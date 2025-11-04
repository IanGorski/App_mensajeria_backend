import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

const mailOptions = {
    from: 'testsigdev@gmail.com',
    to: 'testsigdev@gmail.com',
    subject: 'Prueba de correo',
    text: 'Este es un correo de prueba.'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('Error al enviar correo:', error);
    } else {
        console.log('Correo enviado:', info.response);
    }
});