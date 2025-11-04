import logger from '../config/logger.js';
const randomMiddleware = (nro_piso) => {

    return (request, response, next) => {
        const numero_random = Math.random()
        if (numero_random > nro_piso) {
            logger.info('tuviste suerte');
            next()
        }
        else {
            logger.info("Mala suerte");
            response.send({ ok: false, message: 'Has muerto' })
        }
    }
}

export default randomMiddleware

