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
        // Usa MONGO_DB_CONNECTION_STRING (prioridad) o MONGO_URI
        const connection_string = ENVIRONMENT.MONGO_DB_CONNECTION_STRING || ENVIRONMENT.MONGO_URI;
        
        if (!connection_string) {
            throw new Error('No se encontró la cadena de conexión a MongoDB');
        }

        console.log(`Conectando a MongoDB...`);
        console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
        
        const connection = await mongoose.connect(connection_string, {
            serverSelectionTimeoutMS: 30000, // Aumentado para serverless
            socketTimeoutMS: 45000,
            maxPoolSize: 1, // Importante para serverless
            minPoolSize: 0
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