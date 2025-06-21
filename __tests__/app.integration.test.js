import request from 'supertest';
import app from '../app.js';
import { connection } from '../db/connection.js';
import bcrypt from 'bcrypt';

describe('Testes de Integração da API - Banco de Sangue', () => {
    // --- Variáveis de Teste ---
    const testAdminCredentials = {
        email: 'admin.test@empresa.com',
        password: 'a-very-secure-password-123!'
    };
    let testAdminUser;
    let agent; // Agente para manter a sessão de login

    // --- Hooks de Configuração (before/after) ---
    beforeAll(async () => {
        try {
            await connection.query('DELETE FROM users WHERE email = ?', [testAdminCredentials.email]);
            const hashedPassword = await bcrypt.hash(testAdminCredentials.password, 10);
            const [result] = await connection.query(
                "INSERT INTO users (name, empresa, cnpj, endereco, email, password) VALUES (?, ?, ?, ?, ?, ?)",
                ['Admin de Teste', 'Test Corp', '000000', 'Rua dos Testes', testAdminCredentials.email, hashedPassword]
            );
            const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            testAdminUser = users[0];
        } catch (error) {
            console.error("ERRO FATAL NO SETUP (beforeAll):", error.message);
            process.exit(1);
        }
    });

    beforeEach(async () => {
        agent = request.agent(app);
        await agent.post('/entrar').send(testAdminCredentials);
        await connection.query('DELETE FROM funcionarios');
        await connection.query('DELETE FROM doadores');
        await connection.query('DELETE FROM insumos');
        await connection.query('DELETE FROM bolsas_sangue');
    });

    afterAll(() => {
        connection.end();
    });

    // --- Suítes de Testes ---

    describe('GET / - Rotas Públicas e de Sessão', () => {
        it('deve retornar status 200 para a página inicial', async () => {
            await request(app).get('/').expect(200);
        });

        it('deve retornar status 200 para a página de recuperação', async () => {
            await request(app).get('/recuperacao').expect(200);
        });

        it('GET /auth-status deve retornar isAuthenticated: true após o login', async () => {
            const response = await agent.get('/auth-status');
            expect(response.body.isAuthenticated).toBe(true);
        });

        it('GET /sair deve encerrar a sessão e redirecionar para a home', async () => {
            await agent.get('/sair').expect(302).expect('Location', '/');
        });
    });

    describe('POST /recuperar-senha', () => {
        it('deve retornar sucesso para um e-mail existente', async () => {
            const response = await request(app)
                .post('/recuperar-senha')
                .send({ email: testAdminCredentials.email });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('deve retornar 404 para um e-mail inexistente', async () => {
            await request(app).post('/recuperar-senha').send({ email: 'naoexiste@a.com' }).expect(404);
        });
    });

    describe('POST /deletar - Deleção de Conta', () => {
        it('deve falhar ao tentar deletar com senha incorreta', async () => {
            await agent.post('/deletar').send({ password: 'senha-errada' }).expect(401);
        });
    });
    
    describe('POST /editar-empresa - Edição de Empresa', () => {
        it('deve editar os dados da empresa e redirecionar', async () => {
            const dadosEditados = { nameEmpresa: 'Novo Nome Corp', endereco: 'Nova Rua, 456' };
            await agent.post('/editar-empresa').send(dadosEditados).expect(302).expect('Location', '/empresa');
            const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [testAdminUser.id]);
            expect(users[0].empresa).toBe('Novo Nome Corp');
        });

        it('deve falhar se os dados de edição estiverem faltando', async () => {
            await agent.post('/editar-empresa').send({ nameEmpresa: 'Incompleto' }).expect(400);
        });
    });

    describe('Gerenciamento de Funcionários (Admin)', () => {
        it('POST /add-fun deve falhar ao adicionar funcionário com CPF duplicado', async () => {
            const funcionario = { name: 'Func A', cargo: 'estoque', cpf: '111', email: 'a@a.com', password: '123' };
            await agent.post('/add-fun').send(funcionario).expect(201);
            await agent.post('/add-fun').send(funcionario).expect(400);
        });

        it('GET /buscar-funcionario deve encontrar um funcionário pelo nome', async () => {
            const funcionario = { name: 'Funcionario Buscado', cargo: 'limpeza', cpf: '222', email: 'b@b.com', password: '123' };
            await agent.post('/add-fun').send(funcionario);
            const response = await agent.get('/buscar-funcionario?query=Buscado');
            expect(response.status).toBe(200);
            expect(response.body.funcionarios[0].name).toBe('Funcionario Buscado');
        });
        
        it('GET /buscar-funcionario deve retornar 404 se não encontrar', async () => {
            await agent.get('/buscar-funcionario?query=Inexistente').expect(404);
        });
    });

    describe('Gerenciamento de Doadores e Estoque', () => {
        it('GET /buscar-doador deve encontrar um doador pelo nome', async () => {
            const doador = { name: 'Doador Encontrado', documento: 'rg', tipo_sangue: 'a+', condicao_1: 'on', condicao_2: 'on', condicao_3: 'on' };
            await agent.post('/add-doacao').send(doador);
            const response = await agent.get('/buscar-doador?query=Encontrado');
            expect(response.status).toBe(200);
            expect(response.body.doadores[0].name).toBe('Doador Encontrado');
        });

        it('GET /buscar-bolsa-sangue deve encontrar doadores por tipo sanguíneo', async () => {
            const doador = { name: 'Doador O-Neg', documento: 'rg', tipo_sangue: 'o-', condicao_1: 'on', condicao_2: 'on', condicao_3: 'on' };
            await agent.post('/add-doacao').send(doador);
            const response = await agent.get('/buscar-bolsa-sangue?tipo_sangue=o-');
            expect(response.status).toBe(200);
            expect(response.body.doadores[0].name).toBe('Doador O-Neg');
        });

        it('POST /add-insumo e GET /buscar-insumos devem funcionar em conjunto', async () => {
            const insumo = { nome: 'Seringa Especial', quantidade: 500 };
            await agent.post('/add-insumo').send(insumo).expect(201);
            const response = await agent.get('/buscar-insumos?nome=Especial');
            expect(response.status).toBe(200);
            expect(response.body.insumos[0].nome).toBe('Seringa Especial');
        });

        it('POST /add-bolsa-sangue deve adicionar uma nova bolsa e redirecionar', async () => {
            const bolsa = { tipo_sangue: 'ab-', quantidade: 10 };
            await agent.post('/add-bolsa-sangue').send(bolsa).expect(302).expect('Location', '/empresa');
            const [bolsas] = await connection.query('SELECT * FROM bolsas_sangue WHERE tipo_sangue = ?', ['ab-']);
            expect(bolsas.length).toBe(1);
            expect(bolsas[0].quantidade).toBe(10);
        });
    });
});
