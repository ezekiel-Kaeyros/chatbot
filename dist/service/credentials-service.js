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
exports.CredentialsService = void 0;
const tsyringe_1 = require("tsyringe");
const credentials_repository_1 = require("../repository/credentials-repository");
const response_1 = require("../utility/response");
const credentials_input_1 = require("../models/dto/credentials-input");
const class_transformer_1 = require("class-transformer");
const errors_1 = require("../utility/errors");
const repository = new credentials_repository_1.CredentialsRepository();
let CredentialsService = class CredentialsService {
    constructor(repository) {
        this.repository = repository;
    }
    ResponseWithError(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, response_1.ErrorResponse)(404, "request method is not supported!");
        });
    }
    createCredentials(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = (0, class_transformer_1.plainToClass)(credentials_input_1.CredentialsInput, req.body);
                const error = yield (0, errors_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                console.log(input);
                const data = yield repository.create(input);
                return res
                    .status(201)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ message: "custom error response" });
            }
        });
    }
    updateCredentials(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = (0, class_transformer_1.plainToClass)(credentials_input_1.CredentialsInput, req.body);
                console.log(input);
                const error = yield (0, errors_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                if (!input._id)
                    return (0, response_1.ErrorResponse)(403, "please provide credentials id");
                const data = yield repository.update(input);
                return res
                    .status(200)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ message: "custom error response" });
            }
        });
    }
    deleteCredentials(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const credentialsId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
                if (!credentialsId)
                    return (0, response_1.ErrorResponse)(403, "please provide credentials id");
                const data = yield repository.delete(credentialsId);
                return res
                    .status(200)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ message: "custom error response" });
            }
        });
    }
    getCredentials(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const credentialsId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
                if (!credentialsId)
                    return (0, response_1.ErrorResponse)(404, "please provide credentials id");
                const data = yield repository.getById(credentialsId);
                return res
                    .status(200)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ message: "custom error response" });
            }
        });
    }
    getAllCredentials(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield repository.getAll();
                return res
                    .status(200)
                    .send(data);
            }
            catch (error) {
                console.log(error);
                return res
                    .status(500)
                    .send({ message: "custom error response" });
            }
        });
    }
};
exports.CredentialsService = CredentialsService;
exports.CredentialsService = CredentialsService = __decorate([
    (0, tsyringe_1.autoInjectable)(),
    __metadata("design:paramtypes", [credentials_repository_1.CredentialsRepository])
], CredentialsService);
//# sourceMappingURL=credentials-service.js.map