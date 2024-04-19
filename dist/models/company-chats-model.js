"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companiesChats = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const companyChatsSchema = new mongoose_1.default.Schema({
    phone_number_id: String,
    company: String,
    conversations: [{}],
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
const companiesChats = mongoose_1.default.models.companiesChats ||
    mongoose_1.default.model("chats", companyChatsSchema);
exports.companiesChats = companiesChats;
//# sourceMappingURL=company-chats-model.js.map