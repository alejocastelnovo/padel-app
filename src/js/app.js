const db = require('./database.js');

function loadCanchas() {
    db.all("SELECT * FROM canchas", (err, rows) => {
        if (err) throw err;
        const container = document.getElementById('canchas');

        rows.forEach(cancha => {
            const card = `
        <div class="col-md-3 mb-4">
    <div class="card">
            <div class="card-body">
                <h5>${cancha.nombre}</h5>
                <p>Precio: $${cancha.precio_hora}/h</p>
                <button onclick="reservarCancha(${cancha.id})" class="btn btn-primary">Reservar</button>
            </div>
            </div>
    </div>
      `;
            container.innerHTML += card;
        });
    });
}

window.onload = loadCanchas;