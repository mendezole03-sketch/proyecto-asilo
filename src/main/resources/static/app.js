const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado);

function cerrarSesion() {
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

const API_URL_PACIENTES = 'http://localhost:8081/api/pacientes';
const API_URL_USUARIOS = 'http://localhost:8081/api/usuarios';

let listaPacientesGlobal = [];
let pacienteEditandoId = null;

// Configuración de límites de fechas en inputs
function aplicarLimitesFechas() {
    const hoy = new Date();
    const fechaHoyStr = hoy.toISOString().split('T')[0];

    const inputIngreso = document.getElementById("paciente-ingreso");
    if (inputIngreso) {
        inputIngreso.setAttribute("max", fechaHoyStr);
    }

    const hace60Anios = new Date();
    hace60Anios.setFullYear(hoy.getFullYear() - 60);
    const fechaMaxNacimientoStr = hace60Anios.toISOString().split('T')[0];

    const inputNacimiento = document.getElementById("paciente-nacimiento");
    if (inputNacimiento) {
        inputNacimiento.setAttribute("min", "1900-01-01");
        inputNacimiento.setAttribute("max", fechaMaxNacimientoStr);
    }
}

// Carga principal de pacientes desde el backend
async function cargarPacientes() {
    try {
        const respuesta = await fetch(API_URL_PACIENTES);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

        listaPacientesGlobal = await respuesta.json();
        
        const tarjetaPacientes = document.getElementById('total-pacientes');
        if (tarjetaPacientes) tarjetaPacientes.textContent = listaPacientesGlobal.length;

        renderizarTablaPacientes(listaPacientesGlobal);

    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        const tbody = document.getElementById('tabla-pacientes');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>';
        }
    }
}

// Renderizado de tabla y generación de filas
function renderizarTablaPacientes(pacientes) {
    const tbody = document.getElementById('tabla-pacientes');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (pacientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron pacientes.</td></tr>';
        return;
    }

    pacientes.forEach(paciente => {
        const fila = document.createElement('tr');
        const nombreMedico = paciente.medico && paciente.medico.nombre ? paciente.medico.nombre : 'Sin asignar';
        const nombreFamiliar = paciente.familiar && paciente.familiar.nombre ? paciente.familiar.nombre : 'Sin asignar';

        fila.innerHTML = `
            <td><span class="badge bg-secondary">#${paciente.idPaciente}</span></td>
            <td><strong>${paciente.nombre || 'Sin nombre'}</strong></td>
            <td>${paciente.diagnosticoInicial || 'N/A'}</td>
            <td>${nombreFamiliar}</td>
            <td><span class="badge bg-success">${nombreMedico}</span></td>
            <td>${paciente.fechaIngreso || 'N/A'}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="prepararEdicion(${paciente.idPaciente})">
                    ✏️ Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarPaciente(${paciente.idPaciente})">
                    🗑️ Borrar
                </button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// Filtro en tiempo real para el buscador
function filtrarPacientes(textoBusqueda) {
    const filtro = textoBusqueda.toLowerCase().trim();
    const pacientesFiltrados = listaPacientesGlobal.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(filtro)) ||
        (p.diagnosticoInicial && p.diagnosticoInicial.toLowerCase().includes(filtro)) ||
        (p.familiar && p.familiar.nombre && p.familiar.nombre.toLowerCase().includes(filtro)) ||
        (p.medico && p.medico.nombre && p.medico.nombre.toLowerCase().includes(filtro))
    );
    renderizarTablaPacientes(pacientesFiltrados);
}

async function cargarContadorUsuarios() {
    try {
        const respuesta = await fetch(API_URL_USUARIOS);
        if (respuesta.ok) {
            const usuarios = await respuesta.json();
            const tarjetaUsuarios = document.getElementById('total-usuarios');
            if (tarjetaUsuarios) tarjetaUsuarios.textContent = usuarios.length;
        }
    } catch (error) {
        console.warn('Endpoint de usuarios aún no disponible.');
    }
}

async function cargarMedicosSelect() {
    const selectMedico = document.getElementById('paciente-medico');
    if (!selectMedico) return;

    try {
        const respuesta = await fetch(API_URL_USUARIOS);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

        const usuarios = await respuesta.json();
        const medicos = usuarios.filter(u => u.rol && u.rol.toUpperCase().includes('MEDICO'));

        selectMedico.innerHTML = '<option value="">-- Seleccione un Médico --</option>';

        medicos.forEach(medico => {
            const opcion = document.createElement('option');
            opcion.value = medico.idUsuario;
            opcion.textContent = medico.nombre;
            selectMedico.appendChild(opcion);
        });

        if (medicos.length === 0) {
            selectMedico.innerHTML = '<option value="">No hay médicos disponibles</option>';
        }

    } catch (error) {
        console.error('Error al cargar médicos:', error);
        selectMedico.innerHTML = '<option value="">Error al cargar lista de médicos</option>';
    }
}

// Carga los datos del paciente seleccionado en el formulario para editar
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
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

// Resetea el modal al estado de registro
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

// Crear (POST) o Actualizar (PUT) Paciente
async function guardarPaciente(evento) {
    if (evento) {
        evento.preventDefault();
        evento.stopImmediatePropagation();
    }

    const botonGuardar = document.querySelector('#form-paciente button[type="submit"]');
    if (botonGuardar && botonGuardar.disabled) return;
    if (botonGuardar) botonGuardar.disabled = true;

    const idMedico = document.getElementById('paciente-medico').value;
    if (!idMedico) {
        Swal.fire('Atención', 'Por favor, seleccione un médico asignado.', 'warning');
        if (botonGuardar) botonGuardar.disabled = false;
        return;
    }

    const esEdicion = pacienteEditandoId !== null;
    const pacienteActual = esEdicion ? listaPacientesGlobal.find(p => p.idPaciente === pacienteEditandoId) : null;

    // Construcción limpia del objeto familiar
    const nombreFamiliar = document.getElementById('paciente-familiar').value.trim();
    let familiarObj = null;

    if (nombreFamiliar !== '') {
        familiarObj = {
            nombre: nombreFamiliar,
            telefono: document.getElementById('paciente-telefono-familiar').value.trim(),
            correo: document.getElementById('paciente-correo-familiar').value.trim(),
            direccion: document.getElementById('paciente-direccion-familiar').value.trim()
        };

        // Solo se adjunta el ID si ya existía para evitar conflictos en POST
        if (pacienteActual && pacienteActual.familiar && pacienteActual.familiar.idFamiliar) {
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
        const respuesta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pacientePayload)
        });

        if (respuesta.ok) {
            Swal.fire(
                'Éxito', 
                `Paciente ${esEdicion ? 'actualizado' : 'registrado'} correctamente.`, 
                'success'
            );
            
            const modalElement = document.getElementById('modalPaciente');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            limpiarFormularioPaciente();
            cargarPacientes();
        } else {
            const mensajeError = await respuesta.text();
            Swal.fire('Error', mensajeError || 'Revisa los datos ingresados e intenta de nuevo.', 'error');
        }
    } catch (error) {
        console.error('Error al procesar paciente:', error);
        Swal.fire('Error de conexión', 'No se pudo conectar con el servidor.', 'error');
    } finally {
        if (botonGuardar) botonGuardar.disabled = false;
    }
}

// Eliminar (DELETE) Paciente
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
            const respuesta = await fetch(`${API_URL_PACIENTES}/${id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                Swal.fire('Eliminado', 'El paciente ha sido eliminado.', 'success');
                cargarPacientes();
            } else {
                Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar paciente:', error);
            Swal.fire('Error de conexión', 'No se pudo conectar con el servidor.', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const infoUsuario = document.getElementById('info-usuario');
    if (infoUsuario && usuario) {
        infoUsuario.textContent = `${usuario.nombre} (${usuario.rol})`;
    }

    aplicarLimitesFechas();
    cargarPacientes();
    cargarContadorUsuarios();
    cargarMedicosSelect();

    // Event listener único para el formulario
    const formPaciente = document.getElementById('form-paciente');
    if (formPaciente) {
        formPaciente.addEventListener('submit', guardarPaciente);
    }

    // Listener para limpiar datos cuando se cierra el modal
    const modalElement = document.getElementById('modalPaciente');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', limpiarFormularioPaciente);
    }

    // Listener para el buscador en tiempo real
    const inputBuscador = document.getElementById('input-buscar-paciente');
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => filtrarPacientes(e.target.value));
    }
});