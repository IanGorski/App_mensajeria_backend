import winston from 'winston';

// Configurar transports según el entorno
const transports = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )
    })
];

// Solo agregar File transport si NO estamos en Vercel
if (!process.env.VERCEL) {
    transports.push(
        new winston.transports.File({ filename: 'logs/app.log' })
    );
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports
});

export default logger;