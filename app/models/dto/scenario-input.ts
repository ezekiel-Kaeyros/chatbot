import { Length } from "class-validator";

type ProductItem = {
    product_retailer_id: string;
};

type Section = {
    title: string;
    product_items: ProductItem[];
};

export type TemplateAction = {
    thumbnail_product_retailer_id: string;
    sections: Section[];
};

export type ResponseModel = {
    label: string;
    questions?: QuestionModel[];
    id?: string;
    template_action?: TemplateAction;
};

export type QuestionModel = {
    label: string;
    responses?: ResponseModel[];
    responseType?: "text" | "button" | "list" | "catalog" | "template" | "image";
    id?: string;
    link?: string;
};

export class ScenarioInput {
    _id: string;

    @Length(3, 128)
    title: string;

    @Length(15)
    phone_number_id: string;

    @Length(3)
    company: string;

    description: QuestionModel[];
    interactive_labels?: FilterLabels[];
    times?: number = -1;
    keywords?: string[];
    company_id?: string = "679854450187854";
    report_into?: string;
    last_message?: string;
}

export type FilterLabels = {
    parent: string;
    child?: FilterLabels[];
};