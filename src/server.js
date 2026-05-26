// Requerir módulos
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';
import { swaggerDocs } from "./config/swagger.js"

dotenv.config()


// todo lo que se importe abajo (incluyendo las rutas) ya pueda leer el .env


// Ahora sí cargamos el router de forma segura
import router from './routers/usuario_route.js'

// Inicializaciones
const app = express()

// Configuraciones 

// Middlewares -C
app.use(express.json())
app.use(cors())
// Variables globales y de entorno
// usar el puerto de la variable de entorno si existe, sino usar el 3000
app.set('port', process.env.PORT || 3000)

// Rutas 
app.get('/', (req, res) => res.send("Server on"))

swaggerDocs(app)


// Enlazamos el router con el prefijo /api
app.use('/api', router)

// Exportar la instancia de express por medio de app
export default app