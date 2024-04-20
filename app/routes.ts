import { Request, Response, Router } from "express";
import { container } from "tsyringe";
import { ScenarioService } from "./service/scenario-service";
import { CredentialsService } from "./service/credentials-service";
import { CompanyChatsService } from "./service/company-chats-service";
import { AdminChatsService } from "./service/admin-chat-service";

const router = Router();

const scenarioService = container.resolve(ScenarioService);
const credentialsService = container.resolve(CredentialsService);
const companyChatsService = container.resolve(CompanyChatsService);
const adminChatsService = container.resolve(AdminChatsService);

router.get('/', (req: Request, res: Response) => res.send('App start'));

//SCENARIO
router.post(
    '/create',
    scenarioService.createScenario
);

router.put(
    '/edit/:id',
    scenarioService.editScenario
);

router.get(
    '/getall',
    scenarioService.getScenarios
);

router.get(
    '/getone/:id',
    scenarioService.getScenario
);

router.post(
    '/active',
    scenarioService.activeScenario
);

router.get(
    '/scenarios/:phone_number_id',
    scenarioService.getCompanyScenarios
);

// CHATBOT
router.get(
    '/webhook',
    companyChatsService.getMessage
);

router.post(
    '/webhook',
    companyChatsService.sendMessage
);

// CREDENTIALS
router.get(
    '/credentials',
    credentialsService.getAllCredentials
);
router.get(
    '/credentials/:id',
    credentialsService.getCredentials
);
router.post(
    '/credentials',
    credentialsService.createCredentials
);
router.put(
    '/credentials',
    credentialsService.updateCredentials
);
router.delete(
    '/credentials',
    credentialsService.deleteCredentials
);

// COMPANY CHATS
router.get(
    '/companychats',
    adminChatsService.getAllCompaniesChats
);
router.get(
    '/companychats/:phone_number_id',
    adminChatsService.getCompanyChats
);

// CHATS
router.post(
    '/chats',
    adminChatsService.sendChatMessage
);
router.get(
    '/chats/:phone_number_id/:phone_number',
    adminChatsService.getChatsConversation
);

export default router;