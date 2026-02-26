// URL base de tu servidor
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://pasantias-j1sf.onrender.com';

// ----------------- LOGIN -----------------
const loginBtn = document.getElementById('loginBtn');
const statusDiv = document.getElementById('status');
let chartMantenimiento;
let chartOficinas;

if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    if (!usuario || !password) {
      statusDiv.textContent = 'Ingrese usuario y contraseña';
      return;
    }

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = 'inventario.html';
      } else {
        statusDiv.textContent = 'Usuario o contraseña incorrectos';
      }

    } catch (err) {
      console.error(err);
      statusDiv.textContent = 'Error en la conexión';
    }
  });
}

// ----------------- INVENTARIO -----------------
const equiposTable = document.querySelector('#equiposTable tbody');
const logoutBtn = document.getElementById('logoutBtn');

const searchInput = document.getElementById("searchInput");
const filterOffice = document.getElementById("filterOffice");
const filterMaintenance = document.getElementById("filterMaintenance");

let equiposGlobal = [];

// Cargar inventario
async function cargarInventario() {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  try {
    const res = await fetch(`${API_URL}/inventario`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    equiposGlobal = await res.json();

    if (filterOffice) cargarOficinas();
    renderTabla(equiposGlobal);
    actualizarDashboard();

  } catch (err) {
    console.error(err);
    if (equiposTable) {
      equiposTable.innerHTML = `<tr><td colspan="18">Error al cargar inventario</td></tr>`;
    }
  }
}

// Cargar oficinas únicas en el select
function cargarOficinas() {
  const oficinasUnicas = [...new Set(equiposGlobal.map(e => e.oficina))];

  filterOffice.innerHTML = `<option value="">Todas las oficinas</option>`;

  oficinasUnicas.forEach(of => {
    const option = document.createElement("option");
    option.value = of;
    option.textContent = of;
    filterOffice.appendChild(option);
  });
}

// Renderizar tabla
function renderTabla(data) {
  if (!equiposTable) return;

  equiposTable.innerHTML = '';

  data.forEach(eq => {
    const tr = document.createElement("tr");

    if (eq.necesitaMantenimiento === "Sí") {
      tr.classList.add("needs-maintenance");
    }

    tr.innerHTML = `
      <td>${eq.codigoTorre}</td>
      <td>${eq.codigoPantalla}</td>
      <td>${eq.codigoTeclado}</td>
      <td>${eq.codigoMouse}</td>
      <td>${eq.oficina}</td>
      <td>${eq.tieneMantenimiento || ''}</td>
      <td>${eq.ultimoMantenimiento || ''}</td>
      <td>${eq.detalleMantenimientoPrevio || ''}</td>
      <td>${eq.necesitaMantenimiento || ''}</td>
      <td>${eq.detalleMantenimiento || ''}</td>
      <td>${eq.comentario || ''}</td>
      <td>${eq.nombreDispositivo}</td>
      <td>${eq.procesador}</td>
      <td>${eq.ramInstalada}</td>
      <td>${eq.discoDuro}</td>
      <td>${eq.sistemaOperativo}</td>
      <td>${eq.direccionIP}</td>
      <td>${eq.fecha || ''}</td>
      <td>
        <button class="btn btn-warning btn-sm edit-btn">Editar</button>
        <button class="btn btn-danger btn-sm delete-btn">Borrar</button>
      </td>
    `;

tr.querySelector(".delete-btn").addEventListener("click", async () => {
  if (!confirm("¿Eliminar este equipo definitivamente?")) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/inventario/${eq.id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Error al eliminar");

    // Eliminar de array local
    equiposGlobal = equiposGlobal.filter(e => e.id !== eq.id);

    aplicarFiltros(); // vuelve a renderizar
    actualizarDashboard(); // actualiza estadísticas

  } catch (error) {
    alert("Error al eliminar en el servidor");
    console.error(error);
  }
});

    // EDITAR en línea
    tr.querySelector(".edit-btn").addEventListener("click", function () {
      const celdas = tr.querySelectorAll("td");
      const boton = this;

      if (boton.textContent === "Editar") {

        for (let i = 0; i < celdas.length - 1; i++) {
          const valor = celdas[i].textContent;
          celdas[i].innerHTML = `<input class="form-control form-control-sm" value="${valor}">`;
        }

        boton.textContent = "Guardar";
        boton.classList.remove("btn-warning");
        boton.classList.add("btn-success");

      } else {

        const inputs = tr.querySelectorAll("input");
        inputs.forEach((input, index) => {
          celdas[index].textContent = input.value;
        });

        boton.textContent = "Editar";
        boton.classList.remove("btn-success");
        boton.classList.add("btn-warning");
      }
    });

    equiposTable.appendChild(tr);
  });
}

// Aplicar filtros
function aplicarFiltros() {
  let filtrados = equiposGlobal;

  if (searchInput && searchInput.value) {
    filtrados = filtrados.filter(e =>
      e.codigoTorre.toLowerCase().includes(searchInput.value.toLowerCase()) ||
      e.nombreDispositivo.toLowerCase().includes(searchInput.value.toLowerCase())
    );
  }

  if (filterOffice && filterOffice.value) {
    filtrados = filtrados.filter(e => e.oficina === filterOffice.value);
  }

  if (filterMaintenance && filterMaintenance.value) {
    filtrados = filtrados.filter(e => e.necesitaMantenimiento === filterMaintenance.value);
  }

  renderTabla(filtrados);
}

// Eventos filtros
if (searchInput) searchInput.addEventListener("input", aplicarFiltros);
if (filterOffice) filterOffice.addEventListener("change", aplicarFiltros);
if (filterMaintenance) filterMaintenance.addEventListener("change", aplicarFiltros);

// Ejecutar carga si estamos en inventario
if (equiposTable) cargarInventario();

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
}

function actualizarDashboard(data) {
  document.getElementById("totalEquipos").innerText = data.length;

  const mantenimiento = data.filter(e => e.necesitaMantenimiento === "Sí");
  const noMantenimiento = data.filter(e => e.necesitaMantenimiento === "No");

  document.getElementById("equiposMantenimiento").innerText = mantenimiento.length;
  document.getElementById("equiposOk").innerText = noMantenimiento.length;

  const oficinas = {};
  data.forEach(e => {
    if (!oficinas[e.oficina]) {
      oficinas[e.oficina] = 0;
    }
    oficinas[e.oficina]++;
  });

  document.getElementById("totalOficinas").innerText = Object.keys(oficinas).length;

  actualizarGraficas(mantenimiento.length, noMantenimiento.length, oficinas);
}

function actualizarGraficas(mant, noMant, oficinas) {

  // Destruir gráficas anteriores si existen
  if (chartMantenimiento) chartMantenimiento.destroy();
  if (chartOficinas) chartOficinas.destroy();

  const ctxMant = document.getElementById("chartMantenimiento");
  const ctxOfic = document.getElementById("chartOficinas");

  chartMantenimiento = new Chart(ctxMant, {
    type: "doughnut",
    data: {
      labels: ["Necesitan", "No necesitan"],
      datasets: [{
        data: [mant, noMant],
        backgroundColor: ["#ffc107", "#198754"]
      }]
    }
  });

  chartOficinas = new Chart(ctxOfic, {
    type: "bar",
    data: {
      labels: Object.keys(oficinas),
      datasets: [{
        label: "Cantidad de equipos",
        data: Object.values(oficinas),
        backgroundColor: "#0d6efd"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}