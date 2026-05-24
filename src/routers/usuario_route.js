import { Router } from 'express'
import {
  confirmarMail,
  crearNuevoPassword,
  recuperarPassword,
  comprobarTokenPassword,
  registro,
  login,
  perfil
} from '../controllers/usuario_controller.js'

// IMPORTAMOS EL MIDDLEWARE QUE CREASTE
import { verificarTokenJWT } from '../middlewares/JWT.js' // <-- Ajusta la ruta a donde guardaste tu helper de JWT

const router = Router()

// ==========================================
// RUTAS PÚBLICAS (No requieren Token)
// ==========================================
router.post("/registro", registro)
router.get("/confirmar/:token", confirmarMail)
router.post("/reset", recuperarPassword)
router.get("/reset/:token", comprobarTokenPassword)
router.post("/nuevopassword/:token", crearNuevoPassword)
router.post('/login', login)


// ==========================================
// RUTAS PRIVADAS (Requieren Token)
// ==========================================
router.get("/perfil", verificarTokenJWT, perfil)

export default router