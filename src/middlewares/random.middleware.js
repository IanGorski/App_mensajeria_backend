const randomMiddleware = (nro_piso) => {

    return (request, response, next) => {
        const numero_random = Math.random()
        if (numero_random > nro_piso) {
            console.log('tuviste suerte')
            next()
        }
        else {
            console.log("Mala suerte")
            response.send({ ok: false, message: 'Has muerto' })
        }
    }
}

export default randomMiddleware

