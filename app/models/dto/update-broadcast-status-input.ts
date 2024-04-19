import { IsNotEmpty } from "class-validator";

export class UpdateBroadcastStatusInput {

    @IsNotEmpty()
    response_id: string;

    @IsNotEmpty()
    status: string;

    error?: string;
}