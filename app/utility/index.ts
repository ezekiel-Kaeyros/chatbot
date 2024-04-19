import { ConnectDB } from "./databaseClient";

ConnectDB()
    .then(() => {
        console.log("DB Connected!");
    })
    .catch((error) => console.log(error));