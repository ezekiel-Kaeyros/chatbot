import { ScenarioInput } from "../models/dto/scenario-input";
import { ScenarioDoc, User, scenarios } from "../models/scenario-model";

export class ScenarioRespository {
    constructor() {}

    async createScenario({ 
        title,
        phone_number_id,
        company,
        description,
        interactive_labels,
        times,
        keywords,
        company_id,
        report_into,
        last_message
    }: ScenarioInput) {
        const companyScenariosList = await this.getCompanyScenarios(phone_number_id);
        for (let scenario of companyScenariosList) {
            if (title.toLocaleLowerCase().trim() === scenario.title.toLocaleLowerCase().trim())
                throw new Error(`${title} is already use as scenario title`);
            if (keywords) {
                for (let word of keywords) {
                    if (scenario?.keywords && scenario?.keywords.includes(word))
                        throw new Error(`${word} is already use as scenario keyword`);
                }
            }
        }
        console.log(report_into,
            last_message);
        return scenarios.create({
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
    }

    async getAllScenarios(offset = 0, pages?: number) {
        return scenarios
            .find()
            .skip(offset)
            .limit(pages ? pages : 100);
    }

    async getScenarioById(id: string) {
        return scenarios.findById(id);
    }

    async getScenarioByPhoneNumberId(phone_number_id: string) {
        return scenarios.findOne({ phone_number_id, active: true });
    }

    async getCompanyScenarios(phone_number_id: string) {
        return scenarios.find({ phone_number_id });
    }

    async updateScenario({
        _id,
        title,
        phone_number_id,
        company,
        description
    }: ScenarioInput) {

        const existingScenario = await scenarios.findById(_id) as ScenarioDoc;
        existingScenario.title = title;
        existingScenario.phone_number_id = phone_number_id;
        existingScenario.company = company;
        existingScenario.description = description;
        return existingScenario.save();
    }

    async updateUser(phone_number_id: string, phone_number: string, username: string) {
        let isAdded = false;
        const activeScenario = await scenarios.findOne({ phone_number_id, active: true }) as ScenarioDoc;
        if (activeScenario) {
            if (activeScenario.users.find(user => user.phone_number === phone_number)) {
                activeScenario.users.map(user => {
                    if (user.phone_number === phone_number) {
                        if (user.times < activeScenario.times) {
                            user.times += 1;
                            isAdded = true;
                        };
                    }
                    return user;
                });
            } else {
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
    }

    isAuthorizedUser(phone_number: string, users: User[], times: number) {
        const user = users.find(user => user.phone_number === phone_number);
        if (user) {
            return user.times < times;
        } else {
            return true;
        }
    }

    async activeScenario({
        phone_number_id,
        _id
    }: ScenarioInput) {
        const currentActiveScenario = await scenarios.findOne({ phone_number_id, active: true }) as ScenarioDoc;
        if (currentActiveScenario) {
            console.log("if")
            currentActiveScenario.active = false;
            currentActiveScenario.save();
            const existingScenario = await scenarios.findById(_id) as ScenarioDoc;
            existingScenario.active = true;
            return existingScenario.save();
        } else {
            console.log("else")
            const existingScenario = await scenarios.findById(_id) as ScenarioDoc;
            existingScenario.active = true;
            return existingScenario.save();
        }
    }

    async deleteScenario(id: string) {
        return scenarios.deleteOne({ _id: id });
    }
}