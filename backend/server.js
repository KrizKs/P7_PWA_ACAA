const express = require('express');
const cors = require('cors');
const roomManager = require('./RoomManager');

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors()); // Permite que el frontend (en otro puerto) haga peticiones
app.use(express.json()); // Permite recibir datos en formato JSON

// Ruta 1: Obtener las salas disponibles
app.get('/api/salas', (req, res) => {
    res.json(roomManager.salas);
});

// Ruta 2: Consultar disponibilidad de una sala específica
app.get('/api/disponibilidad/:salaId/:dia/:hora', (req, res) => {
    const { salaId, dia, hora } = req.params;
    const mapa = roomManager.consultarMapa(parseInt(salaId), parseInt(dia), parseInt(hora));
    res.json(mapa);
});

// Ruta 3: Realizar o cancelar una reserva
app.post('/api/gestion', (req, res) => {
    const { accion, salaId, asiento, dia, horaInicio, duracion } = req.body;
    
    const esReserva = accion === 'RESERVAR';
    const exito = roomManager.procesarReserva(salaId, asiento, dia, horaInicio, duracion, esReserva);

    if (exito) {
        res.json({ success: true, message: `Operación ${accion} completada con éxito.` });
    } else {
        res.status(400).json({ success: false, message: `Conflicto detectado al ${accion.toLowerCase()}.` });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de Web Services escuchando en http://localhost:${PORT}`);
});