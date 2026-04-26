const express = require('express');
const router = express.Router();
const pool = require('../../db'); 

// ROTA: Cadastro Simples (JSON)
router.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ mensagem: "Preencha todos os campos." });

    try {
        const emailLower = email.trim().toLowerCase();
        const check = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = $1', [emailLower]);
        if (check.rows.length > 0) return res.status(400).json({ mensagem: "E-mail já cadastrado." });

        await pool.query('INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)', [nome, emailLower, senha]);
        res.status(201).json({ mensagem: "Usuário criado com sucesso!" });
    } catch (err) {
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
});

// ROTA: Recuperação de Senha (Simulação de Link)
router.post('/recuperar-senha', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);
        if (result.rows.length === 0) return res.status(404).json({ mensagem: "E-mail não encontrado." });
        
        // Em um sistema real, aqui dispararíamos um e-mail com NodeMailer
        res.json({ mensagem: "Um link de recuperação foi enviado para o seu e-mail!" });
    } catch (err) {
        res.status(500).json({ mensagem: "Erro ao processar solicitação." });
    }
});

// ROTA: Login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);
        if (result.rows.length === 0 || result.rows[0].senha !== senha) {
            return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
        }
        res.json({ usuario: { id: result.rows[0].id, nome: result.rows[0].nome, role: result.rows[0].role || 'user' } });
    } catch (err) {
        res.status(500).json({ mensagem: "Erro no login." });
    }
});

module.exports = router;
