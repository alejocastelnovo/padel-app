const db = require('./database.js');

document.addEventListener('DOMContentLoaded', () => {
    console.log('¡App cargada!');
    loadCanchas();
});

function loadCanchas() {
    db.all("SELECT * FROM canchas", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        const appDiv = document.getElementById('app');

        rows.forEach(cancha => {
            appDiv.innerHTML += `
            <div class="col-md-4 mb-4">
              <div class="card shadow-sm">
                <div class="card-body">
                  <h5 class="card-title">${cancha.nombre}</h5>
                  <p class="card-text">
                    <span class="badge bg-info">
                      ${cancha.techo || 'N/A'}
                    </span>
                    <br>Precio: $${cancha.precio_hora}/hora
                  </p>
                  <button class="btn btn-primary btn-reservar" data-id="${cancha.id}">
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          `;
        });
    });
}