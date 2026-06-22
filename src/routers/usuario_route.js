import { Router } from "express"
import {
  confirmarMail,
  crearNuevoPassword,
  recuperarPassword,
  comprobarTokenPassword,
  registro,
  login,
  perfil,
  crearUsuarioDesdeAdmin
} from "../controllers/usuario_controller.js"

import { verificarTokenJWT } from "../middlewares/JWT.js"

const router = Router()

// 🟢 REGISTRO
router.post("/registro", registro)

// 🟢 CONFIRMAR EMAIL
router.get("/confirmar/:token", confirmarMail)

// 🟢 LOGIN
router.post("/login", login)

// 🟢 RECUPERAR PASSWORD
router.post("/reset", recuperarPassword)

// 🟢 VALIDAR TOKEN RESET
router.get("/reset/:token", comprobarTokenPassword)

// 🟢 NUEVA PASSWORD
router.post("/nuevopassword/:token", crearNuevoPassword)

// 🔵 PERFIL (PROTEGIDO JWT)
router.get("/perfil", verificarTokenJWT, perfil)

// 🔵 CREAR USUARIO DESDE ADMIN
router.post("/admin/crear-usuario", crearUsuarioDesdeAdmin)

export default router