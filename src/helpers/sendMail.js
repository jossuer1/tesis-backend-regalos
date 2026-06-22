import { sendMail } from "../config/nodemaile.js"

const btnStyle = "display: inline-block; background-color: #df4759; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: 500; border-radius: 6px; margin: 15px 0;"

const sendMailToRegister = (userMail, token) => {
    return sendMail(
        userMail,
        "Confirma tu cuenta - Regalos Mágicos ✨",
        `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 500px;">
            <h2 style="color: #111;">Confirma tu cuenta</h2>
            <p>Hola, gracias por registrarte en <strong>Regalos Mágicos</strong>. Haz clic en el siguiente enlace para activar tu cuenta:</p>
            <a href="${process.env.URL_FRONTEND}confirmar/${token}" style="${btnStyle}">Confirmar cuenta</a>
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
            <a href="${process.env.URL_FRONTEND}reset/${token}" style="${btnStyle}">Cambiar contraseña</a>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
            <footer style="font-size: 12px; color: #999;">Regalos Mágicos</footer>
        </div>
        `
    )
}

// 🛍️ NUEVA: Comprobante de Compra Dinámico
const sendMailToPedido = (userMail, datosPedido) => {
    // Mapeamos los productos comprados para incrustar filas HTML dinámicamente
    const filasProductos = datosPedido.productos.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.nombre}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.precioAlComprar.toFixed(2)}</td>
        </tr>
    `).join('')

    return sendMail(
        userMail,
        "Confirmación de tu Compra - Regalos Mágicos 🎁✨",
        `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #df4759; text-align: center;">¡Gracias por tu compra!</h2>
            <p>Tu pedido ha sido procesado exitosamente. Aquí tienes el resumen de tu orden:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f9f9f9;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Regalo</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Cant.</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Precio Unit.</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasProductos}
                </tbody>
            </table>
            
            <div style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 10px; color: #111;">
                Total Pagado: <span style="color: #df4759;">$${datosPedido.montoTotal.toFixed(2)}</span>
            </div>
            
            <p style="margin-top: 20px;"><strong>Dirección de Envío:</strong> ${datosPedido.direccionEnvio}</p>
            <p style="font-size: 14px; color: #666;">Nos pondremos en marcha para preparar tu sorpresa mágica de inmediato.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
            <footer style="font-size: 11px; color: #999; text-align: center;">Regalos Mágicos © 2026</footer>
        </div>
        `
    )
}

// 🔑 NUEVA: Envío de credenciales generadas por el administrador/trabajador
const sendMailToNuevoUsuarioAdmin = (userMail, passwordClaro, rolAsignado) => {
    return sendMail(
        userMail,
        "Tus credenciales de acceso - Regalos Mágicos ✨",
        `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 500px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #df4759; text-align: center;">¡Bienvenido a Regalos Mágicos!</h2>
            <p>Un administrador o miembro del equipo te ha registrado en la plataforma con el rol de: <strong>${rolAsignado}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #df4759;">
                <p style="margin: 5px 0;"><strong>Correo de acceso:</strong> ${userMail}</p>
                <p style="margin: 5px 0;"><strong>Contraseña temporal:</strong> <span style="font-family: monospace; font-size: 16px; color: #df4759; font-weight: bold;">${passwordClaro}</span></p>
            </div>
            
            <p>Te recomendamos iniciar sesión y cambiar tu contraseña desde tu perfil por motivos de seguridad.</p>
            
            <div style="text-align: center; margin-top: 25px;">
                <a href="${process.env.URL_FRONTEND}login" style="display: inline-block; background-color: #df4759; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: 500; border-radius: 6px;">
                    Ir a iniciar sesión
                </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
            <footer style="font-size: 11px; color: #999; text-align: center;">Regalos Mágicos © 2026</footer>
        </div>
        `
    )
}

// Asegúrate de agregarla al export general junto a las demás funciones:
export {
    sendMailToRegister,
    sendMailToRecoveryPassword,
    sendMailToPedido,
    sendMailToNuevoUsuarioAdmin // 👈 Agregada
}
