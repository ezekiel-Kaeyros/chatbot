import axios from "axios";
import { PullWhatappAccessData } from "../message-queue";
import { FilterLabels, QuestionModel, ResponseModel } from "../models/dto/scenario-input";
import { WhatsappAccessModel } from "../models/whatsapp-access-model";
import { CatalogModel } from "../models/catalog-model";

export const parseScenario = async (questions: QuestionModel[], companyId: string = "679854450187854"): Promise<boolean> => {
    for (let question of questions) {

        let badNbr;

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
        } else if (question.responses.length === 1 && question.responses[0].label.lastIndexOf("_") > 0) {
            const { status: whatsappAccessStatus, data: whatsappAccessData } = await PullWhatappAccessData({
                phone_number_id: "100609346426084"
            });
            if (whatsappAccessStatus !== 200) {
                return false;
            } else {
                const whatsappAccess = whatsappAccessData.data as WhatsappAccessModel;
                const { status, data } = await getCatalogList(companyId, whatsappAccess.token);
                if (status !== 200) {
                    return false;
                } else {
                    const catalogList = data.data as CatalogModel[];
                    if (!(catalogList.find(catalog => catalog.name === question.responses[0].label))) {
                        console.log(`Catalog ${question.responses[0].label} does not exist`);
                        return false;
                    } else {
                        console.log(`Catalog ${question.responses[0].label} exists`);
                        question.responseType = "catalog";
                    }
                }
            }
        } else {
            return true;
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
                    filterLabels[filterLabels.length - 1].child = subLabels
                }
            }
        }
    }
    return filterLabels;
    /*
    const labels: string[] = [];
    for (let question of questions) {
        if (question.responses && question.responses.length >= 2) {
            for (let response of question.responses) {
                labels.push(response.label);

                if (response.questions) {
                    const subLabels = await extractLabelsOfInteractiveResponses(response.questions);
                    labels.push(...subLabels);
                }
            }
        }
    }
    return labels; */
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

export const longLabel = async (data: QuestionModel[] | ResponseModel[]): Promise<boolean> => {
    for (let obj of data) {
        if ("responses" in obj) {
            if (obj.label.length > 1024) return true;
        } else if ("responses" in obj) {
            if (obj.label.length > 20) return true
        }

        let subLength;

        if ("questions" in obj) subLength = await longLabel(obj.questions!);
        if ("responses" in obj) subLength = await longLabel(obj.responses!);

        if (subLength) return true;
    }
    return false;
};

export const removeSpecialCharacter = (label: string) => {
    const regex = /'|"|@|#|\?|\!|\$|{|}|\[|\]|\(|\)|\\|\*|é|è|ê|ë|É|È|à|â|ä|À|î|ï|ù|û|ü|~|`|&|µ|\s+|\./g;
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
