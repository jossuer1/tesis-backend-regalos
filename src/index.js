import connection from './database.js'
import app from './server.js'

// Conectar a MongoDB
connection()

// El servidor escucha en el puerto configurado
app.listen(app.get('port'), () => {
    console.log(`Server ok on http://localhost:${app.get('port')}`)
})