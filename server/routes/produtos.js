const express = require('express');
const router = express.Router();
const pool = require('../../db'); 
const cloudinary = require('../config/cloudinary'); 
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'produtos_prontolook',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// ROTA: Buscar todos os produtos
router.get('/', async (req, res) => {
    try {
        const produtos = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
        res.json(produtos.rows);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
});

// ROTA: Adicionar novo produto (Admin)
router.post('/adicionar', upload.single('imagem'), async (req, res) => {
    const { nome, descricao, preco, categoria, estoque } = req.body;
    
    try {
        const imagem_url = req.file ? req.file.path : 'placeholder.png';
        const estoqueFinal = parseInt(estoque) || 0;

        const novoProduto = await pool.query(
            'INSERT INTO produtos (nome, descricao, preco, categoria, estoque, imagem_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nome, descricao, preco, categoria, estoqueFinal, imagem_url]
        );
        
        res.status(201).json(novoProduto.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ erro: "Erro ao salvar no banco" });
    }
});

module.exports = router;
