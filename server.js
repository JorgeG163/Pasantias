const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const SPREADSHEET_ID = '1Spre-YvlqnUvXgUUOCEGbmO338GqekMGMwUmfeiEXEM';

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
          data.comentario,
          data.nombreDispositivo,
          data.procesador,
          data.ramInstalada,
          data.discoDuro,
          data.sistemaOperativo,
          data.direccionIP,
          new Date().toISOString()
        ]]
      }
    });

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error guardando en Sheets" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});