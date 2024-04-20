import { Length } from "class-validator";

export type ResponseModel = {
    label: string;
    questions?: QuestionModel[];
    id?: string;
};

export type QuestionModel = {
    label: string;
    responses?: ResponseModel[];
    responseType?: "text" | "button" | "list" | "catalog";
    id?: string;
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
}

export type FilterLabels = {
    parent: string;
    child?: FilterLabels[];
};