/* eslint-disable no-console */

// Assumimos que existe um arquivo api.js que exporta estas funções
import { apiGet, apiPost } from './api.js';

// Ponto de entrada principal quando o DOM está pronto
// A inicialização automática é desativada em ambiente de teste para permitir a chamada manual.
document.addEventListener('DOMContentLoaded', bootstrap);

/**
 * Função principal que inicializa todas as funcionalidades da página.
 */
export async function bootstrap() {
    try {
        // 1. Verifica se o usuário está autenticado. Se não, redireciona.
        await verificaAuth();

        // 2. Inicializa todos os listeners de eventos da página.
        initLogout();
        initAddBolsa();
        initBuscaBolsa();
        initAddInsumo();
        initBuscaInsumos();
        initAddFuncionario();
        initBuscaFuncionario();
        initBuscaDoador();
    } catch (err) {
        // Se a verificação de autenticação falhar, redireciona para a página inicial.
        console.error('Falha na autenticação:', err);
        // Padroniza o redirecionamento para ser testável.
        window.location.assign('/');
    }
}

// --- Funções de Inicialização ---

/**
 * Verifica o status de autenticação no servidor.
 */
async function verificaAuth() {
    const { isAuthenticated } = await apiGet('/auth-status');
    if (!isAuthenticated) {
        throw new Error('Usuário não autenticado');
    }
}

/**
 * Adiciona o evento de clique para o botão de logout.
 */
function initLogout() {
    const btnLogout = document.getElementById('btn-logout');
    if (!btnLogout) return;
    btnLogout.addEventListener('click', async (e) => {
        e.preventDefault(); // Impede a navegação direta para /sair
        try {
            await apiGet('/sair'); // Tenta o logout via API
            window.location.assign('/'); // Redireciona com JavaScript
        } catch (error) {
            console.error('Erro ao encerrar sessão:', error);
            // Plano B: Se a API falhar, redireciona o usuário mesmo assim.
            window.location.assign('/'); 
        }
    });
}

/**
 * Lida com o formulário de adição de doação/bolsa.
 */
function initAddBolsa() {
    const form = document.getElementById('form-add-bolsa');
    const okBox = document.getElementById('msg-ok');
    const errBox = document.getElementById('msg-erro');

    if (!form || !okBox || !errBox) return;
    form.addEventListener('submit', async ev => {
        ev.preventDefault();
        okBox.style.display = 'none';
        errBox.style.display = 'none';

        // CORREÇÃO: Usa a variável 'form' do closure, que é mais estável no JSDOM.
        const data = Object.fromEntries(new FormData(form).entries());
        try {
            await apiPost('/add-bolsa', data);
            okBox.style.display = 'block';
            form.reset();
            setTimeout(() => { okBox.style.display = 'none'; }, 3000);
        } catch (err) {
            errBox.textContent = err.message || 'Ocorreu um erro.';
            errBox.style.display = 'block';
        }
    });
}


/**
 * Lida com o formulário de busca de bolsas de sangue.
 */
function initBuscaBolsa() {
    const form      = document.getElementById('form-busca-bolsa');
    const resultDiv = document.getElementById('resultado-bolsa');
    if (!form || !resultDiv) return;

    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        resultDiv.innerHTML = 'Buscando…';

        // Tipo sanguíneo selecionado
        const tipo = new FormData(form).get('tipo_sangue')?.toUpperCase();

        try {
            // Chama o endpoint do back-end (sempre retorna { bolsas: [...] })
            const { bolsas } = await apiGet(
                `/buscar-bolsa-sangue?tipo_sangue=${encodeURIComponent(tipo)}`
            );

            resultDiv.innerHTML = '';

            // Nenhum resultado
            if (!bolsas || bolsas.length === 0) {
                resultDiv.textContent =
                    'Nenhuma bolsa encontrada para este tipo sanguíneo.';
                return;
            }

            // Monta a tabela de resultados
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tipo</th>
                        <th>Volume&nbsp;(mL)</th>
                        <th>Validade</th>
                    </tr>
                </thead>
                <tbody>
                    ${bolsas
                        .map(
                            (b) => `
                        <tr>
                            <td>${b.id}</td>
                            <td>${b.tipo_sangue}</td>
                            <td>${b.volume_ml}</td>
                            <td>${b.validade ?? '—'}</td>
                        </tr>
                    `
                        )
                        .join('')}
                </tbody>
            `;
            resultDiv.appendChild(table);
        } catch (error) {
            console.error('Erro na consulta de bolsas:', error);
            resultDiv.textContent = 'Erro ao realizar a consulta.';
        }
    });
}

/**
 * Lida com o formulário de adição de insumos.
 */
function initAddInsumo() {
    const form = document.getElementById('form-add-insumo');
    const okBox = document.getElementById('mensagem-sucesso');
    const errBox = document.getElementById('mensagem-erro');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // CORREÇÃO: Usa a variável 'form' do closure.
        const data = Object.fromEntries(new FormData(form).entries());

        try {
            await apiPost('/add-insumo', data);
            okBox.style.display = 'block';
            errBox.style.display = 'none';
            form.reset();
            setTimeout(() => {
                okBox.style.display = 'none';
                window.location.hash = ''; // Fecha o modal
            }, 3000);
        } catch (error) {
            errBox.textContent = error.message || 'Erro ao adicionar insumo.';
            errBox.style.display = 'block';
            okBox.style.display = 'none';
            setTimeout(() => { errBox.style.display = 'none'; }, 3000);
        }
    });
}

/**
 * Lida com o formulário de busca de insumos.
 */
function initBuscaInsumos() {
    const form = document.getElementById('form-busca-insumo');
    const resultDiv = document.getElementById('resultado-insumos');
    if (!form || !resultDiv) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // CORREÇÃO: Usa a variável 'form' do closure.
        const nome = new FormData(form).get('nome');
        resultDiv.innerHTML = 'Buscando...';

        try {
            const { insumos } = await apiGet(`/buscar-insumos?nome=${encodeURIComponent(nome)}`);
            resultDiv.innerHTML = '';
            if (insumos && insumos.length > 0) {
                insumos.forEach(insumo => {
                    const p = document.createElement('p');
                    p.textContent = `Nome: ${insumo.nome}, Quantidade: ${insumo.quantidade}`;
                    resultDiv.appendChild(p);
                });
            } else {
                resultDiv.textContent = 'Nenhum insumo encontrado.';
            }
        } catch (error) {
            console.error('Erro ao buscar insumos:', error);
            resultDiv.textContent = 'Erro ao buscar insumos.';
        }
    });
}

/**
 * Lida com o formulário de adição de funcionário.
 */
function initAddFuncionario() {
    const form = document.getElementById('modal-add-funcionario');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // CORREÇÃO: Usa a variável 'form' do closure.
        const data = Object.fromEntries(new FormData(form).entries());

        if (!data.password || data.password.length < 6) {
            alert('A senha precisa ter no mínimo 6 caracteres.');
            return;
        }

        try {
            const result = await apiPost('/add-fun', data);
            alert(result.message || 'Funcionário adicionado com sucesso!');
            form.reset();
            window.location.hash = ''; // Fecha o modal
        } catch (error) {
            console.error('Erro ao adicionar funcionário:', error);
            alert(`Erro: ${error.message || 'Ocorreu um erro desconhecido.'}`);
        }
    });
}

/**
 * Lida com o formulário de busca de funcionário.
 */
function initBuscaFuncionario() {
    const form = document.getElementById('form-busca-funcionario');
    const resultDiv = document.getElementById('resultado-busca-funcionario');
    if (!form || !resultDiv) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // CORREÇÃO: Usa a variável 'form' do closure.
        const query = new FormData(form).get('query');
        resultDiv.innerHTML = 'Buscando...';

        try {
            const { funcionarios } = await apiGet(`/buscar-funcionario?query=${encodeURIComponent(query)}`);
            resultDiv.innerHTML = '';
            if (funcionarios && funcionarios.length > 0) {
                funcionarios.forEach(func => {
                    const p = document.createElement('p');
                    p.textContent = `Nome: ${func.name}, Cargo: ${func.cargo}, Telefone: ${func.telefone}`;
                    resultDiv.appendChild(p);
                });
            } else {
                resultDiv.textContent = 'Nenhum funcionário encontrado.';
            }
        } catch (error) {
            console.error('Erro ao buscar funcionário:', error);
            resultDiv.textContent = 'Erro ao buscar funcionário.';
        }
    });
}

/**
 * Lida com o formulário de busca de doador.
 */
function initBuscaDoador() {
    const form = document.getElementById('form-busca-doador');
    const resultDiv = document.getElementById('resultado-busca-doador');
    if (!form || !resultDiv) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // CORREÇÃO: Usa a variável 'form' do closure.
        const query = new FormData(form).get('query');
        resultDiv.innerHTML = 'Buscando...';

        try {
            const { doadores } = await apiGet(`/buscar-doador?query=${encodeURIComponent(query)}`);
            resultDiv.innerHTML = '';
            if (doadores && doadores.length > 0) {
                doadores.forEach(doador => {
                    const p = document.createElement('p');
                    p.textContent = `Nome: ${doador.name}, Tipo Sanguíneo: ${doador.tipo_sangue}`;
                    resultDiv.appendChild(p);
                });
            } else {
                resultDiv.textContent = 'Nenhum doador encontrado.';
            }
        } catch (error) {
            console.error('Erro ao buscar doador:', error);
            resultDiv.textContent = 'Erro ao buscar doador.';
        }
    });
}
