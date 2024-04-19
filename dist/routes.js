"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const scenario_service_1 = require("./service/scenario-service");
const credentials_service_1 = require("./service/credentials-service");
const company_chats_service_1 = require("./service/company-chats-service");
const admin_chat_service_1 = require("./service/admin-chat-service");
const router = (0, express_1.Router)();
const scenarioService = tsyringe_1.container.resolve(scenario_service_1.ScenarioService);
const credentialsService = tsyringe_1.container.resolve(credentials_service_1.CredentialsService);
const companyChatsService = tsyringe_1.container.resolve(company_chats_service_1.CompanyChatsService);
const adminChatsService = tsyringe_1.container.resolve(admin_chat_service_1.AdminChatsService);
router.get('/', (req, res) => res.send('App start'));
//SCENARIO
router.post('/create', scenarioService.createScenario);
router.put('/edit/:id', scenarioService.editScenario);
router.get('/getall', scenarioService.getScenarios);
router.get('/getone/:id', scenarioService.getScenario);
router.post('/active', scenarioService.activeScenario);
// CHATBOT
router.get('/webhook', companyChatsService.getMessage);
router.post('/webhook', companyChatsService.sendMessage);
// CREDENTIALS
router.get('/credentials', credentialsService.getAllCredentials);
router.get('/credentials/:id', credentialsService.getCredentials);
router.post('/credentials', credentialsService.createCredentials);
router.put('/credentials', credentialsService.updateCredentials);
router.delete('/credentials', credentialsService.deleteCredentials);
// COMPANY CHATS
router.get('/companychats', adminChatsService.getAllCompaniesChats);
router.get('/companychats/:phone_number_id', adminChatsService.getCompanyChats);
// CHATS
router.post('/chats', adminChatsService.sendChatMessage);
router.get('/chats/:phone_number_id/:phone_number', adminChatsService.getChatsConversation);
exports.default = router;
//# sourceMappingURL=routes.js.map