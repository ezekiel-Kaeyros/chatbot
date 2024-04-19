import { IsNotEmpty, IsNumber } from "class-validator";

export class ClientPointInput {
    client_phone_number: string;
    
    program_name: string;

    company_name?: string;

    phone_number_id: string;
}