import mongoose from 'mongoose';
import ENVIRONMENT from './environment.config.js';

// Variable global para mantener la conexión en serverless
let isConnected = false;

async function connectToMongoDB() {
    // Si ya está conectado, no reconectar
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log('Using existing database connection');
        return;
    }

    try {
        // Usa MONGO_DB_CONNECTION_STRING para Atlas o MONGO_URI para local
        const connection_string = process.env.NODE_ENV === 'production' 
            ? ENVIRONMENT.MONGO_DB_CONNECTION_STRING 
            : (ENVIRONMENT.MONGO_URI || ENVIRONMENT.MONGO_DB_CONNECTION_STRING);
        
        if (!connection_string) {
            throw new Error('No se encontró la cadena de conexión a MongoDB');
        }

        const connection = await mongoose.connect(connection_string, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        isConnected = true;
        console.log(`✅ Conexión con DB exitosa: ${connection.connection.host}`);
        console.log(`📊 Base de datos: ${connection.connection.name}`);
    } catch (error) {
        console.error('❌ [SERVER ERROR]: Fallo en la conexión a MongoDB', error);
        isConnected = false;
        throw error; // Lanzar el error para que sea manejado por el llamador
    }
}

export default connectToMongoDB;