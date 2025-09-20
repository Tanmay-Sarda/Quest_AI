import ConnectDB from './db/ConnectDB.js';
// reqire ('dotenv').config({path: './.env'});
import dotenv from 'dotenv';
import app from './app.js';
dotenv.config({ path: './.env' });



ConnectDB()
.then(()=>{
    app.on('error', (err) => {
        console.error(`Connection error: ${err.message}`);      
        throw err;
    });
    app.listen(process.env.Port || 3000, () => {
        console.log(`Server is running on port ${process.env.Port || 3000}`);
    })
})
.catch((error) => {
    console.error(`Failed to connect to the database: ${error.message}`);       
});



/*
import express from 'express';
const app = express();
const ConnectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        app.on('error', (err) => {
            console.error(`Connection error: ${err.message}`);
            throw err;
        });

        app.listen(process.env.Port, () => {
            console.log(`App is running on port ${process.env.Port}`);
        });
        console.log(conn);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default ConnectDB;
*/