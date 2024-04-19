"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chats = exports.CompanyChats = exports.Credentials = exports.ActiveScenario = exports.GetAll = exports.Create = exports.Webhook = exports.GetOne = void 0;
const core_1 = __importDefault(require("@middy/core"));
const http_json_body_parser_1 = __importDefault(require("@middy/http-json-body-parser"));
const tsyringe_1 = require("tsyringe");
const scenario_service_1 = require("../service/scenario-service");
require("../utility");
const credentials_service_1 = require("../service/credentials-service");
const company_chats_service_1 = require("../service/company-chats-service");
const admin_chat_service_1 = require("../service/admin-chat-service");
const scenarioService = tsyringe_1.container.resolve(scenario_service_1.ScenarioService);
const credentialsService = tsyringe_1.container.resolve(credentials_service_1.CredentialsService);
const companyChatsService = tsyringe_1.container.resolve(company_chats_service_1.CompanyChatsService);
const adminChatsService = tsyringe_1.container.resolve(admin_chat_service_1.AdminChatsService);
exports.GetOne = (0, core_1.default)((event) => {
    return scenarioService.getScenario(event);
}).use((0, http_json_body_parser_1.default)());
exports.Webhook = (0, core_1.default)((event) => {
    const httpMethod = event.requestContext.http.method.toLowerCase();
    if (httpMethod === "post") {
        return companyChatsService.sendMessage(event);
    }
    else if (httpMethod === "get") {
        return companyChatsService.getMessage(event);
    }
    else {
        return companyChatsService.ResponseWithError(event);
    }
}).use((0, http_json_body_parser_1.default)());
exports.Create = (0, core_1.default)((event) => {
    return scenarioService.createScenario(event);
}).use((0, http_json_body_parser_1.default)());
exports.GetAll = (0, core_1.default)((event) => {
    return scenarioService.getScenarios(event);
}).use((0, http_json_body_parser_1.default)());
exports.ActiveScenario = (0, core_1.default)((event) => {
    return scenarioService.activeScenario(event);
}).use((0, http_json_body_parser_1.default)());
exports.Credentials = (0, core_1.default)((event) => {
    var _a;
    const httpMethod = event.requestContext.http.method.toLowerCase();
    if (httpMethod === "post") {
        return credentialsService.createCredentials(event);
    }
    else if (httpMethod === "put") {
        return credentialsService.updateCredentials(event);
    }
    else if (httpMethod === "delete") {
        return credentialsService.deleteCredentials(event);
    }
    else if (httpMethod === "get" && ((_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.id)) {
        return credentialsService.getCredentials(event);
    }
    else if (httpMethod === "get") {
        return credentialsService.getAllCredentials(event);
    }
    else {
        return credentialsService.ResponseWithError(event);
    }
}).use((0, http_json_body_parser_1.default)());
exports.CompanyChats = (0, core_1.default)((event) => {
    const isRoot = event.pathParameters === null;
    if (isRoot) {
        return adminChatsService.getAllCompaniesChats(event);
    }
    else {
        return adminChatsService.getCompanyChats(event);
    }
}).use((0, http_json_body_parser_1.default)());
exports.Chats = (0, core_1.default)((event) => {
    const httpMethod = event.requestContext.http.method.toLowerCase();
    if (httpMethod === "post") {
        return adminChatsService.sendChatMessage(event);
    }
    else if (httpMethod === "get") {
        return adminChatsService.getChatsConversation(event);
    }
    else {
        return adminChatsService.ResponseWithError(event);
    }
}).use((0, http_json_body_parser_1.default)());
//# sourceMappingURL=scenarioHandler.js.map