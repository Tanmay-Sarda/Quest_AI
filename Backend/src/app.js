import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}))

app.use(express.json({limit:'20kb'})); //Use for parsing JSON bodies
app.use(express.urlencoded({extended:true, limit:'20kb'})); //Use for parsing URL-encoded bodies
app.use(express.static('public')); //Serve static files from the 'public' directory
app.use(cookieParser()); //Use for parsing cookies  

// Routes

//User Routes
import userRoutes from './routes/user.routes.js';
app.use('/api/v1/user', userRoutes);

export default app;