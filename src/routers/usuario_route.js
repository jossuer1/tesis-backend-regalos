import { Router } from "express"
import {
  confirmarMail,
  crearNuevoPassword,
  recuperarPassword,
  comprobarTokenPassword,
  registro,
  login,
  loginGoogle,
  perfil,
  crearUsuarioDesdeAdmin,
  actualizarPerfil
} from "../controllers/usuario_controller.js"

// 🟢 Aquí importamos ambos middlewares desde tu JWT.js
import { verificarTokenJWT, esAdmin } from "../middlewares/JWT.js"

const router = Router()

// 🟢 REGISTRO
router.post("/registro", registro)

// 🟢 CONFIRMAR EMAIL
router.get("/confirmar/:token", confirmarMail)

// 🟢 LOGIN
router.post("/login", login)

// 🟢 LOGIN / REGISTRO CON GOOGLE
router.post("/google", loginGoogle)

// 🟢 RECUPERAR PASSWORD
router.post("/reset", recuperarPassword)

// 🟢 VALIDAR TOKEN RESET
router.get("/reset/:token", comprobarTokenPassword)

// 🟢 NUEVA PASSWORD
router.post("/nuevopassword/:token", crearNuevoPassword)

// 🔵 PERFIL (PROTEGIDO JWT)
router.get("/perfil", verificarTokenJWT, perfil)

// 🔵 ACTUALIZAR PERFIL (PROTEGIDO JWT)
router.put("/perfil", verificarTokenJWT, actualizarPerfil)

// 🔵 CREAR USUARIO DESDE ADMIN (Aplica verificarTokenJWT primero, luego esAdmin)
router.post("/admin/crear-usuario", verificarTokenJWT, esAdmin, crearUsuarioDesdeAdmin)

export default router