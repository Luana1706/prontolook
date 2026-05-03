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

// ROTA: Atualizar produto (apenas admin)
router.put('/:id', autenticar, apenasAdmin, upload.single('imagem'), async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, categoria, estoque, eh_novidade, tamanhos } = req.body;

    try {
        const produtoAtual = await pool.query('SELECT imagem_url FROM produtos WHERE id = $1', [id]);
        if (produtoAtual.rows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Produto não encontrado." });
        }

        const imagem_url = req.file ? req.file.path : produtoAtual.rows[0].imagem_url;
        const novidadeBool = eh_novidade === 'true' || eh_novidade === true;

        const produtoAtualizado = await pool.query(
            'UPDATE produtos SET nome = $1, descricao = $2, preco = $3, categoria = $4, estoque = $5, imagem_url = $6, eh_novidade = $7, tamanhos = $8 WHERE id = $9 RETURNING *',
            [nome, descricao, preco, categoria, estoque, imagem_url, novidadeBool, tamanhos, id]
        );

        res.json({ sucesso: true, produto: produtoAtualizado.rows[0] });
    } catch (err) {
        console.error('Erro ao atualizar produto:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar no banco." });
    }
});

// ROTA: Atualizar apenas estoque (apenas admin)
router.patch('/:id/estoque', autenticar, apenasAdmin, async (req, res) => {
    const { id } = req.params;
    const { estoque } = req.body;

    try {
        const result = await pool.query(
            'UPDATE produtos SET estoque = $1 WHERE id = $2 RETURNING *',
            [estoque, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Produto não encontrado." });
        }

        res.json({ sucesso: true, produto: result.rows[0] });
    } catch (err) {
        console.error('Erro ao atualizar estoque:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar estoque." });
    }
});

// ROTA: Excluir produto (apenas admin)
router.delete('/:id', autenticar, apenasAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Produto não encontrado." });
        }

        res.json({ sucesso: true, mensagem: "Produto excluído com sucesso!" });
    } catch (err) {
        console.error('Erro ao excluir produto:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir do banco." });
    }
});

module.exports = router;
