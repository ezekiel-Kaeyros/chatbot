import { APIGatewayProxyEventV2 } from "aws-lambda";
import { autoInjectable } from "tsyringe";
import { ErrorResponse, SuccessResponse } from "../utility/response";
import { CredentialsRepository } from "../repository/credentials-repository";
import { Request, Response } from 'express';
import { sendChat } from "../utility/chatbot-inmemory-process";
import { SendWAButtonModel, SendWACatalogModel, SendWAListModel, SendWATextModel, WAResponseModel } from "../models/whatsapp-message-type";
import { askQuestion, chatToString, forbiddenUserResponse, getPrgramName, getTombolaName, getWhatsappResponse, loyaltyProgramSavePoint, saveQuestion, sendTemplateMessage, sendTemplateOfProductsCatalog, sendWhatsappMessage, textMessage, tombolaSaveRandomDraw } from "../utility/whatsapp-method";
import { sessions } from "../models/chat-model";
import { ClientPointModel } from "../models/client-point-model";
import { TombolaProductModel } from "../models/tombola-product-model";
import { CompanyChatRespository } from "../repository/company-chat-repository";
import { ResponseModel } from "../models/dto/scenario-input";
import { ScenarioRespository } from "../repository/scenario-repository";

const companyChatsRepository = new CompanyChatRespository();
const credentialsRepository = new CredentialsRepository();
const scenarioRepository = new ScenarioRespository();

@autoInjectable()
export class CompanyChatsService {

    async ResponseWithError(event: APIGatewayProxyEventV2) {
        return ErrorResponse(404, "request method is not supported!");
    }

    async getMessage(req: Request, res: Response) {
        try {
            const queryParams = req.query;

            const mode = queryParams["hub.mode"];
            const verify_token = queryParams["hub.verify_token"] as string;
            const challenge = queryParams["hub.challenge"];

            const credentials = await credentialsRepository.getByVerifyToken(verify_token)

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

    async sendMessage(req: Request, res: Response) {
        try {
            const body = req.body as any;
            // await sendChat(body);
            // return res.status(200).send();

            let data: SendWATextModel|SendWAButtonModel|SendWAListModel|SendWACatalogModel;
            if (await getWhatsappResponse(body)) {
                const waResponse = await getWhatsappResponse(body) as WAResponseModel;
                waResponse.phone_number_id
                //const credentials = await credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
                const token = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).token;
                //const token = credentials.token;
                // await markMessageAsRead(waResponse.id, token);
                if (waResponse.type === "text" && waResponse.data.text.body.startsWith("Loyalty program: ")) {
    
                    const programName = getPrgramName(waResponse.data.text.body);
    
                    let { status, data } = await loyaltyProgramSavePoint({
                        client_phone_number: waResponse.phone_number,
                        program_name: programName,
                        phone_number_id: waResponse.phone_number_id
                    }, waResponse.phone_number_id);
    
                    if (status === 200) {
                        const clientPoint = data.data as ClientPointModel;
                        status = await sendWhatsappMessage(waResponse.phone_number_id, token, textMessage({
                            recipientPhone: waResponse.phone_number,
                            message: `${programName}: ${clientPoint.points} points`
                        }));
                        // await companyChatsRepository.socketPostScanLoyaltyProgram(clientPoint);
                        return 200;
                    } else {
                        status = await sendWhatsappMessage(waResponse.phone_number_id, token, textMessage({
                            recipientPhone: waResponse.phone_number,
                            message: `You cannot get point`
                        }));
                        return 200;
                    }
                } else if (waResponse.type === "text" && waResponse.data.text.body.startsWith("Tombola: ")) {
    
                    const tombolaName = getTombolaName(waResponse.data.text.body);
                    let { status, data } = await tombolaSaveRandomDraw({
                        client_phone_number: waResponse.phone_number,
                        tombola_name: tombolaName,
                        phone_number_id: waResponse.phone_number_id
                    }, waResponse.phone_number_id);
    
                    if (status === 200) {
                        console.log(data);
                        const product = data.data as TombolaProductModel;
                        status = await sendWhatsappMessage(waResponse.phone_number_id, token, textMessage({
                            recipientPhone: waResponse.phone_number,
                            message: `${tombolaName}: ${product.name}`
                        }));
                        //await companyChatsRepository.socketPostTombolaProduct(product);
                        return 200;
                    } else {
                        status = await sendWhatsappMessage(waResponse.phone_number_id, token, textMessage({
                            recipientPhone: waResponse.phone_number,
                            message: `You cannot get point`
                        }));
                        return 200;
                    }
    
                } else {
                    if (waResponse.type === "order") {
                        console.log("___________________PRODUCTS ORDER______________________");
                        console.dir(waResponse.data, { depth: null });

                        const products = waResponse.data.order.product_items as Array<{
                            product_retailer_id: string,
                            quantity: string,
                            item_price: string,
                            currency: string
                        }>;

                        let order = ``;
                        let total = 0;
                        for (let product of products) {
                            order += `produit: *${product.product_retailer_id}*\nqté: *${product.quantity}*\nprix unit: *€${product.item_price}*\nmontant: *€${(+product.quantity) * (+product.item_price)}*\n\n`;
                            total += (+product.quantity) * (+product.item_price);
                        }
                        order += `Total: *€${total}*\n\n`;

                        data = await chatToString(
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats,
                            waResponse.phone_number,
                            waResponse.name,
                            waResponse.phone_number_id,
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).company
                        ) as SendWATextModel;
                        data.text.body += `\n\nVotre command\n${order}`;

                        sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                        // Save chat
                        await companyChatsRepository.addChatMessage(
                            waResponse.phone_number_id,
                            waResponse.phone_number,
                            {
                                text: data.text.body,
                                is_bot: true,
                                is_admin: false,
                                date: new Date()
                            });

                        await sendWhatsappMessage(
                            waResponse.phone_number_id,
                            token,
                            data
                        );
                        return res.status(200).send({});
                    }

                    if (sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length === 0) {
                        const scenario = await scenarioRepository.getScenarioByPhoneNumberId(waResponse.phone_number_id);
                        if (scenario.keywords && scenario.keywords.length !== 0) {
                            let inputText = '';
                            if (waResponse.type === "text") inputText = waResponse.data.text.body.trim();
                            if (waResponse.type === "button") inputText = waResponse.data.button.text.trim();
                            if (!scenario.keywords.includes(inputText)) {
                                let message = `Utilisez le(s) mot(s) clé(s) suivant\n`;
                                scenario.keywords.forEach(word => message += `*${word}* `);
                                message += `pour initialiser la conservation ou utilisez un lien s'il vous a été envoyé.`;
                                await forbiddenUserResponse({
                                    recipientPhone: waResponse.phone_number,
                                    message: message
                                }, waResponse.phone_number_id, token);
                                return res.status(200).send({});
                            }
                        }
                        if (waResponse.type === "text" || waResponse.type === "button") {
                            if (waResponse.type === "button") {
                                console.dir(waResponse.data.button, { depth: null });
                                console.dir(waResponse.data.button.text, { depth: null });
                                
                                if (waResponse.data.button.text.trim() === "ça ne m'intéresse pas") {
                                    await sendWhatsappMessage(
                                        waResponse.phone_number_id,
                                        token,
                                        {
                                            messaging_product: "whatsapp",
                                            to: waResponse.phone_number,
                                            type: "text",
                                            text: {
                                                body: "Nous sommes désolé de l'apprendre et nous vous disons à très bientôt"
                                            }
                                        }
                                    );
                                    sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                                    return res.status(200).send({});
                                } else {
                                    sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: waResponse.data.button.text });
                                    // Save chat
                                    await companyChatsRepository.addChatMessage(
                                        waResponse.phone_number_id,
                                        waResponse.phone_number,
                                        {
                                            text: waResponse.data.button.text,
                                            is_bot: false,
                                            is_admin: false,
                                            date: new Date()
                                        });
                                }
                            } else {
                                if (waResponse.data.text.body === "Fête des mères, appuyez sur envoyer") {
                                    await sendTemplateMessage(
                                        waResponse.phone_number,
                                        waResponse.phone_number_id,
                                        token
                                    );
                                    sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                                    return res.status(200).send({});
                                } else {
                                    sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: waResponse.data.text.body });
                                    // Save chat
                                    await companyChatsRepository.addChatMessage(
                                        waResponse.phone_number_id,
                                        waResponse.phone_number,
                                        {
                                            text: waResponse.data.text.body,
                                            is_bot: false,
                                            is_admin: false,
                                            date: new Date()
                                        });
                                }
                            }
                                
                            data = askQuestion(
                                waResponse.phone_number,
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]
                            );
                        } else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
                            const label = waResponse.data.interactive.button_reply.title;
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: label });
                            // console.log("TEST")
                            // Save chat
                            await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: label,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
    
                            data = askQuestion(
                                waResponse.phone_number,
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]
                            );
                        } else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
                            const label = waResponse.data.interactive.list_reply.title;
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: label });
    
                            // Save chat
                            await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: label,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
    
                            data = askQuestion(
                                waResponse.phone_number,
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]
                            );
                        }
                        
                        sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = saveQuestion(sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]);
                        sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion =
                        sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0];
                    } else if (sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.responseType === "text" &&
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length !== 0) {
                        if (waResponse.type === "text") {
                            const length = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length;
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats[length-1].received = waResponse.data.text.body;
                            // Save chat
                            await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: waResponse.data.text.body,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
                            const index = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.findIndex(
                                quest => quest.label === sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.label
                            );
                            if (sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.length > index + 1) {
                                data = askQuestion(
                                    waResponse.phone_number,
                                    sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1]
                                );
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = saveQuestion(sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1]);
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion =
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1];
                            } else {
                                data = await chatToString(
                                    sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats,
                                    waResponse.phone_number,
                                    waResponse.name,
                                    waResponse.phone_number_id,
                                    sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).company
                                );
                                sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                                // Save chat
                                await companyChatsRepository.addChatMessage(
                                    waResponse.phone_number_id,
                                    waResponse.phone_number,
                                    {
                                        text: data.text.body,
                                        is_bot: true,
                                        is_admin: false,
                                        date: new Date()
                                    });
                            }
                        } else {
                            data = askQuestion(
                                waResponse.phone_number,
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion
                            );
                        }
                    } else if (sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.responseType === "button") {
                        if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
                            // SEND TEMPLATE OF PRODUCTS CATALOG
                            if (waResponse.phone_number_id === "100609346426084") {
                                const id = waResponse.data.interactive.button_reply.id;
                                const label = waResponse.data.interactive.button_reply.title;
                                const length = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length;
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats[length-1].received = label;
        
                                // Save chat
                                await companyChatsRepository.addChatMessage(
                                    waResponse.phone_number_id,
                                    waResponse.phone_number,
                                    {
                                        text: label,
                                        is_bot: false,
                                        is_admin: false,
                                        date: new Date()
                                    });

                                await sendTemplateOfProductsCatalog(
                                    waResponse.phone_number,
                                    waResponse.phone_number_id,
                                    "token"
                                );
                                return res.status(200).send({});
                            } // END TEMPLATE OF PRODUCTS CATALOG

                            const id = waResponse.data.interactive.button_reply.id;
                            const label = waResponse.data.interactive.button_reply.title;
                            const length = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length;
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats[length-1].received = label;
    
                            // Save chat
                            await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: label,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
        
                            const currentLabel = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.label;
                            const index = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.findIndex(
                                quest => quest.label === currentLabel
                            );
                            const response: ResponseModel = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index]
                                                                    .responses.find(resp => resp.id === id);
                            if (response.questions) {
                                data = askQuestion(
                                    waResponse.phone_number,
                                    response.questions[0]
                                );
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = saveQuestion(response.questions[0]);
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario = response.questions;
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion = response.questions[0];
                            } else {
                                data = await chatToString(
                                    sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats,
                                    waResponse.phone_number,
                                    waResponse.name,
                                    waResponse.phone_number_id,
                                    sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).company
                                );
                                sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                                // Save chat
                                await companyChatsRepository.addChatMessage(
                                    waResponse.phone_number_id,
                                    waResponse.phone_number,
                                    {
                                        text: data.text.body,
                                        is_bot: true,
                                        is_admin: false,
                                        date: new Date()
                                    });
                            }
                        } else {
                            data = askQuestion(
                                waResponse.phone_number,
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion
                            );
                        }
                    } else if (sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.responseType === "list") {
                        if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
                            const id = waResponse.data.interactive.list_reply.id;
                            const label = waResponse.data.interactive.list_reply.title;
                            const length = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length;
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats[length-1].received = label;
    
                            // Save chat
                            await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: label,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
        
                            const currentLabel = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.label;
                            const index = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.findIndex(
                                quest => quest.label === currentLabel
                            );
                            const response: ResponseModel = sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index]
                                                                    .responses.find(resp => resp.id === id);
                            if (response.questions) {
                                data = askQuestion(
                                    waResponse.phone_number,
                                    response.questions[0]
                                );
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = saveQuestion(response.questions[0]);
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario = response.questions;
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion = response.questions[0];
                            } else {
                                data = await chatToString(
                                    sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats,
                                    waResponse.phone_number,
                                    waResponse.name,
                                    waResponse.phone_number_id,
                                    sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).company
                                );
                                sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                                // Save chat
                                await companyChatsRepository.addChatMessage(
                                    waResponse.phone_number_id,
                                    waResponse.phone_number,
                                    {
                                        text: data.text.body,
                                        is_bot: true,
                                        is_admin: false,
                                        date: new Date()
                                    });
                            }
                        } else {
                            data = askQuestion(
                                waResponse.phone_number,
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion
                            );
                        }
                    } else if (sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.responseType === "catalog") {
                        if (waResponse.type === "interactive" && waResponse.data.interactive.type === "catalog_message") {

                        } else {
                            data = askQuestion(
                                waResponse.phone_number,
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion
                            );
                        }
                    }
                    
                    const status = await sendWhatsappMessage(
                        waResponse.phone_number_id,
                        token,
                        data
                    );
                    
                    if (sessions.get(waResponse.phone_number).has(waResponse.phone_number_id)) {
                        sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ send: sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend });
                        // Save chat
                        await companyChatsRepository.addChatMessage(
                            waResponse.phone_number_id,
                            waResponse.phone_number,
                            {
                                text: sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend,
                                is_bot: true,
                                is_admin: false,
                                date: new Date()
                            });
                    } else {
                        if (waResponse.phone_number_id === "299462959914851") {
                            await forbiddenUserResponse({
                                recipientPhone: waResponse.phone_number,
                                message: `Participez à la fêtes des mères et recevez 1000 frs de crédit de communication en cliquant sur ce lien.\nhttps://wa.me/message/UJBNPI6GLOCTN1`
                            }, waResponse.phone_number_id, token);
                        }
                    }
    
                    return res.status(200).send({});
                }
            } else {
                return res.status(200).send({});
            }
        } catch (error) {
            console.log(error);
            return res.status(500).send();
        }
    }
    
}