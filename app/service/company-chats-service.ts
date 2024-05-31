import { APIGatewayProxyEventV2 } from "aws-lambda";
import { autoInjectable } from "tsyringe";
import { ErrorResponse, SuccessResponse } from "../utility/response";
import { CredentialsRepository } from "../repository/credentials-repository";
import { Request, Response } from 'express';
import { SendWAButtonModel, SendWAImageModel, SendWAListModel, SendWAMessageModel, SendWAProductsTemplateModel, SendWATemplateModel, SendWATextModel, WAResponseModel } from "../models/whatsapp-message-type";
import { askQuestion, chatToString, forbiddenUserResponse, formatBodyTemplateMessage, getPrgramName, getTextMessageWAResponseModel, getTextSendWAMessageModel, getTombolaName, getWhatsappResponse, loyaltyProgramSavePoint, saveQuestion, sendTemplateMessage, sendTemplateOfProductsCatalog, sendWhatsappMessage, textMessage, tombolaSaveRandomDraw } from "../utility/whatsapp-method";
import { Conversation, sessions } from "../models/chat-model";
import { ClientPointModel } from "../models/client-point-model";
import { TombolaProductModel } from "../models/tombola-product-model";
import { CompanyChatRespository } from "../repository/company-chat-repository";
import { ResponseModel } from "../models/dto/scenario-input";
import { getCatalogProducts } from "../utility/meta-request";
import { ChatStatus } from "../enums/bot-enum";
import { downloadWhatsappFile, getUrlWhatsappFile } from "../utility/upload-file-from-webhook";

const companyChatsRepository = new CompanyChatRespository();
const credentialsRepository = new CredentialsRepository();

@autoInjectable()
export class CompanyChatsService {

    constructor() {}

    async getMessage(req: Request, res: Response) {
        try {
            const queryParams = req.query;

            const mode = queryParams["hub.mode"];
            const verify_token = queryParams["hub.verify_token"] as string;
            const challenge = queryParams["hub.challenge"];

            const credentials = await credentialsRepository.getByVerifyToken(verify_token);

            if (mode && verify_token) {
                if (mode === "subscribe" && verify_token === credentials.verify_token) {

                  console.log("WEBHOOK_VERIFIED");
                  return res.status(200).send(challenge);
                } else {
                  return res.status(403).send();
                }
            }
            return res.status(403).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send();
        }
    }
    

    async sendMessage(req: any, res: Response) {
        try {
            const body = {...req.body, io: req.io} as any;
            const resultRecieved = await getWhatsappResponse(body);
    
            if (!resultRecieved) {
                return res.status(200).send({});
            }
    
            const waResponse = resultRecieved as WAResponseModel;
            const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
            if (!session) {
                return res.status(200).send({});
            }
    
            const token = session.token;
            const last_message = session.last_message;
            
            if (session.chats.length === 0) {
                const data: SendWAMessageModel = await this.handleInitialResponse(waResponse, req, token);
                if (data) {
                    const status = await sendWhatsappMessage(waResponse.phone_number_id, token, data);
                    const send = getTextSendWAMessageModel(data)
                    const received = getTextMessageWAResponseModel(waResponse);
                    console.log('send =======', send);
                    console.log('received =======', received);
                    session.chats.push({send, received});
                    await this.saveChatMessage(waResponse, session, send, ChatStatus.PENDING, req.io);
                }
            } else {
                const data: SendWAMessageModel = await this.handleSubsequentResponse(waResponse, req, token);
                if (data) {
                    const status = await sendWhatsappMessage(waResponse.phone_number_id, token, data);
                    const send = getTextSendWAMessageModel(data)
                    const received = getTextMessageWAResponseModel(waResponse);
                    console.log('send =======', send);
                    console.log('received =======', received);

                    session.chats.push({send, received});
                    console.log('session.chats ===', session.chats);
                    await this.saveChatMessage(waResponse, session, send, ChatStatus.PENDING, req.io);
                } else if (last_message) {
                    await forbiddenUserResponse({
                        recipientPhone: waResponse.phone_number,
                        message: last_message
                    }, waResponse.phone_number_id, token);
                }
            }
    
            return res.status(200).send({});
        } catch (error) {
            console.error(error);
            return res.status(500).send();
        }
    }
    
    async handleInitialResponse(waResponse: WAResponseModel, req: any, token: string) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        if (!session) return null;
    
        let data;
        switch (waResponse.type) {
            case "text":
            case "button":
                data = await this.handleTextOrButtonResponse(waResponse, req, token);
                break;
            case "interactive":
                data = await this.handleInteractiveResponse(waResponse, req);
                break;
            case "order":
                data = await this.handleOrderResponse(waResponse, req, token);
                break;
            case "image":
                data = await this.handleImageResponse(waResponse, req, token);
                break;
        }
    
        session.textSend = saveQuestion(session.scenario[0]);
        session.currentQuestion = session.scenario[0];
        return data;
    }
    
    async handleSubsequentResponse(waResponse: WAResponseModel, req: any, token: string) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        if (!session) return null;
    
        let data;
        console.log('chats ********', session.chats);
        console.log("waResponse", waResponse);
        
        switch (waResponse.type) {
            case "text":
                data = await this.handleTextResponse(waResponse, req, token);
                break;
            case "image":
                data = await this.handleImageResponse(waResponse, req, token);
                break;
            case "interactive":
                data = await this.handleButtonAndListReplyResponse(waResponse, req);
                break;
            case "template":
                data = await this.handleTemplateResponse(waResponse, req, token);
                break;
        }
        return data;
    }
    
    async handleTextOrButtonResponse(waResponse: WAResponseModel, req: any, token: string) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        if (!session) return null;
    
        if (waResponse.type === "button" && waResponse.data.button.text.trim() === "ça ne m'intéresse pas") {
            const dataMessage: SendWAMessageModel = this.createTextMessage(waResponse.phone_number, "Nous sommes désolé de l'apprendre et nous vous disons à très bientôt")
            await sendWhatsappMessage(waResponse.phone_number_id, token, dataMessage);
            sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
            return null;
        }
    
        await this.saveChatMessage(waResponse, session, waResponse.data.text.body || waResponse.data.button.text, ChatStatus.START, req.io);
    
        if (waResponse.data.text.body === "Fête des mères, appuyez sur envoyer") {
            await sendTemplateMessage(waResponse.phone_number, waResponse.phone_number_id, token);
            sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
            return null;
        }
    
        return askQuestion(waResponse.phone_number, session.scenario[0]);
    }
    
    async handleInteractiveResponse(waResponse: WAResponseModel, req: any) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        if (!session) return null;
    
        const label = waResponse.data.interactive.button_reply?.title || waResponse.data.interactive.list_reply?.title;
        await this.saveChatMessage(waResponse, session, label, ChatStatus.START, req.io);
        
        return askQuestion(waResponse.phone_number, session.scenario[0]);
    }
    
    async handleOrderResponse(waResponse: WAResponseModel, req: any, token: string) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        if (!session) return null;
    
        const orderDetails = await this.getOrderDetails(waResponse, token);
        await this.saveChatMessage(waResponse, session, `\n\n*Command*\n${orderDetails}`, ChatStatus.START, req.io);
        return askQuestion(waResponse.phone_number, session.scenario[0]);
    }
    
    async handleImageResponse(waResponse: WAResponseModel, req: any, token: string) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        
        if (!session) return null;
    
        const resUrl = await getUrlWhatsappFile(waResponse.data.image.id, token);
        const url = await downloadWhatsappFile(resUrl.url, token, resUrl.mime_type);
        await this.saveChatMessage(waResponse, session, url, ChatStatus.PENDING, req.io);
        const index = session.scenario.findIndex(quest => quest.label === session.currentQuestion.label);
        if (session.scenario.length > index + 1) {
            session.currentQuestion = session.scenario[index + 1];
            sessions.get(waResponse.phone_number)?.set(waResponse.phone_number_id, session)
            return askQuestion(waResponse.phone_number, session.scenario[index + 1]);
        } else {
            const data = await chatToString(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
            await this.saveChatMessage(waResponse, session, data.text.body, ChatStatus.END, req.io);
            sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
            return data;
        }
    }
    
    async handleTextResponse(waResponse: WAResponseModel, req: any, token: string) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        if (!session) return null;
    
        if (waResponse.type === "text") {
            await this.saveChatMessage(waResponse, session, waResponse.data.text.body, ChatStatus.PENDING, req.io);
    
            const index = session.scenario.findIndex(quest => quest.label === session.currentQuestion.label);
            if (session.scenario.length > index + 1) {
                session.currentQuestion = session.scenario[index + 1];
                sessions.get(waResponse.phone_number)?.set(waResponse.phone_number_id, session)
                return askQuestion(waResponse.phone_number, session.scenario[index + 1]);
            } else {
                const data = await chatToString(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
                //await this.saveChatMessage(waResponse, session, data.text.body, ChatStatus.END, req.io);
                sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                return data;
            }
        }
    
        return askQuestion(waResponse.phone_number, session.currentQuestion);
    }

    async handleButtonAndListReplyResponse(waResponse: WAResponseModel, req: any) {
        if (waResponse.data.interactive.type === "button_reply") {
            return await this.handleButtonResponse(waResponse, req);
        } else  if (waResponse.data.interactive.type === "list_reply") {
            return await this.handleListResponse(waResponse, req);
        }
    }
    
    async handleButtonResponse(waResponse: WAResponseModel, req: any) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        if (!session) return null;
    
        if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
            const label = waResponse.data.interactive.button_reply.title;
            await this.saveChatMessage(waResponse, session, label, ChatStatus.PENDING, req.io);
    
            const currentLabel = session.currentQuestion.label;
            const index = session.scenario.findIndex(quest => quest.label === currentLabel);
            const response = session.scenario[index].responses.find(resp => resp.id === waResponse.data.interactive.button_reply.id);
    
            if (response.questions) {
                session.scenario = response.questions;
                session.currentQuestion = response.questions[0];
                sessions.get(waResponse.phone_number)?.set(waResponse.phone_number_id, session)
                return askQuestion(waResponse.phone_number, response.questions[0]);
            } else {
                const data = await chatToString(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
                //await this.saveChatMessage(waResponse, session, data.text.body, ChatStatus.END, req.io);
                sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                return data;
            }
        }
    
        return askQuestion(waResponse.phone_number, session.currentQuestion);
    }
    
    async handleListResponse(waResponse: WAResponseModel, req: any) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        if (!session) return null;
    
        if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
            const label = waResponse.data.interactive.list_reply.title;
            await this.saveChatMessage(waResponse, session, label, ChatStatus.PENDING, req.io);
    
            const currentLabel = session.currentQuestion.label;
            const index = session.scenario.findIndex(quest => quest.label === currentLabel);
            const response = session.scenario[index].responses.find(resp => resp.id === waResponse.data.interactive.list_reply.id);
    
            if (response.questions) {
                session.scenario = response.questions;
                session.currentQuestion = response.questions[0];
                sessions.get(waResponse.phone_number)?.set(waResponse.phone_number_id, session)
                return askQuestion(waResponse.phone_number, response.questions[0]);
            } else {
                const data = await chatToString(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
                //await this.saveChatMessage(waResponse, session, data.text.body, ChatStatus.END, req.io);
                sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                return data;
            }
        }
    
        return askQuestion(waResponse.phone_number, session.currentQuestion);
    }
    
    async handleTemplateResponse(waResponse: WAResponseModel, req: any, token: string) {
        const session = sessions.get(waResponse.phone_number)?.get(waResponse.phone_number_id);
        if (!session) return null;
    
        if (waResponse.type === "order") {
            const orderDetails = await this.getOrderDetails(waResponse, token);
    
            const data = await chatToString(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
            await this.saveChatMessage(waResponse, session, data.text.body, ChatStatus.END, req.io);
            sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
            return data;
        }
    
        return askQuestion(waResponse.phone_number, session.currentQuestion);
    }
    
    async getOrderDetails(waResponse: WAResponseModel, token: string) {
        const products = waResponse.data.order.product_items;
        const result = await getCatalogProducts();
    
        let order = ``;
        let total = 0;
         if (result.status === 200) {
            const productsList = result.data.data;
            console.log(productsList);
            
            for (let product of products) {
                const productItem = productsList.find((item: any) => item.retailer_id === product.product_retailer_id);
                order += `produit: *${productItem.name}*\nqté: *${product.quantity}*\nprix unit: *€${product.item_price}*\nmontant: *€${(+product.quantity) * (+product.item_price)}*\n\n`;
                total += (+product.quantity) * (+product.item_price);
            }
        } else {
            for (let product of products) {
                order += `produit: *${product.product_retailer_id}*\nqté: *${product.quantity}*\nprix unit: *€${product.item_price}*\nmontant: *€${(+product.quantity) * (+product.item_price)}*\n\n`;
                total += (+product.quantity) * (+product.item_price);
            }
         }
        order += `Total: *€${total}*\n\n`;
        return order;
    }
    
    async saveChatMessage(waResponse: WAResponseModel, session: Conversation, text: string, status: ChatStatus, io: any) {
        await companyChatsRepository.addChatMessage(
            waResponse.phone_number_id,
            waResponse.phone_number,
            {
                text,
                is_bot: true,
                is_admin: false,
                date: new Date(),
                is_read: false,
                chat_status: status,
                scenario_name: session.scenario_name
            },
            io
        );
    }
    
    createTextMessage(phoneNumber: string, message: string): SendWATextModel {
        return {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "text",
            text: { body: message }
        };
    }
    
}