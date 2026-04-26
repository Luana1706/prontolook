document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    gerenciarLogin();
});

async function carregarProdutos() {
    try {
        const resposta = await fetch('http://localhost:3000/produtos');
        const produtos = await resposta.json();
        const lista = document.getElementById('lista-produtos');
        if (!lista) return;
        lista.innerHTML = "";

        produtos.forEach(produto => {
            lista.innerHTML += `
                <div class="produto-card">
                    <img src="${produto.imagem_url}" alt="${produto.nome}">
                    <h3>${produto.nome}</h3>
                    <p>${produto.descricao}</p>
                    <span class="preco">R$ ${produto.preco}</span>
                    <button onclick="adicionarAoCarrinho(event, ${produto.id})">
                        Adicionar ao Carrinho
                    </button>
                </div>`;
        });
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}

function gerenciarLogin() {
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    const linkCarrinho = document.getElementById('link-carrinho');
    const boasVindas = document.getElementById('boas-vindas');
    const btnSair = document.getElementById('btn-sair');

    if (usuarioRaw) {
        const usuario = JSON.parse(usuarioRaw);
        boasVindas.innerText = `Olá, ${usuario.nome}!`;
        
        // FORÇA o carrinho a aparecer ignorando o CSS antigo
        if (linkCarrinho) {
            linkCarrinho.style.setProperty('display', 'inline-block', 'important');
        }
        if (btnSair) btnSair.style.display = 'inline-block';
    }
}

async function adicionarAoCarrinho(event, produto_id) {
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    if (!usuarioRaw) {
        window.location.href = "login.html";
        return;
    }

    const usuario = JSON.parse(usuarioRaw);
    const btn = event.target;

    try {
        const resposta = await fetch('http://localhost:3000/carrinho/adicionar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuario.id, produto_id: produto_id })
        });

        if (resposta.ok) {
            // FEEDBACK VISUAL NO BOTÃO (SEM ALERT!)
            const textoOriginal = btn.innerText;
            btn.innerText = "Adicionado! ✅";
            btn.style.backgroundColor = "#27ae60";
            setTimeout(() => {
                btn.innerText = textoOriginal;
                btn.style.backgroundColor = "";
            }, 2000);
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

function sair() {
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
}