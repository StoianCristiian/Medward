const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('✅ Conectat la MongoDB cu succes!');
    } catch (error) {
        console.error('❌ Eroare la conectarea cu MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;