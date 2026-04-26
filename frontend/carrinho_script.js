const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : '';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarItensCarrinho();
});

async function carregarItensCarrinho() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const container = document.getElementById('lista-carrinho');
    const totalElemento = document.getElementById('total-carrinho');

    try {
        const resposta = await fetch(`${API_URL}/carrinho`, {
            headers: getAuthHeaders()
        });
        const itens = await resposta.json();

        if (!itens || itens.length === 0) {
            container.innerHTML = `
                <div class="carrinho-vazio">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Seu carrinho está vazio.</p>
                    <p style="color: #ccc; font-size: 13px; margin-top: 5px;">Explore nossa coleção e encontre peças incríveis.</p>
                    <a href="index.html" class="btn-cadastrar btn-continuar">EXPLORAR COLEÇÃO</a>
                </div>`;
            totalElemento.innerText = "0,00";
            return;
        }

        container.innerHTML = "";
        let totalGeral = 0;

        itens.forEach(item => {
            const subtotal = item.preco * item.quantidade;
            totalGeral += subtotal;

            let rawImg = item.imagem_url ? item.imagem_url.trim() : 'placeholder.png';
            let imgPath = rawImg.startsWith('http')
                ? rawImg
                : `assets/${rawImg.replace(/ /g, '%20')}`;

            const estoqueExcedido = item.quantidade > item.estoque;
            const estoqueBaixo = item.estoque <= 5 && item.estoque > 0;

            container.innerHTML += `
                <div class="item-carrinho ${estoqueExcedido ? 'item-estoque-excedido' : ''}">
                    <div class="item-info-wrapper">
                        <img src="${imgPath}" class="img-carrinho" alt="${item.nome}" onerror="this.src='assets/placeholder.png';">
                        <div class="info">
                            <h4>${item.nome}</h4>
                            <p>R$ ${Number(item.preco).toFixed(2).replace('.', ',')} /un</p>
                            <div class="qtd-seletor">
                                <span>Qtd:</span>
                                <div class="qtd-controles">
                                    <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, ${item.quantidade - 1}, ${item.estoque})">−</button>
                                    <span class="qtd-valor">${item.quantidade}</span>
                                    <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, ${item.quantidade + 1}, ${item.estoque})">+</button>
                                </div>
                            </div>
                            ${estoqueExcedido ? `<p class="aviso-estoque-carrinho"><i class="fas fa-exclamation-circle"></i> Apenas ${item.estoque} disponível!</p>` : ''}
                            ${!estoqueExcedido && estoqueBaixo ? `<p class="aviso-estoque-carrinho" style="color: #c9a96e;"><i class="fas fa-info-circle"></i> Últimas ${item.estoque} unidades</p>` : ''}
                        </div>
                    </div>
                    <div class="preco-subtotal">
                        <div class="subtotal-info">
                            <span class="subtotal-label">Subtotal</span>
                            <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <button class="btn-remover" onclick="removerItem(${item.id})" title="Remover item">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        totalElemento.innerText = totalGeral.toFixed(2).replace('.', ',');

        const btnFinalizar = document.querySelector('.btn-finalizar-compra');
        if (btnFinalizar) {
            btnFinalizar.onclick = () => {
                const temExcedido = itens.some(i => i.quantidade > i.estoque);
                if (temExcedido) {
                    alert("Alguns itens no carrinho excedem o estoque disponível. Ajuste as quantidades antes de finalizar.");
                    return;
                }
                localStorage.setItem('totalCarrinho', totalGeral.toFixed(2).replace('.', ','));
                window.location.href = "checkout.html";
            };
        }

    } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        container.innerHTML = "<p class='carrinho-erro'>Erro ao carregar o carrinho. Tente novamente.</p>";
    }
}

async function alterarQuantidade(carrinhoId, novaQtd, estoqueMax) {
    if (novaQtd <= 0) {
        removerItem(carrinhoId);
        return;
    }
    if (novaQtd > estoqueMax) {
        alert(`Estoque insuficiente! Temos apenas ${estoqueMax} unidade(s) disponível(is).`);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/carrinho/atualizar/${carrinhoId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ quantidade: novaQtd })
        });
        if (res.ok) {
            carregarItensCarrinho();
        }
    } catch (error) {
        console.error("Erro ao atualizar quantidade:", error);
    }
}

async function removerItem(carrinhoId) {
    if (!confirm("Deseja remover este item do carrinho?")) return;

    try {
        const resposta = await fetch(`${API_URL}/carrinho/remover/${carrinhoId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (resposta.ok) {
            carregarItensCarrinho();
        }
    } catch (error) {
        console.error("Erro de conexão ao remover item:", error);
    }
}
