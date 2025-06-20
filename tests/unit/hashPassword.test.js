import bcrypt from 'bcrypt';

describe('hashPassword util', () => {
  it('gera hash e valida senha', async () => {
    const plain = '123456';
    const hash  = await bcrypt.hash(plain, 10);
    const ok    = await bcrypt.compare(plain, hash);
    expect(ok).toBe(true);
  });
});
