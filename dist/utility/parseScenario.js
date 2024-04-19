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
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEmptyArray = exports.identifyScenario = exports.removeSpecialCharacter = exports.longLabel = exports.duplicatedLabel = exports.extractLabelsOfInteractiveResponses = exports.parseScenario = void 0;
const parseScenario = (questions) => __awaiter(void 0, void 0, void 0, function* () {
    for (let question of questions) {
        let badNbr;
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
        else if (question.responses.length === 1 && question.responses[0].label.lastIndexOf("_") > 0) {
            question.responseType = "catalog";
        }
        else {
            return true;
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
        if ("responses" in obj) {
            if (obj.label.length > 1024)
                return true;
        }
        else if ("responses" in obj) {
            if (obj.label.length > 20)
                return true;
        }
        let subLength;
        if ("questions" in obj)
            subLength = yield (0, exports.longLabel)(obj.questions);
        if ("responses" in obj)
            subLength = yield (0, exports.longLabel)(obj.responses);
        if (subLength)
            return true;
    }
    return false;
});
exports.longLabel = longLabel;
const removeSpecialCharacter = (label) => {
    const regex = /'|"|@|#|\?|\!|\$|{|}|\[|\]|\(|\)|\\|\*|é|è|ê|ë|É|È|à|â|ä|À|î|ï|ù|û|ü|~|`|&|µ|\s+|\./g;
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
const identify = (data, path = '') => __awaiter(void 0, void 0, void 0, function* () {
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
//# sourceMappingURL=parseScenario.js.map