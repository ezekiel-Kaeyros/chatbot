import { IsNotEmpty } from "class-validator";

export class ChatInput {
    @IsNotEmpty()
    message: string;
    
    @IsNotEmpty()
    phone_number: string;

    @IsNotEmpty()
    phone_number_id: string;
}