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
    createScenario({ title, phone_number_id, company, description, interactive_labels, times, keywords, company_id }) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(interactive_labels);
            return scenario_model_1.scenarios.create({
                title,
                phone_number_id,
                company,
                description,
                active: false,
                interactive_labels,
                times,
                keywords,
                company_id
            });
        });
    }
    getAllScenarios(offset = 0, pages) {
        return __awaiter(this, void 0, void 0, function* () {
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
    updateScenario({ _id, title, phone_number_id, company, description }) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingScenario = yield scenario_model_1.scenarios.findById(_id);
            existingScenario.title = title;
            existingScenario.phone_number_id = phone_number_id;
            existingScenario.company = company;
            existingScenario.description = description;
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
    activeScenario({ phone_number_id, _id }) {
        return __awaiter(this, void 0, void 0, function* () {
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