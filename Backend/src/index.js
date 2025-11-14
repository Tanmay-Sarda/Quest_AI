import ConnectDB from './db/ConnectDB.js';
import dotenv from 'dotenv';
import app from './app.js';
dotenv.config({ path: './.env' });



ConnectDB()
.then(()=>{
    app.on('error', (err) => {
        console.error(`Connection error: ${err.message}`);      
        throw err;
    });
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.Port || 3000}`);
    })
})
.catch((error) => {
    console.error(`Failed to connect to the database: ${error.message}`);       
});
