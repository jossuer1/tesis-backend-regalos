import { v2 as cloudinary } from 'cloudinary'
import fs from "fs-extra"

// 💡 ¡AGREGA ESTO AQUÍ! Inicializa las credenciales con tu .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Subir archivos locales a Cloudinary (Fotos desde el panel de administración)
const subirImagenCloudinary = async (filePath, folder = "RegalosMagicos") => {
    const { secure_url, public_id } = await cloudinary.uploader.upload(filePath, { folder })
    await fs.unlink(filePath) // Limpia el archivo temporal local de inmediato
    return { secure_url, public_id }
}

// Subir Base64 a Cloudinary (Imágenes generadas por IA en el Frontend)
const subirBase64Cloudinary = async (base64, folder = "RegalosMagicos") => {
    try {
        let limpiandoBase64 = base64;
        if (base64.includes(',')) {
            limpiandoBase64 = base64.split(',')[1];
        }

        limpiandoBase64 = limpiandoBase64.replace(/\s/g, '');
        const buffer = Buffer.from(limpiandoBase64, 'base64');

        const secure_url = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { 
                    folder: folder, 
                    resource_type: 'image',
                    format: 'png'
                }, 
                (err, res) => {
                    if (err) reject(err);
                    else resolve(res.secure_url);
                }
            );
            stream.end(buffer);
        });

        return secure_url;

    } catch (error) {
        console.error("Error al subir Base64 a Cloudinary:", error);
        throw new Error("No se pudo procesar la imagen de la IA en el servidor");
    }
}

export {
    subirImagenCloudinary,
    subirBase64Cloudinary
}