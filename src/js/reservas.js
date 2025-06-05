document.addEventListener('DOMContentLoaded', async () => {
    await cargarCanchasEnFiltro();
    setFechaHoy();
    await renderizarVistaDiaria();

    // Cargar métodos de pago configurados
    const config = await window.electronAPI.query("SELECT valor FROM configuracion WHERE clave = 'metodos_pago'");
    const metodos = config.length ? config[0].valor.split(',') : [];
    const selectMetodo = document.getElementById('reservaMetodoPago');
    selectMetodo.innerHTML = '';
    metodos.forEach(metodo => {
        const opt = document.createElement('option');
        opt.value = metodo;
        opt.textContent = metodo;
        selectMetodo.appendChild(opt);
    });

    // Navegación de fechas
    document.getElementById('btnDiaAnterior').onclick = () => cambiarDia(-1);
    document.getElementById('btnDiaSiguiente').onclick = () => cambiarDia(1);
    document.getElementById('btnHoy').onclick = () => setFechaHoy();
    document.getElementById('selectorFecha').onchange = renderizarVistaDiaria;
    document.getElementById('btnVistaDia').onclick = () => {
        renderizarVistaDiaria();
        document.getElementById('btnVistaDia').classList.add('active');
        document.getElementById('btnVistaSemana').classList.remove('active');
        document.getElementById('btnVistaMes').classList.remove('active');
    };
    document.getElementById('btnVistaSemana').onclick = () => {
        renderizarVistaSemanal();
        document.getElementById('btnVistaSemana').classList.add('active');
        document.getElementById('btnVistaDia').classList.remove('active');
        document.getElementById('btnVistaMes').classList.remove('active');
    };
    document.getElementById('btnVistaMes').onclick = () => {
        alert('La vista mensual estará disponible próximamente.');
    };
    document.getElementById('filtroCancha').onchange = renderizarVistaDiaria;
});

function setFechaHoy() {
    const hoy = new Date();
    document.getElementById('selectorFecha').value = hoy.toISOString().split('T')[0];
    renderizarVistaDiaria();
}

async function cargarCanchasEnFiltro() {
    const filtro = document.getElementById('filtroCancha');
    const canchas = await window.electronAPI.query('SELECT * FROM canchas WHERE activa = 1 ORDER BY nombre');
    filtro.innerHTML = `<option value="">Todas las canchas</option>`;
    canchas.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        filtro.appendChild(opt);
    });
}

async function renderizarVistaDiaria() {
    const fecha = document.getElementById('selectorFecha').value;
    const filtroCancha = document.getElementById('filtroCancha').value;
    const canchas = await window.electronAPI.query(
        filtroCancha
            ? 'SELECT * FROM canchas WHERE activa = 1 AND id = ? ORDER BY nombre'
            : 'SELECT * FROM canchas WHERE activa = 1 ORDER BY nombre',
        filtroCancha ? [filtroCancha] : []
    );
    // Horarios: de 8 a 24 hs, cada 1 hora
    const horarios = [];
    for (let h = 8; h < 24; h++) {
        horarios.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // Obtener reservas del día
    const reservas = await window.electronAPI.query(
        'SELECT * FROM reservas WHERE fecha = ?',
        [fecha]
    );

    // Renderizar tabla
    let html = `<div class="table-responsive"><table class="table table-bordered text-center align-middle">
        <thead><tr><th>Hora</th>`;
    canchas.forEach(c => {
        html += `<th>${c.nombre}</th>`;
    });
    html += `</tr></thead><tbody>`;

    horarios.forEach(hora => {
        html += `<tr><td><b>${hora}</b></td>`;
        canchas.forEach(cancha => {
            // Buscar si hay reserva en este horario y cancha
            const turno = reservas.find(r =>
                r.cancha_id === cancha.id &&
                r.hora_inicio === hora
            );
            if (turno) {
                let color = 'bg-primary text-white';
                if (turno.estado === 'cancelado') color = 'bg-danger text-white text-decoration-line-through';
                if (turno.estado === 'pagado') color = 'bg-success text-white';
                html += `<td class="${color}" style="cursor:pointer" title="${turno.cliente_nombre} - ${turno.cliente_telefono}" data-id="${turno.id}">
                    <div>${turno.cliente_nombre}</div>
                    <div style="font-size:0.9em">${turno.cliente_telefono}</div>
                </td>`;
            } else {
                html += `<td class="bg-light" style="cursor:pointer" data-cancha="${cancha.id}" data-hora="${hora}" title="Disponible">
                    <span class="text-success">Disponible</span>
                </td>`;
            }
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    document.getElementById('calendarioReservas').innerHTML = html;

    // Acción: crear reserva al hacer click en celda disponible
    document.querySelectorAll('#calendarioReservas td.bg-light').forEach(td => {
        td.onclick = () => {
            const canchaId = td.getAttribute('data-cancha');
            const hora = td.getAttribute('data-hora');
            // Aquí puedes abrir el modal de nueva reserva con canchaId, fecha y hora preseleccionados
            alert(`Reservar en cancha ${canchaId} a las ${hora} (${fecha})`);
            // TODO: abrir modal de reserva
        };
    });

    // Acción: editar/eliminar reserva al hacer click en celda ocupada
    document.addEventListener('click', async (e) => {
        if (e.target.closest('td.bg-primary, td.bg-success, td.bg-danger')) {
            const td = e.target.closest('td');
            const reservaId = td.getAttribute('data-id');
            if (!reservaId) return;
            const reserva = await window.electronAPI.queryOne('SELECT * FROM reservas WHERE id = ?', [reservaId]);
            if (!reserva) return;
            await abrirModalReserva({
                canchaId: reserva.cancha_id,
                fecha: reserva.fecha,
                hora: reserva.hora_inicio,
                reservaId: reserva.id
            });
            document.getElementById('reservaNombre').value = reserva.cliente_nombre;
            document.getElementById('reservaTelefono').value = reserva.cliente_telefono;
            document.getElementById('reservaNotas').value = reserva.notas || '';
            document.getElementById('reservaEstadoPago').value = reserva.estado || 'pendiente';
            document.getElementById('reservaMetodoPago').value = reserva.metodo_pago || metodos[0] || '';
        }
    });
}

async function cambiarDia(delta) {
    const input = document.getElementById('selectorFecha');
    const fecha = new Date(input.value);
    fecha.setDate(fecha.getDate() + delta);
    input.value = fecha.toISOString().split('T')[0];
    await renderizarVistaDiaria();
}

let modalReserva;
document.addEventListener('DOMContentLoaded', () => {
    modalReserva = new bootstrap.Modal(document.getElementById('modalReserva'));
});

async function abrirModalReserva({canchaId, fecha, hora, reservaId = null}) {
    // Cargar canchas en el select
    const canchas = await window.electronAPI.query('SELECT * FROM canchas WHERE activa = 1 ORDER BY nombre');
    const select = document.getElementById('reservaCancha');
    select.innerHTML = '';
    canchas.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        if (c.id == canchaId) opt.selected = true;
        select.appendChild(opt);
    });

    document.getElementById('reservaFecha').value = fecha;
    document.getElementById('reservaHora').value = hora;
    document.getElementById('reservaNombre').value = '';
    document.getElementById('reservaTelefono').value = '';
    document.getElementById('reservaNotas').value = '';
    document.getElementById('reservaEstadoPago').value = 'pendiente';
    document.getElementById('reservaId').value = reservaId || '';

    // Mostrar botón eliminar solo si es edición
    document.getElementById('btnEliminarReserva').style.display = reservaId ? 'inline-block' : 'none';
    modalReserva.show();
}

// Modifica el onclick de las celdas libres:
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', async (e) => {
        if (e.target.closest('td.bg-light')) {
            const td = e.target.closest('td.bg-light');
            const canchaId = td.getAttribute('data-cancha');
            const hora = td.getAttribute('data-hora');
            const fecha = document.getElementById('selectorFecha').value;
            await abrirModalReserva({canchaId, fecha, hora});
        }
    });
});

// Guardar o actualizar reserva al enviar el formulario
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formReserva').onsubmit = async (e) => {
        e.preventDefault();
        const reservaId = document.getElementById('reservaId').value;
        const canchaId = document.getElementById('reservaCancha').value;
        const fecha = document.getElementById('reservaFecha').value;
        const hora = document.getElementById('reservaHora').value;
        const nombre = document.getElementById('reservaNombre').value.trim();
        const telefono = document.getElementById('reservaTelefono').value.trim();
        const notas = document.getElementById('reservaNotas').value.trim();
        const estado = document.getElementById('reservaEstadoPago').value;
        // Al guardar o actualizar reserva
        const metodoPago = document.getElementById('reservaMetodoPago').value;

        if (reservaId) {
            // Actualizar reserva existente
            await window.electronAPI.run(
                `UPDATE reservas SET cancha_id=?, fecha=?, hora_inicio=?, hora_fin=?, cliente_nombre=?, cliente_telefono=?, estado=?, notas=?, metodo_pago=?
                 WHERE id=?`,
                [canchaId, fecha, hora, sumarUnaHora(hora), nombre, telefono, estado, notas, metodoPago, reservaId]
            );
        } else {
            // Crear nueva reserva
            await window.electronAPI.run(
                `INSERT INTO reservas (cancha_id, fecha, hora_inicio, hora_fin, cliente_nombre, cliente_telefono, estado, notas, metodo_pago)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [canchaId, fecha, hora, sumarUnaHora(hora), nombre, telefono, estado, notas, metodoPago]
            );
        }
        modalReserva.hide();
        await renderizarVistaDiaria();
    };
});

document.getElementById('btnEliminarReserva').onclick = async () => {
    const reservaId = document.getElementById('reservaId').value;
    if (reservaId && confirm('¿Seguro que deseas eliminar esta reserva?')) {
        await window.electronAPI.run('DELETE FROM reservas WHERE id = ?', [reservaId]);
        modalReserva.hide();
        await renderizarVistaDiaria();
    }
};

function sumarUnaHora(hora) {
    const [h, m] = hora.split(':').map(Number);
    const nueva = new Date(0,0,0,h,m);
    nueva.setHours(nueva.getHours() + 1);
    return nueva.toTimeString().slice(0,5);
}

document.addEventListener('DOMContentLoaded', () => {
    const btnNuevoTurno = document.getElementById('btnNuevoTurno');
    if (btnNuevoTurno) {
        btnNuevoTurno.addEventListener('click', async () => {
            // Por defecto, selecciona la primera cancha y el horario más próximo disponible
            const canchas = await window.electronAPI.query('SELECT * FROM canchas WHERE activa = 1 ORDER BY nombre');
            const canchaId = canchas.length > 0 ? canchas[0].id : '';
            const fecha = document.getElementById('selectorFecha').value;
            // Busca el primer horario disponible (puedes mejorar esto)
            const hora = "08:00";
            await abrirModalReserva({ canchaId, fecha, hora });
        });
    }
});

function getDiasSemana(fechaStr) {
    const fecha = new Date(fechaStr);
    // Lunes = 1, Domingo = 0
    const diaSemana = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1;
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() - diaSemana);
    const dias = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(lunes);
        d.setDate(lunes.getDate() + i);
        dias.push({
            fecha: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
        });
    }
    return dias;
}

async function renderizarVistaSemanal() {
    const fechaBase = document.getElementById('selectorFecha').value;
    const filtroCancha = document.getElementById('filtroCancha').value;
    const canchas = await window.electronAPI.query(
        filtroCancha
            ? 'SELECT * FROM canchas WHERE activa = 1 AND id = ? ORDER BY nombre'
            : 'SELECT * FROM canchas WHERE activa = 1 ORDER BY nombre',
        filtroCancha ? [filtroCancha] : []
    );
    const dias = getDiasSemana(fechaBase);

    // Horarios: de 8 a 24 hs, cada 1 hora
    const horarios = [];
    for (let h = 8; h < 24; h++) {
        horarios.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // Obtener todas las reservas de la semana
    const fechasSemana = dias.map(d => d.fecha);
    const reservas = await window.electronAPI.query(
        `SELECT * FROM reservas WHERE fecha IN (${fechasSemana.map(() => '?').join(',')})`,
        fechasSemana
    );

    // Renderizar tabla
    let html = `<div class="table-responsive"><table class="table table-bordered text-center align-middle">
        <thead><tr><th>Día/Hora</th>`;
    canchas.forEach(c => {
        html += `<th>${c.nombre}</th>`;
    });
    html += `</tr></thead><tbody>`;

    dias.forEach(dia => {
        horarios.forEach((hora, idx) => {
            html += `<tr${idx === 0 ? ` style="border-top:2px solid #333;"` : ''}><td><b>${dia.label} ${hora}</b></td>`;
            canchas.forEach(cancha => {
                const turno = reservas.find(r =>
                    r.cancha_id === cancha.id &&
                    r.fecha === dia.fecha &&
                    r.hora_inicio === hora
                );
                if (turno) {
                    let color = 'bg-primary text-white';
                    if (turno.estado === 'cancelado') color = 'bg-danger text-white text-decoration-line-through';
                    if (turno.estado === 'pagado') color = 'bg-success text-white';
                    html += `<td class="${color}" style="cursor:pointer" title="${turno.cliente_nombre} - ${turno.cliente_telefono}" data-id="${turno.id}">
                        <div>${turno.cliente_nombre}</div>
                        <div style="font-size:0.9em">${turno.cliente_telefono}</div>
                    </td>`;
                } else {
                    html += `<td class="bg-light" style="cursor:pointer" data-cancha="${cancha.id}" data-hora="${hora}" data-fecha="${dia.fecha}" title="Disponible">
                        <span class="text-success">Disponible</span>
                    </td>`;
                }
            });
            html += `</tr>`;
        });
    });

    html += `</tbody></table></div>`;
    document.getElementById('calendarioReservas').innerHTML = html;

    // Acción: crear reserva al hacer click en celda disponible
    document.querySelectorAll('#calendarioReservas td.bg-light').forEach(td => {
        td.onclick = () => {
            const canchaId = td.getAttribute('data-cancha');
            const hora = td.getAttribute('data-hora');
            const fecha = td.getAttribute('data-fecha');
            abrirModalReserva({canchaId, fecha, hora});
        };
    });

    // Acción: editar/eliminar reserva al hacer click en celda ocupada
    document.querySelectorAll('#calendarioReservas td.bg-primary, #calendarioReservas td.bg-success, #calendarioReservas td.bg-danger').forEach(td => {
        td.onclick = async () => {
            const reservaId = td.getAttribute('data-id');
            if (!reservaId) return;
            const reserva = await window.electronAPI.queryOne('SELECT * FROM reservas WHERE id = ?', [reservaId]);
            if (!reserva) return;
            await abrirModalReserva({
                canchaId: reserva.cancha_id,
                fecha: reserva.fecha,
                hora: reserva.hora_inicio,
                reservaId: reserva.id
            });
            document.getElementById('reservaNombre').value = reserva.cliente_nombre;
            document.getElementById('reservaTelefono').value = reserva.cliente_telefono;
            document.getElementById('reservaNotas').value = reserva.notas || '';
            document.getElementById('reservaEstadoPago').value = reserva.estado || 'pendiente';
            document.getElementById('reservaMetodoPago').value = reserva.metodo_pago || '';
        };
    });
}