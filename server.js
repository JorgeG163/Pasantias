const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));

const SPREADSHEET_ID = '1Spre-YvlqnUvXgUUOCEGbmO338GqekMGMwUmfeiEXEM';

// --- Usuarios de prueba ---
const USERS = [
  { usuario: 'UNISUCRE', password: 'QWERTY123', token: 'token-admin' },
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
const datos = rows.map((row, index) => ({
  id: index + 2, 
  codigoTorre: row[0],
  codigoPantalla: row[1],
  codigoTeclado: row[2],
  codigoMouse: row[3],
  oficina: row[4],
  tieneMantenimiento: row[5],
  ultimoMantenimiento: row[6],
  detalleMantenimientoPrevio: row[7],
  necesitaMantenimiento: row[8],
  detalleMantenimiento: row[9],
  comentario: row[10],
  nombreDispositivo: row[11],
  procesador: row[12],
  ramInstalada: row[13],
  discoDuro: row[14],
  sistemaOperativo: row[15],
  direccionIP: row[16],
  fecha: row[17]
}));

res.json(datos);

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

app.delete('/inventario/:id', authMiddleware, async (req, res) => {
  try {
    const fila = parseInt(req.params.id);

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `Pasantias!A${fila}:R${fila}`
    });

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar equipo" });
  }
});



app.get("/generar-solicitud/:id", async (req, res) => {
  try {
    const equipoId = req.params.id;

    // Aquí debes buscar el equipo en tu base de datos
    const equipo = await Inventario.findByPk(equipoId); 
    // Ajusta según tu modelo (Mongo, MySQL, etc.)

    if (!equipo) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Solicitud_${equipo.codigoTorre}.pdf`
    );

    doc.pipe(res);

    // ---------------- ENCABEZADO ----------------
    doc.fontSize(16).text("SOLICITUD SOPORTE TÉCNICO", {
      align: "center",
    });

    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Código equipo: ${equipo.codigoTorre}`);
    doc.text(`Oficina: ${equipo.oficina}`);
    doc.text(`Equipo: ${equipo.nombreDispositivo}`);
    doc.text(`IP: ${equipo.direccionIP}`);
    doc.text(`Procesador: ${equipo.procesador}`);
    doc.text(`RAM: ${equipo.ramInstalada}`);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`);

    doc.moveDown();

    // ---------------- DESCRIPCIÓN ----------------
    doc.text("Descripción del problema:");
    doc.rect(doc.x, doc.y + 5, 500, 100).stroke();

    doc.moveDown(8);

    // ---------------- FIRMAS ----------------
    doc.moveDown(4);
    doc.text("Firma solicitante: _____________________________");
    doc.moveDown();
    doc.text("Firma soporte técnico: _____________________________");

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al generar PDF" });
  }
});