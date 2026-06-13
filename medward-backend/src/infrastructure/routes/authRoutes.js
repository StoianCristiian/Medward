const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const UserModel = require('../database/UserModel'); // Momentan folosim format de import comun în NodeJS vechi, hai să definim ruta curat:

const router = express.Router();
// Adaugă Client ID-urile tale aici. Poți asigura securitatea punându-le și pe cel de WEB și pe cel de Android (pentru ca backend-ul să le valideze pe amândouă)
const CLIENT_ID_WEB = '657775272800-ip22ue44g3b3feauvd800en747oo8s1h.apps.googleusercontent.com';
const CLIENT_ID_ANDROID = '657775272800-cgh3g7q1mb70fk0le555serc8rfanfc4.apps.googleusercontent.com';
const client = new OAuth2Client();

router.post('/google', async (req, res) => {
    try {
        const { accessToken } = req.body; // Acesta e de fapt idToken-ul venit din aplicația nativă
        
        // 1. Verificăm și decodăm ID Token-ul direct cu Google
        const ticket = await client.verifyIdToken({
            idToken: accessToken,
            audience: [CLIENT_ID_WEB, CLIENT_ID_ANDROID],  // Acceptă ambele surse
        });

        const payload = ticket.getPayload();
        const { sub: id, email, name, picture } = payload;

        // 2. Căutăm / Creăm userul în baza ta de date
        let user = await UserModel.findOne({ googleId: id });
        if (!user) {
            user = new UserModel({ googleId: id, email, name, picture });
            await user.save();
            console.log(`👤 [Auth] Cont nou creat: ${name}`);
        } else {
            console.log(`👤 [Auth] Autentificare reușită: ${name}`);
        }

        // 3. Emitem token de sesiune (valabil 30 de zile)
        const secret = process.env.JWT_SECRET || 'medward_super_secret_key';
        const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

        res.status(200).json({ success: true, token, user });
    } catch (error) {
        console.error('❌ Eroare Login Google:', error.message);
        res.status(401).json({ success: false, message: 'Autentificare Google eșuată' });
    }
});

// [Orice User] Rută pentru setarea intenționată a rolului
const { requireAuth } = require('../middleware/authMiddleware');
router.post('/set-role', requireAuth, async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['patient', 'warden'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Rol invalid' });
        }

        req.user.role = role;
        await req.user.save();

        res.status(200).json({ success: true, role: req.user.role, message: `Rol actualizat la ${role}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Eroare la schimbarea rolului' });
    }
});

// [Warden] Rută pentru setarea tokenului Expo Push
router.post('/push-token', requireAuth, async (req, res) => {
    try {
        const { token } = req.body;
        req.user.expoPushToken = token;
        await req.user.save();
        res.status(200).json({ success: true, message: 'Push token actualizat' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Eroare la actualizarea push token' });
    }
});

module.exports = router;