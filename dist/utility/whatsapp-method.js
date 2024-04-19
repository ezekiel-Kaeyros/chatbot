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
exports.tombolaSaveRandomDraw = exports.loyaltyProgramSavePoint = exports.getTombolaName = exports.getPrgramName = exports.markMessageAsRead = exports.findImageLinks = exports.chatSessionTimeout = exports.chatToString = exports.saveQuestion = exports.askQuestion = exports.getQuestionResponse = exports.catalogMessage = exports.listMessage = exports.buttonsMessage = exports.imageMessage = exports.textMessage = exports.sendWhatsappMessage = exports.forbiddenUserResponse = exports.getWhatsappResponse = void 0;
const axios_1 = __importDefault(require("axios"));
const chat_model_1 = require("../models/chat-model");
const scenario_repository_1 = require("../repository/scenario-repository");
const message_queue_1 = require("../message-queue");
const company_chat_repository_1 = require("../repository/company-chat-repository");
const credentials_repository_1 = require("../repository/credentials-repository");
const companyChatsRepository = new company_chat_repository_1.CompanyChatRespository();
const scenarioRepository = new scenario_repository_1.ScenarioRespository();
const credentialsRepository = new credentials_repository_1.CredentialsRepository();
const newConversation = (phone_number_id) => __awaiter(void 0, void 0, void 0, function* () {
    const repository = new scenario_repository_1.ScenarioRespository();
    const scenario = yield repository.getScenarioByPhoneNumberId(phone_number_id);
    const credentialsRepository = new credentials_repository_1.CredentialsRepository();
    // console.log("SCENARIO:", scenario);
    const chats = [];
    return {
        scenario: scenario.description,
        chats: chats,
        timeout: new Date(),
        token: (yield credentialsRepository.getByPhoneNumber(phone_number_id)).token
    };
});
const getWhatsappResponse = (body) => __awaiter(void 0, void 0, void 0, function* () {
    console.dir("INCOMMING MESSAGE: ");
    for (let [phone, session] of chat_model_1.sessions) {
        for (let [company, conversat] of session) {
            if ((0, exports.chatSessionTimeout)(conversat.timeout, new Date()) > 2) {
                const token = (yield credentialsRepository.getByPhoneNumber(company)).token;
                yield (0, exports.forbiddenUserResponse)({
                    recipientPhone: phone,
                    message: "Session terminée"
                }, company, token);
                chat_model_1.sessions.get(phone).delete(company);
            }
        }
    }
    if (body.object) {
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
            const token = (yield credentialsRepository.getByPhoneNumber(waResponse.phone_number_id)).token;
            const status = yield (0, exports.markMessageAsRead)(waResponse.id, waResponse.phone_number_id, token);
            if (waResponse.type, waResponse.type === "text" && waResponse.data.text.body.startsWith("Loyalty program: ")) {
                //console.log("LOYATY PROGRAM: ", waResponse.data.text.body);
            }
            else if (waResponse.type === "text" && waResponse.data.text.body.startsWith("Tombola: ")) {
            }
            else {
                if (waResponse.type === "button") {
                    if (!chat_model_1.sessions.has(waResponse.phone_number))
                        chat_model_1.sessions.delete(waResponse.phone_number);
                }
                const activeScenario = yield scenarioRepository.getScenarioByPhoneNumberId(waResponse.phone_number_id);
                if (activeScenario.times !== undefined && activeScenario.times > 0) {
                    if (!scenarioRepository.isAuthorizedUser(waResponse.phone_number, activeScenario.users, activeScenario.times)) {
                        //const token = (await credentialsRepository.getByPhoneNumber(waResponse.phone_number_id)).token;
                        yield (0, exports.forbiddenUserResponse)({
                            recipientPhone: waResponse.phone_number,
                            message: "L'envoie de votre crédit est en cours de traitement\nVous n'êtes plus autorisé à participer."
                        }, waResponse.phone_number_id, token);
                        return false;
                    }
                    else {
                        if (!chat_model_1.sessions.has(waResponse.phone_number)) {
                            const conversation = yield newConversation(waResponse.phone_number_id);
                            const companiesChats = new Map();
                            companiesChats.set(waResponse.phone_number_id, conversation);
                            chat_model_1.sessions.set(waResponse.phone_number, companiesChats);
                        }
                        else if (!chat_model_1.sessions.get(waResponse.phone_number).has(waResponse.phone_number_id)) {
                            const conversation = yield newConversation(waResponse.phone_number_id);
                            chat_model_1.sessions.get(waResponse.phone_number).set(waResponse.phone_number_id, conversation);
                        }
                    }
                }
                else {
                    if (!chat_model_1.sessions.has(waResponse.phone_number)) {
                        const conversation = yield newConversation(waResponse.phone_number_id);
                        const companiesChats = new Map();
                        companiesChats.set(waResponse.phone_number_id, conversation);
                        chat_model_1.sessions.set(waResponse.phone_number, companiesChats);
                    }
                    else if (!chat_model_1.sessions.get(waResponse.phone_number).has(waResponse.phone_number_id)) {
                        const conversation = yield newConversation(waResponse.phone_number_id);
                        chat_model_1.sessions.get(waResponse.phone_number).set(waResponse.phone_number_id, conversation);
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
        }
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
const getQuestionResponse = (messageResponse, questions) => __awaiter(void 0, void 0, void 0, function* () {
    const question = questions[0];
    if (messageResponse.type === question.responseType) {
        if (messageResponse.type === "text") {
            if (questions.length > 1) { }
        }
    }
});
exports.getQuestionResponse = getQuestionResponse;
const askQuestion = (recipientPhone, question) => {
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
                description: resp.label
            });
        }
        return (0, exports.listMessage)({ recipientPhone, message: question.label, listOfSections });
    }
    else if (question.responseType === "catalog") {
        return (0, exports.catalogMessage)({ recipientPhone, message: question.label, catalog_name: question.responses[0].label });
    }
};
exports.askQuestion = askQuestion;
const saveQuestion = (question) => {
    if (question.responseType === "text")
        return question.label;
    else {
        let text = `${question.label}`;
        question.responses.forEach(resp => text + `\n${resp.label}`);
        return text;
    }
};
exports.saveQuestion = saveQuestion;
const chatToString = (chats, recipientPhone, username, phoneNumberId = '') => __awaiter(void 0, void 0, void 0, function* () {
    let text = `Merci *${username}* pour votre participation.\n\n`;
    if (phoneNumberId.trim() === "100609346426084") {
        text += `Nous tenons à vous remercier pour votre confiance et votre fidélité. C'est grâce à vous que nous pouvons continuer à servir notre communauté avec dévouement et engagement. Nous vous souhaitons à vous et à vos familles une merveilleuse fête des mères, pleine d'amour, de bonheur et de beaux souvenirs.\n\nVous recevrez 1000 frs de crédit téléphonique sous 24H.\n\nFaites participer vos proches en leurs envoyant le message suivant.`;
    }
    else {
        for (let chat of chats) {
            if (!chat.send)
                chat.send = ``;
            text += `*bot*: ${chat.send}\n*${username}*: ${chat.received}\n\n`;
        }
    }
    // const urlRegex = /(https?:\/\/[^\s]+)/g;
    const isAdded = yield scenarioRepository.updateUser(phoneNumberId, recipientPhone, username);
    console.log(isAdded);
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
//# sourceMappingURL=whatsapp-method.js.map