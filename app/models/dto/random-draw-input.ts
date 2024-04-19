import { IsNotEmpty } from "class-validator";

export class RandomDrawInput {
    client_phone_number: string;
    tombola_name: string;

    company_name?: string;
    phone_number_id: string;
}