// Detecta se está rodando local ou na Vercel
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : '';

document.addEventListener('DOMContentLoaded', () => {
    carregarItensCarrinho();
});

async function carregarItensCarrinho() {
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    if (!usuarioRaw) {
        window.location.href = "login.html";
        return;
    }

    const usuario = JSON.parse(usuarioRaw);
    const container = document.getElementById('lista-carrinho');
    const totalElemento = document.getElementById('total-carrinho');

    try {
        // Busca os itens do banco de dados
        const resposta = await fetch(`${API_URL}/carrinho/${usuario.id || usuario.id_usuario}`);
        const itens = await resposta.json();

        if (!itens || itens.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px 0;">
                    <i class="fas fa-shopping-bag" style="font-size: 50px; color: #ddd; margin-bottom: 20px;"></i>
                    <p style="color: #888;">Seu carrinho está vazio.</p>
                    <a href="index.html" class="btn-cadastrar" style="display: inline-block; width: auto; padding: 12px 30px; margin-top: 20px; text-decoration: none;">CONTINUAR COMPRANDO</a>
                </div>`;
            totalElemento.innerText = "0,00";
            return;
        }

        container.innerHTML = "";
        let totalGeral = 0;

        itens.forEach(item => {
            const subtotal = item.preco * item.quantidade;
            totalGeral += subtotal;

            // Lógica de imagem (mesma da vitrine)
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
                            <div class="qtd-seletor" style="margin-top: 10px; font-size: 14px; font-weight: 600;">
                                Quantidade: ${item.quantidade}
                            </div>
                        </div>
                    </div>
                    <div class="preco-subtotal">
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 12px; color: #999; font-weight: 400; margin-bottom: 5px;">Subtotal</span>
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
        
        // Salvar total para o checkout
        const btnFinalizar = document.querySelector('.btn-finalizar-compra');
        if (btnFinalizar) {
            btnFinalizar.onclick = () => {
                localStorage.setItem('totalCarrinho', totalGeral.toFixed(2).replace('.', ','));
                window.location.href = "checkout.html";
            };
        }

    } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        container.innerHTML = "<p style='text-align:center;'>Erro ao carregar o carrinho. Tente novamente.</p>";
    }
}

// Função para remover item
async function removerItem(carrinhoId) {
    // Feedback visual imediato (opcional)
    if(!confirm("Deseja remover este item do carrinho?")) return;

    try {
        const resposta = await fetch(`${API_URL}/carrinho/remover/${carrinhoId}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            carregarItensCarrinho(); 
        }
    } catch (error) {
        console.error("Erro de conexão ao remover item:", error);
    }
}
