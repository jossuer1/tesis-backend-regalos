import dotenv from 'dotenv';
import { sendMailToRecoveryPassword, sendMailToRegister } from "../helpers/sendMail.js"

dotenv.config();

/**
 * Envía un correo REAL usando la API HTTP de Brevo (Evita bloqueos de puertos)
 */
export const sendMail = async (emailDestino, asunto, contenidoHtml) => {
  try {
    // 🚨 Usamos la contraseña larga de Brevo (tu API Key de SMTP)
    const apiKey = process.env.SMTP_PASS; 

    if (!apiKey) {
      throw new Error("Falta la variable SMTP_PASS en el entorno");
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { 
          name: "Regalos Mágicos ✨", 
          email: "ac999c001@smtp-brevo.com" // Tu correo emisor de Brevo
        },
        to: [{ email: emailDestino }],
        subject: asunto,
        htmlContent: contenidoHtml
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al conectar con la API de Brevo");
    }

    console.log("✅ ¡Correo REAL enviado por API de Brevo! ID:", data.messageId);
    return data;

  } catch (error) {
    console.error("❌ Error real en sendMail (API):", error.message);
    throw error; // Mantiene el flujo de error si algo sale mal
  }
};