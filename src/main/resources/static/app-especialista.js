/* ==========================================================================
   CONFIGURACIÓN Y CONTROL DE SESIÓN - MÉDICO ESPECIALISTA
   ========================================================================== */
const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado || '{}');

// Seguridad de acceso por rol
if (usuario.rol !== 'MEDICO_ESPECIALISTA' && usuario.rol !== 'ADMIN') {
    window.location.href = 'index.html';
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Endpoints API Backend
const API_URL_BASE = 'http://localhost:8081';
const API_URL_SOLICITUDES = `${API_URL_BASE}/api/solicitudes`;
const API_URL_PACIENTES = `${API_URL_BASE}/api/pacientes`;
const API_URL_VISITAS = `${API_URL_BASE}/api/visitas`;
const API_URL_EXAMENES = `${API_URL_BASE}/api/examenes`;

let listaSolicitudesEspecialista = [];
let pacienteActualSeleccionado = null;

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

    const config = {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    };

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

/* ==========================================================================
   CARGA DE CITAS AGENDADAS PARA EL ESPECIALISTA
   ========================================================================== */
async function cargarCitasEspecialista() {
    const tbody = document.getElementById('tabla-citas-especialista-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';

    try {
        const solicitudes = await fetchData(API_URL_SOLICITUDES);
        
        // Datos disponibles en sesión
        const nombreUsuario = String(usuario.nombre || '').toUpperCase().trim();
        const idUsuarioSesion = usuario.idUsuario || usuario.id || usuario.id_usuario || usuario.idMedico;
        const especialidadUsuario = String(usuario.especialidad || '').toUpperCase().trim();

        console.log("=== DATOS DISPONIBLES ===");
        console.log("Nombre Médico:", nombreUsuario);
        console.log("Especialidad:", especialidadUsuario);
        console.log("Solicitudes recibidas:", solicitudes);

        listaSolicitudesEspecialista = (solicitudes || []).filter(s => {
            const estado = String(s.estado || '').toUpperCase();
            if (estado === 'COMPLETADA' || estado === 'CANCELADA' || estado === 'FINALIZADA') {
                return false;
            }

            const idMedSolicitud = s.idMedicoEspecialista || s.id_medico_especialista || s.idMedico;
            const espSolicitud = String(s.especialidad || s.tipoEspecialidad || s.nombreEspecialidad || '').toUpperCase().trim();
            const nombreMedSolicitud = String(s.nombreMedico || s.medico || '').toUpperCase().trim();

            // 1. Filtrar por ID de médico (Si el backend lo incluye)
            if (idUsuarioSesion && idMedSolicitud && String(idMedSolicitud) === String(idUsuarioSesion)) {
                return true;
            }

            // 2. Filtrar por Especialidad (Si el usuario en localStorage la incluye)
            if (especialidadUsuario !== '' && espSolicitud !== '') {
                if (espSolicitud.includes(especialidadUsuario) || especialidadUsuario.includes(espSolicitud)) {
                    return true;
                }
            }

            // 3. Coincidencia por Nombre del Médico asignado a la cita
            if (nombreUsuario !== '' && nombreMedSolicitud !== '') {
                if (nombreMedSolicitud.includes(nombreUsuario) || nombreUsuario.includes(nombreMedSolicitud)) {
                    return true;
                }
            }

            // 4. Si el usuario es ADMIN, ve todas las citas
            if (usuario.rol === 'ADMIN') {
                return true;
            }

            return false;
        });

        tbody.innerHTML = '';

        if (listaSolicitudesEspecialista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No tiene citas agendadas asignadas a su perfil o especialidad.</td></tr>';
            return;
        }

        const fragmento = document.createDocumentFragment();

        listaSolicitudesEspecialista.forEach(sol => {
            const idSol = sol.idSolicitud || sol.id_solicitud || sol.id;
            const nombrePac = sol.nombrePaciente || sol.nombre_paciente || 'Paciente #' + (sol.idPaciente || '');
            const motivoText = sol.motivo || sol.observaciones || 'Sin motivo registrado';
            
            const fecha = sol.fechaCita || sol.fecha_cita || sol.fecha || '';
            const hora = sol.horaCita || sol.hora_cita || sol.hora || '';
            const fechaLimpia = fecha.includes('T') ? fecha.split('T')[0] : fecha.split(' ')[0];
            const fechaHora = (fechaLimpia || hora) ? `${fechaLimpia} ${hora}`.trim() : 'Pendiente de fecha';

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><span class="badge bg-secondary">#${escaparHTML(idSol)}</span></td>
                <td><strong>${escaparHTML(nombrePac)}</strong></td>
                <td>${escaparHTML(motivoText)}</td>
                <td><span class="badge bg-info text-dark">${escaparHTML(fechaHora)}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-success fw-bold" onclick="abrirModalConsulta(${idSol})">
                        <i class="bi bi-stethoscope me-1"></i> Atender Paciente
                    </button>
                </td>
            `;
            fragmento.appendChild(fila);
        });

        tbody.appendChild(fragmento);

    } catch (error) {
        console.error('Error al cargar citas del especialista:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>';
    }
}

/* ==========================================================================
   CONSULTA DE RESULTADOS DE LABORATORIO
   ========================================================================== */
async function cargarLaboratoriosDeVisita(idVisita) {
    const contenedor = document.getElementById('contenedor-laboratorios-modal');
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Consultando exámenes de laboratorio...';

    try {
        const examenes = await fetchData(`${API_URL_EXAMENES}/visita/${idVisita}`);

        if (examenes && examenes.length > 0) {
            let html = `
                <div class="table-responsive">
                    <table class="table table-sm table-bordered align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Examen</th>
                                <th>Estado</th>
                                <th>Resultado</th>
                            </tr>
                        </thead>
                        <tbody>`;

            examenes.forEach(ex => {
                let badgeClass = 'bg-warning text-dark';
                if (ex.estado === 'REALIZADO') badgeClass = 'bg-success';
                if (ex.estado === 'CANCELADO') badgeClass = 'bg-danger';

                html += `
                    <tr>
                        <td><strong>${escaparHTML(ex.nombreExamen || 'Sin Nombre')}</strong></td>
                        <td><span class="badge ${badgeClass}">${escaparHTML(ex.estado || 'ORDENADO')}</span></td>
                        <td>${escaparHTML(ex.resultado || 'Resultado no registrado aún')}</td>
                    </tr>`;
            });

            html += `</tbody></table></div>`;
            contenedor.innerHTML = html;
        } else {
            contenedor.innerHTML = '<div class="alert alert-light border text-muted py-2 small mb-0">No hay exámenes de laboratorio registrados para esta cita.</div>';
        }

    } catch (error) {
        console.error("Error al cargar exámenes de laboratorio:", error);
        contenedor.innerHTML = '<div class="alert alert-danger py-2 small mb-0">No se pudieron cargar los datos del laboratorio.</div>';
    }
}

/* ==========================================================================
   ATENCIÓN DE CONSULTA Y VER EXPEDIENTE
   ========================================================================== */

async function abrirModalConsulta(idSolicitud) {
    const sol = listaSolicitudesEspecialista.find(s => (s.idSolicitud || s.id_solicitud || s.id) == idSolicitud);
    if (!sol) {
        Swal.fire('Error', 'No se encontró la información de la cita.', 'error');
        return;
    }

    const idSolActual = sol.idSolicitud || sol.id_solicitud || sol.id;
    const idPac = sol.idPaciente || sol.id_paciente;

    document.getElementById('visita-idSolicitud').value = idSolActual;
    document.getElementById('visita-idPaciente').value = idPac;
    document.getElementById('lbl-nombre-paciente').textContent = sol.nombrePaciente || sol.nombre_paciente || 'N/A';
    document.getElementById('lbl-motivo-remision').textContent = sol.motivo || 'N/A';

    try {
        const pacientes = await fetchData(API_URL_PACIENTES);
        pacienteActualSeleccionado = (pacientes || []).find(p => (p.idPaciente || p.id_paciente || p.id) == idPac);
    } catch (e) {
        console.warn('No se pudo obtener la ficha completa del paciente:', e);
    }

    // Cargar exámenes de laboratorio vinculados a esta visita/solicitud
    cargarLaboratoriosDeVisita(idSolActual);

    // Limpiar campos del formulario
    document.getElementById('visita-diagnostico').value = '';
    document.getElementById('visita-observaciones').value = '';
    document.getElementById('visita-costo').value = '150.00';
    document.getElementById('tbody-examenes').innerHTML = '';
    document.getElementById('tbody-medicamentos').innerHTML = '';

    const modalElement = document.getElementById('modalAtenderConsulta');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
}

function verExpedienteDesdeEspecialista() {
    if (!pacienteActualSeleccionado) {
        Swal.fire('Atención', 'No se pudo cargar el historial del paciente.', 'warning');
        return;
    }

    const p = pacienteActualSeleccionado;
    const contenedor = document.getElementById('contenido-expediente-especialista');

    if (contenedor) {
        contenedor.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <p><strong>Paciente:</strong> ${escaparHTML(p.nombre || p.nombrePaciente)}</p>
                    <p><strong>Fecha Nacimiento:</strong> ${escaparHTML(p.fechaNacimiento || p.fecha_nacimiento || 'N/A')}</p>
                    <p><strong>Fecha Ingreso:</strong> ${escaparHTML(p.fechaIngreso || p.fecha_ingreso || 'N/A')}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Familiar Responsable:</strong> ${escaparHTML(p.familiar?.nombre || p.nombreFamiliar || 'N/A')}</p>
                    <p><strong>Teléfono Familiar:</strong> ${escaparHTML(p.familiar?.telefono || p.telefonoFamiliar || 'N/A')}</p>
                </div>
                <hr>
                <div class="col-12">
                    <p><strong>Diagnóstico Inicial:</strong></p>
                    <div class="p-2 bg-light rounded">${escaparHTML(p.diagnosticoInicial || p.diagnostico_inicial || 'Sin registro')}</div>
                </div>
                <div class="col-12">
                    <p><strong>Motivo de Reclusión:</strong></p>
                    <div class="p-2 bg-light rounded">${escaparHTML(p.motivoReclusion || p.motivo_reclusion || 'N/A')}</div>
                </div>
                <div class="col-md-6">
                    <p><strong>Psicopatologías:</strong></p>
                    <p class="text-primary fw-bold">${escaparHTML(p.psicopatologias || 'Ninguna')}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Medicamentos de Cajón:</strong></p>
                    <p class="text-success fw-bold">${escaparHTML(p.medicamentosCajon || p.medicamentos_cajon || 'Ninguno')}</p>
                </div>
            </div>
        `;
    }

    const modalElement = document.getElementById('modalExpedienteEspecialista');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
}

/* ==========================================================================
   FILAS DINÁMICAS (EXÁMENES Y MEDICAMENTOS)
   ========================================================================== */

function agregarFilaExamen() {
    const tbody = document.getElementById('tbody-examenes');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control form-control-sm examen-nombre" placeholder="Nombre / Tipo de examen requerido" required></td>
        <td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove()"><i class="bi bi-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
}

function agregarFilaMedicamento() {
    const tbody = document.getElementById('tbody-medicamentos');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control form-control-sm med-nombre" placeholder="Nombre del medicamento" required></td>
        <td><input type="text" class="form-control form-control-sm med-dosis" placeholder="Dosis (Ej. 500mg)" required></td>
        <td><input type="text" class="form-control form-control-sm med-tiempo" placeholder="Frecuencia (Ej. Cada 8 hrs / 7 días)" required></td>
        <td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove()"><i class="bi bi-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
}

/* ==========================================================================
   GUARDAR Y FINALIZAR VISITA MÉDICA
   ========================================================================== */

async function guardarVisitaMedica(evento) {
    if (evento) evento.preventDefault();

    const idSolicitud = parseInt(document.getElementById('visita-idSolicitud')?.value, 10);
    const idPaciente = parseInt(document.getElementById('visita-idPaciente')?.value, 10);
    
    // Obtener ID del especialista logueado
    const idEspecialistaRaw = usuario.idUsuario || usuario.id || usuario.id_usuario || usuario.idMedico;
    const idMedicoEspecialista = parseInt(idEspecialistaRaw, 10);

    const diagnostico = document.getElementById('visita-diagnostico')?.value.trim();
    const observaciones = document.getElementById('visita-observaciones')?.value.trim();
    const costoConsulta = parseFloat(document.getElementById('visita-costo')?.value) || 0.0;

    if (!diagnostico) {
        Swal.fire('Atención', 'Por favor ingrese el diagnóstico médico.', 'warning');
        return;
    }

    // Exámenes de laboratorio
    const examenes = [];
    document.querySelectorAll('#tbody-examenes tr').forEach(tr => {
        const nombre = tr.querySelector('.examen-nombre')?.value.trim();
        if (nombre) {
            examenes.push({ 
                nombreExamen: nombre,
                costoExamen: 0.0
            });
        }
    });

    // Medicamentos / Receta
    const recetas = [];
    document.querySelectorAll('#tbody-medicamentos tr').forEach(tr => {
        const med = tr.querySelector('.med-nombre')?.value.trim();
        const dosis = tr.querySelector('.med-dosis')?.value.trim();
        const tiempo = tr.querySelector('.med-tiempo')?.value.trim();

        if (med) {
            recetas.push({ 
                medicamento: med,
                dosis: dosis, 
                tiempoAplicacion: tiempo,
                costoMedicamento: 0.0
            });
        }
    });

    const payload = {
        idSolicitud: idSolicitud,
        idPaciente: idPaciente,
        idMedicoEspecialista: idMedicoEspecialista,
        diagnostico: diagnostico,
        observaciones: observaciones,
        costoConsulta: costoConsulta,
        examenes: examenes,
        recetas: recetas
    };

    console.log("Enviando Payload limpio DTO Plano:", JSON.stringify(payload));

    const btnSubmit = document.querySelector('#formVisitaMedica button[type="submit"]');
    const textoOriginal = btnSubmit ? btnSubmit.innerHTML : 'Finalizar Visita Médica';
    setButtonLoading(btnSubmit, true);

    try {
        const res = await fetch(API_URL_VISITAS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorMsg = await res.text();
            console.error("Respuesta del Servidor (Java):", errorMsg);
            throw new Error(errorMsg || `Error HTTP ${res.status}`);
        }

        Swal.fire({
            title: '¡Visita Completada!',
            text: 'Se ha registrado la consulta correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#198754'
        });

        const modalElement = document.getElementById('modalAtenderConsulta');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        document.getElementById('formVisitaMedica')?.reset();
        await cargarCitasEspecialista();

    } catch (error) {
        console.error('Error al registrar visita médica:', error);
        Swal.fire('Error al procesar la visita', 'Revisa la consola del navegador para más detalles.', 'error');
    } finally {
        setButtonLoading(btnSubmit, false, textoOriginal);
    }
}

/* ==========================================================================
   INICIALIZACIÓN Y EVENT LISTENERS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const infoUsuarioEl = document.getElementById('info-usuario');
    if (infoUsuarioEl && usuario && usuario.nombre) {
        infoUsuarioEl.textContent = `${usuario.nombre} ${usuario.especialidad ? '(' + usuario.especialidad + ')' : ''}`;
    }

    const formVisita = document.getElementById('formVisitaMedica');
    if (formVisita) {
        formVisita.addEventListener('submit', guardarVisitaMedica);
    }

    cargarCitasEspecialista();
});