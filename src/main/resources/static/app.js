/* ==========================================================================
   CONFIGURACIÓN Y CONTROL DE SESIÓN
   ========================================================================== */
const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado);
const paginaActual = window.location.pathname.split('/').pop();



// Redirecciones automáticas si está en index.html
if (paginaActual === 'index.html' || paginaActual === '') {
    if (usuario.rol === 'MEDICO_GENERAL') {
        window.location.href = 'medico-general.html';
    } else if (usuario.rol === 'FUNDACION') {
        window.location.href = 'fundacion.html';
    } else if (usuario.rol === 'MEDICO_ESPECIALISTA') {
        window.location.href = 'medico-especialista.html';
    } else if (usuario.rol === 'LABORATORIO') {
        window.location.href = 'laboratorio.html'; // <--- AGREGAR ESTA LÍNEA
    }
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
let pacienteEditandoId = null;
let listaSolicitudesFundacion = [];

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

function debounce(fn, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

function setButtonLoading(button, isLoading, originalText = 'Guardar') {
    if (!button) return;
    button.disabled = isLoading;
    button.innerHTML = isLoading 
        ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...` 
        : originalText;
}

/* ==========================================================================
   NAVEGACIÓN Y LÍMITES DE FECHAS
   ========================================================================== */
function navegarA(idSeccion) {
    document.querySelectorAll('.seccion-contenido').forEach(sec => sec.classList.add('d-none'));
    
    const seccionDestino = document.getElementById(idSeccion);
    if (seccionDestino) seccionDestino.classList.remove('d-none');

    if (window.event && window.event.currentTarget) {
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => link.classList.remove('active'));
        window.event.currentTarget.classList.add('active');
    }
}

function aplicarLimitesFechas() {
    const hoy = new Date();
    const fechaHoyStr = hoy.toISOString().split('T')[0];

    const inputIngreso = document.getElementById("paciente-ingreso");
    if (inputIngreso) inputIngreso.setAttribute("max", fechaHoyStr);

    const hace60Anios = new Date();
    hace60Anios.setFullYear(hoy.getFullYear() - 60);
    const fechaMaxNacimientoStr = hace60Anios.toISOString().split('T')[0];

    const inputNacimiento = document.getElementById("paciente-nacimiento");
    if (inputNacimiento) {
        inputNacimiento.setAttribute("min", "1900-01-01");
        inputNacimiento.setAttribute("max", fechaMaxNacimientoStr);
    }

    // Configurar fecha mínima para agendar cita (Hoy o en adelante)
    const inputAgendarFecha = document.getElementById("agendar-fecha");
    if (inputAgendarFecha) {
        inputAgendarFecha.setAttribute("min", fechaHoyStr);
    }
}

/* ==========================================================================
   GESTIÓN DE USUARIOS Y PERSONAL (ADMINISTRADOR)
   ========================================================================== */

function toggleEspecialidad(rol) {
    const grupoEspecialidad = document.getElementById('grupo-especialidad');
    if (!grupoEspecialidad) return;

    if (rol === 'MEDICO_ESPECIALISTA') {
        grupoEspecialidad.classList.remove('d-none');
    } else {
        grupoEspecialidad.classList.add('d-none');
        const selectEspecialidad = document.getElementById('usuario-especialidad');
        if (selectEspecialidad) selectEspecialidad.value = '';
    }
}

function limpiarFormularioUsuario() {
    const form = document.getElementById('form-usuario');
    if (form) form.reset();
    
    const campoId = document.getElementById('usuario-id');
    if (campoId) campoId.value = '';
    
    toggleEspecialidad('');
}

async function guardarUsuario(evento) {
    if (evento) evento.preventDefault();

    const botonGuardar = document.querySelector('#form-usuario button[type="submit"]');
    const textoOriginal = botonGuardar ? botonGuardar.innerHTML : 'Guardar Usuario';
    setButtonLoading(botonGuardar, true);

    const rol = document.getElementById('usuario-rol').value;
    const especialidad = document.getElementById('usuario-especialidad').value;

    if (rol === 'MEDICO_ESPECIALISTA' && !especialidad) {
        Swal.fire('Atención', 'Seleccione la especialidad médica.', 'warning');
        setButtonLoading(botonGuardar, false, textoOriginal);
        return;
    }

    const usuarioPayload = {
        nombre: document.getElementById('usuario-nombre').value.trim(),
        correo: document.getElementById('usuario-correo').value.trim(),
        password: document.getElementById('usuario-password').value,
        rol: rol,
        especialidad: rol === 'MEDICO_ESPECIALISTA' ? especialidad : null
    };

    try {
        await fetchData(API_URL_USUARIOS, {
            method: 'POST',
            body: JSON.stringify(usuarioPayload)
        });

        Swal.fire('Éxito', 'Usuario creado con éxito.', 'success');
        
        const modalElement = document.getElementById('modalUsuario');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        limpiarFormularioUsuario();
        await cargarDatosUsuarios();
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        const msg = error.message || '';
        if (msg.includes('UNIQUE KEY') || msg.includes('UQ_Usuarios') || msg.includes('duplicate')) {
            Swal.fire('Correo registrado', 'El correo electrónico ingresado ya pertenece a otro usuario.', 'warning');
        } else {
            Swal.fire('Error', msg || 'No se pudo guardar el usuario.', 'error');
        }
    } finally {
        setButtonLoading(botonGuardar, false, textoOriginal);
    }
}

async function cargarDatosUsuarios() {
    if (usuario.rol === 'MEDICO_GENERAL' || usuario.rol === 'FUNDACION') return;

    const selectMedico = document.getElementById('paciente-medico');
    const tarjetaUsuarios = document.getElementById('total-usuarios');
    const tbodyUsuarios = document.getElementById('tabla-usuarios');

    try {
        const usuarios = await fetchData(API_URL_USUARIOS);

        if (tarjetaUsuarios) tarjetaUsuarios.textContent = usuarios.length;

        if (tbodyUsuarios) {
            tbodyUsuarios.innerHTML = '';
            if (usuarios.length === 0) {
                tbodyUsuarios.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay personal registrado.</td></tr>';
            } else {
                const fragmento = document.createDocumentFragment();
                usuarios.forEach(user => {
                    const idMostrar = user.idUsuario || user.id || '';
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td><span class="badge bg-secondary">#${escaparHTML(idMostrar)}</span></td>
                        <td><strong>${escaparHTML(user.nombre)}</strong></td>
                        <td>${escaparHTML(user.correo)}</td>
                        <td><span class="badge bg-info text-dark">${escaparHTML(user.rol)}</span></td>
                        <td>${escaparHTML(user.especialidad || 'N/A')}</td>
                    `;
                    fragmento.appendChild(fila);
                });
                tbodyUsuarios.appendChild(fragmento);
            }
        }

        if (selectMedico) {
            const medicosGenerales = usuarios.filter(u => u.rol === 'MEDICO_GENERAL');
            selectMedico.innerHTML = '<option value="">-- Seleccione un Médico General --</option>';

            medicosGenerales.forEach(medico => {
                const opcion = document.createElement('option');
                opcion.value = medico.idUsuario || medico.id;
                opcion.textContent = medico.nombre;
                selectMedico.appendChild(opcion);
            });

            if (medicosGenerales.length === 0) {
                selectMedico.innerHTML = '<option value="">No hay médicos generales disponibles</option>';
            }
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        if (selectMedico) selectMedico.innerHTML = '<option value="">Error al cargar médicos</option>';
        if (tbodyUsuarios) tbodyUsuarios.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>';
    }
}

/* ==========================================================================
   GESTIÓN DE PACIENTES
   ========================================================================== */

async function cargarPacientes() {
    if (usuario.rol === 'FUNDACION') return;

    const tbodies = document.querySelectorAll('.tabla-pacientes-body');
    tbodies.forEach(tbody => {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';
    });

    try {
        const respuesta = await fetchData(API_URL_PACIENTES);
        
        let idsPacientesRemitidos = new Set();
        try {
            const solicitudes = await fetchData(API_URL_SOLICITUDES);
            if (Array.isArray(solicitudes)) {
                solicitudes.forEach(sol => {
                    const idPac = sol.idPaciente || sol.pacienteId || (sol.paciente ? (sol.paciente.idPaciente || sol.paciente.id) : null);
                    if (idPac !== null && idPac !== undefined) {
                        idsPacientesRemitidos.add(String(idPac));
                    }
                });
            }
        } catch (e) {
            console.warn('No se pudieron verificar las solicitudes activas:', e);
        }

        if (usuario.rol === 'MEDICO_GENERAL') {
            listaPacientesGlobal = respuesta.filter(p => {
                if (!p.medico) return false;
                
                const coincideId = usuario.idUsuario && (p.medico.idUsuario == usuario.idUsuario || p.medico.id == usuario.idUsuario);
                const coincideCorreo = usuario.correo && (p.medico.correo === usuario.correo);

                return coincideId || coincideCorreo;
            }).map(p => {
                const idActual = String(p.idPaciente || p.id);
                p.remitido = idsPacientesRemitidos.has(idActual);
                return p;
            });
            
            const tarjetaMedico = document.getElementById('total-pacientes-medico');
            if (tarjetaMedico) tarjetaMedico.textContent = listaPacientesGlobal.length;

            renderizarTablaMedico(listaPacientesGlobal);
        } else {
            listaPacientesGlobal = respuesta;
            
            const tarjetaPacientes = document.getElementById('total-pacientes');
            if (tarjetaPacientes) tarjetaPacientes.textContent = listaPacientesGlobal.length;

            renderizarTablaPacientes(listaPacientesGlobal);
        }

    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        tbodies.forEach(tbody => {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>';
        });
    }
}

function renderizarTablaPacientes(pacientes) {
    const tbodies = document.querySelectorAll('.tabla-pacientes-body');
    if (tbodies.length === 0) return;

    tbodies.forEach(tbody => {
        tbody.innerHTML = '';

        if (!pacientes || pacientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron pacientes.</td></tr>';
            return;
        }

        const fragmento = document.createDocumentFragment();

        pacientes.forEach(paciente => {
            const fila = document.createElement('tr');
            const nombreMedico = paciente.medico?.nombre ? paciente.medico.nombre : 'Sin asignar';
            const nombreFamiliar = paciente.familiar?.nombre ? paciente.familiar.nombre : 'Sin asignar';
            const idMostrar = paciente.idPaciente || paciente.id;

            fila.innerHTML = `
                <td><span class="badge bg-secondary">#${escaparHTML(idMostrar)}</span></td>
                <td><strong>${escaparHTML(paciente.nombre || 'Sin nombre')}</strong></td>
                <td>${escaparHTML(paciente.diagnosticoInicial || 'N/A')}</td>
                <td>${escaparHTML(nombreFamiliar)}</td>
                <td><span class="badge bg-success">${escaparHTML(nombreMedico)}</span></td>
                <td>${escaparHTML(paciente.fechaIngreso || 'N/A')}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="prepararEdicion(${idMostrar})">✏️ Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarPaciente(${idMostrar})">🗑️ Borrar</button>
                </td>
            `;
            fragmento.appendChild(fila);
        });

        tbody.appendChild(fragmento);
    });
}

function renderizarTablaMedico(pacientes) {
    const tbodies = document.querySelectorAll('.tabla-pacientes-body');
    if (tbodies.length === 0) return;

    tbodies.forEach(tbody => {
        tbody.innerHTML = '';

        if (!pacientes || pacientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No tienes pacientes asignados actualmente.</td></tr>';
            return;
        }

        const fragmento = document.createDocumentFragment();

        pacientes.forEach(paciente => {
            const fila = document.createElement('tr');
            const idMostrar = paciente.idPaciente || paciente.id;
            const nombreFamiliar = paciente.familiar?.nombre ? paciente.familiar.nombre : 'Sin asignar';
            const nombrePacienteSeguro = paciente.nombre ? paciente.nombre.replace(/'/g, "\\'") : 'Paciente';

            fila.innerHTML = `
                <td><span class="badge bg-secondary">#${escaparHTML(idMostrar)}</span></td>
                <td><strong>${escaparHTML(paciente.nombre || 'Sin nombre')}</strong></td>
                <td>${escaparHTML(paciente.diagnosticoInicial || 'N/A')}</td>
                <td>${escaparHTML(nombreFamiliar)}</td>
                <td>${escaparHTML(paciente.fechaIngreso || 'N/A')}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-info text-white me-1" onclick="verExpediente(${idMostrar})">👁️ Ver Expediente</button>
                    ${paciente.remitido ? 
                        `<button class="btn btn-sm btn-secondary fw-bold" disabled>⏳ Remitido</button>` : 
                        `<button class="btn btn-sm btn-warning fw-bold" onclick="abrirModalRemision(${idMostrar}, '${escaparHTML(nombrePacienteSeguro)}')">🏥 Remitir</button>`
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
                <div class="p-2 bg-light rounded">${escaparHTML(paciente.diagnosticoInicial || 'Sin diagnóstico registrado')}</div>
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

    const modalElement = document.getElementById('modalExpediente');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

/* ==========================================================================
   GESTIÓN DE REMISIONES Y NOTIFICACIONES DE CORREO
   ========================================================================== */

async function cargarOpcionesRemision() {
    const selectEnfermero = document.getElementById('remision-enfermero');
    if (!selectEnfermero) return;

    selectEnfermero.innerHTML = '<option value="" selected disabled>Cargando enfermeros...</option>';

    try {
        const usuarios = await fetchData(API_URL_USUARIOS);

        const enfermeros = usuarios.filter(u => 
            u.rol && (u.rol.toUpperCase() === 'ENFERMERO' || u.rol.toUpperCase() === 'ENFERMERA')
        );

        if (enfermeros.length === 0) {
            selectEnfermero.innerHTML = '<option value="" disabled>No hay enfermeros registrados</option>';
            return;
        }

        selectEnfermero.innerHTML = '<option value="" selected disabled>Seleccione un enfermero acompañante...</option>';
        enfermeros.forEach(enf => {
            const option = document.createElement('option');
            option.value = enf.idUsuario || enf.id;
            option.textContent = enf.nombre;
            selectEnfermero.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar datos del personal para la remisión:', error);
        selectEnfermero.innerHTML = '<option value="" disabled>Error al cargar enfermeros</option>';
    }
}

async function abrirModalRemision(idPaciente, nombrePaciente) {
    const inputId = document.getElementById('remision-id-paciente');
    const inputNombre = document.getElementById('remision-nombre-paciente');
    const selectEspecialidad = document.getElementById('remision-especialidad');

    if (inputId) inputId.value = idPaciente;
    if (inputNombre) inputNombre.value = nombrePaciente;
    if (selectEspecialidad) selectEspecialidad.value = "";

    await cargarOpcionesRemision();

    const modalElement = document.getElementById('modalRemision');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
}

async function guardarRemision(evento) {
    if (evento) evento.preventDefault();

    const idPaciente = document.getElementById('remision-id-paciente')?.value;
    const selectEspecialidad = document.getElementById('remision-especialidad');
    const selectEnfermero = document.getElementById('remision-enfermero');
    const motivoInput = document.getElementById('remision-motivo');

    const especialidadVal = selectEspecialidad ? selectEspecialidad.value : '';
    const idEnfermeroVal = selectEnfermero ? selectEnfermero.value : '';
    const motivoVal = motivoInput ? motivoInput.value.trim() : '';

    if (!especialidadVal || !idEnfermeroVal || !motivoVal) {
        Swal.fire('Atención', 'Por favor complete todos los campos obligatorios.', 'warning');
        return;
    }

    const paciente = listaPacientesGlobal.find(p => (p.idPaciente || p.id) == idPaciente);

    if (!paciente) {
        Swal.fire('Error', 'No se encontró la información del paciente.', 'error');
        return;
    }

    const solicitudPayload = {
        idPaciente: parseInt(idPaciente, 10),
        nombrePaciente: paciente.nombre || 'Paciente sin nombre',
        nombreFamiliar: paciente.familiar?.nombre || 'Familiar',
        correoFamiliar: paciente.familiar?.correo || '',
        medicoEspecialista: especialidadVal,
        idEnfermero: parseInt(idEnfermeroVal, 10),
        motivo: motivoVal
    };

    const botonSubmit = document.querySelector('#formRemision button[type="submit"]');
    const textoOriginal = botonSubmit ? botonSubmit.innerHTML : 'Guardar y Notificar';
    setButtonLoading(botonSubmit, true);

    try {
        await fetchData(API_URL_SOLICITUDES, {
            method: 'POST',
            body: JSON.stringify(solicitudPayload)
        });

        paciente.remitido = true;
        renderizarTablaMedico(listaPacientesGlobal);

        const modalElement = document.getElementById('modalRemision');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement) || bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.hide();
        }

        const formRemision = document.getElementById('formRemision');
        if (formRemision) formRemision.reset();

        Swal.fire({
            title: '¡Remisión Registrada!',
            text: 'La remisión fue procesada con éxito y se envió la notificación al familiar.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#0d6efd'
        });

    } catch (error) {
        console.error('Error al procesar la remisión:', error);
        Swal.fire('Error', error.message || 'No se pudo guardar la solicitud.', 'error');
    } finally {
        setButtonLoading(botonSubmit, false, textoOriginal);
    }
}

function filtrarPacientes(textoBusqueda) {
    const filtro = textoBusqueda.toLowerCase().trim();
    
    document.querySelectorAll('.input-buscar-paciente').forEach(input => {
        if (input.value !== textoBusqueda) {
            input.value = textoBusqueda;
        }
    });

    const pacientesFiltrados = listaPacientesGlobal.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(filtro)) ||
        (p.diagnosticoInicial && p.diagnosticoInicial.toLowerCase().includes(filtro)) ||
        (p.familiar?.nombre && p.familiar.nombre.toLowerCase().includes(filtro)) ||
        (p.medico?.nombre && p.medico.nombre.toLowerCase().includes(filtro))
    );

    if (usuario.rol === 'MEDICO_GENERAL') {
        renderizarTablaMedico(pacientesFiltrados);
    } else {
        renderizarTablaPacientes(pacientesFiltrados);
    }
}

function prepararEdicion(id) {
    const paciente = listaPacientesGlobal.find(p => (p.idPaciente || p.id) === id);
    if (!paciente) return;

    pacienteEditandoId = id;

    document.getElementById('paciente-id').value = id;
    document.getElementById('paciente-nombre').value = paciente.nombre || '';
    document.getElementById('paciente-nacimiento').value = paciente.fechaNacimiento || '';
    document.getElementById('paciente-ingreso').value = paciente.fechaIngreso || '';
    document.getElementById('paciente-diagnostico').value = paciente.diagnosticoInicial || '';
    document.getElementById('paciente-motivo').value = paciente.motivoReclusion || '';
    document.getElementById('paciente-psico').value = paciente.psicopatologias || '';
    document.getElementById('paciente-medicamentos').value = paciente.medicamentosCajon || '';

    if (paciente.familiar) {
        document.getElementById('paciente-familiar').value = paciente.familiar.nombre || '';
        document.getElementById('paciente-telefono-familiar').value = paciente.familiar.telefono || '';
        document.getElementById('paciente-correo-familiar').value = paciente.familiar.correo || '';
        document.getElementById('paciente-direccion-familiar').value = paciente.familiar.direccion || '';
    }

    if (paciente.medico) {
        document.getElementById('paciente-medico').value = paciente.medico.idUsuario || paciente.medico.id || '';
    }

    const tituloModal = document.getElementById('modalPacienteLabel');
    if (tituloModal) tituloModal.textContent = '✏️ Editar Paciente';

    const modalElement = document.getElementById('modalPaciente');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

function limpiarFormularioPaciente() {
    pacienteEditandoId = null;
    const form = document.getElementById('form-paciente');
    if (form) form.reset();
    
    const campoId = document.getElementById('paciente-id');
    if (campoId) campoId.value = '';
    
    const tituloModal = document.getElementById('modalPacienteLabel');
    if (tituloModal) tituloModal.textContent = '🏥 Registrar Nuevo Paciente';
    
    aplicarLimitesFechas();
}

async function guardarPaciente(evento) {
    if (evento) {
        evento.preventDefault();
        evento.stopImmediatePropagation();
    }

    const botonGuardar = document.querySelector('#form-paciente button[type="submit"]');
    const textoOriginal = botonGuardar ? botonGuardar.innerHTML : 'Guardar Paciente';
    setButtonLoading(botonGuardar, true);

    const idMedico = document.getElementById('paciente-medico').value;
    if (!idMedico) {
        Swal.fire('Atención', 'Por favor, seleccione un médico asignado.', 'warning');
        setButtonLoading(botonGuardar, false, textoOriginal);
        return;
    }

    const esEdicion = pacienteEditandoId !== null;
    const pacienteActual = esEdicion ? listaPacientesGlobal.find(p => (p.idPaciente || p.id) === pacienteEditandoId) : null;

    const nombreFamiliar = document.getElementById('paciente-familiar').value.trim();
    let familiarObj = null;

    if (nombreFamiliar !== '') {
        familiarObj = {
            nombre: nombreFamiliar,
            telefono: document.getElementById('paciente-telefono-familiar').value.trim(),
            correo: document.getElementById('paciente-correo-familiar').value.trim(),
            direccion: document.getElementById('paciente-direccion-familiar').value.trim()
        };

        if (pacienteActual?.familiar?.idFamiliar) {
            familiarObj.idFamiliar = pacienteActual.familiar.idFamiliar;
        }
    }

    const pacientePayload = {
        nombre: document.getElementById('paciente-nombre').value.trim(),
        fechaNacimiento: document.getElementById('paciente-nacimiento').value,
        fechaIngreso: document.getElementById('paciente-ingreso').value,
        diagnosticoInicial: document.getElementById('paciente-diagnostico').value.trim(),
        motivoReclusion: document.getElementById('paciente-motivo').value.trim(),
        psicopatologias: document.getElementById('paciente-psico').value.trim(),
        medicamentosCajon: document.getElementById('paciente-medicamentos').value.trim(),
        familiar: familiarObj,
        medico: { idUsuario: parseInt(idMedico, 10) }
    };

    const url = esEdicion ? `${API_URL_PACIENTES}/${pacienteEditandoId}` : API_URL_PACIENTES;
    const metodo = esEdicion ? 'PUT' : 'POST';

    try {
        await fetchData(url, {
            method: metodo,
            body: JSON.stringify(pacientePayload)
        });

        Swal.fire('Éxito', `Paciente ${esEdicion ? 'actualizado' : 'registrado'} correctamente.`, 'success');
        
        const modalElement = document.getElementById('modalPaciente');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();

        limpiarFormularioPaciente();
        await cargarPacientes();
    } catch (error) {
        console.error('Error al procesar paciente:', error);
        Swal.fire('Error', error.message || 'Revisa los datos ingresados e intenta de nuevo.', 'error');
    } finally {
        setButtonLoading(botonGuardar, false, textoOriginal);
    }
}

async function eliminarPaciente(id) {
    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmColor: '#d33',
        cancelColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
        try {
            await fetchData(`${API_URL_PACIENTES}/${id}`, { method: 'DELETE' });
            Swal.fire('Eliminado', 'El paciente ha sido eliminado.', 'success');
            await cargarPacientes();
        } catch (error) {
            console.error('Error al eliminar paciente:', error);
            Swal.fire('Error', error.message || 'No se pudo eliminar el registro.', 'error');
        }
    }
}

/* ==========================================================================
   MÓDULO FUNDACIÓN: GESTIÓN Y AGENDAMIENTO DE CITAS
   ========================================================================== */
/*
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

            // Validar si el paciente está inactivo (borrado lógico por Admin)
            const pacienteInactivo = sol.pacienteActivo === false || (sol.paciente && sol.paciente.activo === false);

            let botonesAccion = '';

            if (estado === 'PENDIENTE') {
                if (pacienteInactivo) {
                    // Si el paciente fue desactivado por el Admin, no permite agendar
                    botonesAccion = `
                        <span class="badge bg-secondary mb-1">Paciente Inactivo</span><br>
                        <button class="btn btn-sm btn-outline-danger" onclick="abrirModalCancelar(${idSolicitud})">❌ Cancelar</button>
                    `;
                } else {
                    botonesAccion = `
                        <button class="btn btn-sm btn-primary me-1" onclick="abrirModalAgendar(${idSolicitud})">📅 Agendar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="abrirModalCancelar(${idSolicitud})">❌ Cancelar</button>
                    `;
                }
            } else if (estado === 'AGENDADA') {
                botonesAccion = `
                    <button class="btn btn-sm btn-outline-danger" onclick="abrirModalCancelar(${idSolicitud})">❌ Cancelar</button>
                `;
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
                <td class="text-center">
                    ${botonesAccion}
                </td>
            `;
            fragmento.appendChild(fila);
        });

        tbody.appendChild(fragmento);
        actualizarMetricasFundacion(pendientes, agendadas, canceladas);

    } catch (error) {
        console.error('Error al cargar solicitudes para la fundación:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>';
    }
}
*/


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

            // Evalúa explícitamente si el paciente está inactivo (false)
            const pacienteInactivo = sol.pacienteActivo === false || (sol.paciente && sol.paciente.activo === false);

            let botonesAccion = '';

            if (estado === 'PENDIENTE') {
                if (pacienteInactivo) {
                    // Muestra advertencia y bloquea botón de Agendar
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
                    // Si ya tenía cita agendada pero el paciente fue eliminado, avisa a la Fundación
                    botonesAccion = `
                        <span class="badge bg-danger mb-1">⚠️ Paciente Dado de Baja</span><br>
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
                <td class="text-center">
                    ${botonesAccion}
                </td>
            `;
            fragmento.appendChild(fila);
        });

        tbody.appendChild(fragmento);
        actualizarMetricasFundacion(pendientes, agendadas, canceladas);

    } catch (error) {
        console.error('Error al cargar solicitudes para la fundación:', error);
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
    // Validación de seguridad extra
    const solicitud = listaSolicitudesFundacion.find(s => (s.idSolicitud || s.id) == idSolicitud);
    const pacienteInactivo = solicitud?.pacienteActivo === false || (solicitud?.paciente && solicitud?.paciente.activo === false);

    if (pacienteInactivo) {
        Swal.fire('Acción no permitida', 'El paciente ha sido dado de baja del asilo y no se le pueden agendar nuevas citas.', 'warning');
        return;
    }

    const inputId = document.getElementById('agendar-idSolicitud');
    const selectMedico = document.getElementById('agendar-medico');

    if (inputId) inputId.value = idSolicitud;

    // Obtener solicitud elegida y su especialidad requerida
    const especialidadRequerida = solicitud?.medicoEspecialista || '';

    if (selectMedico) {
        selectMedico.innerHTML = '<option value="" selected disabled>Cargando especialistas...</option>';

        try {
            const usuarios = await fetchData(API_URL_USUARIOS);

            // Filtrar solo los médicos especialistas con la especialidad coincidente
            const especialistasFiltrados = usuarios.filter(u => {
                const esEspecialista = u.rol && u.rol.toUpperCase() === 'MEDICO_ESPECIALISTA';
                const coincideEspecialidad = u.especialidad && 
                    u.especialidad.trim().toLowerCase() === especialidadRequerida.trim().toLowerCase();
                return esEspecialista && coincideEspecialidad;
            });

            selectMedico.innerHTML = '';

            if (especialistasFiltrados.length === 0) {
                selectMedico.innerHTML = `<option value="" disabled selected>No hay médicos registrados para ${escaparHTML(especialidadRequerida || 'esta especialidad')}</option>`;
            } else {
                selectMedico.innerHTML = `<option value="" selected disabled>-- Seleccione médico de ${escaparHTML(especialidadRequerida)} --</option>`;
                especialistasFiltrados.forEach(med => {
                    const option = document.createElement('option');
                    option.value = med.idUsuario || med.id;
                    option.textContent = `${med.nombre} (${med.especialidad})`;
                    selectMedico.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Error al cargar médicos especialistas:', error);
            selectMedico.innerHTML = '<option value="" disabled>Error al cargar médicos especialistas</option>';
        }
    }

    aplicarLimitesFechas();

    const modalElement = document.getElementById('modalAgendar');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
}

async function guardarAgendamiento(evento) {
    if (evento) evento.preventDefault();

    const idSolicitud = document.getElementById('agendar-idSolicitud')?.value;
    const fecha = document.getElementById('agendar-fecha')?.value;
    const hora = document.getElementById('agendar-hora')?.value;
    const idMedicoEspecialista = document.getElementById('agendar-medico')?.value;

    if (!idMedicoEspecialista) {
        Swal.fire('Atención', 'Debe seleccionar un médico especialista.', 'warning');
        return;
    }

    if (!fecha || !hora) {
        Swal.fire('Atención', 'Por favor seleccione la fecha y la hora para la cita.', 'warning');
        return;
    }

    // 1. Validar que la fecha no sea una fecha pasada
    const hoyStr = new Date().toISOString().split('T')[0];
    if (fecha < hoyStr) {
        Swal.fire('Atención', 'No se puede agendar una cita en una fecha pasada.', 'warning');
        return;
    }

    // 2. Validar que no exista choque de horario para el mismo especialista
    const choqueHorario = listaSolicitudesFundacion.some(sol => {
        const idActual = sol.idSolicitud || sol.id;
        const mismoMedico = sol.idMedicoEspecialista && String(sol.idMedicoEspecialista) === String(idMedicoEspecialista);
        return (
            String(idActual) !== String(idSolicitud) &&
            mismoMedico &&
            sol.fechaCita === fecha &&
            sol.horaCita === hora &&
            sol.estado !== 'CANCELADA'
        );
    });

    if (choqueHorario) {
        Swal.fire('Horario Ocupado', 'El médico especialista seleccionado ya tiene una cita en esa fecha y hora.', 'warning');
        return;
    }

    const botonSubmit = document.querySelector('#form-agendar button[type="submit"]');
    const textoOriginal = botonSubmit ? botonSubmit.innerHTML : 'Confirmar y Agendar Cita';
    setButtonLoading(botonSubmit, true);

    try {
        await fetchData(`${API_URL_SOLICITUDES}/${idSolicitud}/agendar`, {
            method: 'PUT',
            body: JSON.stringify({ 
                fechaCita: fecha, 
                horaCita: hora, 
                idMedicoEspecialista: parseInt(idMedicoEspecialista, 10),
                estado: 'AGENDADA' 
            })
        });

        const modalElement = document.getElementById('modalAgendar');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        const formAgendar = document.getElementById('form-agendar');
        if (formAgendar) formAgendar.reset();

        Swal.fire('¡Éxito!', 'La cita médica ha sido agendada correctamente con el especialista.', 'success');
        await cargarSolicitudesFundacion();

    } catch (error) {
        console.error('Error al agendar cita:', error);
        Swal.fire('Error', error.message || 'No se pudo agendar la cita.', 'error');
    } finally {
        setButtonLoading(botonSubmit, false, textoOriginal);
    }
}

function abrirModalCancelar(idSolicitud) {
    const inputId = document.getElementById('cancelar-idSolicitud');
    if (inputId) inputId.value = idSolicitud;

    const modalElement = document.getElementById('modalCancelar');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
}

async function guardarCancelacion(evento) {
    if (evento) evento.preventDefault();

    const idSolicitud = document.getElementById('cancelar-idSolicitud')?.value;
    const motivo = document.getElementById('cancelar-motivo')?.value.trim();

    if (!motivo) {
        Swal.fire('Atención', 'Debe ingresar el motivo de cancelación.', 'warning');
        return;
    }

    const botonSubmit = document.querySelector('#form-cancelar button[type="submit"]');
    const textoOriginal = botonSubmit ? botonSubmit.innerHTML : 'Confirmar Cancelación';
    setButtonLoading(botonSubmit, true);

    try {
        await fetchData(`${API_URL_SOLICITUDES}/${idSolicitud}/cancelar`, {
            method: 'PUT',
            body: JSON.stringify({ 
                motivoCancelacion: motivo, 
                estado: 'CANCELADA' 
            })
        });

        const modalElement = document.getElementById('modalCancelar');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        const formCancelar = document.getElementById('form-cancelar');
        if (formCancelar) formCancelar.reset();

        Swal.fire('Cancelada', 'La solicitud o cita ha sido cancelada.', 'info');
        await cargarSolicitudesFundacion();

    } catch (error) {
        console.error('Error al cancelar la cita:', error);
        Swal.fire('Error', error.message || 'No se pudo procesar la cancelación.', 'error');
    } finally {
        setButtonLoading(botonSubmit, false, textoOriginal);
    }
}

/* ==========================================================================
   INICIALIZACIÓN Y EVENT LISTENERS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Configurar nombre de usuario en UI
    const infoUsuarioEl = document.getElementById('info-usuario');
    if (infoUsuarioEl && typeof usuario !== 'undefined' && usuario.nombre) {
        infoUsuarioEl.textContent = usuario.nombre;
    }

    // Listeners de Formularios
    const formUsuario = document.getElementById('form-usuario');
    if (formUsuario && typeof guardarUsuario === 'function') {
        formUsuario.addEventListener('submit', guardarUsuario);
    }

    const formPaciente = document.getElementById('form-paciente');
    if (formPaciente) {
        formPaciente.addEventListener('submit', guardarPaciente);
    }

    const formRemision = document.getElementById('formRemision');
    if (formRemision && typeof guardarRemision === 'function') {
        formRemision.addEventListener('submit', guardarRemision);
    }

    const formAgendar = document.getElementById('form-agendar');
    if (formAgendar) {
        formAgendar.addEventListener('submit', guardarAgendamiento);
    }

    const formCancelar = document.getElementById('form-cancelar');
    if (formCancelar) {
        formCancelar.addEventListener('submit', guardarCancelacion);
    }

    // Buscador reactivo
    const inputsBuscar = document.querySelectorAll('.input-buscar-paciente');
    inputsBuscar.forEach(input => {
        if (typeof debounce === 'function') {
            input.addEventListener('input', debounce((e) => filtrarPacientes(e.target.value), 300));
        } else {
            input.addEventListener('input', (e) => filtrarPacientes(e.target.value));
        }
    });

    // Carga inicial de límites de fechas
    aplicarLimitesFechas();

    // Carga automática al estar en fundacion.html
    const tablaFundacion = document.getElementById('tabla-solicitudes-body') || document.getElementById('tabla-solicitudes-fundacion-body');
    if (tablaFundacion) {
        cargarSolicitudesFundacion();
    } else if (typeof usuario !== 'undefined' && usuario.rol) {
        if (usuario.rol === 'ADMIN') {
            if (typeof cargarDatosUsuarios === 'function') cargarDatosUsuarios();
            if (typeof cargarPacientes === 'function') cargarPacientes();
        } else if (usuario.rol === 'MEDICO_GENERAL') {
            if (typeof cargarPacientes === 'function') cargarPacientes();
        } else if (usuario.rol === 'FUNDACION') {
            cargarSolicitudesFundacion();
        }
    }
});