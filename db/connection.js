import mysql from 'mysql2';

export const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'banco_sangue',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//Adicionar Usuário
export function adicionarUsuario(name, nameEmpresa, cnpj, endereco, email, password, callback) {
    const sql = `INSERT INTO users (name, empresa, cnpj, endereco, email, password) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [name, nameEmpresa, cnpj, endereco, email, password];
    connection.query(sql, values, (err, result) => {
        if (err) return callback(err);
        callback(null, result.insertId);
    });
}

//Adicionar Doador
export const adicionarDoador = (doadorData, callback) => {
    const query = `
        INSERT INTO doadores 
        (name, documento, tipo_sangue, telefone, email, complemento, condicao_1, condicao_2, condicao_3)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    connection.query(
        query,
        [
            doadorData.name,
            doadorData.documento,
            doadorData.tipo_sangue,
            doadorData.telefone,
            doadorData.email,
            doadorData.complemento,
            doadorData.condicao_1,
            doadorData.condicao_2,
            doadorData.condicao_3,
        ],
        callback
    );
};


//Adicionar Funcionario
export const adicionarFuncionario = (funcionarioData, callback) => {
    const checkQuery = `SELECT * FROM funcionarios WHERE cpf = ?`;

    // Verifica se o CPF já existe
    connection.query(checkQuery, [funcionarioData.cpf], (err, results) => {
        if (err) {
            console.error('Erro ao verificar duplicidade de CPF:', err);
            return callback(err);
        }

        if (results.length > 0) {
            return callback(new Error('CPF já existe no sistema.'));
        }

        // Adiciona o funcionário com a senha
        const insertQuery = `
            INSERT INTO funcionarios (name, cargo, cpf, pis, telefone, email, complemento, password, empresa_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        connection.query(
            insertQuery,
            [
                funcionarioData.name,
                funcionarioData.cargo,
                funcionarioData.cpf,
                funcionarioData.pis,
                funcionarioData.telefone,
                funcionarioData.email,
                funcionarioData.complemento,
                funcionarioData.password, // Novo campo de senha
                funcionarioData.empresa_id || null // O ID da empresa pode ser opcional "verificar" 
            ],
            callback
        );
    });
};



//Adicionar Bolsa de Sangue
export const adicionarBolsaSangue = (bolsaData, callback) => {
  const query = `
      INSERT INTO bolsas_sangue (tipo_sangue, quantidade)
      VALUES (?, ?)
  `;
  connection.query(query, [bolsaData.tipo_sangue, bolsaData.quantidade], callback);
};

export const buscarBolsaSangue = (tipoSangue, callback) => {
  const query = `
      SELECT * FROM bolsas_sangue
      WHERE tipo_sangue = ?
  `;
  connection.query(query, [tipoSangue], callback);
};


//Adicionar Insumo
export const adicionarInsumo = (insumoData, callback) => {
  const query = `
      INSERT INTO insumos (nome, quantidade)
      VALUES (?, ?)
  `;
  connection.query(
      query,
      [insumoData.nome, insumoData.quantidade],
      callback
  );
};


//Buscar Insumo
export const buscarInsumos = (nome, callback) => {
  const query = `
      SELECT * FROM insumos
      WHERE nome LIKE ?
  `;
  connection.query(query, [`%${nome}%`], callback);
};
