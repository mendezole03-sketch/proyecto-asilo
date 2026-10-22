/* ==========================================================================
   CONFIGURACIÓN Y CONTROL DE SESIÓN - ENFERMERÍA
   ========================================================================== */
const usuarioGuardado = localStorage.getItem('usuario');

// Si no hay sesión iniciada, redirige al login
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
const API_URL_ENFERMERIA = `${API_URL_BASE}/api/enfermeria`; // Endpoint para la agenda de enfermería

let listaAsignacionesGlobal = []; // Variable global para almacenar los datos y filtrarlos localmente

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
   RENDERIZAR TABLA DE AGENDA
   ========================================================================== */
function renderizarTabla(asignaciones) {
    const tbody = document.getElementById('tabla-agenda-enfermero');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay turnos o pacientes registrados con este filtro.</td></tr>';
        return;
    }

    asignaciones.forEach(a => {
        const estadoStr = (a.estado || 'Pendiente').toLowerCase();
        
        // Estilo dinámico del badge según el estado exacto
        let badgeClase = 'bg-warning text-dark'; // Por defecto Pendiente
        if (estadoStr === 'completado' || estadoStr === 'completada' || estadoStr === 'atendido') {
            badgeClase = 'bg-success';
        } else if (estadoStr === 'programado') {
            badgeClase = 'bg-primary';
        }

        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">#${escaparHTML(a.idSolicitud || a.id || 'N/A')}</td>
                <td>${escaparHTML(a.paciente?.nombre || a.nombrePaciente || 'Paciente')}</td>
                <td><span class="badge bg-info text-dark">${escaparHTML(a.turnoAsignado || a.turno || 'Sin Asignar')}</span></td>
                <td><span class="badge ${badgeClase}">${escaparHTML(a.estado || 'Pendiente')}</span></td>
            </tr>
        `;
    });
}

/* ==========================================================================
   CARGA DE AGENDA Y PACIENTES ASIGNADOS
   ========================================================================== */
async function cargarAgendaEnfermero() {
    const tbody = document.getElementById('tabla-agenda-enfermero');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border text-success" role="status"></div></td></tr>';

    try {
        const idEnfermero = usuario.idEnfermero || usuario.idUsuario || usuario.id;
        const asignaciones = await fetchData(`${API_URL_ENFERMERIA}/agenda/${idEnfermero}`);

        // Guardamos los datos globalmente
        listaAsignacionesGlobal = asignaciones || [];
        
        // CAMBIO: En lugar de renderizar todo, aplicamos el filtro por defecto para "Pendientes"
        const btnPendiente = document.getElementById('btn-pendiente');
        filtrarEstado('Pendiente', btnPendiente);

    } catch (error) {
        console.error("Error al cargar agenda del enfermero:", error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Error al conectar con el servidor para cargar la agenda.</td></tr>';
    }
}

/* ==========================================================================
   FUNCIÓN DE FILTRADO POR ESTADO (CONECTADA CON LOS BOTONES HTML)
   ========================================================================== */
function filtrarEstado(estadoDeseado, botonElemento) {
    // Remover la clase 'active' de todos los botones y ponérsela al presionado
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    if (botonElemento) {
        botonElemento.classList.add('active');
    }

    if (estadoDeseado === 'TODOS') {
        renderizarTabla(listaAsignacionesGlobal);
        return;
    }

    // Filtrar la lista global comparando el estado (sin importar mayúsculas/minúsculas)
    const filtrados = listaAsignacionesGlobal.filter(item => {
        const estItem = (item.estado || 'Pendiente').toLowerCase();
        return estItem === estadoDeseado.toLowerCase();
    });

    renderizarTabla(filtrados);
}

/* ==========================================================================
   INICIALIZACIÓN AL CARGAR LA PÁGINA
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const nombreEnfermeroEl = document.getElementById('nombre-enfermero-logueado');
    if (nombreEnfermeroEl && usuario) {
        nombreEnfermeroEl.textContent = usuario.nombre ? `Enf. ${usuario.nombre}` : 'Enfermero';
    }

    // Cargar la lista de asignaciones desde el backend
    cargarAgendaEnfermero();
});