import Stripe from "stripe"

// Instancia única de Stripe usando la clave secreta del .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default stripe
