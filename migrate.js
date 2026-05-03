const pool = require('./db');

async function migrate() {
    try {
        console.log("Iniciando migração...");
        
        // Adicionar coluna eh_novidade se não existir
        await pool.query(`
            ALTER TABLE produtos 
            ADD COLUMN IF NOT EXISTS eh_novidade BOOLEAN DEFAULT FALSE;
        `);
        console.log("Coluna 'eh_novidade' verificada/adicionada.");

        // Adicionar coluna tamanhos se não existir
        // Usaremos TEXT para simplificar ou JSONB se preferir. 
        // Para compatibilidade, usaremos TEXT para armazenar uma string separada por vírgula ou JSONB.
        // Vamos de TEXT por enquanto para facilitar a manipulação no frontend.
        await pool.query(`
            ALTER TABLE produtos 
            ADD COLUMN IF NOT EXISTS tamanhos TEXT DEFAULT '';
        `);
        console.log("Coluna 'tamanhos' verificada/adicionada.");

        // Adicionar coluna tamanho no carrinho
        await pool.query(`
            ALTER TABLE carrinho 
            ADD COLUMN IF NOT EXISTS tamanho TEXT DEFAULT '';
        `);
        console.log("Coluna 'tamanho' no carrinho verificada/adicionada.");

        console.log("Migração concluída com sucesso!");
        process.exit(0);
    } catch (err) {
        console.error("Erro na migração:", err);
        process.exit(1);
    }
}

migrate();
