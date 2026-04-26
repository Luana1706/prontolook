const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// Importação do Banco e Rotas
const pool = require('./db');
const usuariosRoutes = require('./server/routes/usuarios');
const produtosRoutes = require('./server/routes/produtos');
const carrinhoRoutes = require('./server/routes/carrinho');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Configuração de Arquivos Estáticos (Frontend)
// O path.resolve garante que a Vercel encontre a pasta independente de onde o script rode
const frontendPath = path.resolve(__dirname, 'frontend');
app.use(express.static(frontendPath));

// 2. Rotas da API
app.use('/usuarios', usuariosRoutes);
app.use('/produtos', produtosRoutes);
app.use('/carrinho', carrinhoRoutes);

// 3. Rota Principal (Home)
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 4. Fallback para Single Page Application (SPA)
// Se o usuário atualizar a página em uma rota que não existe, ele volta pro index
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Porta para Local e Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; // Importante para a Vercel