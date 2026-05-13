// Requerir módulos
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';



// Inicializaciones
const app = express()
dotenv.config()


// Configuraciones 



// Middlewares 
app.use(express.json())
app.use(cors())



// Variables globales
app.set('port',process.env.PORT || 3000)



// Rutas 
app.get('/',(req,res)=> res.send("Server on"))



// Exportar la instancia de express por medio de app
export default  app