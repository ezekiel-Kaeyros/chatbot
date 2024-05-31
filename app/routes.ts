import { Request, Response, Router } from "express";
import { container } from "tsyringe";
import { ScenarioService } from "./service/scenario-service";
import { CredentialsService } from "./service/credentials-service";
import { CompanyChatsService } from "./service/company-chats-service";
import { AdminChatsService } from "./service/admin-chat-service";
import upload from "./utility/multerConfig";

const router = Router();

const scenarioService = container.resolve(ScenarioService);
const credentialsService = container.resolve(CredentialsService);
const companyChatsService = new CompanyChatsService();
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

router.delete(
    '/delete/:id',
    scenarioService.deleteScenario
);

router.post(
    '/active',
    scenarioService.activeScenario
);

router.get(
    '/scenarios/:phone_number_id',
    scenarioService.getCompanyScenarios
);

router.post(
    '/scenarios/upload-file',
    upload.single('file'),
    scenarioService.uploadFile
)

// CHATBOT
router.get(
    '/webhook',
    (req, res) => companyChatsService.getMessage(req, res)
);

router.post(
    '/webhook',
    (req, res) => companyChatsService.sendMessage(req, res)
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
router.get(
    '/credentials/user/emai/',
    credentialsService.getCredentialsByEmail
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

router.post(
    '/chats/update-status-conversation',
    adminChatsService.changeStatusConversation
);

router.get(
    '/chats/:phone_number_id/:phone_number',
    adminChatsService.getChatsConversation
);

export default router;