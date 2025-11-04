import dotenv from 'dotenv'


//Cargar las variables de entorno en process.env
dotenv.config()


//Variables de entorno
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