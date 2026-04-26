const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : '';

let produtosDoBanco = [];

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// Toast notifications
function mostrarToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { sucesso: 'fa-check-circle', erro: 'fa-times-circle', aviso: 'fa-exclamation-triangle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `<i class="fas ${icons[tipo] || icons.sucesso}"></i><span>${mensagem}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    gerenciarLogin();
    configurarFormularios();
    configurarBusca();
    atualizarVisualContador();
});

// 1. BUSCAR PRODUTOS
async function carregarProdutos() {
    const lista = document.getElementById('lista-produtos');
    if (!lista) return;

    try {
        const resposta = await fetch(`${API_URL}/produtos`);
        produtosDoBanco = await resposta.json();
        exibirProdutos(produtosDoBanco);
    } catch (error) {
        console.error("Erro ao carregar vitrine:", error);
        if (lista) {
            lista.innerHTML = "<p class='vitrine-vazia'>Não foi possível carregar os produtos.</p>";
        }
    }
}

// 2. EXIBIR PRODUTOS
function exibirProdutos(listaParaExibir) {
    const lista = document.getElementById('lista-produtos');
    if (!lista) return;
    lista.innerHTML = "";

    if (listaParaExibir.length === 0) {
        lista.innerHTML = "<p class='vitrine-vazia'>Nenhuma peça disponível nesta categoria.</p>";
        return;
    }

    listaParaExibir.forEach(produto => {
        const idProduto = produto.id;
        const emEstoque = (produto.estoque > 0);
        let rawImg = produto.imagem_url ? produto.imagem_url.trim() : '';
        let imgPath = rawImg.startsWith('http') ? rawImg : `assets/${rawImg || 'placeholder.png'}`;

        const card = document.createElement('div');
        card.className = 'produto-card';
        if (!emEstoque) card.classList.add('esgotado');

        card.innerHTML = `
            <div class="img-wrapper">
                ${!emEstoque ? '<div class="badge-esgotado">Esgotado</div>' : ''}
                <img src="${imgPath}" alt="${produto.nome}"
                     class="produto-img ${!emEstoque ? 'img-esgotado' : ''}"
                     onerror="this.src='https://via.placeholder.com/400x600?text=Pronto+Look';">
            </div>
            <div class="produto-info">
                <span class="produto-categoria">${produto.categoria || 'Coleção'}</span>
                <h3 class="produto-nome">${produto.nome}</h3>
                <div class="produto-footer">
                    <span class="preco">R$ ${Number(produto.preco).toFixed(2).replace('.', ',')}</span>
                    <button class="btn-comprar ${!emEstoque ? 'btn-desabilitado' : ''}"
                            ${emEstoque ? `onclick="adicionarAoCarrinho(event, ${idProduto})"` : ''}
                            ${!emEstoque ? 'disabled' : ''}
                            title="${emEstoque ? 'Adicionar ao carrinho' : 'Produto esgotado'}">
                        <i class="fas ${emEstoque ? 'fa-plus' : 'fa-times'}"></i>
                    </button>
                </div>
                ${emEstoque && produto.estoque <= 5 ? `<p class="alerta-estoque">Apenas ${produto.estoque} em estoque!</p>` : ''}
            </div>
        `;

        lista.appendChild(card);
    });
}

// 3. FILTRAR CATEGORIAS
function filtrarPorCategoria(categoria) {
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

// 4. BUSCA
function configurarBusca() {
    const campoBusca = document.getElementById('campo-busca');
    if (!campoBusca) return;

    campoBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase().trim();
        if (!termo) {
            exibirProdutos(produtosDoBanco);
            return;
        }
        const filtrados = produtosDoBanco.filter(p =>
            p.nome.toLowerCase().includes(termo) ||
            (p.descricao || '').toLowerCase().includes(termo) ||
            (p.categoria || '').toLowerCase().includes(termo)
        );
        exibirProdutos(filtrados);
    });
}

// 5. ACESSO RESTRITO (redireciona para login do admin)
function verificarAdmin() {
    window.location.href = "admin_login.html";
}

// 6. FORMULÁRIOS (LOGIN E CADASTRO)
function configurarFormularios() {
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;
            const msg = document.getElementById('mensagem');
            const btn = formLogin.querySelector('button[type="submit"]');

            btn.innerText = "ENTRANDO...";
            btn.disabled = true;

            try {
                const res = await fetch(`${API_URL}/usuarios/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
                    window.location.href = "index.html";
                } else {
                    if (msg) {
                        msg.innerText = data.mensagem;
                        msg.style.color = "#e74c3c";
                    }
                }
            } catch (err) {
                console.error(err);
                if (msg) {
                    msg.innerText = "Erro ao conectar ao servidor.";
                    msg.style.color = "#e74c3c";
                }
            } finally {
                btn.innerText = "ENTRAR";
                btn.disabled = false;
            }
        });
    }

    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const foto = document.getElementById('foto');
            const msg = document.getElementById('mensagem');
            const btn = formCadastro.querySelector('button[type="submit"]');

            if (senha.length < 6) {
                if (msg) {
                    msg.innerText = "A senha deve ter no mínimo 6 caracteres.";
                    msg.style.color = "#e74c3c";
                }
                return;
            }

            btn.innerText = "CRIANDO CONTA...";
            btn.disabled = true;

            try {
                const formData = new FormData();
                formData.append('nome', nome);
                formData.append('email', email);
                formData.append('senha', senha);
                if (foto && foto.files[0]) {
                    formData.append('imagem', foto.files[0]);
                }

                const res = await fetch(`${API_URL}/usuarios/cadastro`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (res.ok) {
                    if (msg) {
                        msg.innerText = data.mensagem;
                        msg.style.color = "#27ae60";
                    }
                    setTimeout(() => { window.location.href = "login.html"; }, 1500);
                } else {
                    if (msg) {
                        msg.innerText = data.mensagem;
                        msg.style.color = "#e74c3c";
                    }
                }
            } catch (err) {
                console.error(err);
                if (msg) {
                    msg.innerText = "Erro ao conectar ao servidor.";
                    msg.style.color = "#e74c3c";
                }
            } finally {
                btn.innerText = "CRIAR MINHA CONTA";
                btn.disabled = false;
            }
        });
    }
}

// 7. GERENCIAR LOGIN (HEADER)
function gerenciarLogin() {
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    const token = localStorage.getItem('token');
    const links = document.getElementById('login-links');
    const logged = document.getElementById('user-logged');
    const boasVindas = document.getElementById('boas-vindas');

    if (usuarioRaw && usuarioRaw !== "undefined" && token) {
        const user = JSON.parse(usuarioRaw);
        if (boasVindas) boasVindas.innerText = `Olá, ${user.nome}`;
        if (links) links.style.display = 'none';
        if (logged) {
            logged.style.display = 'flex';
            logged.classList.remove('user-logged-hidden');
        }

        // Show user photo in header
        const fotoHeader = document.getElementById('user-foto-header');
        if (fotoHeader && user.foto_url) {
            fotoHeader.src = user.foto_url;
            fotoHeader.style.display = 'block';
        }

        if (user.role === 'admin' && !document.getElementById('btn-admin-nav')) {
            const nav = document.querySelector('.main-nav');
            if (nav) {
                const btnAdmin = document.createElement('a');
                btnAdmin.id = 'btn-admin-nav';
                btnAdmin.href = 'admin.html';
                btnAdmin.innerText = 'Painel Admin';
                btnAdmin.className = 'nav-admin-link';
                nav.appendChild(btnAdmin);
            }
        }
    } else {
        if (links) links.style.display = 'flex';
        if (logged) {
            logged.style.display = 'none';
            logged.classList.add('user-logged-hidden');
        }
    }
}

// 8. ADICIONAR AO CARRINHO (COM JWT + TOAST)
async function adicionarAoCarrinho(event, produto_id) {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = "login.html"; return; }

    const btn = event.currentTarget;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const res = await fetch(`${API_URL}/carrinho/adicionar`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ produto_id })
        });
        const data = await res.json();
        if (res.ok) {
            atualizarVisualContador();
            mostrarToast("Adicionado ao carrinho!", "sucesso");
        } else {
            mostrarToast(data.mensagem, "aviso");
        }
    } catch (err) {
        console.error(err);
        mostrarToast("Erro ao adicionar.", "erro");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i>';
    }
}

// 9. CONTADOR DO CARRINHO
async function atualizarVisualContador() {
    const contador = document.querySelector('.cart-count');
    const token = localStorage.getItem('token');
    if (!contador || !token) return;

    try {
        const res = await fetch(`${API_URL}/carrinho`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const itens = await res.json();
            const total = itens.reduce((sum, item) => sum + item.quantidade, 0);
            contador.innerText = total;
        }
    } catch (err) { console.error(err); }
}

// 10. SAIR
function sair() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('token');
    localStorage.removeItem('totalCarrinho');
    window.location.href = "index.html";
}
