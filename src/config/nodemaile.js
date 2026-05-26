import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

const transporter = nodemailer.createTransport({
   
    host: "74.125.193.108", 
    port: 587,            
    secure: false,    
    auth: {
        user: process.env.USER_MAILTRAP, // Tu correo de Gmail
        pass: process.env.PASS_MAILTRAP, // Tus 16 letras de contraseña de aplicación
    },
    tls: {
        servername: "smtp.gmail.com",
        rejectUnauthorized: false
    }
})
const sendMail = async (to, subject, html) => {

    try {

        const info = await transporter.sendMail({
            from: '"Regalos Mágicos" <rojasjosue55a@gmail.com>',
            to,
            subject,
            html,
        })

        console.log("✅ Email enviado:", info.messageId)

    } catch (error) {

        console.error("❌ Error enviando email:", error.message)

        throw error
    }
}

export default sendMail