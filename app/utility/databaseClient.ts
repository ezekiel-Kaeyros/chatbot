import { MongoClient } from "mongodb";
import mongoose from "mongoose";
mongoose.set("strictQuery", false);

const ConnectDB = async () => {
    // const DB_URL = "mongodb+srv://geraud:Password-2023@chatbot.llikcvv.mongodb.net/chatbot";
    //const DB_URL = "mongodb://admin:admin@localhost:27017/";

    try {
        //const DB_URL = "mongodb://ec2-3-123-17-212.eu-central-1.compute.amazonaws.com:27017/chatbot";
        // const DB_URL = "mongodb+srv://geraud:Password-2023@chatbot.llikcvv.mongodb.net/chatbot";
        const DB_URL = "mongodb+srv://dba_user:dba_db2024@dba.vt1nhtx.mongodb.net/dba-chatbot-service";
        await mongoose.connect(DB_URL);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

export { ConnectDB };
