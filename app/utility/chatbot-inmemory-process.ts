import { SendWAButtonModel, SendWACatalogModel, SendWAListModel, SendWATextModel, WAResponseModel } from "../models/whatsapp-message-type";
import Bull, { Job } from "bull";
import {
    askQuestion,
    chatToString,
    getPrgramName,
    getTombolaName,
    getWhatsappResponse,
    loyaltyProgramSavePoint,
    saveQuestion,
    sendWhatsappMessage,
    textMessage,
    tombolaSaveRandomDraw,
    //markMessageAsRead
} from "../utility/whatsapp-method";
import { ClientPointModel } from "../models/client-point-model";
import { TombolaProductModel } from "../models/tombola-product-model";
import { sessions } from "../models/chat-model";
import { CredentialsRepository } from "../repository/credentials-repository";
import { CompanyChatRespository } from "../repository/company-chat-repository";
import { ResponseModel } from "../models/dto/scenario-input";


const credentialsRepository = new CredentialsRepository();
const companyChatsRepository = new CompanyChatRespository();

const chatQueue = new Bull("chat", {
    redis: {
    host: 'ec2-3-123-17-212.eu-central-1.compute.amazonaws.com',
    port: 6379
  }
});

export const sendChat = async (chat: any) => {
    chatQueue.add({ ...chat });
}

export const processChatQueue = async (job: Job) => {
    try {
        const body = job.data as any;
        
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
                if (sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length === 0) {
                    if (waResponse.type === "text" || waResponse.type === "button") {
                        if (waResponse.type === "button") {
                            console.dir(waResponse.data.button, { depth: null });
                            console.dir(waResponse.data.button.text, { depth: null });
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

                            if (waResponse.data.button.text.trim() === "ça m'intéresse") {
                                console.log("ça m'intéresse");
                            }

                            if (waResponse.data.button.text.trim() === "ça ne m'intéresse pas") {
                                console.log("ça ne m'intéresse pas");
                            }

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
                                return 200;
                            }
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
                            data = await askQuestion(
                                waResponse.phone_number,
                                sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1]
                            );
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = saveQuestion(sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1]);
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion =
                            sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1];
                        } else {
                            data = await chatToString(sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats, waResponse.phone_number, waResponse.name);
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
                            data = await chatToString(sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats, waResponse.phone_number, waResponse.name);
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
                            data = await chatToString(sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats, waResponse.phone_number, waResponse.name);
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
                }

                return 200;
            }
        } else {
            return 403;
        }
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
}

chatQueue.process(processChatQueue);
