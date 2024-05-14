"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
require("./utility");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
io.on("connection", (socket) => {
    console.log("io connected");
});
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use("/", routes_1.default);
const PORT = process.env.PORT || 3300;
httpServer.listen({ port: PORT }, () => {
    console.log(`httpServer ready at http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map