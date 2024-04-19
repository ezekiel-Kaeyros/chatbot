"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
require("./utility");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/', routes_1.default);
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3300;
httpServer.listen({ port: PORT }, () => {
    console.log(`httpServer ready at http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map