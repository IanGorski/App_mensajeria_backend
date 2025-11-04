import mongoose from 'mongoose';
import ENVIRONMENT from './environment.config.js';

async function connectToMongoDB() {
    try {
        // Usa MONGO_URI para conexión local o MONGO_DB_CONNECTION_STRING para Atlas
        const connection_string = ENVIRONMENT.MONGO_URI || ENVIRONMENT.MONGO_DB_CONNECTION_STRING;
        const connection = await mongoose.connect(connection_string, {
            timeoutMS: 60000,
            socketTimeoutMS: 60000,
        });
        console.log(`Conexión con DB exitosa: ${connection.connection.host}:${connection.connection.port}`);
        console.log(`Nombre de la base de datos: ${connection.connection.name}`);
    } catch (error) {
        console.error('[SERVER ERROR]: Fallo en la conexión', error);
    }
}

export default connectToMongoDB;