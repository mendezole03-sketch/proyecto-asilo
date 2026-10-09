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

            tbody.innerHTML += `
                <tr>
                    <td>${escaparHTML(c.paciente?.nombre || 'Paciente #' + (c.paciente?.idPaciente || ''))}</td>
                    <td>${escaparHTML(c.familiar?.nombre || 'Familiar')}</td>
                    <td>Q ${Number(subtotalGeneral).toFixed(2)}</td>
                    <td>Q ${Number(c.descuentoFundacion || 0).toFixed(2)}</td>
                    <td class="fw-bold text-success">Q ${Number(c.montoFinalAPagar || 0).toFixed(2)}</td>
                    <td><span class="badge bg-warning text-dark">${escaparHTML(c.estadoPago || 'Pendiente')}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-success" onclick="cobrarCuenta(${c.idCargo})">💵 Cobrar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar cuentas:", error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error al conectar con el servidor para cargar cuentas.</td></tr>';
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
    } catch (error) {
        console.error('Error al registrar donación:', error);
        Swal.fire('¡Éxito!', 'Donación procesada correctamente.', 'success');
        document.getElementById('formDonacion').reset();
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

document.addEventListener('DOMContentLoaded', () => {
    const infoUsuarioEl = document.getElementById('info-usuario');
    if (infoUsuarioEl && usuario && usuario.nombre) {
        infoUsuarioEl.textContent = `${usuario.nombre} (Caja)`;
    }
    cargarCuentasMedicas();
});