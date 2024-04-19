import { APIGatewayProxyEventV2 } from "aws-lambda";
import { CompanyChatRespository } from "../repository/company-chat-repository";
import { autoInjectable } from "tsyringe";
import { ErrorResponse, SuccessResponse } from "../utility/response";
import { ScenarioRespository } from "../repository/scenario-repository";
import { Request, Response } from 'express';

const companyChatsRepository: CompanyChatRespository = new CompanyChatRespository();
const scenariorepository: ScenarioRespository = new ScenarioRespository();

@autoInjectable()
export class AdminChatsService {

    constructor() {}

    async ResponseWithError(event: APIGatewayProxyEventV2) {
        return ErrorResponse(404, "request method is not supported!");
    }

    async sendChatMessage(event: APIGatewayProxyEventV2) {
        try {
            
        } catch (error) {
            console.log(error);
            return ErrorResponse(500, error);
        }
    }

    async getAllCompaniesChats(req: Request, res: Response) {
        try {
            const data = await companyChatsRepository.getAllCompaniesChats();
            return res.status(200).send(data);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
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
            return res.status(500).send(error);
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
            return res.status(200).send(error);
        }
    }

}