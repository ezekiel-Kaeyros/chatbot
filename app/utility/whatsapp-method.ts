import axios from "axios";
import {
    ButtonContent,
    SendWAButtonModel,
    SendWACatalogModel,
    SendWAImageModel,
    SendWAListModel,
    SendWATextModel,
    WAButtons,
    WACatalog,
    WAImage,
    WAList,
    WAResponseModel,
    WAText
} from "../models/whatsapp-message-type";
import { QuestionModel } from "../models/dto/scenario-input";
import { Chat, Conversation, sessions } from "../models/chat-model";
import { ScenarioRespository } from "../repository/scenario-repository";
import { ClientPointInput } from "../models/dto/client-point-input";
import { PullBroadcastResponse, PullRandomDraw, PullSaveLoyaltyPoints, PullWhatappAccessData } from "../message-queue";
import { CompanyChatRespository } from "../repository/company-chat-repository";
import { RandomDrawInput } from "../models/dto/random-draw-input";
import { CredentialsRepository } from "../repository/credentials-repository";
import { UpdateBroadcastStatusInput } from "../models/dto/update-broadcast-status-input";
import { BroadcastStatusModel } from "../models/broadcast-status-model";

const companyChatsRepository = new CompanyChatRespository();
const scenarioRepository = new ScenarioRespository();
const credentialsRepository = new CredentialsRepository();

const newConversation = async (phone_number_id: string) => {
    const repository = new ScenarioRespository();
    const scenario = await repository.getScenarioByPhoneNumberId(phone_number_id);
    const credentialsRepository = new CredentialsRepository();
    // console.log("SCENARIO:", scenario);
    const chats: Chat[] = [];
    return {
        scenario: scenario.description,
        chats: chats,
        timeout: new Date(),
        token: (await credentialsRepository.getByPhoneNumber(phone_number_id)).token,
        company: scenario.company
    };
};

export const getWhatsappResponse = async (body: any): Promise<WAResponseModel|boolean> => {
    console.dir("INCOMMING MESSAGE: ");
    console.dir(body, { depth: null });
    for (let [phone, session] of sessions) {
        for (let [company, conversat] of session) {
            if (chatSessionTimeout(conversat.timeout, new Date()) > 2) {
                const token = (await credentialsRepository.getByPhoneNumber(company)).token;
                await forbiddenUserResponse({
                    recipientPhone: phone,
                    message: "Session terminée"
                }, company, token);
                sessions.get(phone).delete(company);
            }
        }
    }

    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.statuses &&
            body.entry[0].changes[0].value.statuses[0]
        ) {
            const broadcastStatus: BroadcastStatusModel = {
                display_phone_number: body.entry[0].changes[0].value.metadata.display_phone_number,
                phone_number_id: body.entry[0].changes[0].value.metadata.phone_number_id,
                id: body.entry[0].changes[0].value.statuses[0].id,
                status: body.entry[0].changes[0].value.statuses[0].status,
                timestamp: body.entry[0].changes[0].value.statuses[0].timestamp,
                recipient_id: body.entry[0].changes[0].value.statuses[0].recipient_id,
            };
            if (
                body.entry[0].changes[0].value.statuses[0].errors &&
                body.entry[0].changes[0].value.statuses[0].errors[0]
            ) {
                console.log("TEMPLATE RESPONSE WITH ERRORS");
                broadcastStatus.error_code = body.entry[0].changes[0].value.statuses[0].errors[0].code;
                broadcastStatus.error_title = body.entry[0].changes[0].value.statuses[0].errors[0].title;
                broadcastStatus.error_message = body.entry[0].changes[0].value.statuses[0].errors[0].message;
                broadcastStatus.error_details = body.entry[0].changes[0].value.statuses[0].errors[0].error_data.details;
                broadcastStatus.error_support_url = body.entry[0].changes[0].value.statuses[0].errors[0].href;

                const result = await bulkmessageUpdateBroadcastStatus({
                    response_id: broadcastStatus.id,
                    status: broadcastStatus.status,
                    error: broadcastStatus.error_details
                }, broadcastStatus.phone_number_id);
                console.dir(result, { depth: null });
            } else {
                const result = await bulkmessageUpdateBroadcastStatus({
                    response_id: broadcastStatus.id,
                    status: broadcastStatus.status
                }, broadcastStatus.phone_number_id);
                console.dir(result, { depth: null });
            }
        }

        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            console.log("IS WEBHOOK MESSAGE");
            const waResponse: WAResponseModel = {
                phone_number_id: body.entry[0].changes[0].value.metadata.phone_number_id,
                phone_number: body.entry[0].changes[0].value.messages[0].from,
                name: body.entry[0].changes[0].value.contacts[0].profile.name,
                type: body.entry[0].changes[0].value.messages[0].type,
                data: body.entry[0].changes[0].value.messages[0],
                id: body.entry[0].changes[0].value.messages[0].id
            };

            const token = (await credentialsRepository.getByPhoneNumber(waResponse.phone_number_id)).token;
            const status = await markMessageAsRead(waResponse.id, waResponse.phone_number_id, token);
            
            if (waResponse.type, waResponse.type === "text" && waResponse.data.text.body.startsWith("Loyalty program: ")) {
                //console.log("LOYATY PROGRAM: ", waResponse.data.text.body);
            } else if (waResponse.type === "text" && waResponse.data.text.body.startsWith("Tombola: ")) {

            } else {
                if (waResponse.type === "button") {
                    if (!sessions.has(waResponse.phone_number)) sessions.delete(waResponse.phone_number);
                }

                const activeScenario = await scenarioRepository.getScenarioByPhoneNumberId(waResponse.phone_number_id);
                if (activeScenario.times !== undefined && activeScenario.times > 0) {
                    if (!scenarioRepository.isAuthorizedUser(waResponse.phone_number, activeScenario.users, activeScenario.times)) {
                        //const token = (await credentialsRepository.getByPhoneNumber(waResponse.phone_number_id)).token;
                        await forbiddenUserResponse({
                            recipientPhone: waResponse.phone_number,
                            message: "L'envoie de votre crédit est en cours de traitement\nVous n'êtes plus autorisé à participer."
                        }, waResponse.phone_number_id, token);
                        return false;
                    } else {
                        if (!sessions.has(waResponse.phone_number)) {
                            const conversation = await newConversation(waResponse.phone_number_id);
                            const companiesChats = new Map<string, Conversation>();
                            companiesChats.set(waResponse.phone_number_id, conversation);
                            sessions.set(waResponse.phone_number, companiesChats);
                        } else if (!sessions.get(waResponse.phone_number).has(waResponse.phone_number_id)) {
                            const conversation = await newConversation(waResponse.phone_number_id);
                            sessions.get(waResponse.phone_number).set(waResponse.phone_number_id, conversation);
                        }
                    }
                } else {
                    if (!sessions.has(waResponse.phone_number)) {
                        const conversation = await newConversation(waResponse.phone_number_id);
                        const companiesChats = new Map<string, Conversation>();
                        companiesChats.set(waResponse.phone_number_id, conversation);
                        sessions.set(waResponse.phone_number, companiesChats);
                    } else if (!sessions.get(waResponse.phone_number).has(waResponse.phone_number_id)) {
                        const conversation = await newConversation(waResponse.phone_number_id);
                        sessions.get(waResponse.phone_number).set(waResponse.phone_number_id, conversation);
                    }
                }

            }
            
            return waResponse;
        }
        return false;
    }
    return false;
};

export const forbiddenUserResponse = async (data: WAText, phone_number_id: string, token: string) => {
    sendWhatsappMessage(phone_number_id, token, textMessage(data));
};

export const sendWhatsappMessage = async (phone_number_id: string, token: string, data: SendWATextModel|SendWAButtonModel|SendWAListModel|SendWACatalogModel) => {
    const { status } = await axios({
        method: "POST",
        url:
            "https://graph.facebook.com/v17.0/" +
            phone_number_id +
            "/messages?access_token=" +
            token,
        data,
        headers: { "Content-Type": "application/json" },
    });
    return status;
};

export const textMessage = (data: WAText): SendWATextModel => {
    return {
        messaging_product: "whatsapp",
        to: data.recipientPhone,
        type: "text",
        text: {
            body: data.message
        }
    };
};

export const imageMessage = (data: WAImage): SendWAImageModel => {
    return {
        messaging_product: "whatsapp",
        to: data.recipientPhone,
        type: "image",
        image: {
            link : data.link
        }
    };
};

export const buttonsMessage = (data: WAButtons): SendWAButtonModel => {
    return {
        messaging_product: "whatsapp",
        to: data.recipientPhone,
        type: "interactive",
        interactive: {
            type: "button",
            body: {
                text: data.message
            },
            action: {
                buttons: data.listOfButtons.map(button => {
                    return {
                        type: "reply",
                        reply: {
                            id: button.id,
                            title: button.title
                        }
                    };
                })
            }
        }
    };
};

export const listMessage = (data: WAList): SendWAListModel => {
    return {
        messaging_product: "whatsapp",
        to: data.recipientPhone,
        type: "interactive",
        interactive: {
            type: "list",
            body: {
                text: data.message
            },
            action: {
                button: "Votre choix",
                sections: [
                    {
                        title: "Title section",
                        rows: data.listOfSections
                    }
                ]
            }
        }
    };
};

export const catalogMessage = (data: WACatalog): SendWACatalogModel => {
    return {
        messaging_product: "whatsapp",
        to: data.recipientPhone,
        type: "interactive",
        interactive: {
            type: "catalog_message",
            body: {
                text: data.message
            },
            action: {
                name: data.catalog_name,
                
                /* Parameters object is optional */
                parameters: {
                thumbnail_product_retailer_id: "wctwvujzeg"
                }
            },
        
            /* Footer object is optional */
            footer: {
                text: "Best grocery deals on WhatsApp!"
            }
        }
    };
};

export const getQuestionResponse = async (messageResponse: any, questions: QuestionModel[]) => {
    const question = questions[0];
    if (messageResponse.type === question.responseType) {
        if (messageResponse.type === "text") {
            if (questions.length > 1) {}
        }
    }
};

export const askQuestion = (recipientPhone: string, question: QuestionModel) => {
    if (question.responseType === "text") {
        return textMessage({ recipientPhone, message: question.label });
    } else if (question.responseType === "button") {
        let listOfButtons: ButtonContent[] = [];
        for (let resp of question.responses) {
            listOfButtons.push({
                id: resp.id,
                title: resp.label
            });
        }
        return buttonsMessage({ recipientPhone, message: question.label, listOfButtons });
    } else if (question.responseType === "list") {
        let listOfSections: ButtonContent[] = [];
        for (let resp of question.responses) {
            listOfSections.push({
                id: resp.id,
                title: resp.label,
                //description: resp.label,
                description: '  '
            });
        }
        return listMessage({ recipientPhone, message: question.label, listOfSections });
    } else if (question.responseType === "catalog") {
        return catalogMessage({ recipientPhone, message: question.label, catalog_name: question.responses[0].label });
    }
};

export const saveQuestion = (question: QuestionModel) => {
    if (question.responseType === "text") return question.label;
    else {
        let text = `${question.label}`;
        question.responses.forEach(resp => text + `\n${resp.label}`);
        return text;
    }
};

export const chatToString = async (chats: Chat[], recipientPhone: string, username: string, phoneNumberId: string = '', company: string = ''): Promise<SendWATextModel> => {
    let text = `Merci *${username}* pour cet échange, veuillez trouver ci-dessous le résumé de nos échanges.\n\n`;
    
    if (phoneNumberId.trim() === "100609346426084") {
        text += `Nous tenons à vous remercier pour votre confiance et votre fidélité. C'est grâce à vous que nous pouvons continuer à servir notre communauté avec dévouement et engagement. Nous vous souhaitons à vous et à vos familles une merveilleuse fête des mères, pleine d'amour, de bonheur et de beaux souvenirs.\n\nVous recevrez 1000 frs de crédit téléphonique sous 24H.\n\nFaites participer vos proches en leurs envoyant le message suivant.`;
    } else {
        for (let chat of chats) {
            if (!chat.send) chat.send = ``;
            text += `*${company}*: ${chat.send}\n*${username}*: ${chat.received}\n\n`;
        }

        if (phoneNumberId.trim() === "266752343194812") {
            text += `Cliquez sur le lien ci-dessous pour choisir une date et une plage horaire pour vos soins ou votre consultation.`;
        }
    }
    // const urlRegex = /(https?:\/\/[^\s]+)/g;
    const isAdded = await scenarioRepository.updateUser(phoneNumberId, recipientPhone, username);
    return {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "text",
        text: {
            body: text
        }
    };
};

export const chatSessionTimeout = (startDate: Date, endDate: Date) => {
    const diff = Math.abs(endDate.getTime() - startDate.getTime());
    return diff/1000/60;
};

export const findImageLinks = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    const imagesUrls: string[] = [];
    if (urls !== null) {
        for (let url of urls) {
            if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')) {
                imagesUrls.push(url);
            }
        }
    }
    return imagesUrls;
};

export const markMessageAsRead = async (id: string, phone_number_id: string, token: string) => {
    return axios({
        method: "POST",
        url: `https://graph.facebook.com/v19.0/${ phone_number_id }/messages`,
        data: {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": id
        },
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
};

export const getPrgramName = (text: string) => {
    return text.replace("Loyalty program: ", "")
                .replace(". Please send this message without edit", "")
                .trim();
};

export const getTombolaName = (text: string) => {
    return text.replace("Tombola: ", "")
                .replace(". Please send this message without edit", "")
                .trim();
};

export const loyaltyProgramSavePoint = async (data: ClientPointInput, phone_number_id: string) => {
    return PullSaveLoyaltyPoints({
        client_phone_number: data.client_phone_number,
        program_name: data.program_name,
        phone_number_id: data.phone_number_id
    }, phone_number_id);
};

export const tombolaSaveRandomDraw = async (data: RandomDrawInput, phone_number_id: string) => {
    return PullRandomDraw({
        client_phone_number: data.client_phone_number,
        tombola_name: data.tombola_name,
        phone_number_id: data.phone_number_id
    }, phone_number_id);
};

export const bulkmessageUpdateBroadcastStatus = async (data: UpdateBroadcastStatusInput, phone_number_id: string) => {
    return PullBroadcastResponse({
        response_id: data.response_id,
        status: data.status,
        error: data.error
    }, phone_number_id);
};

export const sendTemplateMessage = async (phone_number: string, phone_number_id: string, token: string) => {
    return axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
        data: {
            messaging_product: "whatsapp",
            to: phone_number,
            type: "template",
            template: {
                name: "mother_birthday",
                language: {
                    code: "fr"
                },
                components: [
                    {
                        type: "header",
                        parameters: [
                            {
                                type: "image",
                                image: {
                                    link: "https://res.cloudinary.com/devskills/image/upload/v1712220488/motherbirthday_vlfuh5.jpg"
                                }
                            }
                        ]
                    }
                ]
            }
        },
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
};