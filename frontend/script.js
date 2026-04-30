const API_BASE = 'http://localhost:3000'; 

// VALIDACIÓN DE SESIÓN
const session = localStorage.getItem('userSISC');
// Si no hay sesión y no estamos ya en el login, redirigir
if (!session && !window.location.pathname.includes('login')) {
    window.location.href = '/login'; // Esta ruta la definimos en server.js
}

async function loadView(viewName) {
    const contentArea = document.getElementById('content-area');
    const titleArea = document.getElementById('view-title');

    // Estilo activo en el menú
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('nav-active'));
    const activeBtn = document.getElementById(`btn-${viewName}`);
    if (activeBtn) activeBtn.classList.add('nav-active');

    try {
        const response = await fetch(`/vistas/${viewName}.html`);
        const html = await response.text();
        contentArea.innerHTML = html;
        titleArea.innerText = viewName;

        if (viewName === 'registro') initRegistro();
        if (viewName === 'login') initLogin();
        if (viewName === 'perfil') initPerfil();
        if (viewName === 'dashboard') initDashboard();
        if (viewName === 'inventario') initInventario();
        if (viewName === 'usuarios') initUsuarios();
    } catch (e) {
        console.error("Error cargando vista:", e);
    }
}

const user = JSON.parse(session);

async function descargarReporte(tipo) {
    try {
        const res = await fetch(`${API_BASE}/productos`);
        const productos = await res.json();

        if (tipo === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Encabezado del PDF
            doc.setFontSize(20);
            doc.setTextColor(30, 41, 59); // Color Slate-800
            doc.text("Reporte de Inventario - Toby´s", 14, 22);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generado por: Carla Díaz | Fecha: ${new Date().toLocaleString()}`, 14, 30);

            // Tabla automática con jsPDF-AutoTable
            const tableData = productos.map(p => [p.id, p.nombre, `${p.stock} unidades`]);
            
            doc.autoTable({
                head: [['ID', 'Producto', 'Disponibilidad']],
                body: tableData,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] }, // Azul
                styles: { font: 'helvetica', fontSize: 10 }
            });

            doc.save("Reporte_Inventario_SISC.pdf");
        } else {
            // Excel/CSV 
            let csv = "ID,Producto,Stock\n";
            productos.forEach(p => csv += `${p.id},${p.nombre},${p.stock}\n`);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", "Inventario_SISC.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        alert("Error al generar el reporte. Verifica la conexión con el servidor.");
    }
}

async function initDashboard() {
    const resStats = await fetch(`${API_BASE}/stats`);
    const stats = await resStats.json();
    
    document.getElementById('dash-total').innerText = stats.total;
    document.getElementById('dash-stock').innerText = stats.stock_total;
    document.getElementById('dash-bajo').innerText = stats.stock_bajo;

    // Generar gráfica de stock de los productos
    const resProd = await fetch(`${API_BASE}/productos`);
    const productos = await resProd.json();
    
    const ctx = document.getElementById('stockChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: productos.slice(0, 6).map(p => p.nombre),
            datasets: [{
                label: 'Stock Actual',
                data: productos.slice(0, 6).map(p => p.stock),
                backgroundColor: '#3b82f6',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

async function initInventario() {
    const res = await fetch(`${API_BASE}/productos`);
    const productos = await res.json();
    const tabla = document.getElementById('tabla-productos');
    if(!tabla) return;

    tabla.innerHTML = productos.map(p => `
        <tr class="hover:bg-slate-50 border-b border-slate-100 transition">
            <td class="p-4 text-slate-400 font-mono text-xs">#${p.id}</td>
            <td class="p-4 font-bold text-slate-700">${p.nombre}</td>
            <td class="p-4"><span class="${p.stock < 10 ? 'text-rose-500 font-bold' : ''}">${p.stock} pzas</span></td>
            <td class="p-4 text-center">
                <button onclick="eliminarProducto(${p.id})" class="text-rose-500 hover:scale-125 transition">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function eliminarProducto(id) {
    if(confirm('¿Eliminar producto?')) {
        await fetch(`${API_BASE}/productos/${id}`, { method: 'DELETE' });
        initInventario();
    }
}

// Funciones para el Modal de Usuarios
function abrirModalUsuario() { document.getElementById('modal-usuario').classList.remove('hidden'); }
function cerrarModalUsuario() { document.getElementById('modal-usuario').classList.add('hidden'); }

// Guardar nuevo usuario
async function guardarUsuario() {
    const nombre = document.getElementById('user_nombre').value;
    const correo = document.getElementById('user_correo').value;
    const rol = document.getElementById('user_rol').value;

    if(!nombre || !correo) return alert("Por favor, llena los campos.");

    await fetch(`${API_BASE}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, rol })
    });

    cerrarModalUsuario();
    initUsuarios(); // Recargar la tabla
}

// Eliminar usuario
async function eliminarUsuario(id) {
    if(confirm('¿Estás seguro de eliminar a este colaborador?')) {
        await fetch(`${API_BASE}/usuarios/${id}`, { method: 'DELETE' });
        initUsuarios();
    }
}

async function initUsuarios() {
    const res = await fetch(`${API_BASE}/usuarios`);
    const usuarios = await res.json();
    const tabla = document.getElementById('tabla-usuarios');
    if(!tabla) return;

    tabla.innerHTML = usuarios.map(u => `
        <tr class="border-b hover:bg-slate-50">
            <td class="p-4"><div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">${u.nombre.charAt(0)}</div></td>
            <td class="p-4 font-bold text-slate-700">${u.nombre}</td>
            <td class="p-4 text-slate-500 text-sm">${u.correo}</td>
            <td class="p-4"><span class="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold uppercase">${u.rol}</span></td>
            <td class="p-4 text-center">
                <button onclick="eliminarUsuario(${u.id})" class="text-rose-500 hover:scale-110 transition">
                    <i class="fas fa-user-minus"></i>
                </button>
            </td>
        </tr>
    `).join('');
}
function toggleModal() { document.getElementById('modal').classList.toggle('hidden'); }

async function guardarProducto() {
    const nombre = document.getElementById('nombre_prod').value;
    const stock = document.getElementById('stock_prod').value;
    await fetch(`${API_BASE}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, stock: parseInt(stock) })
    });
    toggleModal();
    loadView('inventario');
}

window.onload = () => loadView('dashboard');