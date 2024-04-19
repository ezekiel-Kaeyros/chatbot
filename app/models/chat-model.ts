import { QuestionModel } from "./dto/scenario-input";

export type Chat = {
    send?: string;
    received?: string;
};

export type Conversation = {
    scenario: QuestionModel[];
    chats: Chat[];
    currentQuestion?: QuestionModel;
    textSend?: string;
    timeout?: Date;
    token?: string;
    company?: string;
};
// Map<phone, Map<company, chat>>
export const sessions = new Map<string, Map<string, Conversation>>();