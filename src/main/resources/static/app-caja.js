/* ==========================================================================
   CONFIGURACIÓN Y CONTROL DE SESIÓN - CAJA Y FINANZAS
   ========================================================================== */
const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado || '{}');

function cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

const API_URL_BASE = 'http://localhost:8081';
const API_URL_CAJA = `${API_URL_BASE}/api/caja`; 
const API_URL_DONACIONES = `${API_URL_BASE}/api/donaciones`; 
const API_URL_GASTOS = `${API_URL_BASE}/api/gastos`;         

function escaparHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function fetchData(url, options = {}) {
    const defaultHeaders = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

    const config = { ...options, headers: { ...defaultHeaders, ...options.headers } };
    const respuesta = await fetch(url, config);
    if (!respuesta.ok) {
        const errorText = await respuesta.text();
        throw new Error(errorText || `Error HTTP ${respuesta.status}`);
    }
    const contentType = respuesta.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await respuesta.json();
    }
    return null;
}

/* ==========================================================================
   FUNCIONES DE CARGA Y REGISTRO (CONECTADAS AL BACKEND)
   ========================================================================== */

async function cargarCuentasMedicas() {
    const tbody = document.getElementById('tablaCuentasMedicas');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';

    try {
        // Petición real al backend para listar cuentas por cobrar
        const cuentas = await fetchData(`${API_URL_CAJA}/cuentas`);
        
        tbody.innerHTML = '';
        if (!cuentas || cuentas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hay cuentas pendientes de cobro.</td></tr>';
            return;
        }

        cuentas.forEach(c => {
            // Sumamos los subtotales de consulta, exámenes y medicamentos que vienen de la base de datos
            const subtotalConsulta = Number(c.subtotalConsulta || 0);
            const subtotalExamenes = Number(c.subtotalExamenes || 0);
            const subtotalMedicamentos = Number(c.subtotalMedicamentos || 0);
            const subtotalGeneral = subtotalConsulta + subtotalExamenes + subtotalMedicamentos;

            // Verificamos si la cuenta ya se encuentra pagada (compatible con 'Pagado' o 'PAGADO')
            const esPagado = c.estadoPago && c.estadoPago.toLowerCase() === 'pagado';

            // Definimos dinámicamente el botón y el color de la insignia según el estado
            let botonAccion = '';
            if (esPagado) {
                botonAccion = `<button class="btn btn-sm btn-secondary" disabled>✔️ Pagado</button>`;
            } else {
                botonAccion = `<button class="btn btn-sm btn-success" onclick="cobrarCuenta(${c.idCargo})">💵 Cobrar</button>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${escaparHTML(c.paciente?.nombre || 'Paciente #' + (c.paciente?.idPaciente || ''))}</td>
                    <td>${escaparHTML(c.familiar?.nombre || 'Familiar')}</td>
                    <td>Q ${Number(subtotalGeneral).toFixed(2)}</td>
                    <td>Q ${Number(c.descuentoFundacion || 0).toFixed(2)}</td>
                    <td class="fw-bold text-success">Q ${Number(c.montoFinalAPagar || 0).toFixed(2)}</td>
                    <td><span class="badge ${esPagado ? 'bg-success' : 'bg-warning text-dark'}">${escaparHTML(c.estadoPago || 'Pendiente')}</span></td>
                    <td class="text-center">
                        ${botonAccion}
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar cuentas:", error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error al conectar con el servidor para cargar cuentas.</td></tr>';
    }
}

async function registrarGasto(evento) {
    evento.preventDefault();

    const gastoPayload = {
        concepto: document.getElementById('conceptosGasto').value.trim(),
        monto: parseFloat(document.getElementById('montoGasto').value),
        comprobante: document.getElementById('comprobanteGasto').value.trim()
    };

    try {
        await fetchData(API_URL_GASTOS, {
            method: 'POST',
            body: JSON.stringify(gastoPayload)
        });

        Swal.fire('¡Éxito!', 'Gasto operativo registrado y guardado correctamente.', 'success');
        document.getElementById('formGasto').reset();
    } catch (error) {
        console.error('Error al registrar gasto:', error);
        Swal.fire('¡Éxito!', 'Gasto operativo registrado correctamente.', 'success');
        document.getElementById('formGasto').reset();
    }
}

/* ==========================================================================
   FUNCIÓN PARA PROCESAR EL COBRO DE LA CUENTA
   ========================================================================== */
async function cobrarCuenta(idCargo) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas marcar esta cuenta médica como Pagada?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Sí, cobrar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await fetchData(`${API_URL_CAJA}/cuentas/${idCargo}/pagar`, {
                method: 'PUT'
            });

            Swal.fire({
                icon: 'success',
                title: '¡Cobro realizado!',
                text: 'La cuenta ha sido marcada como Pagada con éxito.',
                timer: 1500,
                showConfirmButton: false
            });

            cargarCuentasMedicas();

        } catch (error) {
            console.error("Error al procesar el cobro:", error);
            Swal.fire('Error', 'No se pudo procesar el pago en el servidor.', 'error');
        }
    }
}

/* ==========================================================================
   FUNCIONES DE DONACIONES (CARGAR Y REGISTRAR)
   ========================================================================== */
async function cargarHistorialDonaciones() {
    const tbody = document.getElementById('tablaDonaciones');
    if (!tbody) return;

    try {
        const donaciones = await fetchData(API_URL_DONACIONES);
        tbody.innerHTML = '';

        if (!donaciones || donaciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No hay donaciones registradas.</td></tr>';
            return;
        }

        donaciones.forEach(d => {
            tbody.innerHTML += `
                <tr>
                    <td><span class="badge bg-info text-dark">${escaparHTML(d.tipoDonante)}</span></td>
                    <td>${escaparHTML(d.nombreDonante)}</td>
                    <td class="fw-bold text-success">Q ${Number(d.monto || 0).toFixed(2)}</td>
                    <td>${escaparHTML(d.fechaDonacion || '')}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar historial de donaciones:", error);
    }
}

async function registrarDonacion(evento) {
    evento.preventDefault();

    const donacionPayload = {
        tipoDonante: document.getElementById('tipoDonante').value,
        nombreDonante: document.getElementById('nombreDonante').value.trim(),
        monto: parseFloat(document.getElementById('montoDonacion').value),
        descripcion: document.getElementById('descDonacion').value.trim()
    };

    try {
        await fetchData(API_URL_DONACIONES, {
            method: 'POST',
            body: JSON.stringify(donacionPayload)
        });

        Swal.fire('¡Éxito!', 'Donación registrada y guardada correctamente.', 'success');
        document.getElementById('formDonacion').reset();
        
        // Refrescar la tabla de la derecha automáticamente
        cargarHistorialDonaciones();

    } catch (error) {
        console.error('Error al registrar donación:', error);
        Swal.fire('Error', 'No se pudo registrar la donación en el servidor.', 'error');
    }
}
/* ==========================================================================
   FUNCIONES DE GASTOS Y EGRESOS (CARGAR Y REGISTRAR)
   ========================================================================== */
async function cargarHistorialGastos() {
    const tbody = document.getElementById('tablaGastos');
    if (!tbody) return;

    try {
        const gastos = await fetchData(API_URL_GASTOS);
        tbody.innerHTML = '';

        if (!gastos || gastos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No hay gastos registrados.</td></tr>';
            return;
        }

        gastos.forEach(g => {
            tbody.innerHTML += `
                <tr>
                    <td>${escaparHTML(g.concepto)}</td>
                    <td><span class="badge bg-secondary">${escaparHTML(g.comprobante || 'S/N')}</span></td>
                    <td class="fw-bold text-danger">Q ${Number(g.monto || 0).toFixed(2)}</td>
                    <td>${escaparHTML(g.fechaGasto || '')}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar historial de gastos:", error);
    }
}

async function registrarGasto(evento) {
    evento.preventDefault();

    const gastoPayload = {
        concepto: document.getElementById('conceptosGasto').value.trim(),
        monto: parseFloat(document.getElementById('montoGasto').value),
        comprobante: document.getElementById('comprobanteGasto').value.trim(),
        registradoPor: usuario.nombre || 'Administrador' // Envía el nombre del usuario logueado
    };

    try {
        await fetchData(API_URL_GASTOS, {
            method: 'POST',
            body: JSON.stringify(gastoPayload)
        });

        Swal.fire('¡Éxito!', 'Gasto operativo registrado y guardado correctamente.', 'success');
        document.getElementById('formGasto').reset();
        
        // Refrescar la tabla de fiscalización de la derecha automáticamente
        cargarHistorialGastos();

    } catch (error) {
        console.error('Error al registrar gasto:', error);
        Swal.fire('Error', 'No se pudo registrar el gasto en el servidor.', 'error');
    }
}

/* ==========================================================================
   INICIALIZACIÓN AL CARGAR LA PÁGINA
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const infoUsuarioEl = document.getElementById('info-usuario');
    if (infoUsuarioEl && usuario && usuario.nombre) {
        infoUsuarioEl.textContent = `${usuario.nombre} (Caja)`;
    }
    cargarCuentasMedicas();
    cargarHistorialDonaciones();
    cargarHistorialGastos();
});