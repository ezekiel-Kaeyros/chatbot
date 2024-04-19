"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyChatsService = void 0;
const tsyringe_1 = require("tsyringe");
const response_1 = require("../utility/response");
const credentials_repository_1 = require("../repository/credentials-repository");
const whatsapp_method_1 = require("../utility/whatsapp-method");
const chat_model_1 = require("../models/chat-model");
const company_chat_repository_1 = require("../repository/company-chat-repository");
const scenario_repository_1 = require("../repository/scenario-repository");
const companyChatsRepository = new company_chat_repository_1.CompanyChatRespository();
const credentialsRepository = new credentials_repository_1.CredentialsRepository();
const scenarioRepository = new scenario_repository_1.ScenarioRespository();
let CompanyChatsService = class CompanyChatsService {
    ResponseWithError(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, response_1.ErrorResponse)(404, "request method is not supported!");
        });
    }
    getMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const queryParams = req.query;
                const mode = queryParams["hub.mode"];
                const verify_token = queryParams["hub.verify_token"];
                const challenge = queryParams["hub.challenge"];
                const credentials = yield credentialsRepository.getByVerifyToken(verify_token);
                if (mode && verify_token) {
                    if (mode === "subscribe" && verify_token === credentials.verify_token) {
                        console.log("WEBHOOK_VERIFIED");
                        return res.status(200).send(challenge);
                    }
                    else {
                        return res.status(403).send();
                    }
                }
                return res.status(403).send();
            }
            catch (error) {
                console.log(error);
                return res.status(500).send();
            }
        });
    }
    sendMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = req.body;
                // await sendChat(body);
                // return res.status(200).send();
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
                            const scenario = yield scenarioRepository.getScenarioByPhoneNumberId(waResponse.phone_number_id);
                            if (scenario.keywords && scenario.keywords.length !== 0) {
                                let inputText = '';
                                if (waResponse.type === "text")
                                    inputText = waResponse.data.text.body.trim();
                                if (waResponse.type === "button")
                                    inputText = waResponse.data.button.text.trim();
                                if (!scenario.keywords.includes(inputText)) {
                                    yield (0, whatsapp_method_1.forbiddenUserResponse)({
                                        recipientPhone: waResponse.phone_number,
                                        message: "Cliquez sur l'un des buttons ou sur le lien du message que vous avez reçu."
                                    }, waResponse.phone_number_id, token);
                                    return res.status(200).send({});
                                }
                            }
                            if (waResponse.type === "text" || waResponse.type === "button") {
                                if (waResponse.type === "button") {
                                    console.dir(waResponse.data.button, { depth: null });
                                    console.dir(waResponse.data.button.text, { depth: null });
                                    if (waResponse.data.button.text.trim() === "ça ne m'intéresse pas") {
                                        yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, {
                                            messaging_product: "whatsapp",
                                            to: waResponse.phone_number,
                                            type: "text",
                                            text: {
                                                body: "Nous sommes désolé de l'apprendre et nous vous disons à très bientôt"
                                            }
                                        });
                                        chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                                        return res.status(200).send({});
                                    }
                                    else {
                                        chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: waResponse.data.button.text });
                                        // Save chat
                                        yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                            text: waResponse.data.button.text,
                                            is_bot: false,
                                            is_admin: false,
                                            date: new Date()
                                        });
                                    }
                                }
                                else {
                                    chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: waResponse.data.text.body });
                                    // Save chat
                                    yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                        text: waResponse.data.text.body,
                                        is_bot: false,
                                        is_admin: false,
                                        date: new Date()
                                    });
                                }
                                data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]);
                            }
                            else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
                                const label = waResponse.data.interactive.button_reply.title;
                                chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: label });
                                // console.log("TEST")
                                // Save chat
                                yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                    text: label,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
                                data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[0]);
                            }
                            else if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
                                const label = waResponse.data.interactive.list_reply.title;
                                chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats.push({ received: label });
                                // Save chat
                                yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                    text: label,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
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
                                yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                    text: waResponse.data.text.body,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
                                const index = chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.findIndex(quest => quest.label === chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion.label);
                                if (chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario.length > index + 1) {
                                    data = (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1]);
                                    chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend = (0, whatsapp_method_1.saveQuestion)(chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1]);
                                    chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).currentQuestion =
                                        chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).scenario[index + 1];
                                }
                                else {
                                    data = yield (0, whatsapp_method_1.chatToString)(chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id);
                                    chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                                    // Save chat
                                    yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                        text: data.text.body,
                                        is_bot: true,
                                        is_admin: false,
                                        date: new Date()
                                    });
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
                                yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                    text: label,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
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
                                    data = yield (0, whatsapp_method_1.chatToString)(chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id);
                                    chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                                    // Save chat
                                    yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                        text: data.text.body,
                                        is_bot: true,
                                        is_admin: false,
                                        date: new Date()
                                    });
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
                                yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                    text: label,
                                    is_bot: false,
                                    is_admin: false,
                                    date: new Date()
                                });
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
                                    data = yield (0, whatsapp_method_1.chatToString)(chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id);
                                    chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                                    // Save chat
                                    yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                        text: data.text.body,
                                        is_bot: true,
                                        is_admin: false,
                                        date: new Date()
                                    });
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
                            yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                                text: chat_model_1.sessions.get(waResponse.phone_number).get(waResponse.phone_number_id).textSend,
                                is_bot: true,
                                is_admin: false,
                                date: new Date()
                            });
                        }
                        else {
                            if (waResponse.phone_number_id === "100609346426084") {
                                yield (0, whatsapp_method_1.forbiddenUserResponse)({
                                    recipientPhone: waResponse.phone_number,
                                    message: `Participez à la fêtes des mères et recevez 1000 frs de crédit de communication en cliquant sur ce lien.\nhttps://wa.me/message/UJBNPI6GLOCTN1`
                                }, waResponse.phone_number_id, token);
                            }
                        }
                        return res.status(200).send({});
                    }
                }
                else {
                    return res.status(403).send({});
                }
            }
            catch (error) {
                console.log(error);
                return res.status(500).send();
            }
        });
    }
};
exports.CompanyChatsService = CompanyChatsService;
exports.CompanyChatsService = CompanyChatsService = __decorate([
    (0, tsyringe_1.autoInjectable)()
], CompanyChatsService);
//# sourceMappingURL=company-chats-service.js.map