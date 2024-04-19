import { autoInjectable } from "tsyringe";
import { CredentialsRepository } from "../repository/credentials-repository";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ErrorResponse, SuccessResponse } from "../utility/response";
import { CredentialsInput } from "../models/dto/credentials-input";
import { plainToClass } from "class-transformer";
import { AppValidationError } from "../utility/errors";
import { Request, Response } from 'express';

const repository = new CredentialsRepository();

@autoInjectable()
export class CredentialsService {

    constructor(private repository: CredentialsRepository) {}

    async ResponseWithError(event: APIGatewayProxyEventV2) {
        return ErrorResponse(404, "request method is not supported!");
    }

    async createCredentials(req: Request, res: Response) {
        try {
            const input = plainToClass(CredentialsInput, req.body);
            const error = await AppValidationError(input);
            if (error) return ErrorResponse(404, error);
            console.log(input);
            const data = await repository.create(input);

            return res
                .status(201)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ message: "custom error response" });
        }
    }

    async updateCredentials(req: Request, res: Response) {
        try {
            const input = plainToClass(CredentialsInput, req.body);
            console.log(input)
            const error = await AppValidationError(input);
            if (error) return ErrorResponse(404, error);
            if (!input._id) return ErrorResponse(403, "please provide credentials id");
            
            const data = await repository.update(input);

            return res
                .status(200)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ message: "custom error response" });
        }
    }

    async deleteCredentials(req: Request, res: Response) {
        try {
            const credentialsId = req.params?.id;
            if (!credentialsId) return ErrorResponse(403, "please provide credentials id");

            const data = await repository.delete(credentialsId)
            return res
                .status(200)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ message: "custom error response" });
        }
    }

    async getCredentials(req: Request, res: Response) {
        try {
            const credentialsId = req.params?.id;
            if (!credentialsId) return ErrorResponse(404, "please provide credentials id");

            const data = await repository.getById(credentialsId)
            return res
                .status(200)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ message: "custom error response" });
        }
    }

    async getAllCredentials(req: Request, res: Response) {
        try {
            const data = await repository.getAll();
            return res
                .status(200)
                .send(data);
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .send({ message: "custom error response" });
        }
    }
}