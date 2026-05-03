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
        card.setAttribute('data-id', idProduto);
        if (!emEstoque) card.classList.add('esgotado');

        // Lógica de tamanhos
        let tamanhosHtml = '';
        if (produto.tamanhos) {
            const estoqueD = produto.estoque_por_tamanho || {};
            const tags = produto.tamanhos.split(',').map(t => {
                const tam = t.trim();
                if (!tam) return '';
                const qtdTam = parseInt(estoqueD[tam]) || 0;
                if (qtdTam <= 0) return `<span class="tamanho-tag" style="opacity: 0.3; cursor: not-allowed;" title="Esgotado">${tam}</span>`;
                return `<span class="tamanho-tag selectable" onclick="event.stopPropagation(); selecionarTamanho(this, '${tam}')">${tam}</span>`;
            }).join('');
            tamanhosHtml = `<div class="produto-tamanhos">${tags}</div>`;
        }

        card.innerHTML = `
            <div class="img-wrapper" onclick="abrirModalDetalhes(${idProduto})">
                ${produto.eh_novidade ? '<div class="badge-novidade">Novo</div>' : ''}
                ${!emEstoque ? '<div class="badge-esgotado">Esgotado</div>' : ''}
                <img src="${imgPath}" alt="${produto.nome}"
                     class="produto-img ${!emEstoque ? 'img-esgotado' : ''}"
                     onerror="this.src='https://via.placeholder.com/400x600?text=Pronto+Look';">
            </div>
            <div class="produto-info" onclick="abrirModalDetalhes(${idProduto})">
                <span class="produto-categoria">${produto.categoria || 'Coleção'}</span>
                <h3 class="produto-nome">${produto.nome}</h3>
                ${tamanhosHtml}
                <div class="produto-footer">
                    <span class="preco">R$ ${Number(produto.preco).toFixed(2).replace('.', ',')}</span>
                    <button class="btn-comprar ${!emEstoque ? 'btn-desabilitado' : ''}"
                            ${emEstoque ? `onclick="event.stopPropagation(); adicionarAoCarrinho(event, ${idProduto})"` : ''}
                            ${!emEstoque ? 'disabled' : ''}
                            title="${emEstoque ? 'Adicionar ao carrinho' : 'Produto esgotado'}">
                        <i class="fas ${emEstoque ? 'fa-plus' : 'fa-times'}"></i>
                    </button>
                </div>
                ${emEstoque && produto.estoque <= 5 ? `<p class="alerta-estoque">Apenas ${produto.estoque} no total!</p>` : ''}
            </div>
        `;

        lista.appendChild(card);
    });
}

// 2.1 MODAL DETALHES
function abrirModalDetalhes(id) {
    const p = produtosDoBanco.find(prod => prod.id === id);
    if (!p) return;

    let rawImg = p.imagem_url ? p.imagem_url.trim() : '';
    let imgPath = rawImg.startsWith('http') ? rawImg : `assets/${rawImg || 'placeholder.png'}`;

    document.getElementById('detalhe-img').src = imgPath;
    document.getElementById('detalhe-nome').textContent = p.nome;
    document.getElementById('detalhe-categoria').textContent = p.categoria;
    document.getElementById('detalhe-preco').textContent = `R$ ${Number(p.preco).toFixed(2).replace('.', ',')}`;
    document.getElementById('detalhe-descricao').textContent = p.descricao || "Sem descrição disponível.";

    const containerTam = document.getElementById('detalhe-tamanhos');
    containerTam.innerHTML = "";

    if (p.tamanhos) {
        const estoqueD = p.estoque_por_tamanho || {};
        p.tamanhos.split(',').forEach(t => {
            const tam = t.trim();
            if (!tam) return;
            const qtdTam = parseInt(estoqueD[tam]) || 0;
            
            const span = document.createElement('span');
            span.className = 'tamanho-tag' + (qtdTam > 0 ? ' selectable' : '');
            span.textContent = tam;
            if (qtdTam <= 0) {
                span.style.opacity = "0.3";
                span.title = "Esgotado";
            } else {
                span.onclick = () => selecionarTamanho(span, tam);
            }
            containerTam.appendChild(span);
        });
    }

    const btnAdd = document.getElementById('btn-adicionar-detalhe');
    btnAdd.onclick = (e) => adicionarAoCarrinho(e, p.id, true);
    btnAdd.disabled = (p.estoque <= 0);
    btnAdd.innerHTML = p.estoque > 0 ? '<i class="fas fa-shopping-bag"></i> &nbsp; ADICIONAR AO CARRINHO' : 'PRODUTO ESGOTADO';

    const modal = document.getElementById('modal-detalhes');
    modal.setAttribute('data-id', p.id);
    modal.removeAttribute('data-tamanho-selecionado');
    modal.style.display = 'flex';
}

function fecharModalDetalhes() {
    document.getElementById('modal-detalhes').style.display = 'none';
}

// Fecha modal ao clicar fora
window.onclick = function(event) {
    const modalD = document.getElementById('modal-detalhes');
    if (event.target == modalD) fecharModalDetalhes();
}

// Função global para selecionar tamanho
window.selecionarTamanho = function(elemento, tamanho) {
    const container = elemento.parentElement;
    const cardOuModal = elemento.closest('.produto-card') || elemento.closest('.modal-admin');
    if (!cardOuModal) return;
    
    container.querySelectorAll('.tamanho-tag').forEach(tag => tag.classList.remove('selected'));
    elemento.classList.add('selected');
    cardOuModal.setAttribute('data-tamanho-selecionado', tamanho);
};

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
    } else if (categoria === 'novidades') {
        const filtrados = produtosDoBanco.filter(p => p.eh_novidade === true);
        exibirProdutos(filtrados);
    } else {
        const filtrados = produtosDoBanco.filter(p =>
            (p.categoria || "").toLowerCase() === categoria.toLowerCase()
        );
        exibirProdutos(filtrados);
    }

    const secaoProdutos = document.getElementById('titulo-pagina');
    if (secaoProdutos) {
        secaoProdutos.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 4. BUSCA
function configurarBusca() {
    const campoBusca = document.getElementById('campo-busca');
    if (!campoBusca) return;

    campoBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase().trim();
        const lista = document.getElementById('lista-produtos');

        if (!termo) {
            exibirProdutos(produtosDoBanco);
            return;
        }

        const filtrados = produtosDoBanco.filter(p =>
            p.nome.toLowerCase().includes(termo) ||
            (p.descricao || '').toLowerCase().includes(termo) ||
            (p.categoria || '').toLowerCase().includes(termo)
        );

        if (filtrados.length === 0) {
            if (lista) {
                lista.innerHTML = `
                    <div class="vitrine-vazia">
                        <i class="fas fa-search" style="font-size: 40px; color: #ddd; margin-bottom: 15px; display: block;"></i>
                        <p>Nenhum produto encontrado para "<b>${termo}</b>"</p>
                        <p style="font-size: 13px; color: #aaa;">Tente pesquisar por outros termos ou categorias.</p>
                    </div>`;
            }
        } else {
            exibirProdutos(filtrados);
        }
    });
}

// 5. ACESSO RESTRITO
function verificarAdmin() {
    window.location.href = "admin_login.html";
}

// 6. FORMULÁRIOS
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
                    if (msg) { msg.innerText = data.mensagem; msg.style.color = "#e74c3c"; }
                }
            } catch (err) {
                console.error(err);
                if (msg) { msg.innerText = "Erro ao conectar."; msg.style.color = "#e74c3c"; }
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
                if (msg) { msg.innerText = "Mínimo 6 caracteres."; msg.style.color = "#e74c3c"; }
                return;
            }

            btn.innerText = "CRIANDO...";
            btn.disabled = true;

            try {
                const formData = new FormData();
                formData.append('nome', nome);
                formData.append('email', email);
                formData.append('senha', senha);
                if (foto && foto.files[0]) formData.append('imagem', foto.files[0]);

                const res = await fetch(`${API_URL}/usuarios/cadastro`, { method: 'POST', body: formData });
                const data = await res.json();

                if (res.ok) {
                    if (msg) { msg.innerText = data.mensagem; msg.style.color = "#27ae60"; }
                    setTimeout(() => { window.location.href = "login.html"; }, 1500);
                } else {
                    if (msg) { msg.innerText = data.mensagem; msg.style.color = "#e74c3c"; }
                }
            } catch (err) {
                console.error(err);
            } finally {
                btn.innerText = "CRIAR MINHA CONTA";
                btn.disabled = false;
            }
        });
    }
}

// 7. GERENCIAR LOGIN
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

// 8. ADICIONAR AO CARRINHO
async function adicionarAoCarrinho(event, produto_id, isFromModal = false) {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = "login.html"; return; }

    const btn = event.currentTarget;
    const container = isFromModal ? document.getElementById('modal-detalhes') : btn.closest('.produto-card');
    const tamanho = container.getAttribute('data-tamanho-selecionado');

    if (!tamanho) {
        mostrarToast("Por favor, escolha um tamanho primeiro!", "aviso");
        return;
    }

    btn.disabled = true;
    const originalContent = btn.innerHTML;
    btn.innerHTML = isFromModal ? 'PROCESSANDO...' : '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const res = await fetch(`${API_URL}/carrinho/adicionar`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ produto_id, tamanho })
        });
        const data = await res.json();
        if (res.ok) {
            atualizarVisualContador();
            mostrarToast(`Adicionado ao carrinho (${tamanho})!`, "sucesso");
            if (isFromModal) fecharModalDetalhes();
        } else {
            mostrarToast(data.mensagem || "Erro ao adicionar.", "aviso");
        }
    } catch (err) {
        console.error(err);
        mostrarToast("Erro ao adicionar.", "erro");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

// 9. CONTADOR
async function atualizarVisualContador() {
    const contador = document.querySelector('.cart-count');
    const token = localStorage.getItem('token');
    if (!contador || !token) return;

    try {
        const res = await fetch(`${API_URL}/carrinho`, { headers: getAuthHeaders() });
        
        if (res.status === 403 || res.status === 401) {
            console.warn("Sessão inválida detectada no contador. Limpando...");
            sair(); // Força logout se o token for rejeitado
            return;
        }

        if (res.ok) {
            const itens = await res.json();
            if (Array.isArray(itens)) {
                const total = itens.reduce((sum, item) => sum + item.quantidade, 0);
                contador.innerText = total;
            }
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
