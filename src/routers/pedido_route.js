import { Router } from "express"
import { verificarTokenJWT, esAdmin } from "../middlewares/JWT.js"
import { 
    crearPedido, 
    obtenerMisPedidos, 
    obtenerTodosLosPedidosAdmin, 
    actualizarEstadoPedido 
} from "../controllers/pedido_controller.js"
import { crearSesionPago } from "../controllers/pago_controller.js"

const router = Router()

// RUTAS PARA EL CLIENTE LOGUEADO (Ambas necesitan token)
router.post("/pedidos", verificarTokenJWT, crearPedido) // Enviar carrito
router.get("/pedidos/mis-pedidos", verificarTokenJWT, obtenerMisPedidos) // Ver historial propio

// 💳 Generar el link de pago de Stripe Checkout para un pedido ya creado
router.post("/pedidos/:id/pagar", verificarTokenJWT, crearSesionPago)

// RUTAS PARA EL ADMINISTRADOR (Necesitan token Y ser Admin)
router.get("/admin/pedidos", verificarTokenJWT, esAdmin, obtenerTodosLosPedidosAdmin) // Ver todo
router.put("/admin/pedidos/:id", verificarTokenJWT, esAdmin, actualizarEstadoPedido) // Cambiar estado

export default router