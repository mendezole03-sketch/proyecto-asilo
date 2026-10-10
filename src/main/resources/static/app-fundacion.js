/* ==========================================================================
   CONFIGURACIÓN Y CONTROL DE SESIÓN (MÓDULO FUNDACIÓN)
   ========================================================================== */
const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado);

if (usuario.rol !== 'FUNDACION' && usuario.rol !== 'ADMIN' && usuario.rol !== 'ADMINISTRADOR') {
    window.location.href = 'index.html';
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Endpoints API
const API_URL_SOLICITUDES = 'http://localhost:8081/api/solicitudes';
const API_URL_USUARIOS = 'http://localhost:8081/api/usuarios';

let listaSolicitudesFundacion = [];

/* ==========================================================================
   UTILIDADES
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

function setButtonLoading(button, isLoading, originalText = 'Guardar') {
    if (!button) return;
    button.disabled = isLoading;
    button.innerHTML = isLoading 
        ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...` 
        : originalText;
}

function mostrarNombreUsuario() {
    const spanUsuario = document.getElementById('nombre-usuario-logueado');
    const infoUsuarioEl = document.getElementById('info-usuario');
    if (usuarioGuardado) {
        try {
            const usuarioObj = JSON.parse(usuarioGuardado);
            const texto = `👤 ${usuarioObj.nombre || 'Fundación'}`;
            if (spanUsuario) spanUsuario.textContent = texto;
            if (infoUsuarioEl) infoUsuarioEl.textContent = usuarioObj.nombre;
        } catch (e) {
            if (spanUsuario) spanUsuario.textContent = '👤 Fundación';
        }
    }
}

function aplicarLimitesFechas() {
    const hoy = new Date();
    const fechaHoyStr = hoy.toISOString().split('T')[0];
    const inputAgendarFecha = document.getElementById("agendar-fecha");
    if (inputAgendarFecha) {
        inputAgendarFecha.setAttribute("min", fechaHoyStr);
    }
}

/* ==========================================================================
   GESTIÓN DE SOLICITUDES Y CITAS MÉDICAS (FUNDACIÓN)
   ========================================================================== */

async function cargarSolicitudesFundacion() {
    const tbody = document.getElementById('tabla-solicitudes-body') || document.getElementById('tabla-solicitudes-fundacion-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';

    try {
        const solicitudes = await fetchData(API_URL_SOLICITUDES);
        listaSolicitudesFundacion = solicitudes || [];

        let pendientes = 0;
        let agendadas = 0;
        let canceladas = 0;

        tbody.innerHTML = '';

        if (listaSolicitudesFundacion.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hay solicitudes registradas.</td></tr>';
            actualizarMetricasFundacion(0, 0, 0);
            return;
        }

        const fragmento = document.createDocumentFragment();

        listaSolicitudesFundacion.forEach(sol => {
            const estado = sol.estado || 'PENDIENTE';
            if (estado === 'PENDIENTE') pendientes++;
            if (estado === 'AGENDADA') agendadas++;
            if (estado === 'CANCELADA') canceladas++;

            const idSolicitud = sol.idSolicitud || sol.id;
            const fechaHora = (sol.fechaCita && sol.horaCita) ? `${sol.fechaCita} - ${sol.horaCita}` : 'Sin asignar';
            
            let badgeEstado = '<span class="badge bg-warning text-dark">PENDIENTE</span>';
            if (estado === 'AGENDADA') {
                badgeEstado = '<span class="badge bg-success">AGENDADA</span>';
            } else if (estado === 'CANCELADA') {
                badgeEstado = '<span class="badge bg-danger">CANCELADA</span>';
            }

            const pacienteInactivo = sol.pacienteActivo === false || (sol.paciente && sol.paciente.activo === false);
            let botonesAccion = '';

            if (estado === 'PENDIENTE') {
                if (pacienteInactivo) {
                    botonesAccion = `
                        <span class="badge bg-secondary mb-1">Paciente Inactivo</span><br>
                        <button class="btn btn-sm btn-outline-danger me-1" onclick="abrirModalCancelar(${idSolicitud})">❌ Cancelar</button>
                    `;
                } else {
                    botonesAccion = `
                        <button class="btn btn-sm btn-primary me-1" onclick="abrirModalAgendar(${idSolicitud})">📅 Agendar</button>
                        <button class="btn btn-sm btn-outline-danger me-1" onclick="abrirModalCancelar(${idSolicitud})">❌ Cancelar</button>
                    `;
                }
            } else if (estado === 'AGENDADA') {
                if (pacienteInactivo) {
                    botonesAccion = `
                        <span class="badge bg-danger mb-1">⚠️ Dado de Baja</span><br>
                        <button class="btn btn-sm btn-danger fw-bold" onclick="abrirModalCancelar(${idSolicitud})">❌ Liberar Cita</button>
                    `;
                } else {
                    botonesAccion = `
                        <button class="btn btn-sm btn-outline-danger" onclick="abrirModalCancelar(${idSolicitud})">❌ Cancelar</button>
                    `;
                }
            } else {
                botonesAccion = `<span class="text-muted small">Sin acciones</span>`;
            }

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><span class="badge bg-secondary">#${escaparHTML(idSolicitud)}</span></td>
                <td><strong>${escaparHTML(sol.nombrePaciente || 'Sin Nombre')}</strong></td>
                <td><span class="badge bg-info text-dark">${escaparHTML(sol.medicoEspecialista || 'Especialidad')}</span></td>
                <td>${escaparHTML(sol.motivo || 'Sin motivo')}</td>
                <td>${escaparHTML(fechaHora)}</td>
                <td>${badgeEstado}</td>
                <td class="text-center">${botonesAccion}</td>
            `;
            fragmento.appendChild(fila);
        });

        tbody.appendChild(fragmento);
        actualizarMetricasFundacion(pendientes, agendadas, canceladas);

    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>';
    }
}

function actualizarMetricasFundacion(pendientes, agendadas, canceladas) {
    const elPendientes = document.getElementById('total-pendientes');
    const elAgendadas = document.getElementById('total-agendadas');
    const elCanceladas = document.getElementById('total-canceladas');

    if (elPendientes) elPendientes.textContent = pendientes;
    if (elAgendadas) elAgendadas.textContent = agendadas;
    if (elCanceladas) elCanceladas.textContent = canceladas;
}

async function abrirModalAgendar(idSolicitud) {
    const solicitud = listaSolicitudesFundacion.find(s => (s.idSolicitud || s.id) == idSolicitud);
    const pacienteInactivo = solicitud?.pacienteActivo === false || (solicitud?.paciente && solicitud?.paciente.activo === false);

    if (pacienteInactivo) {
        Swal.fire('Acción no permitida', 'El paciente ha sido dado de baja y no se le pueden agendar citas.', 'warning');
        return;
    }

    document.getElementById('agendar-idSolicitud').value = idSolicitud;
    const especialidadRequerida = solicitud?.medicoEspecialista || '';
    const selectMedico = document.getElementById('agendar-medico');

    if (selectMedico) {
        selectMedico.innerHTML = '<option value="" selected disabled>Cargando especialistas...</option>';
        try {
            const usuarios = await fetchData(API_URL_USUARIOS);
            const especialistasFiltrados = usuarios.filter(u => {
                const esEspecialista = u.rol && u.rol.toUpperCase() === 'MEDICO_ESPECIALISTA';
                const coincide = u.especialidad && u.especialidad.trim().toLowerCase() === especialidadRequerida.trim().toLowerCase();
                return esEspecialista && coincide;
            });

            selectMedico.innerHTML = '';
            if (especialistasFiltrados.length === 0) {
                selectMedico.innerHTML = `<option value="" disabled selected>No hay médicos para ${escaparHTML(especialidadRequerida)}</option>`;
            } else {
                selectMedico.innerHTML = `<option value="" selected disabled>-- Seleccione médico --</option>`;
                especialistasFiltrados.forEach(med => {
                    const option = document.createElement('option');
                    option.value = med.idUsuario || med.id;
                    option.textContent = `${med.nombre} (${med.especialidad})`;
                    selectMedico.appendChild(option);
                });
            }
        } catch (e) {
            selectMedico.innerHTML = '<option value="" disabled>Error al cargar especialistas</option>';
        }
    }

    aplicarLimitesFechas();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAgendar')).show();
}

async function guardarAgendamiento(evento) {
    if (evento) evento.preventDefault();

    const idSolicitud = document.getElementById('agendar-idSolicitud').value;
    const fecha = document.getElementById('agendar-fecha').value;
    const hora = document.getElementById('agendar-hora').value;
    const idMedicoEspecialista = document.getElementById('agendar-medico').value;

    if (!idMedicoEspecialista || !fecha || !hora) {
        Swal.fire('Atención', 'Complete todos los campos obligatorios para agendar.', 'warning');
        return;
    }

    const hoyStr = new Date().toISOString().split('T')[0];
    if (fecha < hoyStr) {
        Swal.fire('Atención', 'No se puede agendar una cita en el pasado.', 'warning');
        return;
    }

    // Validación de choque de horarios
    const choque = listaSolicitudesFundacion.some(sol => {
        const mismoMedico = sol.idMedicoEspecialista && String(sol.idMedicoEspecialista) === String(idMedicoEspecialista);
        return String(sol.idSolicitud || sol.id) !== String(idSolicitud) &&
               mismoMedico && sol.fechaCita === fecha && sol.horaCita === hora && sol.estado !== 'CANCELADA';
    });

    if (choque) {
        Swal.fire('Horario Ocupado', 'El médico ya tiene una cita asignada en esa fecha y hora.', 'warning');
        return;
    }

    const boton = document.querySelector('#form-agendar button[type="submit"]');
    const textoOriginal = boton ? boton.innerHTML : 'Confirmar';
    setButtonLoading(boton, true);

    try {
        await fetchData(`${API_URL_SOLICITUDES}/${idSolicitud}/agendar`, {
            method: 'PUT',
            body: JSON.stringify({ fechaCita: fecha, horaCita: hora, idMedicoEspecialista: parseInt(idMedicoEspecialista, 10), estado: 'AGENDADA' })
        });

        bootstrap.Modal.getInstance(document.getElementById('modalAgendar')).hide();
        document.getElementById('form-agendar').reset();
        Swal.fire('¡Éxito!', 'Cita agendada correctamente.', 'success');
        await cargarSolicitudesFundacion();
    } catch (error) {
        Swal.fire('Error', error.message || 'No se pudo agendar.', 'error');
    } finally {
        setButtonLoading(boton, false, textoOriginal);
    }
}

function abrirModalCancelar(idSolicitud) {
    document.getElementById('cancelar-idSolicitud').value = idSolicitud;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCancelar')).show();
}

async function guardarCancelacion(evento) {
    if (evento) evento.preventDefault();

    const idSolicitud = document.getElementById('cancelar-idSolicitud').value;
    const motivo = document.getElementById('cancelar-motivo').value.trim();

    if (!motivo) {
        Swal.fire('Atención', 'Ingrese el motivo de cancelación.', 'warning');
        return;
    }

    const boton = document.querySelector('#form-cancelar button[type="submit"]');
    const textoOriginal = boton ? boton.innerHTML : 'Confirmar';
    setButtonLoading(boton, true);

    try {
        await fetchData(`${API_URL_SOLICITUDES}/${idSolicitud}/cancelar`, {
            method: 'PUT',
            body: JSON.stringify({ motivoCancelacion: motivo, estado: 'CANCELADA' })
        });

        bootstrap.Modal.getInstance(document.getElementById('modalCancelar')).hide();
        document.getElementById('form-cancelar').reset();
        Swal.fire('Cancelada', 'La solicitud ha sido cancelada.', 'info');
        await cargarSolicitudesFundacion();
    } catch (error) {
        Swal.fire('Error', error.message || 'No se pudo cancelar.', 'error');
    } finally {
        setButtonLoading(boton, false, textoOriginal);
    }
}

/* ==========================================================================
   INICIALIZACIÓN MÓDULO FUNDACIÓN
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    mostrarNombreUsuario();
    aplicarLimitesFechas();

    const formAgendar = document.getElementById('form-agendar');
    if (formAgendar) formAgendar.addEventListener('submit', guardarAgendamiento);

    const formCancelar = document.getElementById('form-cancelar');
    if (formCancelar) formCancelar.addEventListener('submit', guardarCancelacion);

    // Forzar la carga de solicitudes independientemente del ID del tbody
    cargarSolicitudesFundacion();
});