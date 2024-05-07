"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatStatus = exports.TypeWhatsappMessage = exports.Status_bot = exports.TimeToDisableBot = void 0;
var TimeToDisableBot;
(function (TimeToDisableBot) {
    TimeToDisableBot[TimeToDisableBot["IN_SECONDE"] = 60] = "IN_SECONDE";
    TimeToDisableBot[TimeToDisableBot["IN_MINUTE"] = 1] = "IN_MINUTE";
})(TimeToDisableBot || (exports.TimeToDisableBot = TimeToDisableBot = {}));
var Status_bot;
(function (Status_bot) {
    Status_bot["DISABLED"] = "disabled";
    Status_bot["ENABLED"] = "enabled";
})(Status_bot || (exports.Status_bot = Status_bot = {}));
var TypeWhatsappMessage;
(function (TypeWhatsappMessage) {
    TypeWhatsappMessage["BUTTON_REPLY"] = "button_reply";
    TypeWhatsappMessage["TEXT"] = "text";
    TypeWhatsappMessage["LIST_REPLY"] = "list_reply";
    TypeWhatsappMessage["INTERACTIVE"] = "interactive";
})(TypeWhatsappMessage || (exports.TypeWhatsappMessage = TypeWhatsappMessage = {}));
var ChatStatus;
(function (ChatStatus) {
    ChatStatus["START"] = "start";
    ChatStatus["PENDING"] = "pending";
    ChatStatus["END"] = "end";
    ChatStatus["OPEN"] = "open";
    ChatStatus["EXPIRED"] = "expired";
})(ChatStatus || (exports.ChatStatus = ChatStatus = {}));
//# sourceMappingURL=bot-enum.js.map