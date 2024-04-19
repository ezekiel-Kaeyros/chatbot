import mongoose from "mongoose";
import { FilterLabels } from "./dto/scenario-input";

type ResponseModel = {
    label: string;
    questions?: QuestionModel[];
    id?: string;
};

type QuestionModel = {
    label: string;
    responses?: ResponseModel[];
    responseType?: "text" | "button" | "list" | "catalog";
    id?: string;
};

export type User = {
    phone_number: string;
    username: string;
    times: number;
};

type ScenarioModel = {
    title: string;
    phone_number_id: string;
    company: string;
    description: QuestionModel[];
    active: boolean;
    interactive_labels?: FilterLabels[];
    users?: User[];
    times?: number;
    keywords?: string[];
};

export type ScenarioDoc = mongoose.Document & ScenarioModel;

const scenarioSchema = new mongoose.Schema(
    {
        title: String,
        phone_number_id: String,
        company: String,
        description: [{}],
        active: Boolean,
        interactive_labels: [{}],
        users: [{}],
        times: Number,
        keywords: [String]
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

const scenarios = (mongoose.models.scenarios as mongoose.Model<ScenarioDoc>) ||
mongoose.model<ScenarioDoc>("scenarios", scenarioSchema);

export { scenarios };