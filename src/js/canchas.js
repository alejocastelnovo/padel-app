const { ipcRenderer } = require('electron');
const db = require('./database.js');

document.addEventListener('DOMContentLoaded', () => {
    // Botón para agregar nueva cancha
    const btnNuevaCancha = document.getElementById('btnNuevaCancha');
    const contenedorCanchas = document.getElementById('contenedorCanchas');

    btnNuevaCancha.addEventListener('click', () => {
        // Crear el formulario modal para nueva cancha
        const modalHtml = `
            <div class="modal fade" id="modalNuevaCancha" tabindex="-1" aria-labelledby="modalNuevaCanchaLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalNuevaCanchaLabel">Nueva Cancha</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formNuevaCancha">
                                <div class="mb-3">
                                    <label for="nombreCancha" class="form-label">Nombre de la Cancha</label>
                                    <input type="text" class="form-control" id="nombreCancha" required>
                                </div>
                                <div class="mb-3">
                                    <label for="tipoCancha" class="form-label">Tipo de Cancha</label>
                                    <select class="form-select" id="tipoCancha" required>
                                        <option value="indoor">Indoor</option>
                                        <option value="outdoor">Outdoor</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="precioHora" class="form-label">Precio por Hora</label>
                                    <input type="number" class="form-control" id="precioHora" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnGuardarCancha">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar el modal al DOM si no existe
        if (!document.getElementById('modalNuevaCancha')) {
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('modalNuevaCancha'));
        modal.show();

        // Manejar el guardado de la nueva cancha
        document.getElementById('btnGuardarCancha').addEventListener('click', () => {
            const formNuevaCancha = document.getElementById('formNuevaCancha');
            const nombreCancha = document.getElementById('nombreCancha').value;
            const tipoCancha = document.getElementById('tipoCancha').value;
            const precioHora = document.getElementById('precioHora').value;

            if (nombreCancha && tipoCancha && precioHora) {
                // Insertar en la base de datos
                db.run(
                    'INSERT INTO canchas (nombre, tipo, precio_hora) VALUES (?, ?, ?)',
                    [nombreCancha, tipoCancha, precioHora],
                    function(err) {
                        if (err) {
                            console.error('Error al guardar la cancha:', err);
                            return;
                        }

                        // Crear y agregar la nueva tarjeta de cancha al contenedor
                        const nuevaCanchaHtml = `
                            <div class="col-md-4 mb-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">${nombreCancha}</h5>
                                        <p class="card-text">Tipo: ${tipoCancha}</p>
                                        <p class="card-text">Precio: $${precioHora}/hora</p>
                                        <button class="btn btn-primary btn-reservar" data-cancha-id="${this.lastID}">Reservar</button>
                                    </div>
                                </div>
                            </div>
                        `;
                        contenedorCanchas.insertAdjacentHTML('beforeend', nuevaCanchaHtml);

                        // Cerrar el modal
                        modal.hide();
                        formNuevaCancha.reset();
                    }
                );
            }
        });
    });

    // Cargar canchas existentes al iniciar
    cargarCanchas();
});

// Función para cargar las canchas existentes
function cargarCanchas() {
    const contenedorCanchas = document.getElementById('contenedorCanchas');
    
    db.all('SELECT * FROM canchas', [], (err, canchas) => {
        if (err) {
            console.error('Error al cargar las canchas:', err);
            return;
        }

        contenedorCanchas.innerHTML = '';
        canchas.forEach(cancha => {
            const canchaHtml = `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${cancha.nombre}</h5>
                            <p class="card-text">Tipo: ${cancha.tipo}</p>
                            <p class="card-text">Precio: $${cancha.precio_hora}/hora</p>
                            <button class="btn btn-primary btn-reservar" data-cancha-id="${cancha.id}">Reservar</button>
                        </div>
                    </div>
                </div>
            `;
            contenedorCanchas.insertAdjacentHTML('beforeend', canchaHtml);
        });
    });
}