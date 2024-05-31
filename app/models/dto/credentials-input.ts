import { Length } from "class-validator";

export type CredentialsModel = {
    company: string;
    phone_number_id: string;
    verify_token: string;
    token: string;
    _id?: string;
    email?: string;

};

export class CredentialsInput {
    _id?: string;
    company: string;
    phone_number_id: string;
    verify_token: string;
    token: string;
    email?: string;
}