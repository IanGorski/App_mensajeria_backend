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
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports
});

// Filtrar logs sensibles en producción
if (process.env.NODE_ENV === 'production') {
    logger.transports.forEach((t) => {
        if (t instanceof winston.transports.Console) {
            t.silent = true;
        }
    });
}

export default logger;