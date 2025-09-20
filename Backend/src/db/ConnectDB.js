import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';


const ConnectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`, {
    
        });
        console.log(conn.connection.host );
        return conn;
    } catch (error) {
        console.error(`MongoDB correction error: ${error.message}`);
        process.exit(1);
    }
}

export default ConnectDB;