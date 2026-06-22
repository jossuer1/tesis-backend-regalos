import multer from 'multer'
import os from 'os'

// Configuración del almacenamiento temporal
const storage = multer.diskStorage({
    // Guardamos el archivo en la carpeta 'tmp' temporal del sistema operativo
    destination: (req, file, cb) => {
        cb(null, os.tmpdir())
    },
    // Le dejamos su nombre original temporal
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

// Filtro de seguridad para asegurarse de que solo suban imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true) // Aceptar archivo
    } else {
        cb(new Error('El archivo debe ser una imagen válida'), false) // Rechazar
    }
}

// Inicializamos el middleware de Multer
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite máximo de 5MB por foto
})

export default upload