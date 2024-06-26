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
exports.ScenarioRespository = void 0;
const scenario_model_1 = require("../models/scenario-model");
class ScenarioRespository {
    constructor() { }
    createScenario(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, phone_number_id, company, description, interactive_labels, times, keywords, company_id, report_into, last_message }) {
            const companyScenariosList = yield this.getCompanyScenarios(phone_number_id);
            for (let scenario of companyScenariosList) {
                if (title.toLocaleLowerCase().trim() === scenario.title.toLocaleLowerCase().trim())
                    throw new Error(`${title} is already use as scenario title`);
                if (keywords) {
                    for (let word of keywords) {
                        if ((scenario === null || scenario === void 0 ? void 0 : scenario.keywords) && (scenario === null || scenario === void 0 ? void 0 : scenario.keywords.includes(word)))
                            throw new Error(`${word} is already use as scenario keyword`);
                    }
                }
            }
            console.log(report_into, last_message);
            return scenario_model_1.scenarios.create({
                title,
                phone_number_id,
                company,
                description,
                active: false,
                interactive_labels,
                times,
                keywords,
                company_id,
                report_into,
                last_message
            });
        });
    }
    getAllScenarios() {
        return __awaiter(this, arguments, void 0, function* (offset = 0, pages) {
            return scenario_model_1.scenarios
                .find()
                .skip(offset)
                .limit(pages ? pages : 100);
        });
    }
    getScenarioById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return scenario_model_1.scenarios.findById(id);
        });
    }
    getScenarioByPhoneNumberId(phone_number_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return scenario_model_1.scenarios.findOne({ phone_number_id, active: true });
        });
    }
    getCompanyScenarios(phone_number_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return scenario_model_1.scenarios.find({ phone_number_id });
        });
    }
    updateScenario(_a) {
        return __awaiter(this, arguments, void 0, function* ({ _id, title, phone_number_id, company, description, interactive_labels, times, keywords, company_id, report_into, last_message }) {
            const existingScenario = yield scenario_model_1.scenarios.findById(_id);
            existingScenario.title = title;
            existingScenario.phone_number_id = phone_number_id;
            existingScenario.company = company;
            existingScenario.description = description;
            existingScenario.interactive_labels = interactive_labels;
            existingScenario.times = times,
                existingScenario.keywords = keywords;
            existingScenario.company_id = company_id;
            existingScenario.report_into = report_into;
            existingScenario.last_message = last_message;
            return existingScenario.save();
        });
    }
    updateUser(phone_number_id, phone_number, username) {
        return __awaiter(this, void 0, void 0, function* () {
            let isAdded = false;
            const activeScenario = yield scenario_model_1.scenarios.findOne({ phone_number_id, active: true });
            if (activeScenario) {
                if (activeScenario.users.find(user => user.phone_number === phone_number)) {
                    activeScenario.users.map(user => {
                        if (user.phone_number === phone_number) {
                            if (user.times < activeScenario.times) {
                                user.times += 1;
                                isAdded = true;
                            }
                            ;
                        }
                        return user;
                    });
                }
                else {
                    activeScenario.users = [...activeScenario.users, {
                            phone_number,
                            username,
                            times: 1
                        }];
                    isAdded = true;
                }
                activeScenario.markModified('users');
                activeScenario.save();
            }
            return isAdded;
        });
    }
    isAuthorizedUser(phone_number, users, times) {
        const user = users.find(user => user.phone_number === phone_number);
        if (user) {
            return user.times < times;
        }
        else {
            return true;
        }
    }
    activeScenario(_a) {
        return __awaiter(this, arguments, void 0, function* ({ phone_number_id, _id }) {
            const currentActiveScenario = yield scenario_model_1.scenarios.findOne({ phone_number_id, active: true });
            if (currentActiveScenario) {
                console.log("if");
                currentActiveScenario.active = false;
                currentActiveScenario.save();
                const existingScenario = yield scenario_model_1.scenarios.findById(_id);
                existingScenario.active = true;
                return existingScenario.save();
            }
            else {
                console.log("else");
                const existingScenario = yield scenario_model_1.scenarios.findById(_id);
                existingScenario.active = true;
                return existingScenario.save();
            }
        });
    }
    deleteScenario(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return scenario_model_1.scenarios.deleteOne({ _id: id });
        });
    }
}
exports.ScenarioRespository = ScenarioRespository;
//# sourceMappingURL=scenario-repository.js.map