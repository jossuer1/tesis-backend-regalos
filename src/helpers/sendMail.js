import { sendMail } from "../config/nodemaile.js"

// Estilo para los botones (se usa en ambos correos)
const btnStyle = "display: inline-block; background-color: #df4759; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: 500; border-radius: 6px; margin: 15px 0;"

const sendMailToRegister = (userMail, token) => {
    return sendMail(
        userMail,
        "Confirma tu cuenta - Regalos Mágicos ✨",
        `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 500px;">
            <h2 style="color: #111;">Confirma tu cuenta</h2>
            <p>Hola, gracias por registrarte en <strong>Regalos Mágicos</strong>. Haz clic en el siguiente enlace para activar tu cuenta:</p>
            
            <a href="${process.env.URL_FRONTEND}confirmar/${token}" style="${btnStyle}">
                Confirmar cuenta
            </a>
            
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
            <footer style="font-size: 12px; color: #999;">Regalos Mágicos</footer>
        </div>
        `
    )
}

const sendMailToRecoveryPassword = (userMail, token) => {
    return sendMail(
        userMail,
        "Recupera tu contraseña - Regalos Mágicos",
        `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 500px;">
            <h2 style="color: #111;">Restablecer contraseña</h2>
            <p>Has solicitado restablecer tu contraseña en <strong>Regalos Mágicos</strong>. Haz clic abajo para cambiarla:</p>

            <a href="${process.env.URL_FRONTEND}reset/${token}" style="${btnStyle}">
                Cambiar contraseña
            </a>

            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
            <footer style="font-size: 12px; color: #999;">Regalos Mágicos</footer>
        </div>
        `
    )
}

export {
    sendMailToRegister,
    sendMailToRecoveryPassword
}