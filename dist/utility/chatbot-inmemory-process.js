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
exports.processChatQueue = exports.sendChat = void 0;
const bull_1 = __importDefault(require("bull"));
const whatsapp_method_1 = require("../utility/whatsapp-method");
const chat_model_1 = require("../models/chat-model");
const credentials_repository_1 = require("../repository/credentials-repository");
const company_chat_repository_1 = require("../repository/company-chat-repository");
const credentialsRepository = new credentials_repository_1.CredentialsRepository();
const companyChatsRepository = new company_chat_repository_1.CompanyChatRespository();
const chatQueue = new bull_1.default("chat", {
    redis: {
        host: 'ec2-3-123-17-212.eu-central-1.compute.amazonaws.com',
        port: 6379
    }
});
const sendChat = (chat) => __awaiter(void 0, void 0, void 0, function* () {
    chatQueue.add(Object.assign({}, chat));
});
exports.sendChat = sendChat;
const processChatQueue = (job) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = job.data;
        const io = body.io;
        let data;
        if (yield (0, whatsapp_method_1.getWhatsappResponse)(body)) {
            const waResponse = yield (0, whatsapp_method_1.getWhatsappResponse)(body);
            waResponse.phone_number_id;
            //const credentials = await credentialsRepository.getByPhoneNumber(waResponse.phone_number_id);
            const token = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).token;
            //const token = credentials.token;
            // await markMessageAsRead(waResponse.id, token);
            if (waResponse.type === "text" && waResponse.data.text.body.startsWith("Loyalty program: ")) {
                const programName = (0, whatsapp_method_1.getPrgramName)(waResponse.data.text.body);
                let { status, data } = yield (0, whatsapp_method_1.loyaltyProgramSavePoint)({
                    client_phone_number: waResponse.phone_number,
                    program_name: programName,
                    phone_number_id: waResponse.phone_number_id
                }, waResponse.phone_number_id);
                if (status === 200) {
                    const clientPoint = data.data;
                    status = yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, (0, whatsapp_method_1.textMessage)({
                        recipientPhone: waResponse.phone_number,
                        message: `${programName}: ${clientPoint.points} points`
                    }));
                    // await companyChatsRepository.socketPostScanLoyaltyProgram(clientPoint);
                    return 200;
                }
                else {
                    status = yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, (0, whatsapp_method_1.textMessage)({
                        recipientPhone: waResponse.phone_number,
                        message: `You cannot get point`
                    }));
                    return 200;
                }
            }
            else if (waResponse.type === "text" && waResponse.data.text.body.startsWith("Tombola: ")) {
                const tombolaName = (0, whatsapp_method_1.getTombolaName)(waResponse.data.text.body);
                let { status, data } = yield (0, whatsapp_method_1.tombolaSaveRandomDraw)({
                    client_phone_number: waResponse.phone_number,
                    tombola_name: tombolaName,
                    phone_number_id: waResponse.phone_number_id
                }, waResponse.phone_number_id);
                if (status === 200) {
                    console.log(data);
                    const product = data.data;
                    status = yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, (0, whatsapp_method_1.textMessage)({
                        recipientPhone: waResponse.phone_number,
                        message: `${tombolaName}: ${product.name}`
                    }));
                    //await companyChatsRepository.socketPostTombolaProduct(product);
                    return 200;
                }
                else {
                    status = yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, (0, whatsapp_method_1.textMessage)({
                        recipientPhone: waResponse.phone_number,
                        message: `You cannot get point`
                    }));
                    return 200;
                }
            }
            else {
                if (chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length === 0) {
                    if (waResponse.type === "text" || waResponse.type === "button") {
                        if (waResponse.type === "button") {
                            console.dir(waResponse.data.button, { depth: null });
                            console.dir(waResponse.data.button.text, { depth: null });
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: waResponse.data.button.text });
                            // Save chat
                            /*await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: waResponse.data.button.text,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                }, io);*/
                            if (waResponse.data.button.text.trim() === "ça m'intéresse") {
                                console.log("ça m'intéresse");
                            }
                            if (waResponse.data.button.text.trim() === "ça ne m'intéresse pas") {
                                console.log("ça ne m'intéresse pas");
                            }
                            if (waResponse.data.button.text.trim() === "ça ne m'intéresse pas") {
                                yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, {
                                    messaging_product: "whatsapp",
                                    to: waResponse.phone_number,
                                    type: "text",
                                    text: {
                                        body: "Nous sommes désolé de l'apprendre et nous vous disons à très bientôt"
                                    }
                                });
                                return 200;
                            }
                        }
                        else {
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: waResponse.data.text.body });
                            // Save chat
                            /*await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: waResponse.data.text.body,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                }, io);*/
                        }
                        data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]);
                    }
                    else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
                        const label = waResponse.data.interactive.button_reply.title;
                        chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: label });
                        // console.log("TEST")
                        // Save chat
                        /*await companyChatsRepository.addChatMessage(
                            waResponse.phone_number_id,
                            waResponse.phone_number,
                            {
                                text: label,
                                is_bot: false,
                                is_admin: false,
                                date: new Date()
                            }, io);*/
                        data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]);
                    }
                    else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
                        const label = waResponse.data.interactive.list_reply.title;
                        chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: label });
                        // Save chat
                        /*await companyChatsRepository.addChatMessage(
                            waResponse.phone_number_id,
                            waResponse.phone_number,
                            {
                                text: label,
                                is_bot: false,
                                is_admin: false,
                                date: new Date()
                            }, io);*/
                        data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]);
                    }
                    chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = (0, whatsapp_method_1.saveQuestion)(chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]);
                    chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion =
                        chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0];
                }
                else if (chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.responseType === "text" &&
                    chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length !== 0) {
                    if (waResponse.type === "text") {
                        const length = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length;
                        chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats[length - 1].received = waResponse.data.text.body;
                        // Save chat
                        /*await companyChatsRepository.addChatMessage(
                            waResponse.phone_number_id,
                            waResponse.phone_number,
                            {
                                text: waResponse.data.text.body,
                                is_bot: false,
                                is_admin: false,
                                date: new Date()
                            }, io);*/
                        const index = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.findIndex(quest => quest.label === chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.label);
                        if (chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.length > index + 1) {
                            data = yield (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1]);
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = (0, whatsapp_method_1.saveQuestion)(chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1]);
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion =
                                chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1];
                        }
                        else {
                            data = yield (0, whatsapp_method_1.chatToString)(chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats, waResponse.phone_number, waResponse.name);
                            chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                            // Save chat
                            /*await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: data.text.body,
                                    is_bot: true,
                                    is_admin: false,
                                    date: new Date()
                                }, io);*/
                        }
                    }
                    else {
                        data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion);
                    }
                }
                else if (chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.responseType === "button") {
                    if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
                        const id = waResponse.data.interactive.button_reply.id;
                        const label = waResponse.data.interactive.button_reply.title;
                        const length = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length;
                        chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats[length - 1].received = label;
                        // Save chat
                        /*await companyChatsRepository.addChatMessage(
                            waResponse.phone_number_id,
                            waResponse.phone_number,
                            {
                                text: label,
                                is_bot: false,
                                is_admin: false,
                                date: new Date()
                            }, io);*/
                        const currentLabel = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.label;
                        const index = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.findIndex(quest => quest.label === currentLabel);
                        const response = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index]
                            .responses.find(resp => resp.id === id);
                        if (response.questions) {
                            data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, response.questions[0]);
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = (0, whatsapp_method_1.saveQuestion)(response.questions[0]);
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario = response.questions;
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion = response.questions[0];
                        }
                        else {
                            data = yield (0, whatsapp_method_1.chatToString)(chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats, waResponse.phone_number, waResponse.name);
                            chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                            // Save chat
                            /*await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: data.text.body,
                                    is_bot: true,
                                    is_admin: false,
                                    date: new Date()
                                }, io);*/
                        }
                    }
                    else {
                        data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion);
                    }
                }
                else if (chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.responseType === "list") {
                    if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
                        const id = waResponse.data.interactive.list_reply.id;
                        const label = waResponse.data.interactive.list_reply.title;
                        const length = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.length;
                        chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats[length - 1].received = label;
                        // Save chat
                        /*await companyChatsRepository.addChatMessage(
                            waResponse.phone_number_id,
                            waResponse.phone_number,
                            {
                                text: label,
                                is_bot: false,
                                is_admin: false,
                                date: new Date()
                            }, io);*/
                        const currentLabel = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.label;
                        const index = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.findIndex(quest => quest.label === currentLabel);
                        const response = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index]
                            .responses.find(resp => resp.id === id);
                        if (response.questions) {
                            data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, response.questions[0]);
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = (0, whatsapp_method_1.saveQuestion)(response.questions[0]);
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario = response.questions;
                            chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion = response.questions[0];
                        }
                        else {
                            data = yield (0, whatsapp_method_1.chatToString)(chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats, waResponse.phone_number, waResponse.name);
                            chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                            // Save chat
                            /*await companyChatsRepository.addChatMessage(
                                waResponse.phone_number_id,
                                waResponse.phone_number,
                                {
                                    text: data.text.body,
                                    is_bot: true,
                                    is_admin: false,
                                    date: new Date()
                                }, io);*/
                        }
                    }
                    else {
                        data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion);
                    }
                }
                const status = yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, data);
                if (chat_model_1.sessions.get(waResponse.phone_number).has(waResponse.phone_number_id)) {
                    chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ send: chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend });
                    // Save chat
                    /*await companyChatsRepository.addChatMessage(
                        waResponse.phone_number_id,
                        waResponse.phone_number,
                        {
                            text: sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend,
                            is_bot: true,
                            is_admin: false,
                            date: new Date()
                        }, io);*/
                }
                return 200;
            }
        }
        else {
            return 403;
        }
    }
    catch (error) {
        console.log(error);
        throw new Error(error);
    }
});
exports.processChatQueue = processChatQueue;
chatQueue.process(exports.processChatQueue);
//# sourceMappingURL=chatbot-inmemory-process.js.map