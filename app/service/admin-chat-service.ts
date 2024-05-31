import { APIGatewayProxyEventV2 } from "aws-lambda";
import { CompanyChatRespository } from "../repository/company-chat-repository";
import { autoInjectable } from "tsyringe";
import { ErrorResponse, SuccessResponse } from "../utility/response";
import { ScenarioRespository } from "../repository/scenario-repository";
import { Request, Response } from 'express';
import { sessions } from "../models/chat-model";
import { ChatMessageModel } from "../models/company-chats-model";
import { chatSessionTimeout, sendWhatsappMessage, textMessage } from "../utility/whatsapp-method";
import { plainToClass } from "class-transformer";
import { ChatInput } from "../models/dto/chat-input";
import { AppValidationError } from "../utility/errors";
import { ChatStatus } from "../enums/bot-enum";

const companyChatsRepository: CompanyChatRespository = new CompanyChatRespository();
const scenariorepository: ScenarioRespository = new ScenarioRespository();

@autoInjectable()
export class AdminChatsService {

    constructor() {}

    async ResponseWithError(event: APIGatewayProxyEventV2) {
        return ErrorResponse(404, "request method is not supported!");
    }

    async sendChatMessage(req: any, res: Response) {
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
        } catch (error) {
            console.log(error);
            return res.status(500).send({error: error?.message});
        }
    }

    async getAllCompaniesChats(req: Request, res: Response) {
        try {
            const data = await companyChatsRepository.getAllCompaniesChats();
            return res.status(200).send(data);
        } catch (error) {
            console.log(error);
            return res.status(500).send({ error: error?.message });
        }
    }

    async getCompanyChats(req: Request, res: Response) {
        try {
            const phone_number_id = req.params?.phone_number_id;
            if (!phone_number_id) return res.status(403).send("please provide company phone number id");

            const data = await companyChatsRepository.getCompanyChatsByPhoneNumberId(phone_number_id);
            const time = Date.now();
            const conversations = data.conversations.sort((userA, userB) => {
                const aTime = new Date(userA.chat_messages[userA.chat_messages.length-1].date).getTime();
                const bTime = new Date(userB.chat_messages[userB.chat_messages.length-1].date).getTime();
                const aDelta = Math.abs(time - aTime);
                const bDelta = Math.abs(time - bTime);
                return (aDelta - bDelta);
            });

            for (let conv of conversations) {
                if (conv.chat_messages.length > 0) {
                    const chats = conv.chat_messages.reverse();
                    const index = chats.findIndex(
                        message => message.is_bot === false
                    );
                    const timeLeft = chatSessionTimeout(chats[index].date, new Date())/60;
                    if (timeLeft < 24) {
                        if (chats[0].chat_status !== ChatStatus.PENDING) chats[0].chat_status = ChatStatus.OPEN;
                    } else {
                        chats[0].chat_status = ChatStatus.EXPIRED;
                    }
                    conv.chat_messages = chats.reverse();
                }
            }
            data.conversations = conversations;
            
            return res.status(200).send(data);
        } catch (error) {
            console.log(error);
            return res.status(500).send({ error: error?.message });
        }
    }

    async getChatsConversation(req: Request, res: Response) {
        try {
            const phone_number_id = req.params?.phone_number_id;
            if (!phone_number_id) return res.status(403).send("please provide company phone number id");
            const phone_number = req.params?.phone_number;
            if (!phone_number) return res.status(403).send("please provide user phone number");

            const companyChats = await companyChatsRepository.getChatsConversation(
                phone_number_id, phone_number
            );
            console.log(companyChats);
            return res.status(200).send(companyChats);
        } catch (error) {
            console.log(error);
            return res.status(200).send({ error: error?.message });
        }
    }

    async changeStatusConversation(req: Request, res: Response) {
        try {
            const { phone_number, phone_number_id, status }: { phone_number: string, phone_number_id: string, status: "pending" | "open" } = req.body;
    
            // Validate status
            const validStatuses = ["pending", "open"];
            if (!validStatuses.includes(status)) {
                return res.status(400).send({ error: "Statut invalide, seuls les statuts 'pending' et 'open' sont pris en compte" });
            }
    
            // Update chat status
            const updateResult = await companyChatsRepository.updateStatusLastChatConversation(phone_number_id, phone_number, status);
            
            if (!updateResult) {
                return res.status(404).send({ error: "Company chat or conversation not found" });
            }
    
            return res.status(200).send({ message: "Chat status updated successfully" });
        } catch (error) {
            console.log(error);
            return res.status(500).send({ error: "Internal error" });
        }
    }

}