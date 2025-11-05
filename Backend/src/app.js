import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors({
  origin:  "http://localhost:3001", // your frontend URL
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
}));


app.use(express.json({limit:'20kb'})); //Use for parsing JSON bodies
app.use(express.urlencoded({extended:true, limit:'20kb'})); //Use for parsing URL-encoded bodies
app.use(express.static('public')); //Serve static files from the 'public' directory
app.use(cookieParser()); //Use for parsing cookies  

// Routes

//Story Routes
import storyRoutes from './routes/story.routes.js';
app.use('/api/v1/story', storyRoutes);

//User Routes
import userRoutes from './routes/user.routes.js';
app.use('/api/v1/user', userRoutes);

//Notification Routes
import notificationRoutes from './routes/notification.routes.js';
app.use('/api/v1/notification', notificationRoutes);

export default app;