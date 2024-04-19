"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentials = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const credentialsSchema = new mongoose_1.default.Schema({
    company: String,
    phone_number_id: Number,
    verify_token: String,
    token: String
}, {
    toJSON: {
        transform(doc, ret, options) {
            delete ret.__v;
            delete ret.createdAt;
            delete ret.updatedAt;
        },
    },
    timestamps: true,
});
const credentials = mongoose_1.default.models.credentials ||
    mongoose_1.default.model("credentials", credentialsSchema);
exports.credentials = credentials;
//# sourceMappingURL=credentials-model.js.map