const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

// Importação do Banco e Rotas
const pool = require('./db');
const usuariosRoutes = require('./server/routes/usuarios');
const produtosRoutes = require('./server/routes/produtos');
const carrinhoRoutes = require('./server/routes/carrinho');

const app = express();

// Segurança: Headers HTTP
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// CORS configurado (ajustar origens para produção)
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
}));

// Rate limiting para rotas de autenticação
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { sucesso: false, mensagem: "Muitas tentativas. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middlewares de body-parser com limites aumentados
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configuração de Arquivos Estáticos (Frontend)
const frontendPath = path.resolve(__dirname, 'frontend');
app.use(express.static(frontendPath));

// Rate limiting nas rotas de autenticação
app.use('/usuarios/login', authLimiter);
app.use('/usuarios/cadastro', authLimiter);
app.use('/usuarios/recuperar-senha', authLimiter);

// Rotas da API
app.use('/usuarios', usuariosRoutes);
app.use('/produtos', produtosRoutes);
app.use('/carrinho', carrinhoRoutes);

// Rota Principal (Home)
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Fallback para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Porta para Local e Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
