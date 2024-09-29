import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {userRouter} from './routes/user.routes.js'


const app = express();
app.use(express.json())



app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: '20kb'}));
app.use(express.urlencoded({extended:true, limit:'20kb'}));
app.use(express.static('public'));
app.use(cookieParser());
/*  
express.json({ limit: '20kb' }): This sets a limit on the size of incoming JSON payloads (20 kilobytes in this case) to prevent large request bodies that could overload the server.
express.urlencoded({ extended: true, limit: '20kb' }): Parses incoming URL-encoded payloads (typically used for form submissions). The extended: true option allows for parsing complex objects.

*/



//Routes Use
app.use('/api/v1/users', userRouter );

export default app;