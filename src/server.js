// Requerir módulos
import 'dotenv/config';
import express from 'express'
import cors from 'cors';

// Importación de todos tus enrutadores
import routerUsuario from './routers/usuario_route.js'
import routerTienda from './routers/tienda_route.js' 
import routerPedidos from './routers/pedido_route.js'
import routerIA from './routers/ia_route.js'

// Inicializaciones
const app = express()

// Middlewares -C
app.use(express.json())
app.use(cors())
// Variables globales y de entorno
// usar el puerto de la variable de entorno si existe, sino usar el 3000
app.set('port', process.env.PORT || 3000)

// Rutas 
app.get('/', (req, res) => res.send("Server on"))



//  Enlazamos todas las rutas de tu negocio con el prefijo /api
app.use('/api/usuarios', routerUsuario)  // /api/registro, /api/login, /api/perfil
app.use('/api/tienda', routerTienda)   // /api/productos, /api/categorias
app.use('/api/compras', routerPedidos) // /api/compras/pedidos, /api/compras/admin/pedidos
app.use('/api/ia', routerIA)       // /api/ia/recomendar
// Exportar la instancia de express por medio de app
export default app