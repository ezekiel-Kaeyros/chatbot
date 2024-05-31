import { CredentialsModel } from "../models/dto/credentials-input";
import { CredentialsDoc, credentials } from "../models/credentials-model";

export class CredentialsRepository {
    
    async create({
        company,
        phone_number_id,
        verify_token,
        token
    }: CredentialsModel) {
        return credentials.create({
            company,
            phone_number_id,
            verify_token,
            token
        });
    }

    async update({
        company,
        phone_number_id,
        verify_token,
        token,
        _id
    }: CredentialsModel) {
        let existingCredentials = await credentials.findById(_id) as CredentialsDoc;
        existingCredentials.company = company;
        existingCredentials.phone_number_id = phone_number_id;
        existingCredentials.verify_token = verify_token;
        existingCredentials.token = token;
        return existingCredentials.save();
    }

    async delete(_id: string) {
        return credentials.deleteOne({ _id });
    }

    async getById(id: string) {
        return credentials.findById(id);
    }

    async getByPhoneNumber(phone_number_id: string) {
        return credentials.findOne({ phone_number_id });
    }

    async getByEmail(email: any) {
        return credentials.find({ email });
    }

    async getByVerifyToken(verify_token: string) {
        return credentials.findOne({ verify_token });
    }

    async getAll(offset = 0, pages?: number) {
        return credentials
            .find()
            .skip(offset)
            .limit(pages ? pages : 100);
    }

}