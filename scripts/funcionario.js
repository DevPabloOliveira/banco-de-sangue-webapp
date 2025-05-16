document.addEventListener("DOMContentLoaded", () => {
    // Verificar autenticação
    fetch('/auth-status')
        .then(res => res.json())
        .then(data => {
            if (!data.isAuthenticated) {
                // Redirecionar se não autenticado
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Erro ao verificar autenticação:', error);
            window.location.href = '/';
        });

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        // Logout
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            fetch('/sair')
                .then(() => {
                    window.location.href = '/';
                })
                .catch(error => {
                    console.error('Erro ao encerrar sessão:', error);
                });
        });
    }

    // Adicionar doador
    const formAddDoacao = document.getElementById('modal-add-doacao');
    if (formAddDoacao) {
        formAddDoacao.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            fetch('/add-doacao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao adicionar doador.');
                    }
                    alert('Doador adicionado com sucesso!');
                    this.reset();
                    // Fechar modal: simples maneira é recarregar a página ou remover hash
                    window.location.hash = '';
                })
                .catch(error => {
                    console.error('Erro ao adicionar doador:', error);
                    alert('Erro ao adicionar doador: ' + error.message);
                });
        });
    }

    // Buscar Doador
    const formBuscaDoador = document.getElementById('form-busca-doador');
    if (formBuscaDoador) {
        formBuscaDoador.addEventListener('submit', function (e) {
            e.preventDefault();
            const query = this.querySelector('[name="query"]').value;

            fetch(`/buscar-doador?query=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    const resultDiv = document.getElementById('resultado-busca-doador');
                    const aviso = document.querySelector('#buscar-doador #aviso');
                    resultDiv.innerHTML = '';
                    if (data.success && data.doadores.length > 0) {
                        aviso.style.display = 'none';
                        data.doadores.forEach(doador => {
                            const p = document.createElement('p');
                            p.textContent = `Nome: ${doador.name}, Tipo Sanguíneo: ${doador.tipo_sangue}`;
                            resultDiv.appendChild(p);
                        });
                    } else {
                        aviso.style.display = 'block';
                    }
                })
                .catch(error => console.error('Erro ao buscar doador:', error));
        });
    }

    // Buscar Bolsa de Sangue
    const formBuscaBolsa = document.getElementById('form-busca-bolsa');
    if (formBuscaBolsa) {
        formBuscaBolsa.addEventListener('submit', function (e) {
            e.preventDefault();
            const tipoSangue = this.querySelector('select[name="tipo_sangue"]').value;

            fetch(`/buscar-bolsa-sangue?tipo_sangue=${encodeURIComponent(tipoSangue)}`)
                .then(res => res.json())
                .then(data => {
                    const resultDiv = document.getElementById('resultado-bolsa');
                    const aviso = document.querySelector('#buscar-bolsa-sangue #aviso');
                    resultDiv.innerHTML = '';
                    if (data.success && data.doadores.length > 0) {
                        aviso.style.display = 'none';
                        data.doadores.forEach(doador => {
                            const p = document.createElement('p');
                            p.textContent = `Nome: ${doador.name}, Tipo Sanguíneo: ${doador.tipo_sangue}`;
                            resultDiv.appendChild(p);
                        });
                    } else {
                        aviso.style.display = 'block';
                    }
                })
                .catch(error => console.error('Erro ao buscar bolsa de sangue:', error));
        });
    }

    // Adicionar Insumo
    const formAddInsumo = document.getElementById('form-add-insumo');
    if (formAddInsumo) {
        const mensagemSucesso = document.getElementById('mensagem-sucesso');
        const mensagemErro = document.getElementById('mensagem-erro');

        formAddInsumo.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            fetch('/add-insumo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        mensagemSucesso.style.display = 'block';
                        mensagemErro.style.display = 'none';
                        formAddInsumo.reset();
                        setTimeout(() => {
                            mensagemSucesso.style.display = 'none';
                            window.location.hash = '';
                        }, 3000);
                    } else {
                        mensagemErro.textContent = result.message || 'Erro ao adicionar insumo.';
                        mensagemErro.style.display = 'block';
                        setTimeout(() => {
                            mensagemErro.style.display = 'none';
                        }, 3000);
                    }
                })
                .catch(error => {
                    console.error('Erro ao adicionar insumo:', error);
                    mensagemErro.textContent = 'Erro ao adicionar insumo.';
                    mensagemErro.style.display = 'block';
                    setTimeout(() => {
                        mensagemErro.style.display = 'none';
                    }, 3000);
                });
        });
    }

    // Buscar Insumos
    const formBuscaInsumo = document.getElementById('form-busca-insumo');
    if (formBuscaInsumo) {
        formBuscaInsumo.addEventListener('submit', function (e) {
            e.preventDefault();
            const nome = this.querySelector('input[name="nome"]').value;

            fetch(`/buscar-insumos?nome=${encodeURIComponent(nome)}`)
                .then(res => res.json())
                .then(data => {
                    const resultDiv = document.getElementById('resultado-insumos');
                    const aviso = document.querySelector('#buscar-insumos #aviso');
                    resultDiv.innerHTML = '';
                    if (data.success && data.insumos.length > 0) {
                        aviso.style.display = 'none';
                        data.insumos.forEach(insumo => {
                            const p = document.createElement('p');
                            p.textContent = `Nome: ${insumo.nome}, Quantidade: ${insumo.quantidade}`;
                            resultDiv.appendChild(p);
                        });
                    } else {
                        aviso.style.display = 'block';
                    }
                })
                .catch(error => console.error('Erro ao buscar insumos:', error));
        });
    }
});
