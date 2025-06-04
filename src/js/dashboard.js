// Elementos del DOM
const infoComplejo = document.getElementById('infoComplejo');
const resumenReservasHoy = document.getElementById('resumenReservasHoy');
const resumenCanchasDisponibles = document.getElementById('resumenCanchasDisponibles');
const resumenIngresos = document.getElementById('resumenIngresos');
const resumenOcupacion = document.getElementById('resumenOcupacion');
const estadoCanchas = document.getElementById('estadoCanchas');

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarDatosDashboard();
        inicializarGraficos();
    } catch (error) {
        console.error('Error al inicializar el dashboard:', error);
        mostrarError('Error al cargar el dashboard');
    }
});

// Función para cargar los datos del dashboard
async function cargarDatosDashboard() {
    try {
        // Cargar información del complejo
        const config = await window.electronAPI.query('SELECT * FROM configuracion WHERE clave IN ("nombre_complejo", "direccion")');
        const nombreComplejo = config.find(c => c.clave === 'nombre_complejo')?.valor || 'Complejo de Pádel';
        const direccion = config.find(c => c.clave === 'direccion')?.valor || 'Sin dirección especificada';
        infoComplejo.textContent = `${nombreComplejo} - ${direccion}`;

        // Cargar resumen de reservas hoy
        const hoy = new Date().toISOString().split('T')[0];
        const reservasHoy = await window.electronAPI.query(
            'SELECT COUNT(*) as total FROM reservas WHERE fecha = ?',
            [hoy]
        );
        resumenReservasHoy.textContent = reservasHoy[0]?.total || 0;

        // Cargar canchas disponibles
        const canchasDisponibles = await window.electronAPI.query(
            'SELECT COUNT(*) as total FROM canchas WHERE activa = 1'
        );
        resumenCanchasDisponibles.textContent = canchasDisponibles[0]?.total || 0;

        // Cargar estado de canchas
        const canchas = await window.electronAPI.query('SELECT * FROM canchas WHERE activa = 1');
        estadoCanchas.innerHTML = '';
        canchas.forEach(cancha => {
            const card = crearCardEstadoCancha(cancha);
            estadoCanchas.appendChild(card);
        });

    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        throw error; // Re-lanzar el error para manejarlo en el nivel superior
    }
}

// Función para crear una card de estado de cancha
function crearCardEstadoCancha(cancha) {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.width = '200px';
    div.innerHTML = `
        <div class="card-body">
            <h6 class="card-title">${cancha.nombre}</h6>
            <p class="card-text text-muted mb-0">
                ${cancha.tipo === 'abierta' ? 'Outdoor' : 'Indoor'}
            </p>
            <div class="mt-2">
                <span class="badge bg-success">Disponible</span>
            </div>
        </div>
    `;
    return div;
}

// Función para mostrar errores
function mostrarError(mensaje) {
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

// Función para inicializar los gráficos
function inicializarGraficos() {
    try {
        // Gráfico de ocupación semanal
        const ctxOcupacion = document.getElementById('ocupacionChart').getContext('2d');
        new Chart(ctxOcupacion, {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Ocupación',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Gráfico de ingresos mensuales
        const ctxIngresos = document.getElementById('ingresosChart').getContext('2d');
        new Chart(ctxIngresos, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Ingresos',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true
            }
        });
    } catch (error) {
        console.error('Error al inicializar gráficos:', error);
        mostrarError('Error al cargar los gráficos');
    }
} 