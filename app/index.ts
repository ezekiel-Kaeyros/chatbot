import 'reflect-metadata';
import expres from 'express';
import { createServer } from 'http';
import cors from 'cors';
import routes from './routes';
import "./utility";

const app = expres();

app.use(
    cors({
        origin: '*',
        credentials: true
    })
);

app.use(expres.json());
app.use(expres.urlencoded({ extended: true }));

app.use('/', routes);

const httpServer = createServer(app);

const PORT = process.env.PORT || 3300;
httpServer.listen({ port: PORT }, () => {
    console.log(`httpServer ready at http://localhost:${PORT}`);
});
