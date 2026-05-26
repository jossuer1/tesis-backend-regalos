import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Creamos el transporte apuntando a los servidores de Brevo
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // Debe ser false para el puerto 587 (usa TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Función para enviar correos reales
 */
export const sendMail = async (emailDestino, asunto, contenidoHtml) => {
  try {
    const mailOptions = {
      from: '"Regalos Mágicos ✨" <rojasjosue55a@gmail.com>', // Tu correo emisor de Brevo
      to: emailDestino,
      subject: asunto,
      html: contenidoHtml,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("✅ ¡Correo REAL enviado con Brevo! ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error enviando correo real:", error.message);
    throw error;
  }
};