// Detecta se está rodando local ou na Vercel
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : '';

let produtosDoBanco = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    gerenciarLogin();
    configurarFormularios();
    atualizarVisualContador(); 
});

// 1. BUSCAR PRODUTOS DO BACKEND
async function carregarProdutos() {
    const lista = document.getElementById('lista-produtos');
    if (!lista) return; 

    try {
        const resposta = await fetch(`${API_URL}/produtos`);
        produtosDoBanco = await resposta.json();
        exibirProdutos(produtosDoBanco);
    } catch (error) {
        console.error("Erro ao carregar vitrine:", error);
        lista.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #999;'>Não foi possível carregar os produtos.</p>";
    }
}

// 2. EXIBIR PRODUTOS (DESIGN PREMIUM)
function exibirProdutos(listaParaExibir) {
    const lista = document.getElementById('lista-produtos');
    if (!lista) return; 
    
    lista.innerHTML = "";

    if (listaParaExibir.length === 0) {
        lista.innerHTML = "<p style='text-align:center; width:100%; grid-column: 1/-1; color: #888; padding: 50px 0;'>Nenhuma peça disponível nesta categoria.</p>";
        return;
    }

    listaParaExibir.forEach(produto => {
        const idProduto = produto.id; 
        const emEstoque = (produto.estoque > 0);
        let rawImg = produto.imagem_url ? produto.imagem_url.trim() : '';
        let imgPath = rawImg.startsWith('http') ? rawImg : `assets/${rawImg || 'placeholder.png'}`;

        lista.innerHTML += `
            <div class="produto-card" style="${!emEstoque ? 'opacity: 0.7;' : ''}">
                <div class="img-wrapper" style="position: relative; overflow: hidden; height: 350px;">
                    ${!emEstoque ? '<div style="position: absolute; top: 20px; right: 20px; background: #333; color: white; padding: 5px 15px; border-radius: 5px; font-weight: bold; z-index: 10;">ESGOTADO</div>' : ''}
                    <img src="${imgPath}" alt="${produto.nome}" 
                         style="width: 100%; height: 100%; object-fit: cover; transition: 0.5s; ${!emEstoque ? 'filter: grayscale(100%);' : ''}"
                         onerror="this.src='https://via.placeholder.com/400x600?text=Pronto+Look';">
                </div>
                <div class="produto-info" style="padding: 20px; text-align: left;">
                    <span style="font-size: 10px; text-transform: uppercase; color: #999; letter-spacing: 2px;">${produto.categoria || 'Coleção'}</span>
                    <h3 style="font-family: 'Playfair Display', serif; font-size: 18px; margin: 5px 0; color: #333;">${produto.nome}</h3>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <span class="preco" style="color: var(--rosa-principal); font-weight: 700; font-size: 20px;">R$ ${Number(produto.preco).toFixed(2).replace('.', ',')}</span>
                        <button class="btn-comprar" 
                                onclick="${emEstoque ? `adicionarAoCarrinho(event, ${idProduto})` : ''}" 
                                style="background: ${emEstoque ? '#333' : '#ccc'}; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: ${emEstoque ? 'pointer' : 'not-allowed'}; transition: 0.3s;">
                            <i class="fas ${emEstoque ? 'fa-plus' : 'fa-times'}"></i>
                        </button>
                    </div>
                    ${emEstoque && produto.estoque < 5 ? `<p style="color: #e67e22; font-size: 11px; margin-top: 5px;">Apenas ${produto.estoque} unidades!</p>` : ''}
                </div>
            </div>
        `;
    });
}

// 3. FILTRAR CATEGORIAS
function filtrarPorCategoria(categoria) {
    // Estilizar botões
    document.querySelectorAll('.cat-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase() === categoria.toLowerCase() || (categoria === 'todos' && btn.innerText.toLowerCase() === 'tudo')) {
            btn.classList.add('active');
        }
    });

    if (categoria === 'todos') {
        exibirProdutos(produtosDoBanco);
    } else {
        const filtrados = produtosDoBanco.filter(p => 
            (p.categoria || "").toLowerCase() === categoria.toLowerCase()
        );
        exibirProdutos(filtrados);
    }
}

// 4. ACESSO RESTRITO (ADMIN)
function verificarAdmin() {
    const userRaw = localStorage.getItem('usuarioLogado');
    if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user.role === 'admin') {
            window.location.href = "admin.html";
        } else {
            alert("Acesso restrito apenas para administradores.");
        }
    } else {
        window.location.href = "login.html";
    }
}

function configurarFormularios() {
    // (Lógica de cadastro e login permanece igual, mas garantindo que o role seja salvo no login)
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;

            try {
                const res = await fetch(`${API_URL}/usuarios/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
                    window.location.href = "index.html";
                } else {
                    alert(data.mensagem);
                }
            } catch (err) { console.error(err); }
        });
    }

    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            try {
                const res = await fetch(`${API_URL}/usuarios/cadastro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha })
                });
                if (res.ok) {
                    alert("Seja bem-vinda!");
                    window.location.href = "login.html";
                }
            } catch (err) { console.error(err); }
        });
    }
}

function gerenciarLogin() {
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    const links = document.getElementById('login-links');
    const logged = document.getElementById('user-logged');
    const boasVindas = document.getElementById('boas-vindas');

    if (usuarioRaw && usuarioRaw !== "undefined") {
        const user = JSON.parse(usuarioRaw);
        if (boasVindas) boasVindas.innerText = `Olá, ${user.nome}!`;
        if (links) links.style.display = 'none';
        if (logged) logged.style.display = 'flex';
        
        // Se for admin, mostra botão do painel
        if (user.role === 'admin' && !document.getElementById('btn-admin-nav')) {
            const nav = document.querySelector('.main-nav');
            if (nav) {
                const btnAdmin = document.createElement('a');
                btnAdmin.id = 'btn-admin-nav';
                btnAdmin.href = 'admin.html';
                btnAdmin.innerText = 'Painel Admin';
                btnAdmin.style.color = 'var(--rosa-principal)';
                btnAdmin.style.fontWeight = 'bold';
                nav.appendChild(btnAdmin);
            }
        }
    } else {
        if (links) links.style.display = 'flex';
        if (logged) logged.style.display = 'none';
    }
}

async function adicionarAoCarrinho(event, produto_id) {
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    if (!usuarioRaw) { window.location.href = "login.html"; return; }
    const user = JSON.parse(usuarioRaw);
    try {
        const res = await fetch(`${API_URL}/carrinho/adicionar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: user.id, produto_id })
        });
        const data = await res.json();
        if (res.ok) { 
            atualizarVisualContador(); 
        } else {
            alert(data.mensagem); // Alerta de estoque insuficiente
        }
    } catch (err) { console.error(err); }
}

async function atualizarVisualContador() {
    const contador = document.querySelector('.cart-count');
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    if (!contador || !usuarioRaw) return;
    const user = JSON.parse(usuarioRaw);
    try {
        const res = await fetch(`${API_URL}/carrinho/${user.id}`);
        if (res.ok) {
            const itens = await res.json();
            contador.innerText = itens.length;
        }
    } catch (err) { console.error(err); }
}

function sair() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = "index.html";
}
