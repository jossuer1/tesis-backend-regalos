import stripe from "../config/stripe.js"
import Pedido from "../models/Pedido.js"


const crearSesionPago = async (req, res) => {
    try {
        const { id } = req.params

        const pedidoBDD = await Pedido.findById(id).populate("productos.producto", "nombre")
        if (!pedidoBDD) {
            return res.status(404).json({ msg: "Pedido no encontrado" })
        }

        // Verificar que el pedido pertenece al usuario logueado
        if (pedidoBDD.usuario.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({ msg: "Este pedido no te pertenece" })
        }

        if (pedidoBDD.estado !== "Pendiente") {
            return res.status(400).json({ msg: `Este pedido ya está en estado "${pedidoBDD.estado}", no se puede pagar` })
        }

        // Armar los line_items que Stripe necesita a partir de los productos guardados
        const line_items = pedidoBDD.productos.map((item) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.producto?.nombre || "Producto"
                },
                unit_amount: Math.round(item.precioAlComprar * 100) // Stripe trabaja en centavos
            },
            quantity: item.cantidad
        }))

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items,
            // A dónde Stripe redirige al usuario después de pagar (o cancelar)
            success_url: `${process.env.URL_FRONTEND}pago-exitoso?pedido=${pedidoBDD._id}`,
            cancel_url: `${process.env.URL_FRONTEND}pago-cancelado?pedido=${pedidoBDD._id}`,
            customer_email: req.usuario.email,
            // Guardamos el ID del pedido para poder identificarlo cuando llegue el webhook
            metadata: {
                pedidoId: pedidoBDD._id.toString()
            }
        })

        return res.status(200).json({ url: session.url })

    } catch (error) {
        console.error("ERROR AL CREAR SESIÓN DE PAGO:", error)
        return res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}


const webhookStripe = async (req, res) => {
    const sig = req.headers["stripe-signature"]
    let event

    try {
        // req.body debe llegar como Buffer "crudo" (raw), no como JSON parseado,
        // por eso en server.js esta ruta usa express.raw() en vez de express.json()
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
        console.error("ERROR VERIFICANDO FIRMA DEL WEBHOOK:", error.message)
        return res.status(400).send(`Webhook Error: ${error.message}`)
    }

    // Nos interesa el evento de que el Checkout se completó y el pago fue exitoso
    if (event.type === "checkout.session.completed") {
        const session = event.data.object
        const pedidoId = session.metadata?.pedidoId

        try {
            const pedidoBDD = await Pedido.findById(pedidoId)

            if (pedidoBDD && pedidoBDD.estado === "Pendiente") {
                pedidoBDD.estado = "Pagado"
                await pedidoBDD.save()
                console.log(`✅ Pedido ${pedidoId} marcado como Pagado (webhook Stripe)`)
            }
        } catch (error) {
            console.error("ERROR ACTUALIZANDO PEDIDO DESDE WEBHOOK:", error)
            // Igual respondemos 200 para que Stripe no siga reintentando indefinidamente
            // por un error nuestro; el log queda para revisar manualmente.
        }
    }

    return res.status(200).json({ received: true })
}

export {
    crearSesionPago,
    webhookStripe
}
