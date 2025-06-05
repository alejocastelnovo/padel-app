// Elementos del DOM
const listaCanchas = document.getElementById('listaCanchas');
const formNuevaCancha = document.getElementById('formNuevaCancha');
const btnGuardarCancha = document.getElementById('btnGuardarCancha');
const modalNuevaCancha = document.getElementById('modalNuevaCancha');
const bsModalNuevaCancha = new bootstrap.Modal(modalNuevaCancha);
const modalEditarCancha = document.getElementById('modalEditarCancha');
const bsModalEditarCancha = new bootstrap.Modal(modalEditarCancha);
const btnActualizarCancha = document.getElementById('btnActualizarCancha');

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
btnGuardarCancha.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Obtener el formulario y validar
    const form = document.getElementById('formNuevaCancha');
    form.classList.add('was-validated');
    
    if (!form.checkValidity()) {
        return;
    }

    try {
        const nombre = document.getElementById('nombreCancha').value.trim();
        const precioHora = document.getElementById('precioHora').value.trim();
        const tipo = document.getElementById('tipoCancha').value;

        const precioHoraNum = parseFloat(precioHora);
        
        // Validaciones adicionales
        if (!nombre || nombre.length < 3) {
            mostrarError('El nombre debe tener al menos 3 caracteres');
            return;
        }

        if (isNaN(precioHoraNum) || precioHoraNum <= 0) {
            mostrarError('El precio por hora debe ser un número válido mayor a 0');
            return;
        }

        if (!tipo) {
            mostrarError('Seleccione un tipo de cancha');
            return;
        }

        // Insertar en la base de datos
        const result = await window.electronAPI.run(
            'INSERT INTO canchas (nombre, precio_hora, tipo, activa) VALUES (?, ?, ?, 1)',
            [nombre, precioHoraNum, tipo]
        );

        // Limpiar y cerrar el modal
        form.reset();
        form.classList.remove('was-validated');
        bsModalNuevaCancha.hide();
        
        // Recargar canchas y mostrar mensaje de éxito
        await cargarCanchas();
        mostrarExito('Cancha agregada exitosamente');
    } catch (error) {
        console.error('Error al guardar cancha:', error);
        mostrarError('Error al guardar la cancha: ' + (error.message || 'Error desconocido'));
    }
});

// Agregar este event listener para limpiar el formulario cuando se cierre el modal
modalNuevaCancha.addEventListener('hidden.bs.modal', () => {
    const form = document.getElementById('formNuevaCancha');
    form.reset();
    form.classList.remove('was-validated');
});

modalEditarCancha.addEventListener('hidden.bs.modal', () => {
    const form = document.getElementById('formEditarCancha');
    form.reset();
    form.classList.remove('was-validated');
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

        // Cargar datos en el formulario
        document.getElementById('editarCanchaId').value = cancha.id;
        document.getElementById('editarNombreCancha').value = cancha.nombre;
        document.getElementById('editarPrecioHora').value = cancha.precio_hora;
        document.getElementById('editarTipoCancha').value = cancha.tipo;

        // Mostrar modal
        bsModalEditarCancha.show();
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
        const precioPromedio = canchas.length > 0 
            ? canchas.reduce((acc, curr) => acc + curr.precio_hora, 0) / canchas.length 
            : 0;
        document.getElementById('precioPromedio').textContent = `$${precioPromedio.toFixed(2)}`;
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
        mostrarError('Error al actualizar estadísticas');
    }
}

btnActualizarCancha.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const form = document.getElementById('formEditarCancha');
    form.classList.add('was-validated');
    
    if (!form.checkValidity()) {
        return;
    }

    try {
        const id = document.getElementById('editarCanchaId').value;
        const nombre = document.getElementById('editarNombreCancha').value.trim();
        const precioHora = document.getElementById('editarPrecioHora').value.trim();
        const tipo = document.getElementById('editarTipoCancha').value;

        const precioHoraNum = parseFloat(precioHora);
        
        // Validaciones
        if (!nombre || nombre.length < 3) {
            mostrarError('El nombre debe tener al menos 3 caracteres');
            return;
        }

        if (isNaN(precioHoraNum) || precioHoraNum <= 0) {
            mostrarError('El precio por hora debe ser un número válido mayor a 0');
            return;
        }

        if (!tipo) {
            mostrarError('Seleccione un tipo de cancha');
            return;
        }

        // Actualizar en la base de datos
        await window.electronAPI.run(
            'UPDATE canchas SET nombre = ?, precio_hora = ?, tipo = ? WHERE id = ?',
            [nombre, precioHoraNum, tipo, id]
        );

        // Cerrar modal y limpiar formulario
        form.reset();
        form.classList.remove('was-validated');
        bsModalEditarCancha.hide();
        
        // Recargar canchas y mostrar mensaje de éxito
        await cargarCanchas();
        mostrarExito('Cancha actualizada exitosamente');
    } catch (error) {
        console.error('Error al actualizar cancha:', error);
        mostrarError('Error al actualizar la cancha: ' + (error.message || 'Error desconocido'));
    }
});

