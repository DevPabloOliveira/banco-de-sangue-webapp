import request from 'supertest';
import { app } from '../../src/app.js';  // exporte o Express em src/app.js

describe('POST /entrar', () => {
  it('deve logar admin com 302 redirect', async () => {
    const res = await request(app)
      .post('/entrar')
      .send({ email: 'admin@mail.com', password: '123456' });

    expect(res.statusCode).toBe(302);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
