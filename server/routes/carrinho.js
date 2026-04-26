const express = require('express');
const router = express.Router();
const pool = require('../../db');

// ROTA: Adicionar ao carrinho com verificação de estoque
router.post('/adicionar', async (req, res) => {
    const { usuario_id, produto_id } = req.body;

    try {
        // 1. Verificar estoque atual do produto
        const produto = await pool.query('SELECT nome, estoque FROM produtos WHERE id = $1', [produto_id]);
        
        if (produto.rows.length === 0) {
            return res.status(404).json({ erro: "Produto não encontrado." });
        }

        const estoqueDisponivel = produto.rows[0].estoque;

        // 2. Verificar quantos o usuário já tem no carrinho
        const noCarrinho = await pool.query(
            'SELECT quantidade FROM carrinho WHERE usuario_id = $1 AND produto_id = $2',
            [usuario_id, produto_id]
        );

        const qtdNoCarrinho = noCarrinho.rows.length > 0 ? noCarrinho.rows[0].quantidade : 0;

        // 3. Validar se pode adicionar mais um
        if (qtdNoCarrinho + 1 > estoqueDisponivel) {
            return res.status(400).json({ 
                mensagem: `Desculpe, estoque insuficiente. Temos apenas ${estoqueDisponivel} unidade(s) de "${produto.rows[0].nome}".` 
            });
        }

        // 4. Se passou, adiciona ou aumenta
        if (noCarrinho.rows.length > 0) {
            await pool.query(
                'UPDATE carrinho SET quantidade = quantidade + 1 WHERE usuario_id = $1 AND produto_id = $2',
                [usuario_id, produto_id]
            );
        } else {
            await pool.query(
                'INSERT INTO carrinho (usuario_id, produto_id, quantidade) VALUES ($1, $2, 1)',
                [usuario_id, produto_id]
            );
        }

        res.status(200).json({ mensagem: "Adicionado ao carrinho! 🎉" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ erro: "Erro ao processar pedido." });
    }
});

// Buscar itens do carrinho
router.get('/:usuario_id', async (req, res) => {
    try {
        const itens = await pool.query(
            `SELECT c.id, p.nome, p.preco, c.quantidade, p.imagem_url, p.estoque 
             FROM carrinho c 
             JOIN produtos p ON c.produto_id = p.id 
             WHERE c.usuario_id = $1`,
            [req.params.usuario_id]
        );
        res.json(itens.rows);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar carrinho." });
    }
});

// Remover item
router.delete('/remover/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM carrinho WHERE id = $1', [req.params.id]);
        res.json({ mensagem: "Removido!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao remover." });
    }
});

module.exports = router;
