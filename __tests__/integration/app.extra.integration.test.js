/**
 * __tests__/integration/app.extra.integration.test.js
 *
 * Exercita rotas “felizes” que ainda não tinham cobertura:
 *   • /buscar-funcionario
 *   • /add-fun
 *   • /add-doacao
 *   • /buscar-doador
 *   • /add-bolsa-sangue
 *   • /buscar-bolsa-sangue
 *   • /add-insumo
 *   • /buscar-insumos
 */

import request        from 'supertest';
import { jest }       from '@jest/globals';
import bcrypt         from 'bcrypt';
import app            from '../../app.js';
import { connection } from '../../db/connection.js';

/*-------------------------------------------------------------------*
 * 1) Fixtures
 *-------------------------------------------------------------------*/
const adminCreds = { email: 'admin@test.com', password: 'abc123' };   // login
const funcRow    = { id: 10, name: 'José da Silva', cargo: 'estoque', telefone: '9999' };
const doadorRow  = { id: 20, name: 'Ana',          tipo_sangue: 'A+' };

/*-------------------------------------------------------------------*
 * 2) Mocks de BD – criados no beforeAll porque precisamos do hash
 *-------------------------------------------------------------------*/
let queryMock;         // para restaurar depois
let adminHash;         // calculado async

beforeAll(async () => {
  /* gera hash compatível com bcrypt.compare */
  adminHash = await bcrypt.hash(adminCreds.password, 10);

  /* espionamos a pool – devolvemos exatamente o que cada rota espera */
  queryMock = jest.spyOn(connection, 'query')
    .mockImplementation(async (sql, params = []) => {
      const q = sql.toLowerCase().trim();

      /* ---------- LOGIN ADMIN ---------- */
      if (q.includes('from users where email')) {
        return [[{ id: 1, name: 'Admin', password: adminHash }]];
      }

      /* ---------- FUNCIONÁRIOS ---------- */
      if (q.includes('from funcionarios where cpf')) {      // verif. duplicidade
        return [[/* vazio = cpf livre */]];
      }
      if (q.includes('from funcionarios') && q.includes('like')) {
        return [[funcRow]];                                 // busca por nome
      }
      if (q.startsWith('insert into funcionarios')) {       // insert
        return [[{ insertId: 42 }]];
      }

      /* ---------- DOADORES / BOLSAS ---------- */
      if (q.startsWith('select') && q.includes('from doadores')) {
        return [[doadorRow]];
      }
      if (q.startsWith('insert into doadores')) {
        return [[{ insertId: 50 }]];
      }
      if (q.startsWith('insert into bolsas_sangue')) {
        return [[{ insertId: 77 }]];
      }

      /* ---------- INSUMOS ---------- */
      if (q.startsWith('insert into insumos')) {
        return [[{ insertId: 88 }]];
      }
      if (q.includes('from insumos')) {
        return [[{ nome: 'Seringa', quantidade: 99 }]];
      }

      /* fallback – sem linhas */
      return [[/* empty */]];
    });

  /* stub de connection.end p/ não estourar em outros testes */
  if (!('end' in connection)) {
    Object.defineProperty(connection, 'end', { value: jest.fn() });
  }
});

afterAll(() => queryMock.mockRestore());

/*-------------------------------------------------------------------*
 * 3) Agent que guarda sessão (login fake no beforeEach)
 *-------------------------------------------------------------------*/
let agent;

beforeEach(async () => {
  agent = request.agent(app);
  await agent.post('/entrar').send(adminCreds);  // cria cookie de sessão
});

/*-------------------------------------------------------------------*
 * 4) Testes propriamente ditos
 *-------------------------------------------------------------------*/
describe('Rotas ainda não testadas – caminhos FELIZES', () => {

  /* ---------- FUNCIONÁRIOS ---------- */
  it('GET /buscar-funcionario → 200 + payload', async () => {
    const { status, body } = await agent.get('/buscar-funcionario?query=Jose');
    expect(status).toBe(200);
    expect(body.funcionarios[0].name).toBe(funcRow.name);
  });

  it('POST /add-fun → 201', async () => {
    const { status } = await agent.post('/add-fun').send({
      ...funcRow,
      cpf        : '12345678900',
      pis        : '',
      telefone   : '',
      email      : '',
      complemento: '',
      password   : 'segura123'
    });
    expect(status).toBe(201);
  });

  /* ---------- DOADORES ---------- */
  it('POST /add-doacao → 302 redireciona', async () => {
    const res = await agent.post('/add-doacao').send({
      ...doadorRow,
      documento  : 'rg',
      telefone   : '',
      email      : '',
      complemento: '',
      condicao_1 : 'on',
      condicao_2 : 'on',
      condicao_3 : 'on'
    });
    expect(res.status).toBe(302);
  });

  it('GET /buscar-doador → 200 + payload', async () => {
    const { status, body } = await agent.get('/buscar-doador?query=Ana');
    expect(status).toBe(200);
    expect(body.doadores[0].name).toBe(doadorRow.name);
  });

  /* ---------- BOLSAS ---------- */
  it('POST /add-bolsa-sangue → 302', async () => {
    const res = await agent.post('/add-bolsa-sangue')
      .send({ tipo_sangue: 'O-', quantidade: 5 });
    expect(res.status).toBe(302);
  });

  it('GET /buscar-bolsa-sangue → 200 + payload', async () => {
    const { status, body } = await agent.get('/buscar-bolsa-sangue?tipo_sangue=O-');
    expect(status).toBe(200);
    expect(body.doadores[0].name).toBe(doadorRow.name);
  });

  /* ---------- INSUMOS ---------- */
  it('POST /add-insumo → 201', async () => {
    const { status } = await agent.post('/add-insumo')
      .send({ nome: 'Seringa', quantidade: 99 });
    expect(status).toBe(201);
  });

  it('GET /buscar-insumos → 200 + payload', async () => {
    const { status, body } = await agent.get('/buscar-insumos?nome=Seringa');
    expect(status).toBe(200);
    expect(body.insumos[0].nome).toBe('Seringa');
  });
});
