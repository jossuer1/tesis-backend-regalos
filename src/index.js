import connection from './database.js'
import app from './server.js'

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

// Conectar a MongoDB
connection()

// El servidor escucha en el puerto configurado
app.listen(app.get('port'), () => {
    console.log(`Server ok on http://localhost:${app.get('port')}`)
})