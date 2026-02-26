const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));

const SPREADSHEET_ID = '1Spre-YvlqnUvXgUUOCEGbmO338GqekMGMwUmfeiEXEM';

// --- Usuarios de prueba ---
const USERS = [
  { usuario: 'admin', password: '1234', token: 'token-admin' },
  { usuario: 'user', password: 'abcd', token: 'token-user' }
];

// --- LOGIN ---
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = USERS.find(u => u.usuario === usuario && u.password === password);
  if (user) {
    return res.json({ token: user.token });
  }
  res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
});

// --- MIDDLEWARE de autenticación ---
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });
  const token = authHeader.split(' ')[1];
  const user = USERS.find(u => u.token === token);
  if (!user) return res.status(401).json({ error: 'Token inválido' });
  req.user = user;
  next();
}

// --- GUARDAR INVENTARIO ---
app.post('/inventario', async (req, res) => {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const data = req.body;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pasantias!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.codigoTorre,
          data.codigoPantalla,
          data.codigoTeclado,
          data.codigoMouse,
          data.oficina,
          data.tieneMantenimiento || '',
          data.ultimoMantenimiento || '',
          data.detalleMantenimientoPrevio || '',
          data.necesitaMantenimiento || '',
          data.detalleMantenimiento || '',
          data.comentario || '',
          data.nombreDispositivo,
          data.procesador,
          data.ramInstalada,
          data.discoDuro,
          data.sistemaOperativo,
          data.direccionIP,
          new Date().toISOString(),
        ]]
      }
    });

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error guardando en Sheets" });
  }
});

// --- OBTENER INVENTARIO (solo para usuarios autenticados) ---
app.get('/inventario', authMiddleware, async (req, res) => {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pasantias!A2:R', // Ajustado a las nuevas columnas
    });

    const rows = response.data.values || [];
    const equipos = rows.map(r => ({
      codigoTorre: r[0],
      codigoPantalla: r[1],
      codigoTeclado: r[2],
      codigoMouse: r[3],
      oficina: r[4],
      tieneMantenimiento: r[5],
      ultimoMantenimiento: r[6],
      detalleMantenimientoPrevio: r[7],
      necesitaMantenimiento: r[8],
      detalleMantenimiento: r[9],
      comentario: r[10],
      nombreDispositivo: r[11],
      procesador: r[12],
      ramInstalada: r[13],
      discoDuro: r[14],
      sistemaOperativo: r[15],
      direccionIP: r[16],
      fecha: r[17]
    }));

    res.json(equipos);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer inventario' });
  }
});

// --- SERVIR LA PÁGINA PRINCIPAL ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor corriendo en puerto', PORT));