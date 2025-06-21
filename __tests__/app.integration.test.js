import request from 'supertest';
import app from '../app.js';
import { connection } from '../db/connection.js';
import bcrypt from 'bcrypt';
import { execSync } from 'child_process';

// ===================================================================================
// Bloco de Configuração Geral dos Testes
// ===================================================================================
describe('Testes de Integração da API - Banco de Sangue', () => {
    // Credenciais para um usuário de teste que criaremos programaticamente
    const testAdminCredentials = {
        email: 'admin.test@empresa.com',
        password: 'a-very-secure-password-123!'
    };

    // Hook que roda UMA VEZ ANTES de todos os testes.
    beforeAll(async () => {
        // 1. Popula o banco de dados com a estrutura e dados base
        try {
            const dbPassword = process.env.DB_PASSWORD || 'DevOliveira25';
            execSync(`mysql -u root -p${dbPassword} banco_sangue_test < banco_sangue.sql`);
        } catch (error) {
            console.error("ERRO AO POPULAR BANCO DE DADOS DE TESTE:", error.message);
            process.exit(1);
        }

        // 2. Cria um usuário admin de teste com senha conhecida e hasheada
        try {
            // Limpa qualquer resquício de um teste anterior
            await connection.query('DELETE FROM users WHERE email = ?', [testAdminCredentials.email]);
            
            const hashedPassword = await bcrypt.hash(testAdminCredentials.password, 10);
            await connection.query(
                "INSERT INTO users (name, empresa, cnpj, endereco, email, password) VALUES (?, ?, ?, ?, ?, ?)",
                ['Admin de Teste', 'Test Corp', '000000', 'Rua dos Testes', testAdminCredentials.email, hashedPassword]
            );
        } catch (error) {
            console.error("ERRO AO CRIAR USUÁRIO DE TESTE:", error.message);
            process.exit(1);
        }
    });

    // Hook que roda UMA VEZ DEPOIS de todos os testes.
    afterAll(() => {
        connection.end(); // Fecha a conexão com o banco
    });

    // ===================================================================================
    // Testes para Endpoints Públicos
    // ===================================================================================
    describe('Endpoints Públicos e Autenticação', () => {
        it('GET / -> Deve retornar status 200', async () => {
            const response = await request(app).get('/');
            expect(response.statusCode).toBe(200);
        });

        it('POST /entrar -> Deve retornar 404 para e-mail inexistente', async () => {
            const response = await request(app)
                .post('/entrar')
                .send({ email: 'naoexiste@exemplo.com', password: '123' });
            expect(response.statusCode).toBe(404);
        });

        it('POST /entrar -> Deve autenticar com sucesso o usuário de teste', async () => {
            const response = await request(app)
                .post('/entrar')
                .send(testAdminCredentials);
            // O sucesso redireciona para /empresa
            expect(response.statusCode).toBe(302);
            expect(response.headers.location).toBe('/empresa');
        });
    });

    // ===================================================================================
    // Testes para Endpoints Protegidos (que exigem login)
    // ===================================================================================
    describe('Endpoints Protegidos', () => {
        let agent; // O 'agent' mantém o cookie de sessão entre os testes

        // Antes de cada teste neste bloco, faz o login com nosso usuário de teste
        beforeEach(async () => {
            agent = request.agent(app); // Cria um agente para simular um navegador
            await agent.post('/entrar').send(testAdminCredentials);
        });

        it('POST /add-fun -> Deve adicionar um novo funcionário com sucesso', async () => {
            const novoFuncionario = {
                name: 'Funcionario Teste',
                cargo: 'balconista',
                cpf: '123.456.789-00',
                email: 'func.teste@empresa.com',
                password: 'senhaFunc123'
            };

            const response = await agent // Usa o agente já autenticado
                .post('/add-fun')
                .send(novoFuncionario);
            
            expect(response.statusCode).toBe(201); // 201 Created
            expect(response.body.success).toBe(true);
        });
        
        it('POST /add-doacao -> Deve registrar uma nova doação com sucesso', async () => {
            const novaDoacao = {
                name: 'Doador Generoso',
                documento: 'cnh',
                tipo_sangue: 'o-',
                condicao_1: 'on',
                condicao_2: 'on',
                condicao_3: 'on'
            };
            
            const response = await agent
                .post('/add-doacao')
                .send(novaDoacao);

            // A rota redireciona em caso de sucesso
            expect(response.statusCode).toBe(302);
            expect(response.headers.location).toBe('/empresa');
        });
    });
});
