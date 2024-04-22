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
exports.PullBroadcastResponse = exports.PullRandomDraw = exports.PullSaveLoyaltyPoints = exports.PullWhatappAccessData = void 0;
const axios_1 = __importDefault(require("axios"));
const DASHBOARD_WHATSAPP_ACCESS_URL = "https://nh9dzfa8o7.execute-api.eu-central-1.amazonaws.com/prod/whatsapp-access-queue";
const LOYALTY_PROGRAM_SAVE_POINT_URL = "https://6r10kf27nk.execute-api.eu-central-1.amazonaws.com/prod/points";
const TOMBOLA_RANDOM_DRAW_URL = "https://lbd4bz7xd7.execute-api.eu-central-1.amazonaws.com/prod/random";
const BULKMESSAGE_BROADCAST_STATUS_URL = "https://7ws8gmoso5.execute-api.eu-central-1.amazonaws.com/prod";
//const BULKMESSAGE_BROADCAST_STATUS_URL = "http://127.0.0.1:3000";
const PullWhatappAccessData = (requestData) => __awaiter(void 0, void 0, void 0, function* () {
    return axios_1.default.post(DASHBOARD_WHATSAPP_ACCESS_URL, requestData);
});
exports.PullWhatappAccessData = PullWhatappAccessData;
const PullSaveLoyaltyPoints = (requestData, phone_number_id) => __awaiter(void 0, void 0, void 0, function* () {
    return axios_1.default.post(`${LOYALTY_PROGRAM_SAVE_POINT_URL}/${phone_number_id}`, requestData);
});
exports.PullSaveLoyaltyPoints = PullSaveLoyaltyPoints;
const PullRandomDraw = (requestData, phone_number_id) => __awaiter(void 0, void 0, void 0, function* () {
    return axios_1.default.post(`${TOMBOLA_RANDOM_DRAW_URL}/${phone_number_id}`, requestData);
});
exports.PullRandomDraw = PullRandomDraw;
const PullBroadcastResponse = (requestData, phone_number_id) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
        method: "PUT",
        url: `${BULKMESSAGE_BROADCAST_STATUS_URL}/broadcast-session/${phone_number_id}`,
        data: requestData,
        headers: {
            "Content-Type": "application/json"
        }
    });
});
exports.PullBroadcastResponse = PullBroadcastResponse;
//# sourceMappingURL=index.js.map