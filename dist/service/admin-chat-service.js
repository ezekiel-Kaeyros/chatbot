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
exports.AdminChatsService = void 0;
const company_chat_repository_1 = require("../repository/company-chat-repository");
const tsyringe_1 = require("tsyringe");
const response_1 = require("../utility/response");
const scenario_repository_1 = require("../repository/scenario-repository");
const whatsapp_method_1 = require("../utility/whatsapp-method");
const bot_enum_1 = require("../enums/bot-enum");
const companyChatsRepository = new company_chat_repository_1.CompanyChatRespository();
const scenariorepository = new scenario_repository_1.ScenarioRespository();
let AdminChatsService = class AdminChatsService {
    constructor() { }
    ResponseWithError(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, response_1.ErrorResponse)(404, "request method is not supported!");
        });
    }
    sendChatMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                /*const input = plainToClass(ChatInput, req.body);
                const error = await AppValidationError(input);
                if (error) return res.status(404).send(error);
    
                const token = sessions?.get(input.phone_number)?.get(input.phone_number_id).token;
                let token: string;
                if (!sessions.has(input.phone_number)) {
                    return res.status(400).send("Il n'existe aucune conversation ouverte avec ce client");
                } else if (!sessions.get(input.phone_number).has(input.phone_number_id)) {
                    return res.status(400).send("Il n'existe aucune conversation ouverte avec ce client");
                } else {
                    token = sessions.get(input.phone_number).get(input.phone_number_id).token;
                }
                const chatMessage : ChatMessageModel = {text: input.message, is_admin: true, is_bot: false, date: new Date()};
                const data = await companyChatsRepository.addChatMessage(input.phone_number_id, input.phone_number, chatMessage, req.io);
                
                if (data) {
                    let status = await sendWhatsappMessage(input.phone_number_id, token, textMessage({
                        recipientPhone: input.phone_number,
                        message: input.message
                    }));
                }*/
                return res.status(200).send();
            }
            catch (error) {
                console.log(error);
                return res.status(500).send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    getAllCompaniesChats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield companyChatsRepository.getAllCompaniesChats();
                return res.status(200).send(data);
            }
            catch (error) {
                console.log(error);
                return res.status(500).send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    getCompanyChats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const phone_number_id = (_a = req.params) === null || _a === void 0 ? void 0 : _a.phone_number_id;
                if (!phone_number_id)
                    return res.status(403).send("please provide company phone number id");
                const data = yield companyChatsRepository.getCompanyChatsByPhoneNumberId(phone_number_id);
                const time = Date.now();
                const conversations = data.conversations.sort((userA, userB) => {
                    const aTime = new Date(userA.chat_messages[userA.chat_messages.length - 1].date).getTime();
                    const bTime = new Date(userB.chat_messages[userB.chat_messages.length - 1].date).getTime();
                    const aDelta = Math.abs(time - aTime);
                    const bDelta = Math.abs(time - bTime);
                    return (aDelta - bDelta);
                });
                for (let conv of conversations) {
                    if (conv.chat_messages.length > 0) {
                        const chats = conv.chat_messages.reverse();
                        const index = chats.findIndex(message => message.is_bot === false);
                        const timeLeft = (0, whatsapp_method_1.chatSessionTimeout)(chats[index].date, new Date()) / 60;
                        if (timeLeft < 24) {
                            if (chats[0].chat_status !== bot_enum_1.ChatStatus.PENDING)
                                chats[0].chat_status = bot_enum_1.ChatStatus.OPEN;
                        }
                        else {
                            chats[0].chat_status = bot_enum_1.ChatStatus.EXPIRED;
                        }
                        conv.chat_messages = chats.reverse();
                    }
                }
                data.conversations = conversations;
                return res.status(200).send(data);
            }
            catch (error) {
                console.log(error);
                return res.status(500).send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    getChatsConversation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const phone_number_id = (_a = req.params) === null || _a === void 0 ? void 0 : _a.phone_number_id;
                if (!phone_number_id)
                    return res.status(403).send("please provide company phone number id");
                const phone_number = (_b = req.params) === null || _b === void 0 ? void 0 : _b.phone_number;
                if (!phone_number)
                    return res.status(403).send("please provide user phone number");
                const companyChats = yield companyChatsRepository.getChatsConversation(phone_number_id, phone_number);
                console.log(companyChats);
                return res.status(200).send(companyChats);
            }
            catch (error) {
                console.log(error);
                return res.status(200).send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    changeStatusConversation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phone_number, phone_number_id, status } = req.body;
                // Validate status
                const validStatuses = ["pending", "open"];
                if (!validStatuses.includes(status)) {
                    return res.status(400).send({ error: "Statut invalide, seuls les statuts 'pending' et 'open' sont pris en compte" });
                }
                // Update chat status
                const updateResult = yield companyChatsRepository.updateStatusLastChatConversation(phone_number_id, phone_number, status);
                if (!updateResult) {
                    return res.status(404).send({ error: "Company chat or conversation not found" });
                }
                return res.status(200).send({ message: "Chat status updated successfully" });
            }
            catch (error) {
                console.log(error);
                return res.status(500).send({ error: "Internal error" });
            }
        });
    }
};
exports.AdminChatsService = AdminChatsService;
exports.AdminChatsService = AdminChatsService = __decorate([
    (0, tsyringe_1.autoInjectable)(),
    __metadata("design:paramtypes", [])
], AdminChatsService);
//# sourceMappingURL=admin-chat-service.js.map