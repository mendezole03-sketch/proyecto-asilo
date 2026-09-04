// 1. Validar que el usuario haya iniciado sesión
const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    // Si no hay datos de usuario, lo mandamos al login
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado);

// 2. Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// Lógica de carga de pacientes
const API_URL = 'http://localhost:8081/api/pacientes';

async function cargarPacientes() {
    try {
        const respuesta = await fetch(API_URL);
        const pacientes = await respuesta.json();
        
        const tbody = document.getElementById('tabla-pacientes');
        tbody.innerHTML = '';

        if (pacientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        No hay pacientes registrados.
                    </td>
                </tr>`;
            return;
        }

        pacientes.forEach(paciente => {
            const fila = document.createElement('tr');
            
            // Extraer el nombre del médico asignado si existe en el objeto paciente
            const nombreMedico = paciente.medico ? paciente.medico.nombre : 'Sin asignar';

            fila.innerHTML = `
                <td><span class="badge-id">#${paciente.idPaciente}</span></td>
                <td><strong>${paciente.nombre}</strong></td>
                <td>${paciente.diagnosticoInicial || 'N/A'}</td>
                <td>${paciente.nombreFamiliar || 'Sin asignar'}</td>
                <td><span class="badge bg-success">${nombreMedico}</span></td>
                <td>${paciente.fechaIngreso || 'N/A'}</td>
            `;
            tbody.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        document.getElementById('tabla-pacientes').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    Error al conectar con el servidor. Verifica que el backend esté ejecutándose.
                </td>
            </tr>`;
    }
}

// Mostrar los datos del usuario logueado al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    const infoUsuario = document.getElementById('info-usuario');
    if (infoUsuario) {
        infoUsuario.textContent = `${usuario.nombre} (${usuario.rol})`;
    }
    cargarPacientes();
});