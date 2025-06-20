export default {
  testEnvironment: 'node',
  //extensionsToTreatAsEsm: ['.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  setupFilesAfterEnv: ['./tests/jest.setup.cjs'],
};
