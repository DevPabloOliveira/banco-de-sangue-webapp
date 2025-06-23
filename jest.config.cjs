// jest.config.cjs  – configuração única do Jest (Common-JS)

/** @type {import('jest').Config} */
module.exports = {
  /* onde procurar testes */
  testMatch: ['**/?(*.)+(test|spec).[jt]s?(x)'],

  /* ambiente padrão → node
     (specs de front-end indicam `@jest-environment jsdom` no cabeçalho) */
  testEnvironment: 'node',

  /* ignora helpers utilitários que não são suítes */
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/__tests__/helpers/',
  ],

  /* transforma JS/JSX com SWC – entende ESM sem precisar do Babel */
  transform: {
    '^.+\\.jsx?$': '@swc/jest',
  },

  /* permite importar caminhos relativos sem sufixo “.js” */
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  /* arquivos globais executados depois do ambiente criado */
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  clearMocks: true,

  /* cobertura de todo o código (exceto testes/config e node_modules) */
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!jest.config.*',
    '!**/__tests__/**',
    '!**/coverage/**',          // ← ignora artefactos do lcov-report
    '!**/cypress/**',  
    '!**/styles/**' 
  ],
  //coverageThreshold: {
  //  global: { lines: 95, statements: 95, branches: 90, functions: 90 }
}//};