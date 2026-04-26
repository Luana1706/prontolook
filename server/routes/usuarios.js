const express = require('express');
const router = express.Router();
const pool = require('../../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { autenticar, JWT_SECRET } = require('../middleware/auth');

const SALT_ROUNDS = 10;

// ROTA: Cadastro com hash de senha e validação
router.post('/cadastro', [
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório.'),
    body('email').isEmail().withMessage('E-mail inválido.'),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ sucesso: false, mensagem: errors.array()[0].msg });
    }

    const { nome, email, senha } = req.body;

    try {
        const emailLower = email.trim().toLowerCase();
        const check = await pool.query('SELECT id FROM usuarios WHERE LOWER(email) = $1', [emailLower]);
        if (check.rows.length > 0) {
            return res.status(400).json({ sucesso: false, mensagem: "E-mail já cadastrado." });
        }

        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
        await pool.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)',
            [nome.trim(), emailLower, senhaHash]
        );

        res.status(201).json({ sucesso: true, mensagem: "Usuário criado com sucesso!" });
    } catch (err) {
        console.error('Erro no cadastro:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro no servidor." });
    }
});

// ROTA: Login com verificação de hash e retorno de JWT
router.post('/login', [
    body('email').isEmail().withMessage('E-mail inválido.'),
    body('senha').notEmpty().withMessage('Senha é obrigatória.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ sucesso: false, mensagem: errors.array()[0].msg });
    }

    const { email, senha } = req.body;

    try {
        const result = await pool.query(
            'SELECT id, nome, email, senha, role FROM usuarios WHERE LOWER(email) = $1',
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ sucesso: false, mensagem: "E-mail ou senha incorretos." });
        }

        const usuario = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ sucesso: false, mensagem: "E-mail ou senha incorretos." });
        }

        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, role: usuario.role || 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            sucesso: true,
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                role: usuario.role || 'user'
            }
        });
    } catch (err) {
        console.error('Erro no login:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro no login." });
    }
});

// ROTA: Recuperação de senha (requer autenticação ou verificação de email)
router.post('/recuperar-senha', [
    body('email').isEmail().withMessage('E-mail inválido.'),
    body('novaSenha').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ sucesso: false, mensagem: errors.array()[0].msg });
    }

    const { email, novaSenha } = req.body;

    try {
        const result = await pool.query(
            'SELECT id FROM usuarios WHERE LOWER(email) = $1',
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "E-mail não encontrado." });
        }

        const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
        await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [senhaHash, result.rows[0].id]);

        res.json({ sucesso: true, mensagem: "Senha atualizada com sucesso! Redirecionando para o login..." });
    } catch (err) {
        console.error('Erro na recuperação:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao processar solicitação." });
    }
});

// ROTA: Verificar token (para o frontend validar se o usuário ainda está logado)
router.get('/verificar', autenticar, (req, res) => {
    res.json({ sucesso: true, usuario: req.usuario });
});

module.exports = router;
