import { Length } from "class-validator";

export type CredentialsModel = {
    company: string;
    phone_number_id: string;
    verify_token: string;
    token: string;
    _id?: string;
};

export class CredentialsInput {
    _id?: string;
    
    @Length(3, 128)
    company: string;

    @Length(3, 32)
    phone_number_id: string;

    @Length(3, 32)
    verify_token: string;

    @Length(3)
    token: string;
}