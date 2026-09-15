/* ==========================================================================
   CONFIGURACIÓN Y CONTROL DE SESIÓN
   ========================================================================== */
const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado);

function cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Endpoints API
const API_URL_PACIENTES = 'http://localhost:8081/api/pacientes';
const API_URL_USUARIOS = 'http://localhost:8081/api/usuarios';

let listaPacientesGlobal = [];
let pacienteEditandoId = null;

/* ==========================================================================
   UTILIDADES Y HELPERS
   ========================================================================== */

// Prevención de ataques XSS
function escaparHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Cliente HTTP centralizado
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

// Limitador de frecuencia para la búsqueda (Debounce)
function debounce(fn, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

// Estado de carga para los botones
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
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion-contenido').forEach(sec => sec.classList.add('d-none'));
    
    // Mostrar la sección requerida
    const seccionDestino = document.getElementById(idSeccion);
    if (seccionDestino) seccionDestino.classList.remove('d-none');

    // Actualizar estado de la barra de navegación (Active Class)
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
}

/* ==========================================================================
   GESTIÓN DE USUARIOS Y PERSONAL
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
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();

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
    const selectMedico = document.getElementById('paciente-medico');
    const tarjetaUsuarios = document.getElementById('total-usuarios');
    const tbodyUsuarios = document.getElementById('tabla-usuarios');

    try {
        const usuarios = await fetchData(API_URL_USUARIOS);

        if (tarjetaUsuarios) tarjetaUsuarios.textContent = usuarios.length;

        // Renderizado de la tabla de usuarios en la pestaña Usuarios / Personal
        if (tbodyUsuarios) {
            tbodyUsuarios.innerHTML = '';
            if (usuarios.length === 0) {
                tbodyUsuarios.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay personal registrado.</td></tr>';
            } else {
                const fragmento = document.createDocumentFragment();
                usuarios.forEach(user => {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td><span class="badge bg-secondary">#${escaparHTML(user.idUsuario)}</span></td>
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

        // Cargar las opciones del selector de Médicos Generales en el Modal Pacientes
        if (selectMedico) {
            const medicosGenerales = usuarios.filter(u => u.rol === 'MEDICO_GENERAL');
            selectMedico.innerHTML = '<option value="">-- Seleccione un Médico General --</option>';

            medicosGenerales.forEach(medico => {
                const opcion = document.createElement('option');
                opcion.value = medico.idUsuario;
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
    const tbodies = document.querySelectorAll('.tabla-pacientes-body');
    tbodies.forEach(tbody => {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';
    });

    try {
        listaPacientesGlobal = await fetchData(API_URL_PACIENTES);
        
        const tarjetaPacientes = document.getElementById('total-pacientes');
        if (tarjetaPacientes) tarjetaPacientes.textContent = listaPacientesGlobal.length;

        renderizarTablaPacientes(listaPacientesGlobal);
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

            fila.innerHTML = `
                <td><span class="badge bg-secondary">#${escaparHTML(paciente.idPaciente)}</span></td>
                <td><strong>${escaparHTML(paciente.nombre || 'Sin nombre')}</strong></td>
                <td>${escaparHTML(paciente.diagnosticoInicial || 'N/A')}</td>
                <td>${escaparHTML(nombreFamiliar)}</td>
                <td><span class="badge bg-success">${escaparHTML(nombreMedico)}</span></td>
                <td>${escaparHTML(paciente.fechaIngreso || 'N/A')}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="prepararEdicion(${paciente.idPaciente})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarPaciente(${paciente.idPaciente})">
                        🗑️ Borrar
                    </button>
                </td>
            `;
            fragmento.appendChild(fila);
        });

        tbody.appendChild(fragmento);
    });
}

function filtrarPacientes(textoBusqueda) {
    const filtro = textoBusqueda.toLowerCase().trim();
    
    // Sincronizar todos los inputs de búsqueda
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
    renderizarTablaPacientes(pacientesFiltrados);
}

function prepararEdicion(id) {
    const paciente = listaPacientesGlobal.find(p => p.idPaciente === id);
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
        document.getElementById('paciente-medico').value = paciente.medico.idUsuario || '';
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
    const pacienteActual = esEdicion ? listaPacientesGlobal.find(p => p.idPaciente === pacienteEditandoId) : null;

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
   INICIALIZACIÓN DE EVENTOS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Carga de sesión de usuario
    const infoUsuario = document.getElementById('info-usuario');
    if (infoUsuario && usuario) {
        infoUsuario.textContent = `${usuario.nombre} (${usuario.rol})`;
    }

    // Inicializar límites y peticiones API iniciales
    aplicarLimitesFechas();
    cargarPacientes();
    cargarDatosUsuarios();

    // Event Listeners de formularios
    const formPaciente = document.getElementById('form-paciente');
    if (formPaciente) formPaciente.addEventListener('submit', guardarPaciente);

    const formUsuario = document.getElementById('form-usuario');
    if (formUsuario) formUsuario.addEventListener('submit', guardarUsuario);

    // Event Listeners para reseteo automático al cerrar Modales
    const modalPacienteElement = document.getElementById('modalPaciente');
    if (modalPacienteElement) {
        modalPacienteElement.addEventListener('hidden.bs.modal', limpiarFormularioPaciente);
    }

    const modalUsuarioElement = document.getElementById('modalUsuario');
    if (modalUsuarioElement) {
        modalUsuarioElement.addEventListener('hidden.bs.modal', limpiarFormularioUsuario);
    }

    // Buscador interactivo en tiempo real con Debounce (para todos los buscadores)
    const buscadores = document.querySelectorAll('.input-buscar-paciente');
    buscadores.forEach(input => {
        input.addEventListener('input', debounce((e) => filtrarPacientes(e.target.value), 300));
    });
});