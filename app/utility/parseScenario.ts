import axios from "axios";
import { PullWhatappAccessData } from "../message-queue";
import { FilterLabels, QuestionModel, ResponseModel } from "../models/dto/scenario-input";
import { WhatsappAccessModel } from "../models/whatsapp-access-model";
import { TemplateResponseModel } from "../models/template-response-model";

export const parseScenario = async (questions: QuestionModel[], phone_number_id: string = "100609346426084"): Promise<boolean> => {
    for (let question of questions) {
        let badNbr;

        if (question.responseType ) {
           
        }else{

            if (! question.responses) {
                question.responseType = "text";
            } else if (question.responses.length >= 2 && question.responses.length <= 3) {
                question.responseType = "button";
                for (let response of question.responses) {
                    if (response.questions) {
                        badNbr = await parseScenario(response.questions);
                    }
    
                    if (badNbr) return true;
                }
            } else if (question.responses.length >= 4 && question.responses.length <= 10) {
                question.responseType = "list";
                for (let response of question.responses) {
                    if (response.questions) {
                        badNbr = await parseScenario(response.questions);
                    }
    
                    if (badNbr) return true;
                }
            } else if (
                question.responses.length === 1 &&
                question.responses[0].label.lastIndexOf("_") > 0 &&
                question.responses[0].template_action
            ) {
                const { status: whatsappAccessStatus, data: whatsappAccessData } = await PullWhatappAccessData({
                    phone_number_id
                });
                if (whatsappAccessStatus !== 200) {
                    throw new Error("your phone number ID does not exist");
                } else {
                    const whatsappAccess = whatsappAccessData.data as WhatsappAccessModel;
                    const { status, data } = await getTemplatesList(whatsappAccess.waba_id, whatsappAccess.token);
                    
                    if (status !== 200) {
                        throw new Error("Impossible get retreive your templates list, check your internet connection");
                    } else {
                        const templatesList = data.data as TemplateResponseModel[];
                        if (!(templatesList.find(template => template.name === question.responses[0].label))) {
                            console.log(`Template ${question.responses[0].label} does not exist`);
                            throw new Error(`Template ${question.responses[0].label} does not exist`);
                        } else {
                            console.log(`Template ${question.responses[0].label} exists`);
                            question.responseType = "template";
                        }
                    }
                }
            } else {
                throw new Error("Bad format responses, check the number of your responses");
            }
        }

      
    }
    return false;
};

export const extractLabelsOfInteractiveResponses = async (questions: QuestionModel[]): Promise<FilterLabels[]> => {
    const filterLabels: FilterLabels[] = [];
    for (let question of questions) {
        if (question.responses && question.responses.length >= 2) {
            for (let response of question.responses) {
                filterLabels.push({
                    parent: response.label
                });
                if (response.questions) {
                    const subLabels = await extractLabelsOfInteractiveResponses(response.questions);
                    filterLabels[filterLabels.length - 1].child = subLabels;
                }
            }
        }
    }
    return filterLabels;
}

export const duplicatedLabel = async (data: QuestionModel[] | ResponseModel[]): Promise<boolean> => {
    const labelSet = new Set<string>();
    for (let obj of data) {
        if (labelSet.has(removeSpecialCharacter(obj.label))) {
            return true;
        } else {
            labelSet.add(removeSpecialCharacter(obj.label));
        }

        let subDupe;

        if ("questions" in obj) subDupe = await duplicatedLabel(obj.questions!);
        if ("responses" in obj) subDupe = await duplicatedLabel(obj.responses!);

        if (subDupe) return true;
        // otherwise check the next obj of data
    }
    return false; // only return false once everything is checked
};

export const longLabel = async (data: QuestionModel[] | ResponseModel[]) => {
    for (let obj of data) {
        if ("questions" in obj) {
            if (obj.label.length > 20) {
                throw new Error(`The question '${obj.label}' has more than 20 characters`);
            }
            for (let subObj of obj.questions) {
                if (subObj.label.length > 1024) throw new Error(`The question '${subObj.label}' has more than 1024 characters`);
            }
        } else if ("responses" in obj) {
            if (obj.label.length > 1024) {
                throw new Error(`The response '${obj.label}' has more than 1024 characters`);
            }
            for (let subObj of obj.responses) {
                if (subObj.label.length > 20) throw new Error(`The response '${subObj.label}' has more than 20 characters`);
            }
        }

        if ("questions" in obj) longLabel(obj.questions!);
        if ("responses" in obj) longLabel(obj.responses!);
    }
};

export const removeSpecialCharacter = (label: string) => {
    const regex = /'|"|@|#|-|\?|\!|\$|{|}|\[|\]|\(|\)|\\|\*|é|è|ê|ë|É|È|à|â|ä|À|î|ï|ù|û|ü|~|`|&|µ|\s+|\./g;
    label = label.toLowerCase().replace(regex, "");
    if (label.length > 10) return label.slice(0, 5) + label.slice(-5);
    else return label;
    return label;
};

export const identifyScenario = async (questions: QuestionModel[]) => {
    for (let question of questions) {
        await identify(question);
    }
};

const identify = async (data: QuestionModel | ResponseModel, path='') => {
    data.id = path + (path ? '_' : '') + removeSpecialCharacter(data.label);
  
    if ("questions" in data) data.questions?.forEach((q) => identify(q, data.id));
    if ("responses" in data) data.responses?.forEach((r) => identify(r, data.id));
};

export const removeEmptyArray = async (questions: QuestionModel[]) => {
    questions.forEach(q => cleanData(q));
}

const cleanData = async (data: QuestionModel | ResponseModel) => {
    if ("questions" in data && data.questions) {
      if (data.questions.length === 0) {
        delete data.questions;
      } else {
        data.questions.forEach(q => cleanData(q));
      }
    }
    if ("responses" in data && data.responses) {
      if (data.responses.length === 0) {
        delete data.responses;
      } else {
        data.responses.forEach(r => cleanData(r));
      }
    }
};

const isCatalogName = async (catalogName: string) => {
    const { status: whatsappAccessStatus, data: whatsappAccessData } = await PullWhatappAccessData({
        phone_number_id: "100609346426084"
    });
    if (whatsappAccessStatus !== 200) {

    } else {

    }
};

const getCatalogList = async (companyId: string, token: string) => {
    return axios({
        method: "GET",
        url: `https://graph.facebook.com/v18.0/${companyId}/owned_product_catalogs`,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
};

const getTemplatesList = async (wabaId: string, token: string) => {
    return axios({
        method: "GET",
        url: `https://graph.facebook.com/v19.0/${wabaId}/message_templates?fields=name,status`,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
};
