import { APIGatewayProxyEventV2 } from "aws-lambda";
import { CompanyChatRespository } from "../repository/company-chat-repository";
import { autoInjectable } from "tsyringe";
import { ErrorResponse, SuccessResponse } from "../utility/response";
import { ScenarioRespository } from "../repository/scenario-repository";
import { Request, Response } from 'express';
import { sessions } from "../models/chat-model";
import { ChatMessageModel } from "../models/company-chats-model";
import { sendWhatsappMessage, textMessage } from "../utility/whatsapp-method";
import { plainToClass } from "class-transformer";
import { ChatInput } from "../models/dto/chat-input";
import { AppValidationError } from "../utility/errors";

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
            const input = plainToClass(ChatInput, req.body);
            const error = await AppValidationError(input);
            if (error) return res.status(404).send(error);

            //const token = sessions?.get(input.phone_number)?.get(input.phone_number_id).token;
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
            }
            return res.status(200).send(data);
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
            const activeScenario = await scenariorepository.getScenarioByPhoneNumberId(phone_number_id);
            
            return res.status(200).send({ data, filter_labels: activeScenario.interactive_labels });
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

}