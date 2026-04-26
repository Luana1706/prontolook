const cloudinary = require('cloudinary').v2;

// As variáveis de ambiente devem estar no seu arquivo .env na raiz do projeto
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

module.exports = cloudinary;