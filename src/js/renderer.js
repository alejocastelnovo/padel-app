const db = require('./database.js');

document.addEventListener('DOMContentLoaded', () => {
    // Cargar canchas al inicio
    cargarCanchas();

    // Eventos de navegación
    document.getElementById('verCanchas').addEventListener('click', (e) => {
        e.preventDefault();
        cargarCanchas();
    });

    document.getElementById('verReservas').addEventListener('click', (e) => {
        e.preventDefault();
        mostrarReservas();
    });

    document.getElementById('configuracion').addEventListener('click', (e) => {
        e.preventDefault();
        mostrarConfiguracion();
    });
});

function cargarCanchas() {
    const contenedor = document.getElementById('canchasGrid');
    contenedor.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

    db.all("SELECT * FROM canchas", (err, canchas) => {
        if (err) {
            console.error(err);
            contenedor.innerHTML = '<div class="alert alert-danger">Error al cargar las canchas</div>';
            return;
        }

        if (canchas.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12 text-center">
                    <p>No hay canchas configuradas</p>
                    <button class="btn btn-primary" onclick="mostrarConfiguracion()">Configurar Canchas</button>
                </div>`;
            return;
        }

        contenedor.innerHTML = '';
        canchas.forEach(cancha => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            card.innerHTML = `
                <div class="card cancha-card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${cancha.nombre}</h5>
                        <p class="card-text">
                            <span class="badge bg-${cancha.techo === 'cerrada' ? 'info' : 'warning'}">
                                ${cancha.techo}
                            </span>
                        </p>
                        <p class="card-text">Precio: $${cancha.precio_hora}/hora</p>
                        <button class="btn btn-primary w-100" onclick="mostrarReserva(${cancha.id})">Reservar</button>
                    </div>
                </div>`;
            contenedor.appendChild(card);
        });
    });
}

function mostrarReservas() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
        <h2 class="mb-4">Reservas</h2>
        <div class="calendario-reservas">
            <p class="text-muted">Implementación del calendario de reservas pendiente...</p>
        </div>`;
}

function mostrarConfiguracion() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
        <div class="config-form">
            <h2 class="mb-4">Configuración</h2>
            <form id="configForm">
                <div class="mb-3">
                    <label class="form-label">Nombre del Complejo</label>
                    <input type="text" class="form-control" id="nombreComplejo" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Logo</label>
                    <input type="file" class="form-control" id="logoComplejo">
                </div>
                <button type="submit" class="btn btn-primary">Guardar Configuración</button>
            </form>
        </div>`;
}