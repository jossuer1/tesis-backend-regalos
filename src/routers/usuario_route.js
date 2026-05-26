import { Router } from "express"
import {
  confirmarMail,
  crearNuevoPassword,
  recuperarPassword,
  comprobarTokenPassword,
  registro,
  login,
  perfil
} from "../controllers/usuario_controller.js"

import { verificarTokenJWT } from "../middlewares/JWT.js"

const router = Router()

// ================================
// 🟢 REGISTRO
// ================================
/**
 * @swagger
 * /registro:
 * post:
 * summary: Registrar usuario
 * tags: [Usuarios]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - nombre
 * - email
 * - password
 * properties:
 * nombre:
 * type: string
 * apellido:
 * type: string
 * telefono:
 * type: string
 * direccion:
 * type: string
 * email:
 * type: string
 * password:
 * type: string
 * responses:
 * 200:
 * description: Usuario registrado
 */
router.post("/registro", registro)


// ================================
// 🟢 CONFIRMAR EMAIL
// ================================
/**
 * @swagger
 * /confirmar/{token}:
 * get:
 * summary: Confirmar cuenta por token
 * tags: [Usuarios]
 * parameters:
 * - in: path
 * name: token
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Cuenta confirmada
 */
router.get("/confirmar/:token", confirmarMail)


// ================================
// 🟢 LOGIN
// ================================
/**
 * @swagger
 * /login:
 * post:
 * summary: Iniciar sesión
 * tags: [Usuarios]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * password:
 * type: string
 * responses:
 * 200:
 * description: Login exitoso (retorna JWT)
 */
router.post("/login", login)


// ================================
// 🟢 RECUPERAR PASSWORD
// ================================
/**
 * @swagger
 * /reset:
 * post:
 * summary: Solicitar reset de contraseña
 * tags: [Usuarios]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * properties:
 * email:
 * type: string
 * responses:
 * 200:
 * description: Email de recuperación enviado con éxito
 */
router.post("/reset", recuperarPassword)


// ================================
// 🟢 VALIDAR TOKEN RESET
// ================================
/**
 * @swagger
 * /reset/{token}:
 * get:
 * summary: Validar token de reset
 * tags: [Usuarios]
 * parameters:
 * - in: path
 * name: token
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Token válido para cambiar contraseña
 */
router.get("/reset/:token", comprobarTokenPassword)


// ================================
// 🟢 NUEVA PASSWORD
// ================================
/**
 * @swagger
 * /nuevopassword/{token}:
 * post:
 * summary: Crear nueva contraseña
 * tags: [Usuarios]
 * parameters:
 * - in: path
 * name: token
 * required: true
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - password
 * properties:
 * password:
 * type: string
 * responses:
 * 200:
 * description: Contraseña modificada exitosamente
 */
router.post("/nuevopassword/:token", crearNuevoPassword)


// ================================
// 🔵 PERFIL (PROTEGIDO JWT)
// ================================
/**
 * @swagger
 * /perfil:
 * get:
 * summary: Obtener perfil del usuario
 * tags: [Usuarios]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Perfil del usuario autenticado
 * 401:
 * description: No autorizado
 */
router.get("/perfil", verificarTokenJWT, perfil)

export default router