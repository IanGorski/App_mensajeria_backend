import dotenv from 'dotenv'


//Cargar las variables de entorno
dotenv.config()

// Validar variables 
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET no está definido en las variables de entorno');
    throw new Error('JWT_SECRET es requerido. Por favor, configura esta variable en archivo .env');
}

if (!process.env.MONGO_URI && !process.env.MONGO_DB_CONNECTION_STRING) {
    console.error('MONGO_URI o MONGO_DB_CONNECTION_STRING no está definido');
    throw new Error('MONGO_URI es requerido. Por favor, configura esta variable en archivo .env');
}

const ENVIRONMENT = {
    GMAIL_PASSWORD: process.env.GMAIL_PASSWORD,
    GMAIL_USER: process.env.GMAIL_USER,
    PORT: process.env.PORT,
    URL_FRONTEND: process.env.URL_FRONTEND,
    JWT_SECRET: process.env.JWT_SECRET,
    MONGO_DB_CONNECTION_STRING: process.env.MONGO_DB_CONNECTION_STRING,
    URL_BACKEND: process.env.URL_BACKEND,
    MONGO_URI: process.env.MONGO_URI
}


export default ENVIRONMENT