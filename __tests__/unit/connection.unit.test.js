/**
 * @jest-environment node
 */
jest.mock('mysql2/promise', () => ({
  __esModule: true,                // garante import default
  default: { createPool: jest.fn(() => ({})) },
  createPool: jest.fn(() => ({}))
}));

jest.isolateModules(() => {
   jest.resetModules();                // impede vazamento
   jest.doMock('mysql2/promise', () => {
     const createPool = jest.fn(() => ({
       query: jest.fn(),               // stub comum
       end  : jest.fn(),               // evita erro no afterAll()
     }));
     return { __esModule: true, default: { createPool }, createPool };
   });
   // carrega novamente o módulo já isolado
   const { createPool } = require('../../db/connection.js');

   test('createPool repassa opções', () => {
     createPool({ host: 'X' });
     const mysql = require('mysql2/promise');
     expect(mysql.createPool).toHaveBeenCalledWith(
       expect.objectContaining({ host: 'X' })
     );
   });
 });

import mysql from 'mysql2/promise';   // 2º — agora é mock
import { createPool } from '../../db/connection.js';

test('createPool repassa opções', () => {
  createPool({ host: 'X' });
  expect(mysql.createPool)
    .toHaveBeenCalledWith(expect.objectContaining({ host: 'X' }));
});
