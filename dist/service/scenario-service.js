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
exports.ScenarioService = void 0;
const scenario_repository_1 = require("../repository/scenario-repository");
const response_1 = require("../utility/response");
const scenario_input_1 = require("../models/dto/scenario-input");
const class_transformer_1 = require("class-transformer");
const errors_1 = require("../utility/errors");
const tsyringe_1 = require("tsyringe");
const parseScenario_1 = require("../utility/parseScenario");
const credentials_repository_1 = require("../repository/credentials-repository");
const repository = new scenario_repository_1.ScenarioRespository();
const credentialsRepository = new credentials_repository_1.CredentialsRepository();
let ScenarioService = class ScenarioService {
    constructor(repository, credentialsRepository) {
        this.repository = repository;
        this.credentialsRepository = credentialsRepository;
    }
    ResponseWithError(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, response_1.ErrorResponse)(404, "request method is not supported!");
        });
    }
    createScenario(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = (0, class_transformer_1.plainToClass)(scenario_input_1.ScenarioInput, req.body);
                const error = yield (0, errors_1.AppValidationError)(input);
                if (error)
                    return res.status(404).send(error);
                yield (0, parseScenario_1.removeEmptyArray)(input.description);
                yield (0, parseScenario_1.longLabel)(input.description);
                if (yield (0, parseScenario_1.duplicatedLabel)(input.description))
                    throw new Error("Duplicate questions or answers, or check your products template if threre is!");
                const badNbr = yield (0, parseScenario_1.parseScenario)(input.description);
                if (badNbr)
                    return res.status(400).send("Number of responses not supported!");
                yield (0, parseScenario_1.identifyScenario)(input.description);
                const filterLabels = yield (0, parseScenario_1.extractLabelsOfInteractiveResponses)(input.description);
                if (filterLabels.length !== 0)
                    input.interactive_labels = filterLabels;
                const data = yield repository.createScenario(input);
                console.dir(filterLabels, { depth: null });
                return res
                    .status(201)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    getScenarios(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield repository.getAllScenarios();
                return res
                    .status(200)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(400)
                    .send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    getCompanyScenarios(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const phone_number_id = (_a = req.params) === null || _a === void 0 ? void 0 : _a.phone_number_id;
                if (!phone_number_id)
                    return res.status(404).send("please provide company phone_number_id");
                const data = yield repository.getCompanyScenarios(phone_number_id);
                return res.status(200).send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(400)
                    .send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    activeScenario(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = (0, class_transformer_1.plainToClass)(scenario_input_1.ScenarioInput, req.body);
                const error = yield (0, errors_1.AppValidationError)(input);
                if (error)
                    return res.status(404).send(error);
                const data = yield repository.activeScenario(input);
                return res
                    .status(200)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    getScenario(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const scenarioId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
                if (!scenarioId)
                    return res.status(404).send("please provide scenario id");
                const data = yield repository.getScenarioById(scenarioId);
                return res
                    .status(200)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    editScenario(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const input = (0, class_transformer_1.plainToClass)(scenario_input_1.ScenarioInput, req.body);
                const error = yield (0, errors_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                const scenarioId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
                if (!scenarioId)
                    return res.status(403).send("id must be provided!");
                input._id = scenarioId;
                yield (0, parseScenario_1.removeEmptyArray)(input.description);
                yield (0, parseScenario_1.longLabel)(input.description);
                if (yield (0, parseScenario_1.duplicatedLabel)(input.description))
                    throw new Error("Duplicate questions or answers, or check your products template if threre is!");
                const badNbr = yield (0, parseScenario_1.parseScenario)(input.description);
                if (badNbr)
                    return res.status(400).send("Number of responses not supported!");
                yield (0, parseScenario_1.identifyScenario)(input.description);
                const filterLabels = yield (0, parseScenario_1.extractLabelsOfInteractiveResponses)(input.description);
                if (filterLabels.length !== 0)
                    input.interactive_labels = filterLabels;
                const data = yield repository.updateScenario(input);
                return res
                    .status(200)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    deleteScenario(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const scenarioId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
                if (!scenarioId)
                    return res.status(403).send("please provide product id");
                const data = yield repository.deleteScenario(scenarioId);
                return res
                    .status(200)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
    uploadFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = req.file;
                const phoneNumberID = req.body.phone_number_id;
                if (!file) {
                    return res.status(400).send('No file uploaded.');
                }
                if (!phoneNumberID) {
                    return res.status(400).send('No phoneNumberID provided.');
                }
                const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
                res.status(200).send({
                    message: 'File uploaded successfully!',
                    fileUrl: fileUrl,
                    phoneNumberID: phoneNumberID
                });
            }
            catch (error) {
                console.log(error);
                return res.status(500).send({ error: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    }
};
exports.ScenarioService = ScenarioService;
exports.ScenarioService = ScenarioService = __decorate([
    (0, tsyringe_1.autoInjectable)(),
    __metadata("design:paramtypes", [scenario_repository_1.ScenarioRespository,
        credentials_repository_1.CredentialsRepository])
], ScenarioService);
//# sourceMappingURL=scenario-service.js.map