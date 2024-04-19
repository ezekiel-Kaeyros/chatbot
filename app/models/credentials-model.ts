import mongoose from "mongoose";

export type CredentialsModel = {
    company: string;
    phone_number_id: string;
    verify_token: string;
    token: string;
    _id?: string;
};

export type CredentialsDoc = mongoose.Document & CredentialsModel;

const credentialsSchema = new mongoose.Schema(
    {
        company: String,
        phone_number_id: Number,
        verify_token: String,
        token: String
    },
    {
        toJSON: {
            transform(doc, ret, options) {
                delete ret.__v;
                delete ret.createdAt;
                delete ret.updatedAt;
            },
        },
        timestamps: true,
    }
);

const credentials = (mongoose.models.credentials as mongoose.Model<CredentialsDoc>) ||
mongoose.model<CredentialsDoc>("credentials", credentialsSchema);

export { credentials };
