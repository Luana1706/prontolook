const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { autenticar } = require('../middleware/auth');

// ROTA: Adicionar ao carrinho com verificação de estoque (requer autenticação)
router.post('/adicionar', autenticar, async (req, res) => {
    const { produto_id, tamanho } = req.body;
    const usuario_id = req.usuario.id;

    if (!tamanho) {
        return res.status(400).json({ sucesso: false, mensagem: "Por favor, selecione um tamanho." });
    }

    try {
        const produto = await pool.query('SELECT nome, estoque, estoque_por_tamanho FROM produtos WHERE id = $1', [produto_id]);

        if (produto.rows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Produto não encontrado." });
        }

        const estoqueDetalhado = produto.rows[0].estoque_por_tamanho || {};
        const estoqueDisponivelTamanho = parseInt(estoqueDetalhado[tamanho]) || 0;

        const noCarrinho = await pool.query(
            'SELECT quantidade FROM carrinho WHERE usuario_id = $1 AND produto_id = $2 AND tamanho = $3',
            [usuario_id, produto_id, tamanho]
        );

        const qtdNoCarrinho = noCarrinho.rows.length > 0 ? noCarrinho.rows[0].quantidade : 0;

        if (qtdNoCarrinho + 1 > estoqueDisponivelTamanho) {
            return res.status(400).json({
                sucesso: false,
                mensagem: `Estoque insuficiente para o tamanho ${tamanho}. Temos apenas ${estoqueDisponivelTamanho} unidade(s).`
            });
        }

        if (noCarrinho.rows.length > 0) {
            await pool.query(
                'UPDATE carrinho SET quantidade = quantidade + 1 WHERE usuario_id = $1 AND produto_id = $2 AND tamanho = $3',
                [usuario_id, produto_id, tamanho]
            );
        } else {
            await pool.query(
                'INSERT INTO carrinho (usuario_id, produto_id, quantidade, tamanho) VALUES ($1, $2, 1, $3)',
                [usuario_id, produto_id, tamanho]
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
            `SELECT c.id, p.nome, p.preco, c.quantidade, p.imagem_url, p.estoque, c.tamanho, p.estoque_por_tamanho 
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

// ROTA: Finalizar compra (Baixa no estoque por tamanho + Limpar carrinho)
router.post('/finalizar', autenticar, async (req, res) => {
    const usuario_id = req.usuario.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Buscar itens do carrinho com informações do produto
        const cartItems = await client.query(
            `SELECT c.produto_id, c.quantidade, c.tamanho, p.nome, p.estoque_por_tamanho 
             FROM carrinho c 
             JOIN produtos p ON c.produto_id = p.id 
             WHERE c.usuario_id = $1`,
            [usuario_id]
        );

        if (cartItems.rows.length === 0) {
            throw new Error("Carrinho vazio.");
        }

        // 2. Verificar estoque e dar baixa
        for (const item of cartItems.rows) {
            const estoqueAtual = item.estoque_por_tamanho || {};
            const qtdAtual = parseInt(estoqueAtual[item.tamanho]) || 0;

            if (item.quantidade > qtdAtual) {
                throw new Error(`Estoque insuficiente para "${item.nome}" no tamanho ${item.tamanho}.`);
            }

            // Atualizar o JSONB diminuindo a quantidade e também o total
            await client.query(
                `UPDATE produtos 
                 SET estoque_por_tamanho = jsonb_set(estoque_por_tamanho, ARRAY[$1], (COALESCE((estoque_por_tamanho->>$1)::int, 0) - $2)::text::jsonb),
                     estoque = estoque - $2
                 WHERE id = $3`,
                [item.tamanho, item.quantidade, item.produto_id]
            );
        }

        // 3. Limpar carrinho
        await client.query('DELETE FROM carrinho WHERE usuario_id = $1', [usuario_id]);

        await client.query('COMMIT');
        res.json({ sucesso: true, mensagem: "Compra finalizada com sucesso!" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro no checkout:', err.message);
        res.status(400).json({ sucesso: false, mensagem: err.message });
    } finally {
        client.release();
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
