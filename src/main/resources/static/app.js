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

async function cargarPacientes() {
    try {
        const respuesta = await fetch(API_URL_PACIENTES);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

        const pacientes = await respuesta.json();
        const tbody = document.getElementById('tabla-pacientes');

        if (!tbody) return;
        tbody.innerHTML = '';

        const tarjetaPacientes = document.getElementById('total-pacientes');
        if (tarjetaPacientes) tarjetaPacientes.textContent = pacientes.length;

        if (pacientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No hay pacientes registrados.</td></tr>';
            return;
        }

        pacientes.forEach(paciente => {
            const fila = document.createElement('tr');
            const nombreMedico = paciente.medico && paciente.medico.nombre ? paciente.medico.nombre : 'Sin asignar';
            
            // Se actualizó la lectura del nombre del familiar desde el objeto anidado
            const nombreFamiliar = paciente.familiar && paciente.familiar.nombre ? paciente.familiar.nombre : 'Sin asignar';

            fila.innerHTML = `
                <td><span class="badge bg-secondary">#${paciente.idPaciente}</span></td>
                <td><strong>${paciente.nombre || 'Sin nombre'}</strong></td>
                <td>${paciente.diagnosticoInicial || 'N/A'}</td>
                <td>${nombreFamiliar}</td>
                <td><span class="badge bg-success">${nombreMedico}</span></td>
                <td>${paciente.fechaIngreso || 'N/A'}</td>
            `;
            tbody.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        const tbody = document.getElementById('tabla-pacientes');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>';
        }
    }
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
        
        // Filtra cualquier rol que contenga la palabra MEDICO
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

async function registrarPaciente(evento) {
    evento.preventDefault();

    const botonGuardar = document.querySelector('#form-paciente button[type="submit"]');
    if (botonGuardar) botonGuardar.disabled = true;

    const idMedico = document.getElementById('paciente-medico').value;
    if (!idMedico) {
        alert('Por favor, seleccione un médico asignado.');
        if (botonGuardar) botonGuardar.disabled = false;
        return;
    }

    const nuevoPaciente = {
        nombre: document.getElementById('paciente-nombre').value.trim(),
        fechaNacimiento: document.getElementById('paciente-nacimiento').value,
        fechaIngreso: document.getElementById('paciente-ingreso').value,
        diagnosticoInicial: document.getElementById('paciente-diagnostico').value.trim(),
        motivoReclusion: document.getElementById('paciente-motivo').value.trim(),
        psicopatologias: document.getElementById('paciente-psico').value.trim(),
        medicamentosCajon: document.getElementById('paciente-medicamentos').value.trim(),
        // Objeto de Familiar anidado:
        familiar: {
            nombre: document.getElementById('paciente-familiar').value.trim(),
            telefono: document.getElementById('paciente-telefono-familiar').value.trim(),
            correo: document.getElementById('paciente-correo-familiar').value.trim(),
            direccion: document.getElementById('paciente-direccion-familiar').value.trim()
        },
        medico: { idUsuario: parseInt(idMedico) }
    };

    try {
        const respuesta = await fetch(API_URL_PACIENTES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoPaciente)
        });

        if (respuesta.ok) {
            alert('Paciente y Familiar registrados exitosamente.');
            const modalElement = document.getElementById('modalPaciente');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            document.getElementById('form-paciente').reset();
            cargarPacientes();
        } else {
            alert('Error al registrar paciente. Revisa los datos.');
        }
    } catch (error) {
        console.error('Error al guardar paciente:', error);
        alert('No se pudo conectar con el servidor.');
    } finally {
        if (botonGuardar) botonGuardar.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const infoUsuario = document.getElementById('info-usuario');
    if (infoUsuario && usuario) {
        infoUsuario.textContent = `${usuario.nombre} (${usuario.rol})`;
    }

    cargarPacientes();
    cargarContadorUsuarios();
    cargarMedicosSelect();
});