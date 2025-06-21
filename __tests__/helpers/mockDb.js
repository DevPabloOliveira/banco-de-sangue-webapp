// tests/helpers/mockDb.js
export function mockDb() {
  return jest.spyOn(connection, 'query')
    .mockImplementation(async (sql, params = []) => {
      const match = sql.trim().toLowerCase();

      if (match.startsWith('select') && match.includes('from users')) {
        return [[{ id: 1, password: 'hash...' }]];
      }

      if (match.startsWith('insert into funcionarios')) {
        return [[{ insertId: 42 }]];
      }

      if (match.startsWith('delete')) return [[]];

      throw new Error(`SQL não mapeado no mock: ${sql}`);
    });
}
