// Detecta se está rodando local ou na Vercel
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
                    <a href="index.html" class="btn-cadastrar btn-continuar">CONTINUAR COMPRANDO</a>
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

            container.innerHTML += `
                <div class="item-carrinho">
                    <div class="item-info-wrapper">
                        <img src="${imgPath}" class="img-carrinho" alt="${item.nome}" onerror="this.src='assets/placeholder.png';">
                        <div class="info">
                            <h4>${item.nome}</h4>
                            <p>Preço unitário: R$ ${Number(item.preco).toFixed(2).replace('.', ',')}</p>
                            <div class="qtd-seletor">
                                Quantidade: ${item.quantidade}
                            </div>
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
                localStorage.setItem('totalCarrinho', totalGeral.toFixed(2).replace('.', ','));
                window.location.href = "checkout.html";
            };
        }

    } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        container.innerHTML = "<p class='carrinho-erro'>Erro ao carregar o carrinho. Tente novamente.</p>";
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
