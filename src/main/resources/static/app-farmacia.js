const usuarioGuardado = localStorage.getItem('usuario');
if (!usuarioGuardado) window.location.href = 'login.html';

const usuario = JSON.parse(usuarioGuardado || '{}');
if (usuario.rol !== 'FARMACIA' && usuario.rol !== 'ADMIN') {
    window.location.href = 'index.html';
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Ajustado al puerto habitual de Spring Boot (8080)
const API_URL_FARMACIA = 'http://localhost:8081/api/farmacia';
let listaRecetasGlobal = [];

async function fetchData(url, options = {}) {
    const defaultHeaders = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

    const config = { ...options, headers: { ...defaultHeaders, ...options.headers } };
    const respuesta = await fetch(url, config);
    if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
    return await respuesta.json();
}

async function cargarRecetasFarmacia() {
    const tbody = document.getElementById('tablaRecetas') || document.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-success"></div></td></tr>';
    }

    try {
        listaRecetasGlobal = await fetchData(API_URL_FARMACIA) || [];
        filtrarRecetas();
    } catch (error) {
        console.error('Error al cargar recetas:', error);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error al conectar con la API de farmacia.</td></tr>';
        }
    }
}

function renderizarTablaRecetas(recetas) {
    const tbody = document.getElementById('tablaRecetas') || document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!recetas || recetas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hay recetas registradas.</td></tr>';
        return;
    }

    recetas.forEach(rec => {
        const id = rec.idReceta || rec.id_receta;
        const idVisita = rec.idVisita || rec.id_visita || 'N/A';
        const estado = String(rec.estado || 'PENDIENTE_ENTREGA').toUpperCase();
        const badgeClase = estado === 'ENTREGADO' ? 'bg-success' : 'bg-warning text-dark';
        
        // Formato para el costo
        const costoVal = parseFloat(rec.costoMedicamento);
        const costoTxt = (!isNaN(costoVal) && costoVal > 0) 
            ? `Q${costoVal.toFixed(2)}` 
            : 'Q0.00';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge bg-secondary">#${idVisita}</span></td>
            <td class="fw-bold">${rec.nombrePaciente || 'Visita #' + idVisita}</td>
            <td class="fw-bold text-success">${escaparHTML(rec.medicamento || '')}</td>
            <td>${escaparHTML(rec.dosis || 'N/A')} / ${escaparHTML(rec.tiempoAplicacion || 'N/A')}</td>
            <td>${costoTxt}</td>
            <td><span class="badge ${badgeClase}">${estado}</span></td>
            <td class="text-center">
                <button class="btn btn-sm ${estado === 'PENDIENTE_ENTREGA' ? 'btn-success fw-bold' : 'btn-outline-secondary'}" onclick="abrirModalDespachar(${id})">
                    ${estado === 'PENDIENTE_ENTREGA' ? '<i class="bi bi-box-seam me-1"></i> Despachar' : '<i class="bi bi-pencil me-1"></i> Editar'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarRecetas() {
    const inputBuscador = document.getElementById('inputBuscador') || document.querySelector('input[type="text"]');
    const selectFiltro = document.getElementById('selectFiltroEstado') || document.querySelector('select');

    const texto = inputBuscador ? inputBuscador.value.toLowerCase().trim() : '';
    const filtroVal = selectFiltro ? selectFiltro.value : 'TODOS';

    const filtrados = listaRecetasGlobal.filter(r => {
        const paciente = (r.nombrePaciente || '').toLowerCase();
        const med = (r.medicamento || '').toLowerCase();
        const idVisita = String(r.idVisita || r.id_visita || '');
        const estadoReceta = String(r.estado || 'PENDIENTE_ENTREGA').toUpperCase();

        const coincideTexto = paciente.includes(texto) || med.includes(texto) || idVisita.includes(texto);
        
        let coincideEstado = true;
        // Soporta tanto los valores con guion bajo como las opciones del select en español
        if (filtroVal === 'PENDIENTE_ENTREGA' || filtroVal.toLowerCase().includes('pendiente')) {
            coincideEstado = (estadoReceta === 'PENDIENTE_ENTREGA');
        } else if (filtroVal === 'ENTREGADO' || filtroVal.toLowerCase().includes('entregado')) {
            coincideEstado = (estadoReceta === 'ENTREGADO');
        }

        return coincideTexto && coincideEstado;
    });

    renderizarTablaRecetas(filtrados);
}

function abrirModalDespachar(id) {
    const rec = listaRecetasGlobal.find(r => (r.idReceta || r.id_receta) == id);
    if (!rec) return;

    const modalId = document.getElementById('modalIdReceta');
    const modalPaciente = document.getElementById('modalPaciente');
    const modalMedicamento = document.getElementById('modalMedicamento');
    const modalCosto = document.getElementById('modalCosto');
    const modalObs = document.getElementById('modalObservaciones');

    if (modalId) modalId.value = rec.idReceta || rec.id_receta;
    if (modalPaciente) modalPaciente.value = rec.nombrePaciente || `Visita #${rec.idVisita || 'N/A'}`;
    if (modalMedicamento) modalMedicamento.value = `${rec.medicamento || ''} (${rec.dosis || ''})`;
    if (modalCosto) modalCosto.value = rec.costoMedicamento || 0;
    if (modalObs) modalObs.value = rec.observaciones || '';

    const modalElem = document.getElementById('modalDespachar');
    if (modalElem && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(modalElem).show();
    } else {
        // En caso de que no usen modalBootstrap, despacho directo
        if (confirm("¿Marcar este medicamento como ENTREGADO?")) {
            guardarDespachoDirecto(rec.idReceta || rec.id_receta, rec.costoMedicamento || 0);
        }
    }
}

async function guardarDespachoDirecto(id, costo) {
    try {
        await fetchData(`${API_URL_FARMACIA}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ costoMedicamento: costo, estado: 'ENTREGADO' })
        });
        alert('El medicamento ha sido registrado como ENTREGADO.');
        cargarRecetasFarmacia();
    } catch (err) {
        alert('Error al despachar el medicamento.');
    }
}

async function guardarDespacho(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('modalIdReceta').value;
    const costo = parseFloat(document.getElementById('modalCosto').value) || 0;
    const obs = document.getElementById('modalObservaciones') ? document.getElementById('modalObservaciones').value : '';

    try {
        await fetchData(`${API_URL_FARMACIA}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ costoMedicamento: costo, observaciones: obs, estado: 'ENTREGADO' })
        });

        if (typeof Swal !== 'undefined') {
            Swal.fire('¡Despachado!', 'El medicamento ha sido registrado con éxito.', 'success');
        } else {
            alert('El medicamento ha sido registrado con éxito.');
        }

        const modalElem = document.getElementById('modalDespachar');
        if (modalElem && typeof bootstrap !== 'undefined') {
            bootstrap.Modal.getInstance(modalElem)?.hide();
        }

        cargarRecetasFarmacia();
    } catch (err) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'No se pudo procesar el despacho.', 'error');
        } else {
            alert('Error al procesar el despacho.');
        }
    }
}

function escaparHTML(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {
    const elUsuario = document.getElementById('info-usuario');
    if (elUsuario && usuario.nombre) elUsuario.textContent = usuario.nombre;

    // Listeners para los controles de filtro
    const inputBuscador = document.getElementById('inputBuscador') || document.querySelector('input[type="text"]');
    const selectFiltro = document.getElementById('selectFiltroEstado') || document.querySelector('select');

    if (inputBuscador) inputBuscador.addEventListener('input', filtrarRecetas);
    if (selectFiltro) selectFiltro.addEventListener('change', filtrarRecetas);

    cargarRecetasFarmacia();
});