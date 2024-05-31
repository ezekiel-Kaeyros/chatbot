import axios from "axios";
import {
    ButtonContent,
    SendWAButtonModel,
    SendWACatalogModel,
    SendWAImageModel,
    SendWAListModel,
    SendWAMessageModel,
    SendWAProductsTemplateModel,
    SendWATemplateModel,
    SendWATextModel,
    WAButtons,
    WACatalog,
    WAImage,
    WAList,
    WAResponseModel,
    WATemplate,
    WAText
} from "../models/whatsapp-message-type";
import { QuestionModel, TemplateAction } from "../models/dto/scenario-input";
import { Chat, Conversation, sessions } from "../models/chat-model";
import { ScenarioRespository } from "../repository/scenario-repository";
import { ClientPointInput } from "../models/dto/client-point-input";
import { PullBroadcastResponse, PullRandomDraw, PullSaveLoyaltyPoints, PullWhatappAccessData } from "../message-queue";
import { CompanyChatRespository } from "../repository/company-chat-repository";
import { RandomDrawInput } from "../models/dto/random-draw-input";
import { CredentialsRepository } from "../repository/credentials-repository";
import { UpdateBroadcastStatusInput } from "../models/dto/update-broadcast-status-input";
import { BroadcastStatusModel } from "../models/broadcast-status-model";
import { ChatStatus, TimeToDisableBot, TypeWhatsappMessage } from "../enums/bot-enum";
import { TemplateResponseModel } from "app/models/template-response-model";

const companyChatsRepository = new CompanyChatRespository();
const scenarioRepository = new ScenarioRespository();
const credentialsRepository = new CredentialsRepository();

export const getWhatsappResponse = async (body: any): Promise<WAResponseModel|boolean> => {
    console.dir("INCOMMING MESSAGE: ");
    //console.dir(body, { depth: null });
    for (let [phone, session] of sessions) {
        for (let [company, conversat] of session) {
            if (chatSessionTimeout(conversat.timeout, new Date()) > 10) {
                const token = (await credentialsRepository.getByPhoneNumber(company)).token;
                await forbiddenUserResponse({
                    recipientPhone: phone,
                    message: "Session terminée"
                }, company, token);
                await companyChatsRepository.addChatMessage(
                    company,
                    phone,
                    {
                        text: "Session terminée",
                        is_bot: true,
                        is_admin: false,
                        date: new Date(),
                        is_read: false,
                        chat_status: ChatStatus.END,
                        scenario_name: sessions.get(phone).get(company).scenario_name
                    }, body.io);
                sessions.get(phone).delete(company);
            }
        }
    }

    if (body.object) {
        // if (
        //     body.entry &&
        //     body.entry[0].changes &&
        //     body.entry[0].changes[0] &&
        //     body.entry[0].changes[0].value.statuses &&
        //     body.entry[0].changes[0].value.statuses[0]
        // ) {
        //     const broadcastStatus: BroadcastStatusModel = {
        //         display_phone_number: body.entry[0].changes[0].value.metadata.display_phone_number,
        //         phone_number_id: body.entry[0].changes[0].value.metadata.phone_number_id,
        //         id: body.entry[0].changes[0].value.statuses[0].id,
        //         status: body.entry[0].changes[0].value.statuses[0].status,
        //         timestamp: body.entry[0].changes[0].value.statuses[0].timestamp,
        //         recipient_id: body.entry[0].changes[0].value.statuses[0].recipient_id,
        //     };
        //     if (
        //         body.entry[0].changes[0].value.statuses[0].errors &&
        //         body.entry[0].changes[0].value.statuses[0].errors[0]
        //     ) {
        //         console.log("TEMPLATE RESPONSE WITH ERRORS");
        //         broadcastStatus.error_code = body.entry[0].changes[0].value.statuses[0].errors[0].code;
        //         broadcastStatus.error_title = body.entry[0].changes[0].value.statuses[0].errors[0].title;
        //         broadcastStatus.error_message = body.entry[0].changes[0].value.statuses[0].errors[0].message;
        //         broadcastStatus.error_details = body.entry[0].changes[0].value.statuses[0].errors[0].error_data.details;
        //         broadcastStatus.error_support_url = body.entry[0].changes[0].value.statuses[0].errors[0].href;

        //         const result = await bulkmessageUpdateBroadcastStatus({
        //             response_id: broadcastStatus.id,
        //             status: broadcastStatus.status,
        //             error: broadcastStatus.error_details
        //         }, broadcastStatus.phone_number_id);
        //         //console.dir(result, { depth: null });
        //     } else {
        //         const result = await bulkmessageUpdateBroadcastStatus({
        //             response_id: broadcastStatus.id,
        //             status: broadcastStatus.status
        //         }, broadcastStatus.phone_number_id);
        //         //console.dir(result, { depth: null });
        //     }
        // }

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
            
            // MARK MESSAGE AS READ
            const credentials = await credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
            if (credentials) await markMessageAsRead(waResponse.id, waResponse.phone_number_id, credentials.token);

            // STOP BOT
            //const chats = await companyChatsRepository.getChatsConversation(waResponse.phone_number_id, waResponse.phone_number);
            // if (chats && 
            //     chats.chat_messages && 
            //     chats.chat_messages.length > 0
            // ) {
            //     const lastAdminChatMessage = chats.chat_messages.reverse().find(chat => chat.is_admin);
            //     if (lastAdminChatMessage) {
            //         const dateLastMessage = new Date(lastAdminChatMessage.date);
            //         const currentDate = new Date();
            //         const differenceInMilliseconds = currentDate.getTime() - dateLastMessage.getTime();
            //         const differenceInSeconde = Math.floor(differenceInMilliseconds / 1000);
                    
            //         if (differenceInSeconde < TimeToDisableBot.IN_SECONDE) {
            //             const message: string = getContentWhatsappMessage(waResponse);
            //             await companyChatsRepository.addChatMessage(
            //                 waResponse.phone_number_id,
            //                 waResponse.phone_number,
            //                 {
            //                     text: message,
            //                     is_bot: false,
            //                     is_admin: false,
            //                     date: new Date(),
            //                     is_read: false,
            //                     chat_status: ChatStatus.PENDING
            //                 },
            //                 body.io
            //             );
            //             sessions.clear();
            //             return false
            //         }
            //     }
            // }

            // LOYALTY PROGRAM REQUEST
            if (waResponse.type, waResponse.type === "text" && waResponse.data.text.body.startsWith("Loyalty program: ")) {
                //console.log("LOYATY PROGRAM: ", waResponse.data.text.body);
            } else if (waResponse.type === "text" && waResponse.data.text.body.startsWith("Tombola: ")) {

            } else {

                // COMMING FROM TEMPLATE BUTTON
                if (waResponse.type === "button") {
                    if (!sessions.has(waResponse.phone_number)) sessions.delete(waResponse.phone_number);
                }


                if (!sessions.has(waResponse.phone_number)) {
                    const conversation = await getSuitableScenario(waResponse);
                    if (conversation) {
                        if (conversation.times !== undefined && conversation.times > 0) {
                            if (!scenarioRepository.isAuthorizedUser(waResponse.phone_number, conversation.users, conversation.times)) {
                                await forbiddenUserResponse({
                                    recipientPhone: waResponse.phone_number,
                                    message: `Vous avez déjà participez ${conversation.times} fois à la campagne.\nVous n'êtes plus autorisé à participer.`
                                }, waResponse.phone_number_id, conversation.token);
                                return false;
                            } else {
                                const companiesChats = new Map<string, Conversation>();
                                companiesChats.set(waResponse.phone_number_id, conversation);
                                sessions.set(waResponse.phone_number, companiesChats);
                            }
                        } else {
                            const companiesChats = new Map<string, Conversation>();
                            companiesChats.set(waResponse.phone_number_id, conversation);
                            sessions.set(waResponse.phone_number, companiesChats);
                        }
                    } else {
                        const companyCredentials = await credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
                        if (companyCredentials?.token) {

                            await forbiddenUserResponse({
                                recipientPhone: waResponse.phone_number,
                                message: `Mot clé incorrect, vous ne disposez pas du bon mot clé pour participer à cette campagne.`
                            }, waResponse.phone_number_id, companyCredentials.token);
                        }
                        return false;
                    }
                } else if (!sessions.get(waResponse.phone_number).has(waResponse.phone_number_id)) {
                    const conversation = await getSuitableScenario(waResponse);
                    if (conversation) {
                        if (conversation.times !== undefined && conversation.times > 0) {
                            if (!scenarioRepository.isAuthorizedUser(waResponse.phone_number, conversation.users, conversation.times)) {
                                await forbiddenUserResponse({
                                    recipientPhone: waResponse.phone_number,
                                    message: `Vous avez déjà participez ${conversation.times} fois à la campagne.\nVous n'êtes plus autorisé à participer.`
                                }, waResponse.phone_number_id, conversation.token);
                                return false;
                            } else {
                                sessions.get(waResponse.phone_number).set(waResponse.phone_number_id, conversation);
                            }
                        } else {
                            sessions.get(waResponse.phone_number).set(waResponse.phone_number_id, conversation);
                        }
                    } else {
                        const companyCredentials = await credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
                        await forbiddenUserResponse({
                            recipientPhone: waResponse.phone_number,
                            message: `Mot clé incorrect, vous ne disposez pas du bon mot clé pour participer à cette campagne.`
                        }, waResponse.phone_number_id, companyCredentials.token);
                        return false;
                    }
                }
            }
            return waResponse;
        }
        return false;
    }
    return false;
};

export const getSuitableScenario = async (waResponse: WAResponseModel) => {
    let message = '';
    if (waResponse.type === "text") {
        message = waResponse.data.text.body.trim();
    } else if (waResponse.type === "button") {
        message = waResponse.data.button.text.trim();
    } else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
        message = waResponse.data.interactive.button_reply.title;
    } else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
        message = waResponse.data.interactive.list_reply.title;
    }

    const companyScenarios = await scenarioRepository.getCompanyScenarios(waResponse.phone_number_id);
    const companyCredentials = await credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
    const chats: Chat[] = [];

    for (let scen of companyScenarios) {
        if (scen?.keywords) {
            const keywords: string[] = scen?.keywords.map(keyword => keyword.trim().toLocaleLowerCase());
            console.log("---------------------", keywords, message.trim().toLocaleLowerCase(), "-------------------");
            if (keywords.includes(message.trim().toLocaleLowerCase())) {
                return {
                    scenario: scen.description,
                    chats: chats,
                    timeout: new Date(),
                    token: companyCredentials.token,
                    company: scen.company,
                    report_into: scen?.report_into,
                    last_message: scen?.last_message,
                    times: scen.times,
                    users: scen?.users,
                    scenario_name: scen.title
                };
            }
        }
    }
    return false;
};

export const forbiddenUserResponse = async (data: WAText, phone_number_id: string, token: string) => {
    sendWhatsappMessage(phone_number_id, token, textMessage(data));
};

export const sendWhatsappMessage = async (
    phone_number_id: string,
    token: string,
    data: SendWATextModel|SendWAButtonModel|SendWAListModel|SendWAProductsTemplateModel|SendWAImageModel|SendWATemplateModel
) => {
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
        },
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

export const productsTemplateMessage = (data: WATemplate): SendWAProductsTemplateModel => {
    return {
        messaging_product: "whatsapp",
        to: data.recipientPhone,
        type: "template",
        template: {
            name: data.name,
            language: {
                code: "fr"
            },
            components: [
                {
                    type: "button",
                    sub_type: "mpm",
                    index: 0,
                    parameters: [
                        {
                            type: "action",
                            action: data.action
                        }
                    ]
                }
            ]
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

export const getTextSendWAMessageModel = (message: SendWAMessageModel): string => {
    if (message.type === 'text') {
        const newMessage = message as SendWATextModel;
        return newMessage.text.body
    } else if (message.type === 'image') {
        const newMessage = message as SendWAImageModel
        return newMessage.image.link;
    } else if (message.type === 'interactive') {
        const newMessage = message as SendWAListModel | SendWAButtonModel
        return newMessage.interactive.body.text;
    } else if (message.type === 'template') {
        const newMessage = message as SendWATemplateModel
        return newMessage.template.name;
    }
}

export const getTextMessageWAResponseModel = (waResponse: WAResponseModel): string => {
    let message = '';
    if (waResponse.type === "text") {
        message = waResponse.data.text.body.trim();
    } else if (waResponse.type === "button") {
        message = waResponse.data.button.text.trim();
    } else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
        message = waResponse.data.interactive.button_reply.title;
    } else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
        message = waResponse.data.interactive.list_reply.title;
    }
    return message;
}

export const askQuestion = (recipientPhone: string, question: QuestionModel) => {
    console.log('question.responseType ======== ', question.responseType);
    
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
    } else if (question.responseType === "template") {
        const name = question.responses[0].label;
        const action = question.responses[0].template_action;
        return productsTemplateMessage({ recipientPhone, name, action  });
    } else if (question.responseType === "image") {
        const data: WAImage = {
            recipientPhone, 
            link: question.link
        }
        return imageMessage(data);
    }
};

export const saveQuestion = (question: QuestionModel) => {
    if (question.responseType === "text") return question.label;
    if (question.responseType === "image") return question.link;
    let text = `${question.label}`;
    question.responses.forEach(resp => text + `\n${resp.label}`);
    return text;

};

export const chatToString = async (
    chats: Chat[],
    recipientPhone: string,
    username: string,
    phoneNumberId: string = '',
    company: string = '',
    report_into = ''
): Promise<SendWATextModel> => {
    let text = `Merci *${username}* pour cet échange, veuillez trouver ci-dessous le résumé de nos échanges.\n\n`;
    
    // Fete des meres
    if (report_into) {
        text += report_into;
        // text += `Nous tenons à vous remercier pour votre confiance et votre fidélité. C'est grâce à vous que nous pouvons continuer à servir notre communauté avec dévouement et engagement. Nous vous souhaitons à vous et à vos familles une merveilleuse fête des mères, pleine d'amour, de bonheur et de beaux souvenirs.\n\nVous recevrez 1000 frs de crédit téléphonique sous 24H.\n\nFaites participer vos proches en leurs envoyant le message suivant.`;
    } else {
        
        /* Ketourah
        if (phoneNumberId.trim() === "100609346426084") {
            text += `Cliquez sur le lien ci-dessous pour choisir une date et une plage horaire pour vos soins ou votre consultation.`;
        }*/
    }
    for (let chat of chats) {
        if (!chat.send) chat.send = ``;
        text += `*${company}*: ${chat.send}\n*${username}*: ${chat.received}\n\n`;
    }
    // const urlRegex = /(https?:\/\/[^\s]+)/g;
    await scenarioRepository.updateUser(phoneNumberId, recipientPhone, username);
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

export const formatBodyTemplateMessage = (phone_number: string, name: string): SendWATemplateModel => {
    return {
        messaging_product: "whatsapp",
        to: phone_number,
        type: "template",
        template: {
            name: name,
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
    };
}

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

export const sendTemplateOfProductsCatalog = async (phone_number: string, phone_number_id: string, token: string) => {
    return axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/100609346426084/messages`,
        data: {
            messaging_product: "whatsapp",
            to: phone_number,
            type: "template",
            template: {
                name: "ketourah_mpm",
                language: {
                    code: "fr"
                },
                components: [
                    {
                        type: "button",
                        sub_type: "mpm",
                        index: 0,
                        parameters: [
                            {
                                type: "action",
                                action: {
                                    thumbnail_product_retailer_id: "9e2yp5shjk",
                                    sections: [
                                        {
                                            title: "Soins",
                                            product_items: [
                                                {
                                                    product_retailer_id: "thgtmt61ki"
                                                },
                                                {
                                                    product_retailer_id: "pn837nlskk"
                                                },
                                                {
                                                    product_retailer_id: "lh9dgskord"
                                                },
                                                {
                                                    product_retailer_id: "d84a0aaqw2"
                                                }
                                            ]
                                        },
                                        {
                                            title: "Styling",
                                            product_items: [
                                                {
                                                    product_retailer_id: "chb72mov0s"
                                                },
                                                {
                                                    product_retailer_id: "lzop24kdls"
                                                },
                                                {
                                                    product_retailer_id: "mn7040jh0t"
                                                }
                                            ]
                                        },
                                        {
                                            title: "Entretien cheveux",
                                            product_items: [
                                                {
                                                    product_retailer_id: "9e2yp5shjk"
                                                },
                                                {
                                                    product_retailer_id: "0wcq4qefe4"
                                                },
                                                {
                                                    product_retailer_id: "psx0js7qhs"
                                                },
                                                {
                                                    product_retailer_id: "6m5x44mm4k"
                                                },
                                                {
                                                    product_retailer_id: "sibqcu9tmt"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        },
        headers: {
            "Authorization": `Bearer EAAizDOZAPPVIBO9sihZC4ZB0j5ft7TfMqhvPdIO38cg5ZAAbdNhczVUgHH2GiwLZCqtZANZBl1jZBrstlGfzZAJXzEUvGFN4UTNNPszoW1rM8OlRngHZBIMKivERzcbZClWPfcg2ZCVPTkhgc3EvPSAJgFFa6V7PvMGYuKO0V6ZCsnQFuEGcyIa1ImUDhT9hxvgSSjFZBJ`,
            "Content-Type": "application/json"
        }
    });
};

export const sendProductsTemplate = async (
    phone_number: string,
    phone_number_id: string,
    token: string,
    name: string,
    action: TemplateAction
) => {
    return axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
        data: {
            messaging_product: "whatsapp",
            to: phone_number,
            type: "template",
            template: {
                name,
                language: {
                    code: "fr"
                },
                components: [
                    {
                        type: "button",
                        sub_type: "mpm",
                        index: 0,
                        parameters: [
                            {
                                type: "action",
                                action
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

export const getContentWhatsappMessage = (waResponse: WAResponseModel): string => {
    if(waResponse.type === TypeWhatsappMessage.INTERACTIVE) {
        if (waResponse.data.interactive.type === TypeWhatsappMessage.BUTTON_REPLY) {
            return waResponse.data.interactive.button_reply.title
        } else {
            return waResponse.data.interactive.list_reply.title
        }
    } else if (waResponse.type === TypeWhatsappMessage.TEXT) {
        return waResponse.data.text.body
    }
    return '';
}