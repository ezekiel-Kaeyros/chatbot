import mongoose from "mongoose";
import { FilterLabels } from "./dto/scenario-input";

export type ChatMessageModel = {
    text: string;
    is_bot: boolean;
    is_admin: boolean;
    date?: Date;
    is_read?: boolean;
};

export type ChatsConversationModel = {
    phone_number: string;
    chat_messages: ChatMessageModel[];
    unread_msg?: number;
};

export type CompanyChatsModel = {
    _id?: string;
    phone_number_id: string;
    company?: string;
    conversations: ChatsConversationModel[];
};

export type CompanyChatsDoc = mongoose.Document & CompanyChatsModel;

const companyChatsSchema = new mongoose.Schema(
    {
        phone_number_id: String,
        company: String,
        conversations: [{}],
    },
    {
        toJSON: {
            transform(doc, ret, options) {
                delete ret.__v;
                delete ret.createdAt;
                delete ret.updatedAt;
            },
        },
        timestamps: true,
    }
);

const companiesChats = (mongoose.models.companiesChats as mongoose.Model<CompanyChatsDoc>) ||
mongoose.model<CompanyChatsDoc>("chats", companyChatsSchema);

export { companiesChats };