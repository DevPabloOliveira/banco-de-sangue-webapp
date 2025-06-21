// __tests__/unit/login.routes.test.js
import request from 'supertest';
import app from '../../app.js';
import { connection } from '../../db/connection.js';

describe('POST /entrar → 401 quando user inexistente', () => {
  it('retorna 401 e JSON de falha', async () => {
    jest.spyOn(connection, 'query')
      .mockResolvedValueOnce([[]]);          // SELECT users → vazio

    const { status, body } = await request(app)
      .post('/entrar')
      .send({ email: 'fantasma@x.com', password: 'abc' });

    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });
});
