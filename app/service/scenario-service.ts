import { ScenarioRespository } from "../repository/scenario-repository";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ErrorResponse, SuccessResponse } from "../utility/response";
import { ResponseModel, ScenarioInput } from "../models/dto/scenario-input";
import { plainToClass } from "class-transformer";
import { AppValidationError } from "../utility/errors";
import { autoInjectable } from "tsyringe";
import { duplicatedLabel, extractLabelsOfInteractiveResponses, identifyScenario, longLabel, parseScenario, removeEmptyArray } from "../utility/parseScenario";
import { CredentialsRepository } from "../repository/credentials-repository";
import { Request, Response } from 'express';

const repository = new ScenarioRespository();
const credentialsRepository = new CredentialsRepository();

@autoInjectable()
export class ScenarioService {

    constructor(
        private repository: ScenarioRespository,
        private credentialsRepository: CredentialsRepository,
    ) {}

    async ResponseWithError(event: APIGatewayProxyEventV2) {
        return ErrorResponse(404, "request method is not supported!");
    }

    async createScenario(req: Request, res: Response) {
        try {
            const input = plainToClass(ScenarioInput, req.body);
            const error = await AppValidationError(input);
            if (error) return res.status(404).send(error);

            await removeEmptyArray(input.description);
            await longLabel(input.description);
            if (await duplicatedLabel(input.description)) throw new Error("Duplicate questions or answers, or check your products template if threre is!");
            
            const badNbr =  await parseScenario(input.description);
            if (badNbr) return res.status(400).send("Number of responses not supported!");
            await identifyScenario(input.description);
            const filterLabels = await extractLabelsOfInteractiveResponses(input.description);
            if (filterLabels.length !== 0) input.interactive_labels = filterLabels;
            const data = await repository.createScenario(input);
            console.dir(filterLabels, { depth: null });
    
            return res
                .status(201)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ error: error?.message });
        }
    }

    async getScenarios(req: Request, res: Response) {
        try {
            const data = await repository.getAllScenarios();
            return res
                .status(200)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(400)
                .send({ error: error?.message });
        }
    }

    async getCompanyScenarios(req: Request, res: Response) {
        try {
            const phone_number_id = req.params?.phone_number_id as string;
            if (!phone_number_id) return res.status(404).send("please provide company phone_number_id");
            const data = await repository.getCompanyScenarios(phone_number_id);
            return res.status(200).send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(400)
                .send({ error: error?.message });
        }
    }

    async activeScenario(req: Request, res: Response) {
        try {
            const input = plainToClass(ScenarioInput, req.body);
            const error = await AppValidationError(input);
            if (error) return res.status(404).send(error);

            const data = await repository.activeScenario(input);
            return res
                .status(200)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ error: error?.message });
        }
    }

    async getScenario(req: Request, res: Response) {
        try {
            const scenarioId = req.params?.id as string;
            if (!scenarioId) return res.status(404).send("please provide scenario id");

            const data = await repository.getScenarioById(scenarioId)
            return res
                .status(200)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ error: error?.message });
        }
    }

    async editScenario(req: Request, res: Response) {
        try {
            const input = plainToClass(ScenarioInput, req.body!);
            const error = await AppValidationError(input);
            if (error) return ErrorResponse(404, error);

            const scenarioId = req.params?.id as string;
            if (!scenarioId) return res.status(403).send("id must be provided!");
            input._id = scenarioId;

            await removeEmptyArray(input.description);
            await longLabel(input.description);
            if (await duplicatedLabel(input.description)) throw new Error("Duplicate questions or answers, or check your products template if threre is!");

            const badNbr =  await parseScenario(input.description);
            if (badNbr) return res.status(400).send("Number of responses not supported!");
            await identifyScenario(input.description);
            const filterLabels = await extractLabelsOfInteractiveResponses(input.description);
            if (filterLabels.length !== 0) input.interactive_labels = filterLabels;

            const data = await repository.updateScenario(input);

            return res
                .status(200)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ error: error?.message });
        }
    }

    async deleteScenario(req: Request, res: Response) {
        try {
            const scenarioId = req.params?.id as string;
            if (!scenarioId) return res.status(403).send("please provide product id");

            const data = await repository.deleteScenario(scenarioId)
            return res
                .status(200)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ error: error?.message });
        }
    }

    async uploadFile(req: Request, res: Response) {
        try {
            const file = req.file;
            const phoneNumberID = req.body.phone_number_id;
            
            if (!file) {
              return res.status(400).send('No file uploaded.');
            }
          
            if (!phoneNumberID) {
              return res.status(400).send('No phoneNumberID provided.');
            }

            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
          
            res.status(200).send({
                message: 'File uploaded successfully!',
                fileUrl: fileUrl,
                phoneNumberID: phoneNumberID
            });
        } catch (error) {
            console.log(error);
            return res.status(500).send({ error: error?.message });
        }
    }
}