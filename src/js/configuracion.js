document.addEventListener('DOMContentLoaded', async () => {
    await cargarConfiguracion();

    document.getElementById('configForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarConfiguracion();
    });
});

async function cargarConfiguracion() {
    try {
        const config = await window.electronAPI.query('SELECT * FROM configuracion');
        console.log('CONFIG:', config);
        const get = clave => config.find(c => c.clave === clave)?.valor || '';

        document.getElementById('nombreComplejo').value = get('nombre_complejo');
        document.getElementById('direccionComplejo').value = get('direccion');

        // Días habilitados
        const dias = (get('dias_habilitados') || '').split(',');
        ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].forEach(dia => {
            document.getElementById('dia' + dia).checked = dias.includes(dia);
        });

        // Horario
        document.getElementById('horarioInicio').value = get('horario_inicio');
        document.getElementById('horarioFin').value = get('horario_fin');

        // Precios
        document.getElementById('precioBase').value = get('precio_base');
        document.getElementById('precioFeriado').value = get('precio_feriado');
        document.getElementById('precioNoche').value = get('precio_noche');

        // Métodos de pago
        const pagos = (get('metodos_pago') || '').split(',');
        ['Efectivo','Debito','Credito','MercadoPago','Transferencia'].forEach(metodo => {
            const id = 'pago' + metodo.replace('é','e').replace('í','i');
            const el = document.getElementById(id);
            if (el) el.checked = pagos.includes(metodo);
        });

        // Reportes
        document.getElementById('reporteFechaInicio').value = get('reporte_fecha_inicio');
        document.getElementById('reporteFechaFin').value = get('reporte_fecha_fin');
        document.getElementById('reporteHoraInicio').value = get('reporte_hora_inicio');
        document.getElementById('reporteHoraFin').value = get('reporte_hora_fin');
    } catch (error) {
        mostrarMensaje('Error al cargar configuración', 'danger');
    }
}

async function guardarConfiguracion() {
    try {
        // Recolectar datos
        const nombre = document.getElementById('nombreComplejo').value.trim();
        const direccion = document.getElementById('direccionComplejo').value.trim();

        // Días habilitados (sin tildes)
        const dias = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo']
            .filter(dia => document.getElementById('dia' + dia).checked)
            .join(',');

        const horarioInicio = document.getElementById('horarioInicio').value;
        const horarioFin = document.getElementById('horarioFin').value;

        const precioBase = document.getElementById('precioBase').value;
        const precioFeriado = document.getElementById('precioFeriado').value;
        const precioNoche = document.getElementById('precioNoche').value;

        // Métodos de pago (IDs y values iguales)
        const metodos = ['Efectivo','Debito','Credito','MercadoPago','Transferencia']
            .filter(metodo => {
                const id = 'pago' + metodo;
                const el = document.getElementById(id);
                return el && el.checked;
            }).join(',');

        const reporteFechaInicio = document.getElementById('reporteFechaInicio').value;
        const reporteFechaFin = document.getElementById('reporteFechaFin').value;
        const reporteHoraInicio = document.getElementById('reporteHoraInicio').value;
        const reporteHoraFin = document.getElementById('reporteHoraFin').value;

        // Guardar cada campo (upsert)
        const campos = [
            ['nombre_complejo', nombre],
            ['direccion', direccion],
            ['dias_habilitados', dias],
            ['horario_inicio', horarioInicio],
            ['horario_fin', horarioFin],
            ['precio_base', precioBase],
            ['precio_feriado', precioFeriado],
            ['precio_noche', precioNoche],
            ['metodos_pago', metodos],
            ['reporte_fecha_inicio', reporteFechaInicio],
            ['reporte_fecha_fin', reporteFechaFin],
            ['reporte_hora_inicio', reporteHoraInicio],
            ['reporte_hora_fin', reporteHoraFin]
        ];

        for (const [clave, valor] of campos) {
            await window.electronAPI.run(
                `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
                ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor`,
                [clave, valor]
            );
        }
        mostrarMensaje('Configuración guardada correctamente', 'success');
    } catch (error) {
        console.error('Error real al guardar configuración:', error);
        mostrarMensaje('Error al guardar configuración', 'danger');
    }
}

function mostrarMensaje(msg, tipo) {
    const div = document.createElement('div');
    div.className = `alert alert-${tipo} mt-3`;
    div.textContent = msg;
    document.querySelector('.main-content').prepend(div);
    setTimeout(() => div.remove(), 4000);
}