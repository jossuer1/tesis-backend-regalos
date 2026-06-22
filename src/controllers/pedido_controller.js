import Pedido from "../models/Pedido.js"
import Producto from "../models/Producto.js"
import { sendMailToPedido } from "../helpers/sendMail.js" // 👈 Corrección del string de importación

// 🛍️ CREAR UN NUEVO PEDIDO (Ruta Privada - Clientes Autenticados)
const crearPedido = async (req, res) => {
    try {
        const { productos, direccionEnvio } = req.body

        // 1. Validar que vengan productos y la dirección
        if (!productos || productos.length === 0) {
            return res.status(400).json({ msg: "El carrito de compras está vacío" })
        }
        if (!direccionEnvio || direccionEnvio.trim() === "") {
            return res.status(400).json({ msg: "La dirección de envío es obligatoria" })
        }

        let montoTotal = 0
        const productosParaGuardar = []
        const productosParaCorreo = [] // 📧 Lista estructurada con nombres para el HTML del email

        // 2. Recorrer los productos del carrito para validar Stock y Precios reales de la BDD
        for (const item of productos) {
            const productoBDD = await Producto.findById(item.producto)

            if (!productoBDD) {
                return res.status(404).json({ msg: `El producto con ID ${item.producto} no existe` })
            }

            // Validar si hay stock suficiente
            if (productoBDD.stock < item.cantidad) {
                return res.status(400).json({ 
                    msg: `Stock insuficiente para: ${productoBDD.nombre}. Disponibles: ${productoBDD.stock}` 
                })
            }

            // Calcular el subtotal acumulado
            montoTotal += productoBDD.precio * item.cantidad

            // Matriz para guardar en la colección de Pedidos (Estructura de MongoDB)
            productosParaGuardar.push({
                producto: productoBDD._id,
                cantidad: item.cantidad,
                precioAlComprar: productoBDD.precio // 💡 Congelamos el precio por seguridad
            })

            // Matriz con nombres legible para el formateador del correo electrónico
            productosParaCorreo.push({
                nombre: productoBDD.nombre,
                cantidad: item.cantidad,
                precioAlComprar: productoBDD.precio
            })

            // 3. Restar el stock del producto en la BDD y guardar el cambio
            productoBDD.stock -= item.cantidad
            await productoBDD.save()
        }

        // 4. Crear la instancia del pedido amarrado al usuario logueado
        const nuevoPedido = new Pedido({
            usuario: req.usuario._id,
            productos: productosParaGuardar,
            montoTotal,
            direccionEnvio: direccionEnvio.trim()
        })

        await nuevoPedido.save()

        // 📧 DISPARO DEL CORREO: Notificación automática con los datos consolidados
        // req.usuario.email se extrae de forma segura gracias a tu middleware verificarTokenJWT
        await sendMailToPedido(req.usuario.email, {
            productos: productosParaCorreo,
            montoTotal,
            direccionEnvio: direccionEnvio.trim()
        })

        return res.status(201).json({ 
            msg: "¡Pedido realizado con éxito! Se ha enviado el comprobante a tu correo 🎁", 
            nuevoPedido 
        })

    } catch (error) {
        console.error("ERROR AL CREAR PEDIDO:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor al procesar la compra" })
    }
}

// 👤 OBTENER HISTORIAL DE PEDIDOS DEL CLIENTE (Ruta Privada - Cliente)
const obtenerMisPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.find({ usuario: req.usuario._id })
            .populate("productos.producto", "nombre imagenUrl") 
            .sort({ createdAt: -1 }) 
            .lean()

        return res.status(200).json(pedidos)
    } catch (error) {
        console.error("ERROR MIS PEDIDOS:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// 👑 GESTIONAR PEDIDOS DESDE EL PANEL (Ruta Privada - Solo Admin)
const obtenerTodosLosPedidosAdmin = async (req, res) => {
    try {
        const pedidos = await Pedido.find()
            .populate("usuario", "nombre apellido email telefono") 
            .populate("productos.producto", "nombre")
            .sort({ createdAt: -1 })
            .lean()

        return res.status(200).json(pedidos)
    } catch (error) {
        console.error("ERROR PEDIDOS ADMIN:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// 👑 CAMBIAR ESTADO DEL PEDIDO (Ruta Privada - Solo Admin)
const actualizarEstadoPedido = async (req, res) => {
    try {
        const { id } = req.params
        const { estado } = req.body 

        const estadosValidos = ["Pendiente", "Pagado", "Enviado", "Entregado", "Cancelado"]
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ msg: "Estado de pedido no válido" })
        }

        const pedidoBDD = await Pedido.findById(id)
        if (!pedidoBDD) {
            return res.status(404).json({ msg: "Pedido no encontrado" })
        }

        // Si el pedido se cancela, devolvemos el stock automáticamente
        if (estado === "Cancelado" && pedidoBDD.estado !== "Cancelado") {
            for (const item of pedidoBDD.productos) {
                await Producto.findByIdAndUpdate(item.producto, {
                    $inc: { stock: item.cantidad } 
                })
            }
        }

        pedidoBDD.estado = estado
        await pedidoBDD.save()

        return res.status(200).json({ msg: `El pedido cambió a estado: ${estado}`, pedidoBDD })

    } catch (error) {
        console.error("ERROR ACTUALIZAR PEDIDO:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

export {
    crearPedido,
    obtenerMisPedidos,
    obtenerTodosLosPedidosAdmin,
    actualizarEstadoPedido
}