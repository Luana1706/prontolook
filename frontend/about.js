document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('aboutModal');
    const btn = document.getElementById('openAboutBtn');
    const span = document.querySelector('.close-about');

    // Abrir modal
    btn.onclick = () => {
        modal.style.display = 'block';
    }

    // Fechar no X
    span.onclick = () => {
        modal.style.display = 'none';
    }

    // Fechar ao clicar fora do modal
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
});