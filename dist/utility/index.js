"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const databaseClient_1 = require("./databaseClient");
(0, databaseClient_1.ConnectDB)()
    .then(() => {
    console.log("DB Connected!");
})
    .catch((error) => console.log(error));
//# sourceMappingURL=index.js.map