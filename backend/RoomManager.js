class RoomManager {
    constructor() {
        this.salas = [
            { id: 0, nombre: "Biblioteca", proposito: "Estudio Silencioso" },
            { id: 1, nombre: "Laboratorio", proposito: "Prácticas y Actividades" },
            { id: 2, nombre: "Sala de Descanso", proposito: "Relajación y Siestas" },
            { id: 3, nombre: "Estudio Compartido", proposito: "Reuniones Académicas" },
            { id: 4, nombre: "Sala de Ocio", proposito: "Descanso y Diversión" }
        ];

        // Inicializamos los asientos: 5 salas x 36 asientos x 5 días x 12 horas
        this.asientos = {};
        for (let s = 0; s < 5; s++) {
            this.asientos[s] = {};
            for (let a = 1; a <= 36; a++) {
                this.asientos[s][a] = this.crearHorarioVacio();
            }
        }
    }

    crearHorarioVacio() {
        let horario = [];
        for (let dia = 0; dia < 5; dia++) {
            horario[dia] = new Array(12).fill(false); // false = libre
        }
        return horario;
    }

    consultarMapa(salaId, dia, hora) {
        let mapa = [];
        for (let a = 1; a <= 36; a++) {
            mapa.push({
                id: a,
                ocupado: this.asientos[salaId][a][dia][hora]
            });
        }
        return mapa;
    }

    // Node.js es single-threaded, por lo que estas operaciones son atómicas naturalmente
    procesarReserva(salaId, asiento, dia, horaInicio, duracion, esReserva) {
        // Validación de límites
        if (salaId < 0 || salaId > 4 || asiento < 1 || asiento > 36 || horaInicio + duracion > 12) {
            return false;
        }

        let horarioAsiento = this.asientos[salaId][asiento];

        // Verificar disponibilidad previa
        for (let i = 0; i < duracion; i++) {
            let estadoActual = horarioAsiento[dia][horaInicio + i];
            if (esReserva && estadoActual === true) return false; // Ya ocupado
            if (!esReserva && estadoActual === false) return false; // No estaba reservado
        }

        // Aplicar cambios
        for (let i = 0; i < duracion; i++) {
            horarioAsiento[dia][horaInicio + i] = esReserva;
        }
        return true;
    }
}

module.exports = new RoomManager();