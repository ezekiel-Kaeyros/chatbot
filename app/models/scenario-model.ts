import mongoose from "mongoose";
import { FilterLabels } from "./dto/scenario-input";

type ProductItem = {
    product_retailer_id: string;
};

type Section = {
    title: string;
    product_items: ProductItem[];
};

type TemplateAction = {
    thumbnail_product_retailer_id: string;
    sections: Section[];
};

type ResponseModel = {
    label: string;
    questions?: QuestionModel[];
    id?: string;
    template_action?: TemplateAction;
};

type QuestionModel = {
    label: string;
    responses?: ResponseModel[];
    responseType?: "text" | "button" | "list" | "catalog" | "template";
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
    company_id?: string;
    report_into?: string;
    last_message?: string;
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
        keywords: [String],
        company_id: String,
        report_into: String,
        last_message: String
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