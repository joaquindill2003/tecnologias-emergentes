import express from 'express';
import { db } from './db.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();

const PORT = process.env.PORT || 4000;
// User-Agent requerido por Nominatim variable de entorno //

const UA = process.env.USER_AGENT;



app.use(express.json());
app.use(express.static('public'));


const osmFetch = async (url) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA }
  });

  if (!res.ok) {
    throw new Error(`Error HTTP: ${res.status}`);
  }

  return res.json();
};

/* Endpoint 1:  */
app.get('/api/geocode', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Faltan lat o lon' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    const data = await osmFetch(url);

    res.json({
      direccion: data.display_name || 'No disponible',
      ciudad: data.address?.city || data.address?.town || 'No disponible',
      pais: data.address?.country || 'No disponible'
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* Endpoint 2:  */

app.get('/api/ruta', async (req, res) => {
  const { oLat, oLon, dLat, dLon } = req.query;

  if (!oLat || !oLon || !dLat || !dLon) {
    return res.status(400).json({ error: 'Faltan coordenadas' });
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`;

   
    const data = await osmFetch(url);

    //  VALIDACIÓN
    if (!data.routes || data.routes.length === 0) {
      return res.status(404).json({ error: 'No se encontró ruta' });
    }

    const ruta = data.routes[0];

    const distancia = (ruta.distance / 1000).toFixed(2);
    const duracion = (ruta.duration / 60).toFixed(1);

    // guardar en DB
    await db.run(
      `INSERT INTO historial (oLat, oLon, dLat, dLon, distancia, duracion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [oLat, oLon, dLat, dLon, distancia, duracion]
    );

    res.json({
      distancia_km: distancia,
      duracion_min: duracion
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/historial', async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT * FROM historial ORDER BY fecha DESC LIMIT 10`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});