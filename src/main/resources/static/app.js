/* ==========================================================================
   CONFIGURACIÓN Y CONTROL DE SESIÓN (ADMINISTRADOR)
   ========================================================================== */
const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado);

if (usuario.rol !== 'ADMIN' && usuario.rol !== 'ADMINISTRADOR') {
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
let pacienteEditandoId = null;

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
            const texto = `👤 ${usuarioObj.nombre || usuarioObj.correo || 'Administrador'}`;
            if (spanUsuario) spanUsuario.textContent = texto;
            if (infoUsuarioEl) infoUsuarioEl.textContent = usuarioObj.nombre;
        } catch (e) {
            if (spanUsuario) spanUsuario.textContent = '👤 Administrador';
        }
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
   GESTIÓN DE USUARIOS Y PERSONAL (ADMIN)
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
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

function verificarAccesoCaja() {
    window.location.href = 'caja.html';
}

/* ==========================================================================
   GESTIÓN DE PACIENTES (ADMIN)
   ========================================================================== */
async function cargarPacientes() {
    const tbodies = document.querySelectorAll('.tabla-pacientes-body');
    tbodies.forEach(tbody => {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';
    });

    try {
        const respuesta = await fetchData(API_URL_PACIENTES);
        listaPacientesGlobal = respuesta;
        const tarjetaPacientes = document.getElementById('total-pacientes');
        if (tarjetaPacientes) tarjetaPacientes.textContent = listaPacientesGlobal.length;

        renderizarTablaPacientes(listaPacientesGlobal);
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
    }
}

function renderizarTablaPacientes(pacientes) {
    const tbodies = document.querySelectorAll('.tabla-pacientes-body');
    tbodies.forEach(tbody => {
        tbody.innerHTML = '';
        if (!pacientes || pacientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron pacientes.</td></tr>';
            return;
        }
        const fragmento = document.createDocumentFragment();
        pacientes.forEach(paciente => {
            const fila = document.createElement('tr');
            const idMostrar = paciente.idPaciente || paciente.id;
            fila.innerHTML = `
                <td><span class="badge bg-secondary">#${escaparHTML(idMostrar)}</span></td>
                <td><strong>${escaparHTML(paciente.nombre)}</strong></td>
                <td>${escaparHTML(paciente.diagnosticoInicial || 'N/A')}</td>
                <td>${escaparHTML(paciente.familiar?.nombre || 'Sin asignar')}</td>
                <td><span class="badge bg-success">${escaparHTML(paciente.medico?.nombre || 'Sin asignar')}</span></td>
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

function filtrarPacientes(texto) {
    const filtro = texto.toLowerCase().trim();
    const filtrados = listaPacientesGlobal.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(filtro)) ||
        (p.diagnosticoInicial && p.diagnosticoInicial.toLowerCase().includes(filtro))
    );
    renderizarTablaPacientes(filtrados);
}

function prepararEdicion(id) {
    const p = listaPacientesGlobal.find(item => (item.idPaciente || item.id) === id);
    if (!p) return;
    pacienteEditandoId = id;

    document.getElementById('paciente-id').value = id;
    document.getElementById('paciente-nombre').value = p.nombre || '';
    document.getElementById('paciente-nacimiento').value = p.fechaNacimiento || '';
    document.getElementById('paciente-ingreso').value = p.fechaIngreso || '';
    document.getElementById('paciente-diagnostico').value = p.diagnosticoInicial || '';
    document.getElementById('paciente-motivo').value = p.motivoReclusion || '';
    document.getElementById('paciente-psico').value = p.psicopatologias || '';
    document.getElementById('paciente-medicamentos').value = p.medicamentosCajon || '';
    if (p.familiar) {
        document.getElementById('paciente-familiar').value = p.familiar.nombre || '';
        document.getElementById('paciente-telefono-familiar').value = p.familiar.telefono || '';
        document.getElementById('paciente-correo-familiar').value = p.familiar.correo || '';
        document.getElementById('paciente-direccion-familiar').value = p.familiar.direccion || '';
    }
    if (p.medico) {
        document.getElementById('paciente-medico').value = p.medico.idUsuario || p.medico.id || '';
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPaciente')).show();
}

async function guardarPaciente(evento) {
    if (evento) evento.preventDefault();

    const idMedico = document.getElementById('paciente-medico').value;
    if (!idMedico) {
        Swal.fire('Atención', 'Seleccione un médico asignado.', 'warning');
        return;
    }

    const esEdicion = pacienteEditandoId !== null;
    const familiarNombre = document.getElementById('paciente-familiar').value.trim();
    let familiarObj = familiarNombre ? {
        nombre: familiarNombre,
        telefono: document.getElementById('paciente-telefono-familiar').value.trim(),
        correo: document.getElementById('paciente-correo-familiar').value.trim(),
        direccion: document.getElementById('paciente-direccion-familiar').value.trim()
    } : null;

    const payload = {
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
    try {
        await fetchData(url, { method: esEdicion ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        bootstrap.Modal.getInstance(document.getElementById('modalPaciente')).hide();
        Swal.fire('Éxito', `Paciente ${esEdicion ? 'actualizado' : 'registrado'}.`, 'success');
        await cargarPacientes();
    } catch (error) {
        Swal.fire('Error', error.message || 'No se pudo guardar el paciente.', 'error');
    }
}

async function eliminarPaciente(id) {
    const res = await Swal.fire({ title: '¿Eliminar paciente?', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) {
        try {
            await fetchData(`${API_URL_PACIENTES}/${id}`, { method: 'DELETE' });
            Swal.fire('Eliminado', 'Paciente borrado.', 'success');
            await cargarPacientes();
        } catch (error) {
            Swal.fire('Error', error.message || 'No se pudo eliminar.', 'error');
        }
    }
}

/* ==========================================================================
   INICIALIZACIÓN (ADMIN)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    mostrarNombreUsuario();
    aplicarLimitesFechas();

    const formUsuario = document.getElementById('form-usuario');
    if (formUsuario) formUsuario.addEventListener('submit', guardarUsuario);

    const formPaciente = document.getElementById('form-paciente');
    if (formPaciente) formPaciente.addEventListener('submit', guardarPaciente);

    document.querySelectorAll('.input-buscar-paciente').forEach(input => {
        input.addEventListener('input', debounce((e) => filtrarPacientes(e.target.value), 300));
    });

    cargarDatosUsuarios();
    cargarPacientes();
});