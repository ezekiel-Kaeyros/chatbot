"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
const credentials_repository_1 = require("../repository/credentials-repository");
const whatsapp_method_1 = require("../utility/whatsapp-method");
const chat_model_1 = require("../models/chat-model");
const company_chat_repository_1 = require("../repository/company-chat-repository");
const meta_request_1 = require("../utility/meta-request");
const bot_enum_1 = require("../enums/bot-enum");
const upload_file_from_webhook_1 = require("../utility/upload-file-from-webhook");
const companyChatsRepository = new company_chat_repository_1.CompanyChatRespository();
const credentialsRepository = new credentials_repository_1.CredentialsRepository();
let CompanyChatsService = class CompanyChatsService {
    constructor() { }
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
            var _a;
            try {
                const body = Object.assign(Object.assign({}, req.body), { io: req.io });
                const resultRecieved = yield (0, whatsapp_method_1.getWhatsappResponse)(body);
                if (!resultRecieved) {
                    return res.status(200).send({});
                }
                const waResponse = resultRecieved;
                const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
                if (!session) {
                    return res.status(200).send({});
                }
                const token = session.token;
                const last_message = session.last_message;
                if (session.chats.length === 0) {
                    const data = yield this.handleInitialResponse(waResponse, req, token);
                    if (data) {
                        const status = yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, data);
                        const send = (0, whatsapp_method_1.getTextSendWAMessageModel)(data);
                        const received = (0, whatsapp_method_1.getTextMessageWAResponseModel)(waResponse);
                        console.log('send =======', send);
                        console.log('received =======', received);
                        session.chats.push({ send, received });
                        yield this.saveChatMessage(waResponse, session, send, bot_enum_1.ChatStatus.PENDING, req.io, true, false);
                    }
                }
                else {
                    const data = yield this.handleSubsequentResponse(waResponse, req, token);
                    if (data) {
                        const status = yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, data);
                        const send = (0, whatsapp_method_1.getTextSendWAMessageModel)(data);
                        const received = (0, whatsapp_method_1.getTextMessageWAResponseModel)(waResponse);
                        console.log('send =======', send);
                        console.log('received =======', received);
                        session.chats.push({ send, received });
                        console.log('session.chats ===', session.chats);
                        yield this.saveChatMessage(waResponse, session, send, bot_enum_1.ChatStatus.PENDING, req.io, true, false);
                    }
                    else if (last_message) {
                        yield (0, whatsapp_method_1.forbiddenUserResponse)({
                            recipientPhone: waResponse.phone_number,
                            message: last_message
                        }, waResponse.phone_number_id, token);
                    }
                }
                return res.status(200).send({});
            }
            catch (error) {
                console.error(error);
                return res.status(500).send();
            }
        });
    }
    handleInitialResponse(waResponse, req, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            let data;
            switch (waResponse.type) {
                case "text":
                case "button":
                    data = yield this.handleTextOrButtonResponse(waResponse, req, token);
                    break;
                case "interactive":
                    data = yield this.handleInteractiveResponse(waResponse, req);
                    break;
                case "order":
                    data = yield this.handleOrderResponse(waResponse, req, token);
                    break;
                case "image":
                    data = yield this.handleImageResponse(waResponse, req, token);
                    break;
            }
            session.textSend = (0, whatsapp_method_1.saveQuestion)(session.scenario[0]);
            session.currentQuestion = session.scenario[0];
            return data;
        });
    }
    handleSubsequentResponse(waResponse, req, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            let data;
            console.log('chats ********', session.chats);
            console.log("waResponse", waResponse);
            switch (waResponse.type) {
                case "text":
                    data = yield this.handleTextResponse(waResponse, req, token);
                    break;
                case "image":
                    data = yield this.handleImageResponse(waResponse, req, token);
                    break;
                case "interactive":
                    data = yield this.handleButtonAndListReplyResponse(waResponse, req);
                    break;
                case "template":
                    data = yield this.handleTemplateResponse(waResponse, req, token);
                    break;
            }
            return data;
        });
    }
    handleTextOrButtonResponse(waResponse, req, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            if (waResponse.type === "button" && waResponse.data.button.text.trim() === "ça ne m'intéresse pas") {
                const dataMessage = this.createTextMessage(waResponse.phone_number, "Nous sommes désolé de l'apprendre et nous vous disons à très bientôt");
                yield (0, whatsapp_method_1.sendWhatsappMessage)(waResponse.phone_number_id, token, dataMessage);
                chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                return null;
            }
            yield this.saveChatMessage(waResponse, session, waResponse.data.text.body || waResponse.data.button.text, bot_enum_1.ChatStatus.START, req.io, false, false);
            if (waResponse.data.text.body === "Fête des mères, appuyez sur envoyer") {
                yield (0, whatsapp_method_1.sendTemplateMessage)(waResponse.phone_number, waResponse.phone_number_id, token);
                chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                return null;
            }
            return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, session.scenario[0]);
        });
    }
    handleInteractiveResponse(waResponse, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            const label = ((_b = waResponse.data.interactive.button_reply) === null || _b === void 0 ? void 0 : _b.title) || ((_c = waResponse.data.interactive.list_reply) === null || _c === void 0 ? void 0 : _c.title);
            yield this.saveChatMessage(waResponse, session, label, bot_enum_1.ChatStatus.START, req.io, false, false);
            return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, session.scenario[0]);
        });
    }
    handleOrderResponse(waResponse, req, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            const orderDetails = yield this.getOrderDetails(waResponse, token);
            yield this.saveChatMessage(waResponse, session, `\n\n*Command*\n${orderDetails}`, bot_enum_1.ChatStatus.START, req.io, false, false);
            return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, session.scenario[0]);
        });
    }
    handleImageResponse(waResponse, req, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            const resUrl = yield (0, upload_file_from_webhook_1.getUrlWhatsappFile)(waResponse.data.image.id, token);
            const url = yield (0, upload_file_from_webhook_1.downloadWhatsappFile)(resUrl.url, token, resUrl.mime_type);
            yield this.saveChatMessage(waResponse, session, url, bot_enum_1.ChatStatus.PENDING, req.io, false, false);
            const index = session.scenario.findIndex(quest => quest.label === session.currentQuestion.label);
            if (session.scenario.length > index + 1) {
                session.currentQuestion = session.scenario[index + 1];
                (_b = chat_model_1.sessions.get(waResponse.phone_number)) === null || _b === void 0 ? void 0 : _b.set(waResponse.phone_number_id, session);
                return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, session.scenario[index + 1]);
            }
            else {
                const data = yield (0, whatsapp_method_1.chatToString)(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
                yield this.saveChatMessage(waResponse, session, data.text.body, bot_enum_1.ChatStatus.END, req.io, false, false);
                chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                return data;
            }
        });
    }
    handleTextResponse(waResponse, req, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            if (waResponse.type === "text") {
                yield this.saveChatMessage(waResponse, session, waResponse.data.text.body, bot_enum_1.ChatStatus.PENDING, req.io, false, false);
                const index = session.scenario.findIndex(quest => quest.label === session.currentQuestion.label);
                if (session.scenario.length > index + 1) {
                    session.currentQuestion = session.scenario[index + 1];
                    (_b = chat_model_1.sessions.get(waResponse.phone_number)) === null || _b === void 0 ? void 0 : _b.set(waResponse.phone_number_id, session);
                    return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, session.scenario[index + 1]);
                }
                else {
                    const data = yield (0, whatsapp_method_1.chatToString)(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
                    //await this.saveChatMessage(waResponse, session, data.text.body, ChatStatus.END, req.io);
                    chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                    return data;
                }
            }
            return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, session.currentQuestion);
        });
    }
    handleButtonAndListReplyResponse(waResponse, req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (waResponse.data.interactive.type === "button_reply") {
                return yield this.handleButtonResponse(waResponse, req);
            }
            else if (waResponse.data.interactive.type === "list_reply") {
                return yield this.handleListResponse(waResponse, req);
            }
        });
    }
    handleButtonResponse(waResponse, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            if (waResponse.type === "interactive" && waResponse.data.interactive.type === "button_reply") {
                const label = waResponse.data.interactive.button_reply.title;
                yield this.saveChatMessage(waResponse, session, label, bot_enum_1.ChatStatus.PENDING, req.io, false, false);
                const currentLabel = session.currentQuestion.label;
                const index = session.scenario.findIndex(quest => quest.label === currentLabel);
                const response = session.scenario[index].responses.find(resp => resp.id === waResponse.data.interactive.button_reply.id);
                if (response.questions) {
                    session.scenario = response.questions;
                    session.currentQuestion = response.questions[0];
                    (_b = chat_model_1.sessions.get(waResponse.phone_number)) === null || _b === void 0 ? void 0 : _b.set(waResponse.phone_number_id, session);
                    return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, response.questions[0]);
                }
                else {
                    const data = yield (0, whatsapp_method_1.chatToString)(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
                    //await this.saveChatMessage(waResponse, session, data.text.body, ChatStatus.END, req.io);
                    chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                    return data;
                }
            }
            return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, session.currentQuestion);
        });
    }
    handleListResponse(waResponse, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            if (waResponse.type === "interactive" && waResponse.data.interactive.type === "list_reply") {
                const label = waResponse.data.interactive.list_reply.title;
                yield this.saveChatMessage(waResponse, session, label, bot_enum_1.ChatStatus.PENDING, req.io, false, false);
                const currentLabel = session.currentQuestion.label;
                const index = session.scenario.findIndex(quest => quest.label === currentLabel);
                const response = session.scenario[index].responses.find(resp => resp.id === waResponse.data.interactive.list_reply.id);
                if (response.questions) {
                    session.scenario = response.questions;
                    session.currentQuestion = response.questions[0];
                    (_b = chat_model_1.sessions.get(waResponse.phone_number)) === null || _b === void 0 ? void 0 : _b.set(waResponse.phone_number_id, session);
                    return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, response.questions[0]);
                }
                else {
                    const data = yield (0, whatsapp_method_1.chatToString)(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
                    //await this.saveChatMessage(waResponse, session, data.text.body, ChatStatus.END, req.io);
                    chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                    return data;
                }
            }
            return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, session.currentQuestion);
        });
    }
    handleTemplateResponse(waResponse, req, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const session = (_a = chat_model_1.sessions.get(waResponse.phone_number)) === null || _a === void 0 ? void 0 : _a.get(waResponse.phone_number_id);
            if (!session)
                return null;
            if (waResponse.type === "order") {
                const orderDetails = yield this.getOrderDetails(waResponse, token);
                const data = yield (0, whatsapp_method_1.chatToString)(session.chats, waResponse.phone_number, waResponse.name, waResponse.phone_number_id, session.company, session.report_into);
                yield this.saveChatMessage(waResponse, session, data.text.body, bot_enum_1.ChatStatus.END, req.io, false, false);
                chat_model_1.sessions.get(waResponse.phone_number).delete(waResponse.phone_number_id);
                return data;
            }
            return (0, whatsapp_method_1.askQuestion)(waResponse.phone_number, session.currentQuestion);
        });
    }
    getOrderDetails(waResponse, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const products = waResponse.data.order.product_items;
            const result = yield (0, meta_request_1.getCatalogProducts)();
            let order = ``;
            let total = 0;
            if (result.status === 200) {
                const productsList = result.data.data;
                console.log(productsList);
                for (let product of products) {
                    const productItem = productsList.find((item) => item.retailer_id === product.product_retailer_id);
                    order += `produit: *${productItem.name}*\nqté: *${product.quantity}*\nprix unit: *€${product.item_price}*\nmontant: *€${(+product.quantity) * (+product.item_price)}*\n\n`;
                    total += (+product.quantity) * (+product.item_price);
                }
            }
            else {
                for (let product of products) {
                    order += `produit: *${product.product_retailer_id}*\nqté: *${product.quantity}*\nprix unit: *€${product.item_price}*\nmontant: *€${(+product.quantity) * (+product.item_price)}*\n\n`;
                    total += (+product.quantity) * (+product.item_price);
                }
            }
            order += `Total: *€${total}*\n\n`;
            return order;
        });
    }
    saveChatMessage(waResponse, session, text, status, io, is_bot, is_admin) {
        return __awaiter(this, void 0, void 0, function* () {
            yield companyChatsRepository.addChatMessage(waResponse.phone_number_id, waResponse.phone_number, {
                text,
                is_bot,
                is_admin,
                date: new Date(),
                is_read: false,
                chat_status: status,
                scenario_name: session.scenario_name
            }, io);
        });
    }
    createTextMessage(phoneNumber, message) {
        return {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "text",
            text: { body: message }
        };
    }
};
exports.CompanyChatsService = CompanyChatsService;
exports.CompanyChatsService = CompanyChatsService = __decorate([
    (0, tsyringe_1.autoInjectable)(),
    __metadata("design:paramtypes", [])
], CompanyChatsService);
//# sourceMappingURL=company-chats-service.js.map