const jwt = require('jsonwebtoken');
const UserModel = require('../database/UserModel');

// Middleware pentru a verifica dacă un utilizator este autentificat
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Autentificare refuzată: Token lipsă' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'medward_super_secret_key';
        
        // Verificăm și decodificăm token-ul
        const decoded = jwt.verify(token, secret);

        // Căutăm userul în DB pentru a avea mereu datele (și rolul) actualizate
        const user = await UserModel.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Utilizatorul nu există' });
        }

        // Atașăm user-ul la request pentru a fi folosit în controllere
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token invalid sau expirat' });
    }
};

// Middleware pentru a restricționa rutele pe bază de rol
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Utilizator neautentificat' });
        }
        
        if (req.user.role !== role) {
            return res.status(403).json({ success: false, message: `Acces interzis. Necesită rolul: ${role}` });
        }
        
        next();
    };
};

module.exports = { requireAuth, requireRole };