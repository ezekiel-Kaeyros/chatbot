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
exports.CredentialsRepository = void 0;
const credentials_model_1 = require("../models/credentials-model");
class CredentialsRepository {
    create(_a) {
        return __awaiter(this, arguments, void 0, function* ({ company, phone_number_id, verify_token, token }) {
            return credentials_model_1.credentials.create({
                company,
                phone_number_id,
                verify_token,
                token
            });
        });
    }
    update(_a) {
        return __awaiter(this, arguments, void 0, function* ({ company, phone_number_id, verify_token, token, _id }) {
            let existingCredentials = yield credentials_model_1.credentials.findById(_id);
            existingCredentials.company = company;
            existingCredentials.phone_number_id = phone_number_id;
            existingCredentials.verify_token = verify_token;
            existingCredentials.token = token;
            return existingCredentials.save();
        });
    }
    delete(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return credentials_model_1.credentials.deleteOne({ _id });
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return credentials_model_1.credentials.findById(id);
        });
    }
    getByPhoneNumber(phone_number_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return credentials_model_1.credentials.findOne({ phone_number_id });
        });
    }
    getByVerifyToken(verify_token) {
        return __awaiter(this, void 0, void 0, function* () {
            return credentials_model_1.credentials.findOne({ verify_token });
        });
    }
    getAll() {
        return __awaiter(this, arguments, void 0, function* (offset = 0, pages) {
            return credentials_model_1.credentials
                .find()
                .skip(offset)
                .limit(pages ? pages : 100);
        });
    }
}
exports.CredentialsRepository = CredentialsRepository;
//# sourceMappingURL=credentials-repository.js.map