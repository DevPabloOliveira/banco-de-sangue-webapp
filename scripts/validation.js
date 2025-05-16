document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.querySelector('#modal-cadastro form');
    formCadastro.addEventListener('submit', (e) => {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            e.preventDefault();
            const message = document.getElementById('message');
            message.style.display = 'block';
            message.textContent = 'As senhas não correspondem.';
        }
    });
});
