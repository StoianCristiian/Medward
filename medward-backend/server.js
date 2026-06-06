require('dotenv').config();
const express = require('express');
const connectDB = require('./src/infrastructure/database/mongooseConnection');
const authRoutes = require('./src/infrastructure/routes/authRoutes');
const vitalRoutes = require('./src/infrastructure/routes/vitalRoutes');
const pairingRoutes = require('./src/infrastructure/routes/pairingRoutes');
const treatmentRoutes = require('./src/infrastructure/routes/treatmentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const IP_ADDRESS = process.env.IP_ADDRESS || '0.0.0.0';

// Ne conectăm la baza de date MongoDB
connectDB();

// Middleware pentru JSON cu limite crescute
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rută de test
app.get('/', (req, res) => {
    res.send('Serverul MedWard (Clean Architecture) este online!');
});

// Folosim rutele
app.use('/api/auth', authRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/pairing', pairingRoutes);
app.use('/api/treatments', treatmentRoutes);

// Pornește serverul
app.listen(PORT, IP_ADDRESS, () => {
    console.log(`Serverul rulează pe http://${IP_ADDRESS === '0.0.0.0' ? 'localhost' : IP_ADDRESS}:${PORT}`);
    console.log(`Aștept datele de la telefon...`);
});