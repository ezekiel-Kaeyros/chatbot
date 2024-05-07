import { QuestionModel } from "./dto/scenario-input";
import { User } from "./scenario-model";

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
    report_into?: string;
    last_message?: string;
    times?: number;
    users?: User[];
    scenario_name?: string;
};
// Map<phone, Map<company, chat>>
export const sessions = new Map<string, Map<string, Conversation>>();