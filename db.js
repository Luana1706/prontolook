const { Pool } = require('pg');
require('dotenv').config();

// Configuração otimizada para Vercel + Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Isso é essencial para o Supabase aceitar conexões da Vercel
    rejectUnauthorized: false 
  },
  // Limites para evitar queda de conexão em ambiente Serverless
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log simples para debug (aparecerá nos logs da Vercel)
pool.on('error', (err) => {
  console.error('Erro inesperado no cliente Postgres:', err);
});

module.exports = pool;
