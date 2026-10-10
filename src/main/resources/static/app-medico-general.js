/* ==========================================================================
   CONFIGURACIÓN Y CONTROL DE SESIÓN (MÉDICO GENERAL)
   ========================================================================== */
const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado);

if (usuario.rol !== 'MEDICO_GENERAL') {
    window.location.href = 'index.html';
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Endpoints API
const API_URL_PACIENTES = 'http://localhost:8081/api/pacientes';
const API_URL_USUARIOS = 'http://localhost:8081/api/usuarios';
const API_URL_SOLICITUDES = 'http://localhost:8081/api/solicitudes';

let listaPacientesGlobal = [];

/* ==========================================================================
   UTILIDADES Y HELPERS
   ========================================================================== */
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
        const error = new Error(errorText || `Error HTTP ${respuesta.status}`);
        error.status = respuesta.status;
        throw error;
    }
    const contentType = respuesta.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await respuesta.json();
    }
    return null;
}

function debounce(fn, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

function mostrarNombreUsuario() {
    const spanUsuario = document.getElementById('nombre-usuario-logueado');
    const infoUsuarioEl = document.getElementById('info-usuario');
    if (usuarioGuardado) {
        try {
            const usuarioObj = JSON.parse(usuarioGuardado);
            const texto = `👤 ${usuarioObj.nombre || usuarioObj.correo || 'Médico General'}`;
            if (spanUsuario) spanUsuario.textContent = texto;
            if (infoUsuarioEl) infoUsuarioEl.textContent = usuarioObj.nombre;
        } catch (e) {
            if (spanUsuario) spanUsuario.textContent = '👤 Médico General';
        }
    }
}

/* ==========================================================================
   GESTIÓN DE PACIENTES Y REMISIONES (MÉDICO GENERAL)
   ========================================================================== */
async function cargarPacientes() {
    const tbodies = document.querySelectorAll('.tabla-pacientes-body');
    tbodies.forEach(tbody => {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';
    });

    try {
        const respuesta = await fetchData(API_URL_PACIENTES);
        let idsPacientesRemitidos = new Set();
        try {
            const solicitudes = await fetchData(API_URL_SOLICITUDES);
            if (Array.isArray(solicitudes)) {
                solicitudes.forEach(sol => {
                    const idPac = sol.idPaciente || sol.pacienteId || (sol.paciente ? (sol.paciente.idPaciente || sol.paciente.id) : null);
                    if (idPac !== null) idsPacientesRemitidos.add(String(idPac));
                });
            }
        } catch (e) {
            console.warn('No se pudieron verificar solicitudes:', e);
        }

        listaPacientesGlobal = respuesta.filter(p => {
            if (!p.medico) return false;
            return (p.medico.idUsuario == usuario.idUsuario || p.medico.id == usuario.idUsuario || p.medico.correo === usuario.correo);
        }).map(p => {
            p.remitido = idsPacientesRemitidos.has(String(p.idPaciente || p.id));
            return p;
        });
        
        const tarjetaMedico = document.getElementById('total-pacientes-medico');
        if (tarjetaMedico) tarjetaMedico.textContent = listaPacientesGlobal.length;

        renderizarTablaMedico(listaPacientesGlobal);
    } catch (error) {
        console.error('Error al obtener pacientes del médico:', error);
    }
}

function renderizarTablaMedico(pacientes) {
    const tbodies = document.querySelectorAll('.tabla-pacientes-body');
    tbodies.forEach(tbody => {
        tbody.innerHTML = '';
        if (!pacientes || pacientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No tienes pacientes asignados.</td></tr>';
            return;
        }
        const fragmento = document.createDocumentFragment();
        pacientes.forEach(paciente => {
            const fila = document.createElement('tr');
            const idMostrar = paciente.idPaciente || paciente.id;
            const nombreSeguro = (paciente.nombre || '').replace(/'/g, "\\'");
            fila.innerHTML = `
                <td><span class="badge bg-secondary">#${escaparHTML(idMostrar)}</span></td>
                <td><strong>${escaparHTML(paciente.nombre)}</strong></td>
                <td>${escaparHTML(paciente.diagnosticoInicial || 'N/A')}</td>
                <td>${escaparHTML(paciente.familiar?.nombre || 'Sin asignar')}</td>
                <td>${escaparHTML(paciente.fechaIngreso || 'N/A')}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-info text-white me-1" onclick="verExpediente(${idMostrar})">👁️ Ver Expediente</button>
                    ${paciente.remitido ? 
                        `<button class="btn btn-sm btn-secondary fw-bold" disabled>⏳ Remitido</button>` : 
                        `<button class="btn btn-sm btn-warning fw-bold" onclick="abrirModalRemision(${idMostrar}, '${escaparHTML(nombreSeguro)}')">🏥 Remitir</button>`
                    }
                </td>
            `;
            fragmento.appendChild(fila);
        });
        tbody.appendChild(fragmento);
    });
}

function verExpediente(idPaciente) {
    const paciente = listaPacientesGlobal.find(p => (p.idPaciente || p.id) == idPaciente);
    if (!paciente) return;

    const contenedor = document.getElementById('contenido-expediente');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <p><strong>Paciente:</strong> ${escaparHTML(paciente.nombre)}</p>
                <p><strong>Fecha Nacimiento:</strong> ${escaparHTML(paciente.fechaNacimiento || 'N/A')}</p>
                <p><strong>Fecha Ingreso:</strong> ${escaparHTML(paciente.fechaIngreso || 'N/A')}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Familiar Responsable:</strong> ${escaparHTML(paciente.familiar?.nombre || 'N/A')}</p>
                <p><strong>Teléfono Familiar:</strong> ${escaparHTML(paciente.familiar?.telefono || 'N/A')}</p>
            </div>
            <hr>
            <div class="col-12">
                <p><strong>Diagnóstico Inicial:</strong></p>
                <div class="p-2 bg-light rounded">${escaparHTML(paciente.diagnosticoInicial || 'Sin diagnóstico')}</div>
            </div>
            <div class="col-12">
                <p><strong>Motivo de Reclusión:</strong></p>
                <div class="p-2 bg-light rounded">${escaparHTML(paciente.motivoReclusion || 'N/A')}</div>
            </div>
            <div class="col-md-6">
                <p><strong>Psicopatologías:</strong></p>
                <p class="text-primary">${escaparHTML(paciente.psicopatologias || 'Ninguna')}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Medicamentos de Cajón:</strong></p>
                <p class="text-success">${escaparHTML(paciente.medicamentosCajon || 'Ninguno')}</p>
            </div>
        </div>
    `;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalExpediente')).show();
}

async function cargarOpcionesRemision() {
    const selectEnfermero = document.getElementById('remision-enfermero');
    if (!selectEnfermero) return;

    try {
        const usuarios = await fetchData(API_URL_USUARIOS);
        const enfermeros = usuarios.filter(u => u.rol && u.rol.toUpperCase().includes('ENFERMER'));
        
        selectEnfermero.innerHTML = '<option value="" selected disabled>Seleccione un enfermero...</option>';
        enfermeros.forEach(enf => {
            const opt = document.createElement('option');
            opt.value = enf.idUsuario || enf.id;
            opt.textContent = enf.nombre;
            selectEnfermero.appendChild(opt);
        });
    } catch (e) {
        console.error('Error al cargar enfermeros:', e);
    }
}

async function abrirModalRemision(idPaciente, nombrePaciente) {
    document.getElementById('remision-id-paciente').value = idPaciente;
    document.getElementById('remision-nombre-paciente').value = nombrePaciente;
    await cargarOpcionesRemision();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalRemision')).show();
}

async function guardarRemision(evento) {
    if (evento) evento.preventDefault();

    const idPaciente = document.getElementById('remision-id-paciente').value;
    const especialidad = document.getElementById('remision-especialidad').value;
    const idEnfermero = document.getElementById('remision-enfermero').value;
    const motivo = document.getElementById('remision-motivo').value.trim();

    if (!especialidad || !idEnfermero || !motivo) {
        Swal.fire('Atención', 'Complete todos los campos de remisión.', 'warning');
        return;
    }

    const paciente = listaPacientesGlobal.find(p => (p.idPaciente || p.id) == idPaciente);
    const payload = {
        idPaciente: parseInt(idPaciente, 10),
        nombrePaciente: paciente.nombre,
        nombreFamiliar: paciente.familiar?.nombre || 'Familiar',
        correoFamiliar: paciente.familiar?.correo || '',
        medicoEspecialista: especialidad,
        idEnfermero: parseInt(idEnfermero, 10),
        motivo: motivo
    };

    try {
        await fetchData(API_URL_SOLICITUDES, { method: 'POST', body: JSON.stringify(payload) });
        bootstrap.Modal.getInstance(document.getElementById('modalRemision')).hide();
        Swal.fire('¡Éxito!', 'Remisión registrada correctamente.', 'success');
        await cargarPacientes();
    } catch (error) {
        Swal.fire('Error', error.message || 'No se pudo registrar la remisión.', 'error');
    }
}

function filtrarPacientes(texto) {
    const filtro = texto.toLowerCase().trim();
    const filtrados = listaPacientesGlobal.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(filtro)) ||
        (p.diagnosticoInicial && p.diagnosticoInicial.toLowerCase().includes(filtro))
    );
    renderizarTablaMedico(filtrados);
}

/* ==========================================================================
   INICIALIZACIÓN (MÉDICO GENERAL)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    mostrarNombreUsuario();

    const formRemision = document.getElementById('formRemision');
    if (formRemision) formRemision.addEventListener('submit', guardarRemision);

    document.querySelectorAll('.input-buscar-paciente').forEach(input => {
        input.addEventListener('input', debounce((e) => filtrarPacientes(e.target.value), 300));
    });

    cargarPacientes();
});