const API_URL_REPORTES = 'http://localhost:8081/api/reportes';

document.addEventListener("DOMContentLoaded", () => {
    cargarReporteCostosCitas();
});

function cambiarReporte(seccionId) {
    document.querySelectorAll('.seccion-reporte').forEach(el => {
        el.classList.add('d-none');
    });

    const target = document.getElementById(`seccion-${seccionId}`);
    if (target) {
        target.classList.remove('d-none');
    }

    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');

    // Cargar datos según la sección activa
    if (seccionId === 'costos-citas') {
        cargarReporteCostosCitas();
    } else if (seccionId === 'ficha-medica') {
        cargarReporteFichaMedica();
    } else if (seccionId === 'cobros-fecha') {
        cargarReporteCobrosFecha();
    } else if (seccionId === 'pagos-fundacion') {
        cargarReportePagosFundacion();
    } else if (seccionId === 'examenes-medicamentos') {
        // Próximamente: cargarReporteExamenesMedicamentos();
    }
}

async function cargarReporteCostosCitas() {
    try {
        const response = await fetch(`${API_URL_REPORTES}/costos-citas`);
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        
        const data = await response.json();
        const tbody = document.getElementById('tablaReporteCostos');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No hay registros de costos disponibles.</td></tr>`;
            return;
        }

        data.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.idVisita}</td>
                    <td>${item.nombrePaciente ? escaparHTML(item.nombrePaciente) : 'N/A'}</td>
                    <td>${item.fechaVisita || 'N/A'}</td>
                    <td>Q. ${item.costoConsulta.toFixed(2)}</td>
                    <td>Q. ${item.costoExamenes.toFixed(2)}</td>
                    <td>Q. ${item.costoMedicamentos.toFixed(2)}</td>
                    <td><strong>Q. ${item.costoTotal.toFixed(2)}</strong></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar el reporte de costos:", error);
        const tbody = document.getElementById('tablaReporteCostos');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error al cargar el reporte. Verifique la conexión.</td></tr>`;
        }
    }
}

// Cargar el Reporte de Ficha Médica y Análisis
async function cargarReporteFichaMedica() {
    try {
        const response = await fetch(`${API_URL_REPORTES}/ficha-medica`);
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        
        const data = await response.json();
        const tbody = document.getElementById('tablaReporteFichaMedica');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No hay registros de fichas médicas disponibles.</td></tr>`;
            return;
        }

        data.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.idPaciente}</td>
                    <td><strong>${item.nombrePaciente ? escaparHTML(item.nombrePaciente) : 'N/A'}</strong></td>
                    <td>${item.fechaIngreso || 'N/A'}</td>
                    <td>${item.diagnosticoInicial ? escaparHTML(item.diagnosticoInicial) : 'N/A'}</td>
                    <td>${item.motivoReclusion ? escaparHTML(item.motivoReclusion) : 'Sin especificar'}</td>
                    <td>${item.psicopatologias ? escaparHTML(item.psicopatologias) : 'Ninguna'}</td>
                    <td>${item.medicamentosCajon ? escaparHTML(item.medicamentosCajon) : 'Ninguno'}</td>
                    <td>${item.nombreFamiliar ? escaparHTML(item.nombreFamiliar) : 'N/A'}<br><small class="text-muted">${item.telefonoFamiliar || ''}</small></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar el reporte de ficha médica:", error);
        const tbody = document.getElementById('tablaReporteFichaMedica');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">Error al cargar la ficha médica.</td></tr>`;
        }
    }
}

// Cargar el Reporte de Cobros por Rango de Fecha
async function cargarReporteCobrosFecha() {
    const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
    const fechaFin = document.getElementById('filtro-fecha-fin').value;

    let url = `${API_URL_REPORTES}/cobros-fecha?`;
    if (fechaInicio) url += `fechaInicio=${fechaInicio}&`;
    if (fechaFin) url += `fechaFin=${fechaFin}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        
        const data = await response.json();
        const tbody = document.getElementById('tablaReporteCobros');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No se encontraron cobros en el rango de fechas seleccionado.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const badgeClase = item.estadoPago === 'PAGADO' ? 'bg-success' : 'bg-warning text-dark';
            tbody.innerHTML += `
                <tr>
                    <td>${item.idVisita}</td>
                    <td><strong>${item.nombrePaciente ? escaparHTML(item.nombrePaciente) : 'N/A'}</strong></td>
                    <td>${item.fechaVisita || 'N/A'}</td>
                    <td>Q. ${item.costoConsulta.toFixed(2)}</td>
                    <td>Q. ${item.costoExamenes.toFixed(2)}</td>
                    <td>Q. ${item.costoMedicamentos.toFixed(2)}</td>
                    <td><strong>Q. ${item.costoTotal.toFixed(2)}</strong></td>
                    <td><span class="badge ${badgeClase}">${item.estadoPago || 'PENDIENTE'}</span></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar el reporte de cobros:", error);
        const tbody = document.getElementById('tablaReporteCobros');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">Error al cargar el reporte de cobros.</td></tr>`;
        }
    }
}

// Cargar el Reporte de Pagos a la Fundación y Donaciones
async function cargarReportePagosFundacion() {
    try {
        const response = await fetch(`${API_URL_REPORTES}/pagos-fundacion`);
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        
        const data = await response.json();
        const tbody = document.getElementById('tablaReportePagos');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No hay registros de pagos o donaciones disponibles.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const badgeClase = item.tipoIngreso === 'CUOTA MENSUAL' ? 'bg-primary' : 'bg-success';
            tbody.innerHTML += `
                <tr>
                    <td>${item.idRegistro}</td>
                    <td><span class="badge ${badgeClase}">${item.tipoIngreso}</span></td>
                    <td><strong>${item.fuente ? escaparHTML(item.fuente) : 'Anónimo'}</strong></td>
                    <td><strong>Q. ${item.monto.toFixed(2)}</strong></td>
                    <td>${item.fecha || 'N/A'}</td>
                    <td>${item.detalle ? escaparHTML(item.detalle) : 'N/A'}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar el reporte de pagos:", error);
        const tbody = document.getElementById('tablaReportePagos');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Error al cargar los pagos y donaciones.</td></tr>`;
        }
    }
}

function escaparHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)
    );
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'login.html';
}