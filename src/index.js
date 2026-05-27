import app from './server.js'
import connection from './database.js'



// Conectar a MongoDB
connection()

// El servidor escucha en el puerto configurado
app.listen(app.get('port'), () => {
    console.log(`Server ok on http://localhost:${app.get('port')}`)
})