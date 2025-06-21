import request from 'supertest';
import app, { isAuth } from '../../app.js';
import { createPool } from '../../db/connection.js';
import bcrypt from 'bcrypt';

// pool e mocks
const pool = createPool();
beforeEach(() => { jest.clearAllMocks(); });

describe('Rota /cadastrar', () => {
  it('200 → cadastra e redireciona', async () => {
    pool.query.mockResolvedValueOnce([{ insertId : 10 }]); // INSERT
    const res = await request(app).post('/cadastrar').send({
      name : 'A', 'name-empresa' : 'B', cnpj : 'C', endereco : 'D',
      email: 'a@b', password     : '123456'
    });
    expect(res.status).toBe(302);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('400 → campos obrigatórios faltantes', async () => {
    const res = await request(app).post('/cadastrar').send({});
    expect(res.status).toBe(302);
  });

  it('500 → falha de banco', async () => {
    pool.query.mockRejectedValueOnce(new Error());
    const res = await request(app).post('/cadastrar').send({
      name : 'A', 'name-empresa' : 'B', cnpj : 'C', endereco : 'D',
      email: 'a@b', password     : '123456'
    });
    expect(res.status).toBe(302);
  });
});
