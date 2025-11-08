import logger from './config/logger.js';

export class CustomError extends Error{
    constructor(message, status){
        super(message)
        this.status = status
    }
}

const manejarError = (accionCallback) =>{
    try{
        accionCallback()
    }
    catch(error){
        if(error.status){
            logger.error('[CLIENT ERROR]: ' + error.message, 'Status: ' + error.status);
        }
        else{
            logger.error('[SERVER ERROR]: ' + error.message);
        }
    }
}


export class ServerError extends Error{
    constructor(status, message){
        super(message)
        this.status = status
    }
}
