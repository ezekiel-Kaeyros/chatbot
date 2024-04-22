"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenarios = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const scenarioSchema = new mongoose_1.default.Schema({
    title: String,
    phone_number_id: String,
    company: String,
    description: [{}],
    active: Boolean,
    interactive_labels: [{}],
    users: [{}],
    times: Number,
    keywords: [String],
    company_id: String
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
const scenarios = mongoose_1.default.models.scenarios ||
    mongoose_1.default.model("scenarios", scenarioSchema);
exports.scenarios = scenarios;
//# sourceMappingURL=scenario-model.js.map