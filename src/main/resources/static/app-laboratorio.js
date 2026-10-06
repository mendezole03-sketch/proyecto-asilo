/* ==========================================================================
   CONFIGURACIÓN Y CONTROL DE SESIÓN - LABORATORIO CLÍNICO
   ========================================================================== */
const usuarioGuardado = localStorage.getItem('usuario');

if (!usuarioGuardado) {
    window.location.href = 'login.html';
}

const usuario = JSON.parse(usuarioGuardado || '{}');

// Seguridad de acceso por rol (Permitir LABORATORIO o ADMIN)
if (usuario.rol !== 'LABORATORIO' && usuario.rol !== 'ADMIN') {
    window.location.href = 'index.html';
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Endpoints API Backend
const API_URL_BASE = 'http://localhost:8081';
const API_URL_EXAMENES = `${API_URL_BASE}/api/examenes`;

let listaExamenesGlobal = [];

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
   CARGA Y RENDERIZADO DE EXÁMENES DE LABORATORIO
   ========================================================================== */

async function cargarExamenesLaboratorio() {
    const tbody = document.getElementById('tablaExamenes');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';

    try {
        const examenes = await fetchData(API_URL_EXAMENES);
        listaExamenesGlobal = examenes || [];
        
        filtrarExamenes();

    } catch (error) {
        console.error('Error al cargar la lista de exámenes:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error al conectar con el servidor backend.</td></tr>';
    }
}

function renderizarTablaExamenes(examenes) {
    const tbody = document.getElementById('tablaExamenes');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!examenes || examenes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron exámenes registrados.</td></tr>';
        return;
    }

    const fragmento = document.createDocumentFragment();

    examenes.forEach(ex => {
        const idExamen = ex.idExamen || ex.id_examen || ex.id;
        const idVisita = ex.idVisita || ex.id_visita || 'N/A';
        const paciente = ex.nombrePaciente || ex.nombre_paciente || 'Paciente General';
        const nombreExamen = ex.nombreExamen || ex.nombre_examen || 'Examen Clínico';
        const costo = ex.costoExamen ?? ex.costo_examen;
        const estado = String(ex.estado || 'ORDENADO').toUpperCase();
        const resultado = ex.resultado || '';

        const badgeClase = estado === 'REALIZADO' ? 'bg-success' : 'bg-warning text-dark';
        const costoTxt = (costo !== null && costo !== undefined) 
            ? `Q${parseFloat(costo).toFixed(2)}` 
            : `<span class="text-danger fw-bold">Sin asignar</span>`;
        const resultadoTxt = resultado ? escaparHTML(resultado) : `<span class="text-muted">Pendiente...</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge bg-secondary">#${escaparHTML(idVisita)}</span></td>
            <td class="fw-bold">${escaparHTML(paciente)}</td>
            <td>${escaparHTML(nombreExamen)}</td>
            <td>${costoTxt}</td>
            <td><span class="badge ${badgeClase}">${escaparHTML(estado)}</span></td>
            <td><small class="text-truncate d-inline-block" style="max-width: 200px;">${resultadoTxt}</small></td>
            <td class="text-center">
                ${estado === 'ORDENADO' ? `
                    <button class="btn btn-sm btn-primary fw-bold" onclick="abrirModalProcesar(${idExamen})">
                        <i class="bi bi-plus-lg me-1"></i> Atender
                    </button>
                ` : `
                    <button class="btn btn-sm btn-outline-secondary" onclick="abrirModalProcesar(${idExamen})">
                        <i class="bi bi-pencil-square me-1"></i> Ver / Editar
                    </button>
                `}
            </td>
        `;
        fragmento.appendChild(tr);
    });

    tbody.appendChild(fragmento);
}

/* ==========================================================================
   FILTRADO Y BÚSQUEDA DE EXÁMENES
   ========================================================================== */

function filtrarExamenes() {
    const inputBuscador = document.getElementById('inputBuscador');
    const selectEstado = document.getElementById('selectFiltroEstado');

    const texto = inputBuscador ? inputBuscador.value.toLowerCase().trim() : '';
    const estadoFiltro = selectEstado ? selectEstado.value : 'TODOS';

    const filtrados = listaExamenesGlobal.filter(ex => {
        const idVisitaStr = String(ex.idVisita || ex.id_visita || '');
        const pacienteStr = String(ex.nombrePaciente || ex.nombre_paciente || '').toLowerCase();
        const examenStr = String(ex.nombreExamen || ex.nombre_examen || '').toLowerCase();

        const coincideTexto = pacienteStr.includes(texto) || examenStr.includes(texto) || idVisitaStr.includes(texto);
        const coincideEstado = (estadoFiltro === 'TODOS') || (String(ex.estado || '').toUpperCase() === estadoFiltro);

        return coincideTexto && coincideEstado;
    });

    renderizarTablaExamenes(filtrados);
}

/* ==========================================================================
   MODAL DE ATENCIÓN Y REGISTRO DE RESULTADOS
   ========================================================================== */

function abrirModalProcesar(idExamen) {
    const examen = listaExamenesGlobal.find(e => (e.idExamen || e.id_examen || e.id) == idExamen);
    if (!examen) {
        Swal.fire('Error', 'No se encontró la información del examen.', 'error');
        return;
    }

    document.getElementById('modalIdExamen').value = examen.idExamen || examen.id_examen || examen.id;
    document.getElementById('modalIdVisita').value = examen.idVisita || examen.id_visita || 0;
    document.getElementById('modalPaciente').value = examen.nombrePaciente || examen.nombre_paciente || 'Paciente General';
    document.getElementById('modalNombreExamen').value = examen.nombreExamen || examen.nombre_examen || '';
    document.getElementById('modalCostoExamen').value = (examen.costoExamen ?? examen.costo_examen) || '';
    document.getElementById('modalResultado').value = examen.resultado || '';

    const modalElement = document.getElementById('modalProcesarExamen');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
}

/* ==========================================================================
   ACTUALIZAR COSTO Y RESULTADO DE EXAMEN (PUT)
   ========================================================================== */

async function guardarResultadoExamen(evento) {
    if (evento) evento.preventDefault();

    const idExamen = parseInt(document.getElementById('modalIdExamen')?.value, 10);
    const idVisita = parseInt(document.getElementById('modalIdVisita')?.value, 10);
    const nombreExamen = document.getElementById('modalNombreExamen')?.value;
    const costoExamen = parseFloat(document.getElementById('modalCostoExamen')?.value) || 0.0;
    const resultado = document.getElementById('modalResultado')?.value.trim();

    if (!resultado) {
        Swal.fire('Atención', 'Por favor ingrese el resultado del examen.', 'warning');
        return;
    }

    if (isNaN(costoExamen) || costoExamen < 0) {
        Swal.fire('Atención', 'Por favor ingrese un costo de examen válido.', 'warning');
        return;
    }

    // Payload para actualizar la tabla examen_laboratorio mediante Spring Boot
    const payload = {
        idExamen: idExamen,
        idVisita: idVisita,
        nombreExamen: nombreExamen,
        costoExamen: costoExamen,
        resultado: resultado,
        estado: 'REALIZADO'
    };

    console.log("Enviando Payload Examen Laboratorio:", JSON.stringify(payload));

    const btnSubmit = document.querySelector('#formProcesarExamen button[type="submit"]');
    const textoOriginal = btnSubmit ? btnSubmit.innerHTML : 'Guardar y Completar';
    setButtonLoading(btnSubmit, true);

    try {
        await fetchData(`${API_URL_EXAMENES}/${idExamen}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        Swal.fire({
            title: '¡Examen Completado!',
            text: 'Se han guardado el costo y los resultados correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#198754'
        });

        const modalElement = document.getElementById('modalProcesarExamen');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        document.getElementById('formProcesarExamen')?.reset();
        await cargarExamenesLaboratorio();

    } catch (error) {
        console.error('Error al guardar el examen de laboratorio:', error);
        Swal.fire('Error al procesar', 'Revisa la consola para más detalles.', 'error');
    } finally {
        setButtonLoading(btnSubmit, false, textoOriginal);
    }
}

/* ==========================================================================
   INICIALIZACIÓN Y EVENT LISTENERS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Nombre del laboratorio/usuario en el navbar
    const infoUsuarioEl = document.getElementById('info-usuario');
    if (infoUsuarioEl && usuario && usuario.nombre) {
        infoUsuarioEl.textContent = usuario.nombre;
    }

    // Event Listener para el formulario
    const formProcesar = document.getElementById('formProcesarExamen');
    if (formProcesar) {
        formProcesar.addEventListener('submit', guardarResultadoExamen);
    }

    // Cargar exánenes al iniciar la vista
    cargarExamenesLaboratorio();
});