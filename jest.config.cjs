// jest.config.cjs – configuração única do Jest (Common-JS)

/** @type {import('jest').Config} */
module.exports = {
  /* Onde o Jest deve procurar por arquivos de teste. */
  testMatch: ['**/?(*.)+(test|spec).[jt]s?(x)'],

  /* O ambiente de teste padrão é 'node'.
     Testes de front-end devem especificar `@jest-environment jsdom` no cabeçalho do arquivo. */
  testEnvironment: 'node',

  /* Ignora diretórios específicos que não contêm testes a serem executados. */
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/__tests__/helpers/',
  ],

  /* Transforma arquivos JS/JSX usando SWC para entender ESM sem Babel. */
  transform: {
    '^.+\\.jsx?$': '@swc/jest',
  },

  /* Permite importar módulos usando caminhos relativos sem o sufixo .js. */
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  /* Arquivos globais que são executados após o ambiente de teste ser configurado. */
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  /* Limpa mocks entre os testes. */
  clearMocks: true,

  /* Habilita a coleta de cobertura de testes. */
  collectCoverage: true,

  /* Define de quais arquivos a cobertura deve ser coletada. */
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!jest.config.*',
    '!**/__tests__/**',
    '!**/coverage/**',   // Ignora os relatórios de cobertura gerados
    '!**/cypress/**',    // Ignora arquivos de testes E2E do Cypress
    '!scripts/api.js',   // Ignora o utilitário de API, conforme a atualização
    '!cypress.config.js', 
  ],

  /* ATUALIZAÇÃO: Ignora caminhos específicos da instrumentação de cobertura.
     Esta é a forma correta de ignorar diretórios inteiros como 'styles'. */
  coveragePathIgnorePatterns: [
    '<rootDir>/styles/'
  ],

  // Exemplo de como definir um limite mínimo para a cobertura de testes.
  // coverageThreshold: {
  //   global: {
  //     lines: 95,
  //     statements: 95,
  //     branches: 90,
  //     functions: 90,
  //   },
  // },
};