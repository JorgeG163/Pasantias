// URL base de tu servidor
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://pasantias-j1sf.onrender.com';

// ----------------- LOGIN -----------------
const loginBtn = document.getElementById('loginBtn');
const statusDiv = document.getElementById('status');

if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    if (!usuario || !password) return statusDiv.textContent = 'Ingrese usuario y contraseña';

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

async function cargarInventario() {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  try {
    const res = await fetch(`${API_URL}/inventario`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const equipos = await res.json();

    equiposTable.innerHTML = '';
    equipos.forEach(eq => {
      equiposTable.innerHTML += `
        <tr>
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
        </tr>
      `;
    });

  } catch (err) {
    console.error(err);
    equiposTable.innerHTML = `<tr><td colspan="18">Error al cargar inventario</td></tr>`;
  }
}

if (equiposTable) cargarInventario();

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
}