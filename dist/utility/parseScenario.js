"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEmptyArray = exports.identifyScenario = exports.removeSpecialCharacter = exports.longLabel = exports.duplicatedLabel = exports.extractLabelsOfInteractiveResponses = exports.parseScenario = void 0;
const axios_1 = __importDefault(require("axios"));
const message_queue_1 = require("../message-queue");
const parseScenario = (questions_1, ...args_1) => __awaiter(void 0, [questions_1, ...args_1], void 0, function* (questions, phone_number_id = "100609346426084") {
    for (let question of questions) {
        let badNbr;
        if (question.responseType) {
        }
        else {
            if (!question.responses) {
                question.responseType = "text";
            }
            else if (question.responses.length >= 2 && question.responses.length <= 3) {
                question.responseType = "button";
                for (let response of question.responses) {
                    if (response.questions) {
                        badNbr = yield (0, exports.parseScenario)(response.questions);
                    }
                    if (badNbr)
                        return true;
                }
            }
            else if (question.responses.length >= 4 && question.responses.length <= 10) {
                question.responseType = "list";
                for (let response of question.responses) {
                    if (response.questions) {
                        badNbr = yield (0, exports.parseScenario)(response.questions);
                    }
                    if (badNbr)
                        return true;
                }
            }
            else if (question.responses.length === 1 &&
                question.responses[0].label.lastIndexOf("_") > 0 &&
                question.responses[0].template_action) {
                const { status: whatsappAccessStatus, data: whatsappAccessData } = yield (0, message_queue_1.PullWhatappAccessData)({
                    phone_number_id
                });
                if (whatsappAccessStatus !== 200) {
                    throw new Error("your phone number ID does not exist");
                }
                else {
                    const whatsappAccess = whatsappAccessData.data;
                    const { status, data } = yield getTemplatesList(whatsappAccess.waba_id, whatsappAccess.token);
                    if (status !== 200) {
                        throw new Error("Impossible get retreive your templates list, check your internet connection");
                    }
                    else {
                        const templatesList = data.data;
                        if (!(templatesList.find(template => template.name === question.responses[0].label))) {
                            console.log(`Template ${question.responses[0].label} does not exist`);
                            throw new Error(`Template ${question.responses[0].label} does not exist`);
                        }
                        else {
                            console.log(`Template ${question.responses[0].label} exists`);
                            question.responseType = "template";
                        }
                    }
                }
            }
            else {
                throw new Error("Bad format responses, check the number of your responses");
            }
        }
    }
    return false;
});
exports.parseScenario = parseScenario;
const extractLabelsOfInteractiveResponses = (questions) => __awaiter(void 0, void 0, void 0, function* () {
    const filterLabels = [];
    for (let question of questions) {
        if (question.responses && question.responses.length >= 2) {
            for (let response of question.responses) {
                filterLabels.push({
                    parent: response.label
                });
                if (response.questions) {
                    const subLabels = yield (0, exports.extractLabelsOfInteractiveResponses)(response.questions);
                    filterLabels[filterLabels.length - 1].child = subLabels;
                }
            }
        }
    }
    return filterLabels;
});
exports.extractLabelsOfInteractiveResponses = extractLabelsOfInteractiveResponses;
const duplicatedLabel = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const labelSet = new Set();
    for (let obj of data) {
        if (labelSet.has((0, exports.removeSpecialCharacter)(obj.label))) {
            return true;
        }
        else {
            labelSet.add((0, exports.removeSpecialCharacter)(obj.label));
        }
        let subDupe;
        if ("questions" in obj)
            subDupe = yield (0, exports.duplicatedLabel)(obj.questions);
        if ("responses" in obj)
            subDupe = yield (0, exports.duplicatedLabel)(obj.responses);
        if (subDupe)
            return true;
        // otherwise check the next obj of data
    }
    return false; // only return false once everything is checked
});
exports.duplicatedLabel = duplicatedLabel;
const longLabel = (data) => __awaiter(void 0, void 0, void 0, function* () {
    for (let obj of data) {
        if ("questions" in obj) {
            if (obj.label.length > 20) {
                throw new Error(`The question '${obj.label}' has more than 20 characters`);
            }
            for (let subObj of obj.questions) {
                if (subObj.label.length > 1024)
                    throw new Error(`The question '${subObj.label}' has more than 1024 characters`);
            }
        }
        else if ("responses" in obj) {
            if (obj.label.length > 1024) {
                throw new Error(`The response '${obj.label}' has more than 1024 characters`);
            }
            for (let subObj of obj.responses) {
                if (subObj.label.length > 20)
                    throw new Error(`The response '${subObj.label}' has more than 20 characters`);
            }
        }
        if ("questions" in obj)
            (0, exports.longLabel)(obj.questions);
        if ("responses" in obj)
            (0, exports.longLabel)(obj.responses);
    }
});
exports.longLabel = longLabel;
const removeSpecialCharacter = (label) => {
    const regex = /'|"|@|#|-|\?|\!|\$|{|}|\[|\]|\(|\)|\\|\*|é|è|ê|ë|É|È|à|â|ä|À|î|ï|ù|û|ü|~|`|&|µ|\s+|\./g;
    label = label.toLowerCase().replace(regex, "");
    if (label.length > 10)
        return label.slice(0, 5) + label.slice(-5);
    else
        return label;
    return label;
};
exports.removeSpecialCharacter = removeSpecialCharacter;
const identifyScenario = (questions) => __awaiter(void 0, void 0, void 0, function* () {
    for (let question of questions) {
        yield identify(question);
    }
});
exports.identifyScenario = identifyScenario;
const identify = (data_1, ...args_2) => __awaiter(void 0, [data_1, ...args_2], void 0, function* (data, path = '') {
    var _a, _b;
    data.id = path + (path ? '_' : '') + (0, exports.removeSpecialCharacter)(data.label);
    if ("questions" in data)
        (_a = data.questions) === null || _a === void 0 ? void 0 : _a.forEach((q) => identify(q, data.id));
    if ("responses" in data)
        (_b = data.responses) === null || _b === void 0 ? void 0 : _b.forEach((r) => identify(r, data.id));
});
const removeEmptyArray = (questions) => __awaiter(void 0, void 0, void 0, function* () {
    questions.forEach(q => cleanData(q));
});
exports.removeEmptyArray = removeEmptyArray;
const cleanData = (data) => __awaiter(void 0, void 0, void 0, function* () {
    if ("questions" in data && data.questions) {
        if (data.questions.length === 0) {
            delete data.questions;
        }
        else {
            data.questions.forEach(q => cleanData(q));
        }
    }
    if ("responses" in data && data.responses) {
        if (data.responses.length === 0) {
            delete data.responses;
        }
        else {
            data.responses.forEach(r => cleanData(r));
        }
    }
});
const isCatalogName = (catalogName) => __awaiter(void 0, void 0, void 0, function* () {
    const { status: whatsappAccessStatus, data: whatsappAccessData } = yield (0, message_queue_1.PullWhatappAccessData)({
        phone_number_id: "100609346426084"
    });
    if (whatsappAccessStatus !== 200) {
    }
    else {
    }
});
const getCatalogList = (companyId, token) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
        method: "GET",
        url: `https://graph.facebook.com/v18.0/${companyId}/owned_product_catalogs`,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
});
const getTemplatesList = (wabaId, token) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
        method: "GET",
        url: `https://graph.facebook.com/v19.0/${wabaId}/message_templates?fields=name,status`,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
});
//# sourceMappingURL=parseScenario.js.map