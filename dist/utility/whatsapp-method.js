"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentWhatsappMessage = exports.sendProductsTemplate = exports.sendTemplateOfProductsCatalog = exports.sendTemplateMessage = exports.formatBodyTemplateMessage = exports.bulkmessageUpdateBroadcastStatus = exports.tombolaSaveRandomDraw = exports.loyaltyProgramSavePoint = exports.getTombolaName = exports.getPrgramName = exports.markMessageAsRead = exports.findImageLinks = exports.chatSessionTimeout = exports.chatToString = exports.saveQuestion = exports.askQuestion = exports.getTextMessageWAResponseModel = exports.getTextSendWAMessageModel = exports.catalogMessage = exports.productsTemplateMessage = exports.listMessage = exports.buttonsMessage = exports.imageMessage = exports.textMessage = exports.sendWhatsappMessage = exports.forbiddenUserResponse = exports.getSuitableScenario = exports.getWhatsappResponse = void 0;
const axios_1 = __importDefault(require("axios"));
const chat_model_1 = require("../models/chat-model");
const scenario_repository_1 = require("../repository/scenario-repository");
const message_queue_1 = require("../message-queue");
const company_chat_repository_1 = require("../repository/company-chat-repository");
const credentials_repository_1 = require("../repository/credentials-repository");
const bot_enum_1 = require("../enums/bot-enum");
const companyChatsRepository = new company_chat_repository_1.CompanyChatRespository();
const scenarioRepository = new scenario_repository_1.ScenarioRespository();
const credentialsRepository = new credentials_repository_1.CredentialsRepository();
const getWhatsappResponse = (body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    console.dir("INCOMMING MESSAGE: ");
    //console.dir(body, { depth: null });
    for (let [phone, session] of chat_model_1.sessions) {
        for (let [company, conversat] of session) {
            if ((0, exports.chatSessionTimeout)(conversat.timeout, new Date()) > 10) {
                const token = (yield credentialsRepository.getByPhoneNumber(company)).token;
                yield (0, exports.forbiddenUserResponse)({
                    recipientPhone: phone,
                    message: "Session terminée"
                }, company, token);
                yield companyChatsRepository.addChatMessage(company, phone, {
                    text: "Session terminée",
                    is_bot: true,
                    is_admin: false,
                    date: new Date(),
                    is_read: false,
                    chat_status: bot_enum_1.ChatStatus.END,
                    scenario_name: chat_model_1.sessions.get(phone).get(company).scenario_name
                }, body.io);
                chat_model_1.sessions.get(phone).delete(company);
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
        if (body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]) {
            console.log("IS WEBHOOK MESSAGE");
            const waResponse = {
                phone_number_id: body.entry[0].changes[0].value.metadata.phone_number_id,
                phone_number: body.entry[0].changes[0].value.messages[0].from,
                name: body.entry[0].changes[0].value.contacts[0].profile.name,
                type: body.entry[0].changes[0].value.messages[0].type,
                data: body.entry[0].changes[0].value.messages[0],
                id: body.entry[0].changes[0].value.messages[0].id
            };
            // MARK MESSAGE AS READ
            const credentials = yield credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
            if (credentials)
                yield (0, exports.markMessageAsRead)(waResponse.id, waResponse.phone_number_id, credentials.token);
            // KILL Session
            if (waResponse.type === 'text' && waResponse.data.text.body.trim().toLocaleLowerCase() === 'kill') {
                if ((_a = chat_model_1.sessions === null || chat_model_1.sessions === void 0 ? void 0 : chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id)) {
                    (_b = chat_model_1.sessions.get(waResponse.phone_number)) === null || _b === void 0 ? void 0 : _b.delete(waResponse.phone_number_id);
                }
                yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                    text: "Session terminée",
                    is_bot: true,
                    is_admin: false,
                    date: new Date(),
                    is_read: false,
                    chat_status: bot_enum_1.ChatStatus.END,
                    scenario_name: (_d = (_c = chat_model_1.sessions === null || chat_model_1.sessions === void 0 ? void 0 : chat_model_1.sessions.get(waResponse.phone_number)) === null || _c === void 0 ? void 0 : _c.get(waResponse.phone_number_id)) === null || _d === void 0 ? void 0 : _d.scenario_name
                }, body.io);
                yield (0, exports.forbiddenUserResponse)({
                    recipientPhone: waResponse.phone_number,
                    message: "Session terminée"
                }, waResponse.phone_number_id, credentials.token);
                return false;
            }
            /*
            const chats = await companyChatsRepository.getChatsConversation(waResponse.phone_number_id, waResponse.phone_number);
            if (chats &&
                chats.chat_messages &&
                chats.chat_messages.length > 0
            ) {
                const lastAdminChatMessage = chats.chat_messages.reverse().find(chat => chat.is_admin);
                if (lastAdminChatMessage) {
                    const dateLastMessage = new Date(lastAdminChatMessage.date);
                    const currentDate = new Date();
                    const differenceInMilliseconds = currentDate.getTime() - dateLastMessage.getTime();
                    const differenceInSeconde = Math.floor(differenceInMilliseconds / 1000);
                    
                        const message: string = getContentWhatsappMessage(waResponse);
                        await companyChatsRepository.addChatMessage(
                            waResponse.phone_number_id,
                            waResponse.phone_number,
                            {
                                text: message,
                                is_bot: false,
                                is_admin: false,
                                date: new Date(),
                                is_read: false,
                                chat_status: ChatStatus.PENDING
                            },
                            body.io
                        );
                        sessions.clear();
                        return false
                    }
                }
            }*/
            // LOYALTY PROGRAM REQUEST
            if (waResponse.type, waResponse.type === "text" && waResponse.data.text.body.startsWith("Loyalty program: ")) {
                //console.log("LOYATY PROGRAM: ", waResponse.data.text.body);
            }
            else if (waResponse.type === "text" && waResponse.data.text.body.startsWith("Tombola: ")) {
            }
            else {
                // COMMING FROM TEMPLATE BUTTON
                if (waResponse.type === "button") {
                    if (!chat_model_1.sessions.has(waResponse.phone_number))
                        chat_model_1.sessions.delete(waResponse.phone_number);
                }
                if (!chat_model_1.sessions.has(waResponse.phone_number)) {
                    const conversation = yield (0, exports.getSuitableScenario)(waResponse);
                    if (conversation) {
                        if (conversation.times !== undefined && conversation.times > 0) {
                            if (!scenarioRepository.isAuthorizedUser(waResponse.phone_number, conversation.users, conversation.times)) {
                                yield (0, exports.forbiddenUserResponse)({
                                    recipientPhone: waResponse.phone_number,
                                    message: `Vous avez déjà participez ${conversation.times} fois à la campagne.\nVous n'êtes plus autorisé à participer.`
                                }, waResponse.phone_number_id, conversation.token);
                                return false;
                            }
                            else {
                                const companiesChats = new Map();
                                companiesChats.set(waResponse.phone_number_id, conversation);
                                chat_model_1.sessions.set(waResponse.phone_number, companiesChats);
                            }
                        }
                        else {
                            const companiesChats = new Map();
                            companiesChats.set(waResponse.phone_number_id, conversation);
                            chat_model_1.sessions.set(waResponse.phone_number, companiesChats);
                        }
                    }
                    else {
                        const companyCredentials = yield credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
                        if (companyCredentials === null || companyCredentials === void 0 ? void 0 : companyCredentials.token) {
                            yield (0, exports.forbiddenUserResponse)({
                                recipientPhone: waResponse.phone_number,
                                message: `Mot clé incorrect, vous ne disposez pas du bon mot clé pour participer à cette campagne.`
                            }, waResponse.phone_number_id, companyCredentials.token);
                        }
                        return false;
                    }
                }
                else if (!chat_model_1.sessions.get(waResponse.phone_number).has(waResponse.phone_number_id)) {
                    const conversation = yield (0, exports.getSuitableScenario)(waResponse);
                    if (conversation) {
                        if (conversation.times !== undefined && conversation.times > 0) {
                            if (!scenarioRepository.isAuthorizedUser(waResponse.phone_number, conversation.users, conversation.times)) {
                                yield (0, exports.forbiddenUserResponse)({
                                    recipientPhone: waResponse.phone_number,
                                    message: `Vous avez déjà participez ${conversation.times} fois à la campagne.\nVous n'êtes plus autorisé à participer.`
                                }, waResponse.phone_number_id, conversation.token);
                                return false;
                            }
                            else {
                                chat_model_1.sessions.get(waResponse.phone_number).set(waResponse.phone_number_id, conversation);
                            }
                        }
                        else {
                            chat_model_1.sessions.get(waResponse.phone_number).set(waResponse.phone_number_id, conversation);
                        }
                    }
                    else {
                        const companyCredentials = yield credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
                        yield (0, exports.forbiddenUserResponse)({
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
});
exports.getWhatsappResponse = getWhatsappResponse;
const getSuitableScenario = (waResponse) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    if (waResponse.type === "text") {
        message = waResponse.data.text.body.trim();
    }
    else if (waResponse.type === "button") {
        message = waResponse.data.button.text.trim();
    }
    else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
        message = waResponse.data.interactive.button_reply.title;
    }
    else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
        message = waResponse.data.interactive.list_reply.title;
    }
    const companyScenarios = yield scenarioRepository.getCompanyScenarios(waResponse.phone_number_id);
    const companyCredentials = yield credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
    const chats = [];
    for (let scen of companyScenarios) {
        if (scen === null || scen === void 0 ? void 0 : scen.keywords) {
            const keywords = scen === null || scen === void 0 ? void 0 : scen.keywords.map(keyword => keyword.trim().toLocaleLowerCase());
            console.log("---------------------", keywords, message.trim().toLocaleLowerCase(), "-------------------");
            if (keywords.includes(message.trim().toLocaleLowerCase())) {
                return {
                    scenario: scen.description,
                    chats: chats,
                    timeout: new Date(),
                    token: companyCredentials.token,
                    company: scen.company,
                    report_into: scen === null || scen === void 0 ? void 0 : scen.report_into,
                    last_message: scen === null || scen === void 0 ? void 0 : scen.last_message,
                    times: scen.times,
                    users: scen === null || scen === void 0 ? void 0 : scen.users,
                    scenario_name: scen.title
                };
            }
        }
    }
    return false;
});
exports.getSuitableScenario = getSuitableScenario;
const forbiddenUserResponse = (data, phone_number_id, token) => __awaiter(void 0, void 0, void 0, function* () {
    (0, exports.sendWhatsappMessage)(phone_number_id, token, (0, exports.textMessage)(data));
});
exports.forbiddenUserResponse = forbiddenUserResponse;
const sendWhatsappMessage = (phone_number_id, token, data) => __awaiter(void 0, void 0, void 0, function* () {
    const { status } = yield (0, axios_1.default)({
        method: "POST",
        url: "https://graph.facebook.com/v17.0/" +
            phone_number_id +
            "/messages?access_token=" +
            token,
        data,
        headers: { "Content-Type": "application/json" },
    });
    return status;
});
exports.sendWhatsappMessage = sendWhatsappMessage;
const textMessage = (data) => {
    return {
        messaging_product: "whatsapp",
        to: data.recipientPhone,
        type: "text",
        text: {
            body: data.message
        },
    };
};
exports.textMessage = textMessage;
const imageMessage = (data) => {
    return {
        messaging_product: "whatsapp",
        to: data.recipientPhone,
        type: "image",
        image: {
            link: data.link
        }
    };
};
exports.imageMessage = imageMessage;
const buttonsMessage = (data) => {
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
exports.buttonsMessage = buttonsMessage;
const listMessage = (data) => {
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
exports.listMessage = listMessage;
const productsTemplateMessage = (data) => {
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
exports.productsTemplateMessage = productsTemplateMessage;
const catalogMessage = (data) => {
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
exports.catalogMessage = catalogMessage;
const getTextSendWAMessageModel = (message) => {
    if (message.type === 'text') {
        const newMessage = message;
        return newMessage.text.body;
    }
    else if (message.type === 'image') {
        const newMessage = message;
        return newMessage.image.link;
    }
    else if (message.type === 'interactive') {
        const newMessage = message;
        return newMessage.interactive.body.text;
    }
    else if (message.type === 'template') {
        const newMessage = message;
        return newMessage.template.name;
    }
};
exports.getTextSendWAMessageModel = getTextSendWAMessageModel;
const getTextMessageWAResponseModel = (waResponse) => {
    let message = '';
    if (waResponse.type === "text") {
        message = waResponse.data.text.body.trim();
    }
    else if (waResponse.type === "button") {
        message = waResponse.data.button.text.trim();
    }
    else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
        message = waResponse.data.interactive.button_reply.title;
    }
    else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
        message = waResponse.data.interactive.list_reply.title;
    }
    return message;
};
exports.getTextMessageWAResponseModel = getTextMessageWAResponseModel;
const askQuestion = (recipientPhone, question) => {
    console.log('question.responseType ======== ', question.responseType);
    if (question.responseType === "text") {
        return (0, exports.textMessage)({ recipientPhone, message: question.label });
    }
    else if (question.responseType === "button") {
        let listOfButtons = [];
        for (let resp of question.responses) {
            listOfButtons.push({
                id: resp.id,
                title: resp.label
            });
        }
        return (0, exports.buttonsMessage)({ recipientPhone, message: question.label, listOfButtons });
    }
    else if (question.responseType === "list") {
        let listOfSections = [];
        for (let resp of question.responses) {
            listOfSections.push({
                id: resp.id,
                title: resp.label,
                //description: resp.label,
                description: '  '
            });
        }
        return (0, exports.listMessage)({ recipientPhone, message: question.label, listOfSections });
    }
    else if (question.responseType === "template") {
        const name = question.responses[0].label;
        const action = question.responses[0].template_action;
        return (0, exports.productsTemplateMessage)({ recipientPhone, name, action });
    }
    else if (question.responseType === "image") {
        const data = {
            recipientPhone,
            link: question.link
        };
        return (0, exports.imageMessage)(data);
    }
};
exports.askQuestion = askQuestion;
const saveQuestion = (question) => {
    if (question.responseType === "text")
        return question.label;
    if (question.responseType === "image")
        return question.link;
    let text = `${question.label}`;
    question.responses.forEach(resp => text + `\n${resp.label}`);
    return text;
};
exports.saveQuestion = saveQuestion;
const chatToString = (chats_1, recipientPhone_1, username_1, ...args_1) => __awaiter(void 0, [chats_1, recipientPhone_1, username_1, ...args_1], void 0, function* (chats, recipientPhone, username, phoneNumberId = '', company = '', report_into = '') {
    let text = `Merci *${username}* pour cet échange, veuillez trouver ci-dessous le résumé de nos échanges.\n\n`;
    // Fete des meres
    if (report_into) {
        text += report_into;
        // text += `Nous tenons à vous remercier pour votre confiance et votre fidélité. C'est grâce à vous que nous pouvons continuer à servir notre communauté avec dévouement et engagement. Nous vous souhaitons à vous et à vos familles une merveilleuse fête des mères, pleine d'amour, de bonheur et de beaux souvenirs.\n\nVous recevrez 1000 frs de crédit téléphonique sous 24H.\n\nFaites participer vos proches en leurs envoyant le message suivant.`;
    }
    else {
        /* Ketourah
        if (phoneNumberId.trim() === "100609346426084") {
            text += `Cliquez sur le lien ci-dessous pour choisir une date et une plage horaire pour vos soins ou votre consultation.`;
        }*/
    }
    for (let chat of chats) {
        if (!chat.send)
            chat.send = ``;
        text += `*${company}*: ${chat.send}\n*${username}*: ${chat.received}\n\n`;
    }
    // const urlRegex = /(https?:\/\/[^\s]+)/g;
    yield scenarioRepository.updateUser(phoneNumberId, recipientPhone, username);
    return {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "text",
        text: {
            body: text
        }
    };
});
exports.chatToString = chatToString;
const chatSessionTimeout = (startDate, endDate) => {
    const diff = Math.abs(endDate.getTime() - startDate.getTime());
    return diff / 1000 / 60;
};
exports.chatSessionTimeout = chatSessionTimeout;
const findImageLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    const imagesUrls = [];
    if (urls !== null) {
        for (let url of urls) {
            if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')) {
                imagesUrls.push(url);
            }
        }
    }
    return imagesUrls;
};
exports.findImageLinks = findImageLinks;
const markMessageAsRead = (id, phone_number_id, token) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
        method: "POST",
        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages`,
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
});
exports.markMessageAsRead = markMessageAsRead;
const getPrgramName = (text) => {
    return text.replace("Loyalty program: ", "")
        .replace(". Please send this message without edit", "")
        .trim();
};
exports.getPrgramName = getPrgramName;
const getTombolaName = (text) => {
    return text.replace("Tombola: ", "")
        .replace(". Please send this message without edit", "")
        .trim();
};
exports.getTombolaName = getTombolaName;
const loyaltyProgramSavePoint = (data, phone_number_id) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, message_queue_1.PullSaveLoyaltyPoints)({
        client_phone_number: data.client_phone_number,
        program_name: data.program_name,
        phone_number_id: data.phone_number_id
    }, phone_number_id);
});
exports.loyaltyProgramSavePoint = loyaltyProgramSavePoint;
const tombolaSaveRandomDraw = (data, phone_number_id) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, message_queue_1.PullRandomDraw)({
        client_phone_number: data.client_phone_number,
        tombola_name: data.tombola_name,
        phone_number_id: data.phone_number_id
    }, phone_number_id);
});
exports.tombolaSaveRandomDraw = tombolaSaveRandomDraw;
const bulkmessageUpdateBroadcastStatus = (data, phone_number_id) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, message_queue_1.PullBroadcastResponse)({
        response_id: data.response_id,
        status: data.status,
        error: data.error
    }, phone_number_id);
});
exports.bulkmessageUpdateBroadcastStatus = bulkmessageUpdateBroadcastStatus;
const formatBodyTemplateMessage = (phone_number, name) => {
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
};
exports.formatBodyTemplateMessage = formatBodyTemplateMessage;
const sendTemplateMessage = (phone_number, phone_number_id, token) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
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
});
exports.sendTemplateMessage = sendTemplateMessage;
const sendTemplateOfProductsCatalog = (phone_number, phone_number_id, token) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
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
});
exports.sendTemplateOfProductsCatalog = sendTemplateOfProductsCatalog;
const sendProductsTemplate = (phone_number, phone_number_id, token, name, action) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
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
});
exports.sendProductsTemplate = sendProductsTemplate;
const getContentWhatsappMessage = (waResponse) => {
    if (waResponse.type === bot_enum_1.TypeWhatsappMessage.INTERACTIVE) {
        if (waResponse.data.interactive.type === bot_enum_1.TypeWhatsappMessage.BUTTON_REPLY) {
            return waResponse.data.interactive.button_reply.title;
        }
        else {
            return waResponse.data.interactive.list_reply.title;
        }
    }
    else if (waResponse.type === bot_enum_1.TypeWhatsappMessage.TEXT) {
        return waResponse.data.text.body;
    }
    return '';
};
exports.getContentWhatsappMessage = getContentWhatsappMessage;
//# sourceMappingURL=whatsapp-method.js.map