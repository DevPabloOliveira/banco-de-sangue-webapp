/* eslint-disable no-console */

// Assumimos a existência de um arquivo api.js que exporta estas funções
import { apiGet, apiPost } from './api.js';

// Ponto de entrada que chama a função principal após o carregamento do DOM
// A inicialização automática é desativada em ambiente de teste para permitir a chamada manual.
document.addEventListener('DOMContentLoaded', bootstrap);

/**
 * Função principal que inicializa todas as funcionalidades da página do funcionário.
 */
export async function bootstrap() {
    try {
        // 1. Garante que o usuário está autenticado para acessar a página
        await verificaAuth();
        // 2. Inicializa todos os listeners de eventos da página
        initLogout();
        initAddDoador();
        initBuscaDoador();
        initBuscaBolsa();
        initAddInsumo();
        initBuscaInsumos();

    } catch (err) {
        // Se a autenticação falhar, o usuário é redirecionado para a página de login
        console.error('Falha na autenticação do funcionário:', err);
        // Padroniza o redirecionamento para ser testável.
        window.location.assign('/');
    }
}


// --- Funções de Inicialização ---


/**
 * Verifica o status de autenticação no servidor.
 * Lança um erro se não estiver autenticado.
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
        e.preventDefault();
        try {
            await apiGet('/sair');
            window.location.assign('/');
        } catch (error) {
            console.error('Erro ao encerrar sessão:', error);
        }
    });
}

/**
 * Lida com o formulário de adição de um novo doador.
 */
function initAddDoador() {
    const form = document.getElementById('modal-add-doacao');
    if (!form) return;
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        // CORREÇÃO: Usa 'this' (ou a variável 'form' do closure), que é mais estável no JSDOM.
        const data = Object.fromEntries(new FormData(this).entries());

        try {
            await apiPost('/add-doacao', data);
            alert('Doador adicionado com sucesso!');
            this.reset();
            window.location.hash = ''; // Fecha o modal
        } catch (error) {
            console.error('Erro ao adicionar doador:', error);
            alert(`Erro ao adicionar doador: ${error.message}`);
        }
    });
}

/**
 * Lida com o formulário de busca de doadores.
 */
function initBuscaDoador() {
    const form = document.getElementById('form-busca-doador');
    const alvo = document.getElementById('resultado-busca-doador');
    const aviso = document.querySelector('#buscar-doador #aviso');
    if (!form || !alvo || !aviso) return;
    form.addEventListener('submit', async ev => {
        ev.preventDefault();
        aviso.style.display = 'none';
        alvo.innerHTML = 'Buscando...';

        // CORREÇÃO: Usa a variável 'form' do closure, que é mais estável que ev.currentTarget no JSDOM.
        const q = new FormData(form).get('query');
        try {
            const { doadores } = await apiGet(`/buscar-doador?query=${encodeURIComponent(q)}`);
            alvo.innerHTML = ''; // Limpa o "Buscando..."

            if (!doadores || doadores.length === 0) {
                aviso.textContent = 'Nenhum doador encontrado';
                aviso.style.display = 'block';
                return;
            }

            alvo.innerHTML = doadores
                .map(d => `<li>Nome: ${d.name}, Tipo: ${d.tipo_sangue.toUpperCase()}</li>`)
                .join('');
        } catch (err) {
            console.error('Erro na busca de doador:', err);
            aviso.textContent = 'Erro na busca';
            aviso.style.display = 'block';
        }
    });
}

/**
 * Lida com o formulário de busca de bolsas de sangue.
 */
function initBuscaBolsa() {
    const form = document.getElementById('form-busca-bolsa');
    const resultDiv = document.getElementById('resultado-bolsa');
    const aviso = document.querySelector('#buscar-bolsa-sangue #aviso');
    if (!form || !resultDiv || !aviso) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        // CORREÇÃO: Usa a variável 'form' do closure.
        const tipoSangue = new FormData(form).get('tipo_sangue');
        resultDiv.innerHTML = 'Buscando...';
        aviso.style.display = 'none';

        try {
            const { doadores } = await apiGet(`/buscar-bolsa-sangue?tipo_sangue=${encodeURIComponent(tipoSangue)}`);
            resultDiv.innerHTML = '';

            if (doadores && doadores.length > 0) {
                doadores.forEach(doador => {
                    const p = document.createElement('p');
                    p.textContent = `Nome: ${doador.name}, Tipo Sanguíneo: ${doador.tipo_sangue}`;
                    resultDiv.appendChild(p);
                });
            } else {
                aviso.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao buscar bolsa de sangue:', error);
            aviso.textContent = 'Erro ao realizar a busca.';
            aviso.style.display = 'block';
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
    if (!form || !okBox || !errBox) return;

    form.addEventListener('submit', async ev => {
        ev.preventDefault();
        okBox.style.display = 'none';
        errBox.style.display = 'none';

        // CORREÇÃO: Usa a variável 'form' do closure.
        const payload = Object.fromEntries(new FormData(form).entries());
        try {
            await apiPost('/add-insumo', payload);
            okBox.textContent = 'Insumo adicionado ✅';
            okBox.style.display = 'block';
            form.reset();
            setTimeout(() => { okBox.style.display = 'none'; window.location.hash = ''; }, 3000);
        } catch (err) {
            errBox.textContent = err.message || 'Erro ao adicionar insumo.';
            errBox.style.display = 'block';
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
    const aviso = document.querySelector('#buscar-insumos #aviso');
    if (!form || !resultDiv || !aviso) return;
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        // CORREÇÃO: Usa a variável 'form' do closure.
        const nome = new FormData(form).get('nome');
        resultDiv.innerHTML = 'Buscando...';
        aviso.style.display = 'none';

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
                aviso.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao buscar insumos:', error);
            aviso.textContent = 'Erro ao realizar a busca.';
            aviso.style.display = 'block';
        }
    });
}