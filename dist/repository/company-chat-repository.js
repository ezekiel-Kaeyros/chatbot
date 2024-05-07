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
exports.CompanyChatRespository = void 0;
const axios_1 = __importDefault(require("axios"));
const company_chats_model_1 = require("../models/company-chats-model");
class CompanyChatRespository {
    constructor() { }
    createCompanyChats(phone_number_id, phone_number, chat_message) {
        return __awaiter(this, void 0, void 0, function* () {
            const companyChats = {
                phone_number_id,
                conversations: [{
                        phone_number,
                        chat_messages: [chat_message],
                        unread_msg: 1
                    }]
            };
            return company_chats_model_1.companiesChats.create(companyChats);
        });
    }
    getAllCompaniesChats(offset = 0, pages) {
        return __awaiter(this, void 0, void 0, function* () {
            return company_chats_model_1.companiesChats
                .find()
                .skip(offset)
                .limit(pages ? pages : 100);
        });
    }
    getCompanyChatsById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return company_chats_model_1.companiesChats.findById(id);
        });
    }
    getCompanyChatsByPhoneNumberId(phone_number_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return company_chats_model_1.companiesChats.findOne({ phone_number_id });
        });
    }
    getChatsConversation(phone_number_id, phone_number) {
        return __awaiter(this, void 0, void 0, function* () {
            const companyChats = yield company_chats_model_1.companiesChats.findOne({ phone_number_id });
            if (companyChats === null || companyChats === void 0 ? void 0 : companyChats.conversations) {
                const chatsConversation = companyChats.conversations.find(conversation => conversation.phone_number === phone_number);
                chatsConversation === null || chatsConversation === void 0 ? void 0 : chatsConversation.chat_messages.map(chatMessage => {
                    if (!chatMessage.is_read)
                        chatMessage.is_read = true;
                    return chatMessage;
                });
                if (chatsConversation === null || chatsConversation === void 0 ? void 0 : chatsConversation.unread_msg)
                    chatsConversation.unread_msg = 0;
                companyChats === null || companyChats === void 0 ? void 0 : companyChats.conversations.map(conversation => {
                    if (conversation.phone_number === phone_number) {
                        conversation = chatsConversation;
                    }
                });
                companyChats.markModified('conversations');
                companyChats.updateOne();
                return chatsConversation;
            }
        });
    }
    updateCompanyChats({ _id, phone_number_id, company, conversations }) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingCompanyChats = yield company_chats_model_1.companiesChats.findById(_id);
            existingCompanyChats.phone_number_id = phone_number_id;
            existingCompanyChats.company = company;
            existingCompanyChats.conversations = conversations;
            existingCompanyChats.markModified('conversations');
            return existingCompanyChats.updateOne();
        });
    }
    createConversation(phone_number_id, phone_number, chat_message) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingCompanyChats = yield company_chats_model_1.companiesChats.findOne({ phone_number_id });
            existingCompanyChats.conversations.push({
                phone_number,
                chat_messages: [chat_message],
                unread_msg: 1
            });
            existingCompanyChats.markModified('conversations');
            return existingCompanyChats.save();
        });
    }
    updateConversation(phone_number_id, phone_number, chat_message) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingCompanyChats = yield company_chats_model_1.companiesChats.findOne({ phone_number_id });
            existingCompanyChats.conversations.map(conversation => {
                if (conversation.phone_number === phone_number) {
                    conversation.chat_messages = [...conversation.chat_messages, chat_message];
                    conversation.unread_msg += 1;
                }
                return conversation;
            });
            // console.debug("EXISTING CONVERSATION: ", existingCompanyChats._id);
            existingCompanyChats.markModified('conversations');
            return existingCompanyChats.save();
        });
    }
    addChatMessage(phone_number_id, phone_number, chat_message, io) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                chat_message.is_read = false;
                let res;
                const companyChats = yield company_chats_model_1.companiesChats.findOne({ phone_number_id });
                if (companyChats) {
                    if (companyChats.conversations.some(conversation => conversation.phone_number === phone_number)) {
                        res = this.updateConversation(phone_number_id, phone_number, chat_message);
                    }
                    else {
                        res = this.createConversation(phone_number_id, phone_number, chat_message);
                    }
                }
                else {
                    res = this.createCompanyChats(phone_number_id, phone_number, chat_message);
                }
                io.emit(`message-${phone_number_id}-${phone_number}`, { data: res });
                return res;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    deleteScenario(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return company_chats_model_1.companiesChats.deleteOne({ _id: id });
        });
    }
    socketPostMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, axios_1.default)({
                method: "POST",
                url: `https://dbasocket.onrender.com/api/new-message`,
                data: data,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        });
    }
    ;
    socketPostScanLoyaltyProgram(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, axios_1.default)({
                method: "POST",
                url: `https://dbasocket.onrender.com/api/new-scan-loyalty`,
                data: data,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        });
    }
    ;
    socketPostTombolaProduct(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, axios_1.default)({
                method: "POST",
                url: `https://dbasocket.onrender.com/api/new-scan-tombola`,
                data: data,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        });
    }
    ;
}
exports.CompanyChatRespository = CompanyChatRespository;
//# sourceMappingURL=company-chat-repository.js.map