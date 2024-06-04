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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadWhatsappFile = exports.getUrlWhatsappFile = void 0;
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const mime_type_constant_1 = require("../constants/mime-type.constant");
const getUrlWhatsappFile = (mediaId, whatsapp_token) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const response = yield axios_1.default.get(`https://graph.facebook.com/v20.0/${mediaId}/`, {
            headers: {
                'Authorization': `Bearer ${whatsapp_token}`
            }
        });
        return response.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error('Axios error:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
            throw new Error(`Error fetching data: ${(_b = error.response) === null || _b === void 0 ? void 0 : _b.status} ${(_c = error.response) === null || _c === void 0 ? void 0 : _c.statusText}`);
        }
        else {
            console.error('Unexpected error:', error);
            throw new Error('Unexpected error');
        }
    }
});
exports.getUrlWhatsappFile = getUrlWhatsappFile;
const downloadWhatsappFile = (url, whatsapp_token, mime_type) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    try {
        const response = yield axios_1.default.get(url, {
            headers: {
                'Authorization': `Bearer ${whatsapp_token}`,
            },
            responseType: 'arraybuffer'
        });
        const uploadDir = path_1.default.join(__dirname, '../..', 'uploads');
        yield fs_extra_1.default.ensureDir(uploadDir);
        const fileName = `image-${Date.now()}${path_1.default.extname(url)}${mime_type_constant_1.extensionMapping[mime_type]}`;
        const filePath = path_1.default.join(uploadDir, fileName);
        yield fs_extra_1.default.writeFile(filePath, response.data);
        const fileUrl = `${process.env.BASE_URL || 'http://localhost:3300'}/uploads/${fileName}`;
        return fileUrl;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error('Axios error:', (_d = error.response) === null || _d === void 0 ? void 0 : _d.data);
            throw new Error(`Error fetching data: ${(_e = error.response) === null || _e === void 0 ? void 0 : _e.status} ${(_f = error.response) === null || _f === void 0 ? void 0 : _f.statusText}`);
        }
        else {
            console.error('Unexpected error:', error);
            throw new Error('Unexpected error');
        }
    }
});
exports.downloadWhatsappFile = downloadWhatsappFile;
//# sourceMappingURL=upload-file-from-webhook.js.map