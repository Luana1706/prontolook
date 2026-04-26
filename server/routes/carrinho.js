const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { autenticar } = require('../middleware/auth');

// ROTA: Adicionar ao carrinho com verificação de estoque (requer autenticação)
router.post('/adicionar', autenticar, async (req, res) => {
    const { produto_id } = req.body;
    const usuario_id = req.usuario.id;

    try {
        const produto = await pool.query('SELECT nome, estoque FROM produtos WHERE id = $1', [produto_id]);

        if (produto.rows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Produto não encontrado." });
        }

        const estoqueDisponivel = produto.rows[0].estoque;

        const noCarrinho = await pool.query(
            'SELECT quantidade FROM carrinho WHERE usuario_id = $1 AND produto_id = $2',
            [usuario_id, produto_id]
        );

        const qtdNoCarrinho = noCarrinho.rows.length > 0 ? noCarrinho.rows[0].quantidade : 0;

        if (qtdNoCarrinho + 1 > estoqueDisponivel) {
            return res.status(400).json({
                sucesso: false,
                mensagem: `Estoque insuficiente. Temos apenas ${estoqueDisponivel} unidade(s) de "${produto.rows[0].nome}".`
            });
        }

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

        res.status(200).json({ sucesso: true, mensagem: "Adicionado ao carrinho!" });

    } catch (err) {
        console.error('Erro ao adicionar ao carrinho:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao processar pedido." });
    }
});

// ROTA: Buscar itens do carrinho (requer autenticação)
router.get('/', autenticar, async (req, res) => {
    try {
        const itens = await pool.query(
            `SELECT c.id, p.nome, p.preco, c.quantidade, p.imagem_url, p.estoque 
             FROM carrinho c 
             JOIN produtos p ON c.produto_id = p.id 
             WHERE c.usuario_id = $1`,
            [req.usuario.id]
        );
        res.json(itens.rows);
    } catch (err) {
        console.error('Erro ao buscar carrinho:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar carrinho." });
    }
});

// ROTA: Atualizar quantidade no carrinho (requer autenticação)
router.put('/atualizar/:id', autenticar, async (req, res) => {
    const { quantidade } = req.body;

    try {
        const item = await pool.query(
            'SELECT c.usuario_id, c.produto_id FROM carrinho c WHERE c.id = $1',
            [req.params.id]
        );

        if (item.rows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Item não encontrado." });
        }

        if (item.rows[0].usuario_id !== req.usuario.id) {
            return res.status(403).json({ sucesso: false, mensagem: "Não autorizado." });
        }

        const produto = await pool.query('SELECT estoque, nome FROM produtos WHERE id = $1', [item.rows[0].produto_id]);

        if (quantidade > produto.rows[0].estoque) {
            return res.status(400).json({
                sucesso: false,
                mensagem: `Estoque insuficiente. Temos apenas ${produto.rows[0].estoque} unidade(s) de "${produto.rows[0].nome}".`
            });
        }

        if (quantidade <= 0) {
            await pool.query('DELETE FROM carrinho WHERE id = $1', [req.params.id]);
            return res.json({ sucesso: true, mensagem: "Item removido." });
        }

        await pool.query('UPDATE carrinho SET quantidade = $1 WHERE id = $2', [quantidade, req.params.id]);
        res.json({ sucesso: true, mensagem: "Quantidade atualizada." });
    } catch (err) {
        console.error('Erro ao atualizar carrinho:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar." });
    }
});

// ROTA: Remover item do carrinho (requer autenticação, valida que é do próprio usuário)
router.delete('/remover/:id', autenticar, async (req, res) => {
    try {
        const item = await pool.query(
            'SELECT usuario_id FROM carrinho WHERE id = $1',
            [req.params.id]
        );

        if (item.rows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Item não encontrado." });
        }

        if (item.rows[0].usuario_id !== req.usuario.id) {
            return res.status(403).json({ sucesso: false, mensagem: "Não autorizado a remover este item." });
        }

        await pool.query('DELETE FROM carrinho WHERE id = $1', [req.params.id]);
        res.json({ sucesso: true, mensagem: "Removido!" });
    } catch (err) {
        console.error('Erro ao remover do carrinho:', err.message);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao remover." });
    }
});

module.exports = router;
