import axios from "axios";
import {
    ChatMessageModel,
    ChatsConversationModel,
    CompanyChatsDoc,
    CompanyChatsModel,
    companiesChats
} from "../models/company-chats-model";
import { ClientPointModel } from "../models/client-point-model";
import { TombolaProductModel } from "../models/tombola-product-model";

export class CompanyChatRespository {
    constructor() {}

    async createCompanyChats(
        phone_number_id: string,
        phone_number: string,
        chat_message: ChatMessageModel
    ) {
        const companyChats: CompanyChatsModel = {
            phone_number_id,
            conversations: [{
                phone_number,
                chat_messages: [chat_message],
                unread_msg: 1
            }]
        };
        return companiesChats.create(companyChats);
    }

    async getAllCompaniesChats(offset = 0, pages?: number) {
        return companiesChats
            .find()
            .skip(offset)
            .limit(pages ? pages : 100);
    }

    async getCompanyChatsById(id: string) {
        return companiesChats.findById(id);
    }

    async getCompanyChatsByPhoneNumberId(phone_number_id: string) {
        return companiesChats.findOne({ phone_number_id });
    }

    async getChatsConversation(phone_number_id: string, phone_number: string) {
        const companyChats = await companiesChats.findOne({phone_number_id}) as CompanyChatsDoc;
        const chatsConversation = companyChats.conversations.find(
            conversation => conversation.phone_number === phone_number
        );
        chatsConversation.chat_messages.map(chatMessage => {
            if (!chatMessage.is_read) chatMessage.is_read = true;
            return chatMessage;
        });
        chatsConversation.unread_msg = 0;
        companyChats.conversations.map(conversation => {
            if (conversation.phone_number === phone_number) {
                conversation = chatsConversation;
            }
        })
        companyChats.markModified('conversations');
        companyChats.save();
        return chatsConversation;
    }

    async updateCompanyChats({
        _id,
        phone_number_id,
        company,
        conversations
    }: CompanyChatsModel) {
        const existingCompanyChats = await companiesChats.findById(_id) as CompanyChatsDoc;
        existingCompanyChats.phone_number_id = phone_number_id;
        existingCompanyChats.company = company;
        existingCompanyChats.conversations = conversations;
        existingCompanyChats.markModified('conversations');
        return existingCompanyChats.save();
    }

    async createConversation(
        phone_number_id: string,
        phone_number: string,
        chat_message: ChatMessageModel
    ) {
        const existingCompanyChats = await companiesChats.findOne({phone_number_id}) as CompanyChatsDoc;
        existingCompanyChats.conversations.push({
            phone_number,
            chat_messages: [chat_message],
            unread_msg: 1
        });
        existingCompanyChats.markModified('conversations');
        return existingCompanyChats.save();
    }

    async updateConversation(phone_number_id: string, phone_number: string, chat_message: ChatMessageModel) {
        const existingCompanyChats = await companiesChats.findOne({phone_number_id}) as CompanyChatsDoc;
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
    }

    async addChatMessage(phone_number_id: string, phone_number: string, chat_message: ChatMessageModel) {
        // await this.socketPostMessage({
        //     phone_number_id,
        //     phone_number,
        //     chat_message
        // });
        chat_message.is_read = false;
        const companyChats = await companiesChats.findOne({phone_number_id}) as CompanyChatsDoc;
        if (companyChats) {
            if (companyChats.conversations.some(conversation => conversation.phone_number === phone_number)) {
                return this.updateConversation(phone_number_id, phone_number, chat_message);
            } else {
                return this.createConversation(phone_number_id, phone_number, chat_message);
            }
        } else {
            return this.createCompanyChats(phone_number_id, phone_number, chat_message);
        }
    }

    async deleteScenario(id: string) {
        return companiesChats.deleteOne({ _id: id });
    }

    
    async socketPostMessage(data: chatSocketResponse) {
        return axios({
            method: "POST",
            url: `https://dbasocket.onrender.com/api/new-message`,
            data: data,
            headers: {
                "Content-Type": "application/json"
            }
        });
    };

    async socketPostScanLoyaltyProgram(data: ClientPointModel) {
        return axios({
            method: "POST",
            url: `https://dbasocket.onrender.com/api/new-scan-loyalty`,
            data: data,
            headers: {
                "Content-Type": "application/json"
            }
        });
    };

    async socketPostTombolaProduct(data: TombolaProductModel) {
        return axios({
            method: "POST",
            url: `https://dbasocket.onrender.com/api/new-scan-tombola`,
            data: data,
            headers: {
                "Content-Type": "application/json"
            }
        });
    };
}

export type chatSocketResponse = {
    phone_number_id: string;
    phone_number: string;
    chat_message: ChatMessageModel;
};