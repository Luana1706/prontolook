const express = require('express');
const router = express.Router();
const pool = require('../../db');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { autenticar, apenasAdmin } = require('../middleware/auth');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'produtos_prontolook',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Limite de 50MB
});

// ROTA: Buscar todos os produtos (pública)
router.get('/', async (req, res) => {
    try {
        const produtos = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
        res.json(produtos.rows);
    } catch (err) {
        console.error('Erro ao buscar produtos:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar produtos." });
    }
});

// ROTA: Adicionar novo produto (apenas admin autenticado)
router.post('/adicionar', autenticar, apenasAdmin, upload.single('imagem'), async (req, res) => {
    const { nome, descricao, preco, categoria, estoque, eh_novidade, tamanhos } = req.body;

    if (!nome || !preco) {
        return res.status(400).json({ sucesso: false, mensagem: "Nome e preço são obrigatórios." });
    }

    try {
        const imagem_url = req.file ? req.file.path : 'placeholder.png';
        const estoqueFinal = parseInt(estoque) || 0;
        const novidadeBool = eh_novidade === 'true' || eh_novidade === true;

        const novoProduto = await pool.query(
            'INSERT INTO produtos (nome, descricao, preco, categoria, estoque, imagem_url, eh_novidade, tamanhos) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [nome, descricao, preco, categoria, estoqueFinal, imagem_url, novidadeBool, tamanhos || '']
        );

        res.status(201).json({ sucesso: true, produto: novoProduto.rows[0] });
    } catch (err) {
        console.error('Erro ao salvar produto:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao salvar no banco." });
    }
});

module.exports = router;
