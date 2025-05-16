document.addEventListener("DOMContentLoaded", () => {
    fetch('/auth-status')
        .then(res => res.json())
        .then(data => {
            if (data.isAuthenticated) {
                // Exibir botão de logout e esconder entrar/cadastrar
                document.getElementById('btn-logout').style.display = 'inline-block';
                document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
            } else {
                document.getElementById('btn-logout').style.display = 'none';
                document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'inline-block');
            }
        })
        .catch(error => {
            console.error('Erro ao verificar autenticação:', error);
        });
});
