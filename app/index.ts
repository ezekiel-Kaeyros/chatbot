import "reflect-metadata";
import expres from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import routes from "./routes";
import "./utility";
import fs from 'fs';
import path from "path";
import express from "express";

const app = expres();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(expres.json());
app.use(expres.urlencoded({ extended: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket: any) => {
  console.log("io connected");
});
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Vérifier et créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use('/uploads', express.static(uploadDir));

app.use("/", routes);

const PORT = process.env.PORT || 3300;
httpServer.listen({ port: PORT }, () => {
  console.log(`httpServer ready at http://localhost:${PORT}`);
});
