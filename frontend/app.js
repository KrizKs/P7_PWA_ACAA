// Registro del Service Worker para la caché de contenido (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registrado con éxito:', registration.scope);
            })
            .catch(error => {
                console.log('Fallo al registrar el Service Worker:', error);
            });
    });
}

const API_URL = 'http://localhost:5000/api';

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    cargarHoras('sel-hora-consulta');
    cargarHoras('sel-hora-form');
    await cargarSalas();
});

// Llenar selects de hora (8 a 19 hrs)
function cargarHoras(elementId) {
    const select = document.getElementById(elementId);
    for (let i = 0; i < 12; i++) {
        let horaReal = i + 8;
        select.innerHTML += `<option value="${i}">${horaReal}:00 hrs</option>`;
    }
}

// Obtener catálogo de salas mediante GET
async function cargarSalas() {
    try {
        const response = await fetch(`${API_URL}/salas`);
        const salas = await response.json();
        
        // NUEVA VALIDACIÓN: Si no es un arreglo (ej. es el error del Service Worker)
        if (!Array.isArray(salas)) {
            let opcionOffline = '<option value="">Modo sin conexión (Salas no disponibles)</option>';
            document.getElementById('sel-sala-consulta').innerHTML = opcionOffline;
            document.getElementById('sel-sala-form').innerHTML = opcionOffline;
            return; // Detenemos la ejecución aquí para evitar el TypeError
        }
        
        let opciones = '';
        salas.forEach(sala => {
            opciones += `<option value="${sala.id}">${sala.nombre} (${sala.proposito})</option>`;
        });
        
        document.getElementById('sel-sala-consulta').innerHTML = opciones;
        document.getElementById('sel-sala-form').innerHTML = opciones;
    } catch (error) {
        console.error("Error al cargar salas (¿El backend está encendido?):", error);
    }
}

// Navegación de interfaz
function mostrarPantalla(idPantalla) {
    document.querySelectorAll('.pantalla').forEach(p => {
        p.classList.remove('activa');
        p.classList.add('oculta');
    });
    document.getElementById(idPantalla).classList.remove('oculta');
    document.getElementById(idPantalla).classList.add('activa');
    
    if(idPantalla === 'pantalla-menu') {
        document.getElementById('mapa-container').classList.add('oculta');
    }
}

function prepararFormulario(accion) {
    document.getElementById('titulo-formulario').innerText = accion === 'RESERVAR' ? 'Realizar Reservación' : 'Cancelar Reservación';
    document.getElementById('input-accion').value = accion;
    mostrarPantalla('pantalla-formulario');
}

// GET: Consultar y Dibujar Mapa
async function consultarMapa() {
    const salaId = document.getElementById('sel-sala-consulta').value;
    const dia = document.getElementById('sel-dia-consulta').value;
    const hora = document.getElementById('sel-hora-consulta').value;

    // NUEVA VALIDACIÓN: Prevenir peticiones mal formadas si estamos offline
    if (salaId === "") {
        mostrarAlerta("Estás en modo sin conexión. No se puede consultar el mapa.", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/disponibilidad/${salaId}/${dia}/${hora}`);
        const mapa = await response.json();
        
        // Si el Service worker nos devuelve el mensaje de error en vez del mapa
        if (mapa.success === false) {
            mostrarAlerta(mapa.message, "error");
            return;
        }
        
        const grid = document.getElementById('grid-asientos');
        grid.innerHTML = ''; // Limpiar mapa anterior
        
        mapa.forEach(asiento => {
            const div = document.createElement('div');
            div.className = `seat ${asiento.ocupado ? 'ocupado' : ''}`;
            div.innerText = asiento.ocupado ? 'X' : asiento.id;
            grid.appendChild(div);
        });

        document.getElementById('mapa-container').classList.remove('oculta');
    } catch (error) {
        mostrarAlerta("Error de conexión al consultar el mapa.", "error");
    }
}

// POST: Enviar petición de reserva/cancelación
async function enviarGestion(event) {
    event.preventDefault(); // Evitar que la página se recargue

    const payload = {
        accion: document.getElementById('input-accion').value,
        salaId: parseInt(document.getElementById('sel-sala-form').value),
        asiento: parseInt(document.getElementById('input-asiento').value),
        dia: parseInt(document.getElementById('sel-dia-form').value),
        horaInicio: parseInt(document.getElementById('sel-hora-form').value),
        duracion: parseInt(document.getElementById('input-duracion').value)
    };

    try {
        const response = await fetch(`${API_URL}/gestion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (response.ok) {
            // Reemplazo del alert de éxito
            mostrarAlerta(result.message, "exito");
            document.getElementById('form-gestion').reset();
            mostrarPantalla('pantalla-menu');
        } else {
            // Reemplazo del alert de error
            mostrarAlerta(result.message, "error");
        }
    } catch (error) {
        // Reemplazo del alert de caída del servidor
        mostrarAlerta("No se pudo conectar con el servidor web.", "error");
    }
}

function mostrarAlerta(mensaje, tipo) {
    const modal = document.getElementById('modal-alerta');
    const titulo = document.getElementById('modal-titulo');
    const texto = document.getElementById('modal-mensaje');
    const contenido = document.querySelector('.modal-contenido');

    // Limpiamos estilos anteriores
    contenido.classList.remove('modal-exito', 'modal-error');
    texto.innerText = mensaje;

    // Configuramos el estilo según el tipo de alerta
    if (tipo === 'exito') {
        titulo.innerText = '¡Éxito!';
        contenido.classList.add('modal-exito');
    } else {
        titulo.innerText = 'Atención';
        contenido.classList.add('modal-error');
    }

    // Mostramos el modal
    modal.classList.remove('oculta');
    modal.classList.add('activa');
}

function cerrarAlerta() {
    const modal = document.getElementById('modal-alerta');
    modal.classList.remove('activa');
    modal.classList.add('oculta');
}