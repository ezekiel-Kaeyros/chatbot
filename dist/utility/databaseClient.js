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
exports.ConnectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
mongoose_1.default.set("strictQuery", false);
const ConnectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    // const DB_URL = "mongodb+srv://geraud:Password-2023@chatbot.llikcvv.mongodb.net/chatbot";
    //const DB_URL = "mongodb://admin:admin@localhost:27017/";
    try {
        //const DB_URL = "mongodb://ec2-3-123-17-212.eu-central-1.compute.amazonaws.com:27017/chatbot";
        // const DB_URL = "mongodb+srv://geraud:Password-2023@chatbot.llikcvv.mongodb.net/chatbot";
        const DB_URL = "mongodb+srv://dba_user:dba_db2024@dba.vt1nhtx.mongodb.net/dba-chatbot-service";
        yield mongoose_1.default.connect(DB_URL);
    }
    catch (error) {
        console.log(error);
        process.exit(1);
    }
});
exports.ConnectDB = ConnectDB;
//# sourceMappingURL=databaseClient.js.map