"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.AdminChatsService = void 0;
const company_chat_repository_1 = require("../repository/company-chat-repository");
const tsyringe_1 = require("tsyringe");
const response_1 = require("../utility/response");
const scenario_repository_1 = require("../repository/scenario-repository");
const companyChatsRepository = new company_chat_repository_1.CompanyChatRespository();
const scenariorepository = new scenario_repository_1.ScenarioRespository();
let AdminChatsService = class AdminChatsService {
    constructor() { }
    ResponseWithError(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, response_1.ErrorResponse)(404, "request method is not supported!");
        });
    }
    sendChatMessage(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    getAllCompaniesChats(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield companyChatsRepository.getAllCompaniesChats();
                return (0, response_1.SuccessResponse)(data);
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    getCompanyChats(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const phone_number_id = (_a = req.params) === null || _a === void 0 ? void 0 : _a.phone_number_id;
                if (!phone_number_id)
                    return res.status(403).send("please provide company phone number id");
                const data = yield companyChatsRepository.getCompanyChatsByPhoneNumberId(phone_number_id);
                const activeScenario = yield scenariorepository.getScenarioByPhoneNumberId(phone_number_id);
                return res.status(200).send({ data, filter_labels: activeScenario.interactive_labels });
            }
            catch (error) {
                console.log(error);
                return res.status(500).send(error);
            }
        });
    }
    getChatsConversation(event) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const phone_number_id = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.phone_number_id;
                if (!phone_number_id)
                    return (0, response_1.ErrorResponse)(403, "please provide company phone number id");
                const phone_number = (_b = event.pathParameters) === null || _b === void 0 ? void 0 : _b.phone_number;
                if (!phone_number)
                    return (0, response_1.ErrorResponse)(403, "please provide user phone number");
                const companyChats = yield companyChatsRepository.getChatsConversation(phone_number_id, phone_number);
                return (0, response_1.SuccessResponse)(companyChats);
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
};
exports.AdminChatsService = AdminChatsService;
exports.AdminChatsService = AdminChatsService = __decorate([
    (0, tsyringe_1.autoInjectable)(),
    __metadata("design:paramtypes", [])
], AdminChatsService);
//# sourceMappingURL=admin-chat-service.js.map