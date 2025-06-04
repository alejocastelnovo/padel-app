// Elementos del DOM
const listaCanchas = document.getElementById('listaCanchas');
const formNuevaCancha = document.getElementById('formNuevaCancha');
const btnGuardarCancha = document.getElementById('btnGuardarCancha');

// Cargar canchas al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarCanchas();
        console.log('Canchas cargadas correctamente');
    } catch (error) {
        console.error('Error al inicializar:', error);
        mostrarError('Error al inicializar la aplicación');
    }
});

// Función para cargar las canchas
async function cargarCanchas() {
    try {
        console.log('Intentando cargar canchas...');
        const canchas = await window.electronAPI.query('SELECT * FROM canchas WHERE activa = 1 ORDER BY nombre');
        console.log('Canchas obtenidas:', canchas);
        
        listaCanchas.innerHTML = '';
        
        if (!canchas || canchas.length === 0) {
            listaCanchas.innerHTML = `
                <div class="alert alert-info">
                    No hay canchas registradas. ¡Agrega una nueva cancha!
                </div>
            `;
        } else {
            canchas.forEach(cancha => {
                const card = crearCardCancha(cancha);
                listaCanchas.appendChild(card);
            });
        }
        
        // Actualizar estadísticas
        await actualizarEstadisticas();
    } catch (error) {
        console.error('Error al cargar canchas:', error);
        mostrarError('Error al cargar las canchas');
        throw error;
    }
}

// Función para crear una card de cancha
function crearCardCancha(cancha) {
    const div = document.createElement('div');
    div.className = 'court-status-card';
    div.innerHTML = `
        <div class="court-card-body">
            <div class="court-info">
                <h5 class="card-title mb-2">${cancha.nombre}</h5>
                <p class="card-subtitle mb-2 text-muted">
                    ${cancha.tipo === 'outdoor' ? 'Outdoor' : 'Indoor'} - 
                    $${cancha.precio_hora}/hora
                </p>
            </div>
            <div class="court-actions">
                <button class="btn btn-court-action btn-ver-turnos" onclick="verTurnos(${cancha.id})">
                    <i class="fas fa-calendar"></i> Ver Turnos
                </button>
                <button class="btn btn-court-action btn-editar" onclick="editarCancha(${cancha.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-court-action btn-eliminar" onclick="eliminarCancha(${cancha.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
    return div;
}

// Función para guardar una nueva cancha
btnGuardarCancha.addEventListener('click', async () => {
    try {
        const nombre = document.getElementById('nombreCancha').value.trim();
        const precioHora = document.getElementById('precioHora').value.trim();
        const tipo = document.getElementById('tipoCancha').value;

        if (!nombre || !precioHora || !tipo) {
            mostrarError('Por favor complete todos los campos');
            return;
        }

        const precioHoraNum = parseFloat(precioHora);
        if (isNaN(precioHoraNum) || precioHoraNum <= 0) {
            mostrarError('El precio por hora debe ser un número válido mayor a 0');
            return;
        }

        const result = await window.electronAPI.run(
            'INSERT INTO canchas (nombre, precio_hora, tipo) VALUES (?, ?, ?)',
            [nombre, precioHoraNum, tipo]
        );

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaCancha'));
        modal.hide();
        formNuevaCancha.reset();
        await cargarCanchas();
        mostrarExito('Cancha guardada exitosamente');
    } catch (error) {
        console.error('Error al guardar cancha:', error);
        mostrarError('Error al guardar la cancha: ' + error.message);
    }
});

// Función para mostrar errores
function mostrarError(mensaje) {
    console.error('Error:', mensaje);
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.main-content').insertBefore(alertDiv, document.querySelector('.main-content').firstChild);
    
    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Función para mostrar mensajes de éxito
function mostrarExito(mensaje) {
    console.log('Éxito:', mensaje);
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.main-content').insertBefore(alertDiv, document.querySelector('.main-content').firstChild);
    
    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Funciones para las acciones de las canchas
window.verTurnos = (id) => {
    // Implementaremos esto más adelante
    console.log('Ver turnos de cancha:', id);
};

window.editarCancha = async (id) => {
    try {
        console.log('Intentando editar cancha:', id);
        const cancha = await window.electronAPI.queryOne('SELECT * FROM canchas WHERE id = ?', [id]);
        if (!cancha) {
            mostrarError('Cancha no encontrada');
            return;
        }
        // Implementaremos el modal de edición más adelante
        console.log('Cancha encontrada:', cancha);
    } catch (error) {
        console.error('Error al obtener cancha:', error);
        mostrarError('Error al cargar la cancha: ' + error.message);
    }
};

window.eliminarCancha = async (id) => {
    if (confirm('¿Está seguro de que desea eliminar esta cancha?')) {
        try {
            console.log('Intentando eliminar cancha:', id);
            const result = await window.electronAPI.run('UPDATE canchas SET activa = 0 WHERE id = ?', [id]);
            console.log('Resultado de eliminar cancha:', result);
            await cargarCanchas();
            mostrarExito('Cancha eliminada exitosamente');
        } catch (error) {
            console.error('Error al eliminar cancha:', error);
            mostrarError('Error al eliminar la cancha: ' + error.message);
        }
    }
};

// Función para actualizar estadísticas
async function actualizarEstadisticas() {
    try {
        const canchas = await window.electronAPI.query('SELECT * FROM canchas WHERE activa = 1');
        
        // Total de canchas
        document.getElementById('totalCanchas').textContent = canchas.length;
        
        // Canchas indoor y outdoor
        const indoor = canchas.filter(c => c.tipo === 'cerrada').length;
        const outdoor = canchas.filter(c => c.tipo === 'abierta').length;
        document.getElementById('totalIndoor').textContent = indoor;
        document.getElementById('totalOutdoor').textContent = outdoor;
        
        // Precio promedio
        const precioPromedio = canchas.reduce((acc, curr) => acc + curr.precio_hora, 0) / canchas.length;
        document.getElementById('precioPromedio').textContent = `$${precioPromedio.toFixed(2)}`;
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
    }
}