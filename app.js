import express from 'express';
import path from 'path';
import session from 'express-session';
import bcrypt from 'bcrypt'; // Importando bcrypt
import { 
  connection, 
  adicionarUsuario, 
  adicionarDoador, 
  adicionarFuncionario, 
  adicionarBolsaSangue, 
  buscarBolsaSangue, 
  adicionarInsumo, 
  buscarInsumos 
} from './db/connection.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir arquivos estáticos
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

// Sessão
app.use(
  session({
    secret: 'sessao_user',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Em produção, use true com HTTPS
  })
);

// Rota principal (Index)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Endpoint para verificar o estado de autenticação
app.get('/auth-status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ isAuthenticated: true, userName: req.session.userName });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Rota de recuperação
app.get('/recuperacao', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'recuperacao.html'));
});

// Rota para página da empresa
app.get('/empresa', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'empresa.html'));
});

// Rota para página de funcionário
app.get('/funcionario', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'funcionario.html'));
});

// Endpoint cadastro (Empresa)
app.post('/cadastrar', async (req, res) => {
  try {
    const { name, 'name-empresa': nameEmpresa, cnpj, endereco, email, password } =
      req.body;

    if (!name || !nameEmpresa || !cnpj || !endereco || !email || !password) {
      return res.redirect('/');
    }

    // Hash da senha antes de salvar no banco de dados
    const hashedPassword = await bcrypt.hash(password, 10);

    adicionarUsuario(
      name,
      nameEmpresa,
      cnpj,
      endereco,
      email,
      hashedPassword, // Salvando a senha criptografada
      (err, userId) => {
        if (err) {
          console.error('Erro ao adicionar o usuário: ', err);
          return res.redirect('/');
        }

        req.session.userId = userId;
        req.session.userName = name;
        return res.redirect('/empresa');
      }
    );
  } catch (erro) {
    console.error('Erro ao cadastrar: ', erro);
    return res.redirect('/');
  }
});


// Endpoint entrar (login)
app.post('/entrar', (req, res) => {
  const { email, password } = req.body;

  // Primeiro, verificar se o e-mail pertence a um administrador
  const queryAdmin = 'SELECT * FROM users WHERE email = ?';
  connection.query(queryAdmin, [email], async (err, adminResults) => {
      if (err) {
          return res
              .status(500)
              .json({ success: false, message: 'Erro ao consultar dados' });
      }

      if (adminResults.length > 0) {
          const adminRecord = adminResults[0];

          // Comparar a senha digitada com a senha criptografada
          const isPasswordValid = await bcrypt.compare(password, adminRecord.password);

          if (isPasswordValid) {
              req.session.userId = adminRecord.id;
              req.session.userName = adminRecord.name;
              req.session.userType = 'admin'; // Identificar como administrador
              return res.redirect('/empresa');
          } else {
              return res
                  .status(401)
                  .json({ success: false, message: 'Senha incorreta!' });
          }
      }

      // Se não for administrador, verificar se é um funcionário
      const queryFuncionario = 'SELECT * FROM funcionarios WHERE email = ?';
      connection.query(queryFuncionario, [email], async (err, funcResults) => {
          if (err) {
              return res
                  .status(500)
                  .json({ success: false, message: 'Erro ao consultar dados' });
          }

          if (funcResults.length === 0) {
              return res
                  .status(404)
                  .json({ success: false, message: 'E-mail não encontrado!' });
          } else {
              const funcionarioRecord = funcResults[0];

              // Comparar a senha digitada com a senha criptografada
              const isPasswordValid = await bcrypt.compare(password, funcionarioRecord.password);

              if (isPasswordValid) {
                  req.session.userId = funcionarioRecord.id;
                  req.session.userName = funcionarioRecord.name;
                  req.session.userType = 'funcionario'; // Identificar como funcionário
                  return res.redirect('/funcionario');
              } else {
                  return res
                      .status(401)
                      .json({ success: false, message: 'Senha incorreta!' });
              }
          }
      });
  });
});


// Rota sair (logout)
app.get('/sair', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Erro ao encerrar sessão!');
    }
    res.redirect('/'); // Redirecionar para a página inicial
  });
});


// Endpoint para buscar funcionário
app.get('/buscar-funcionario', (req, res) => {
  const { query } = req.query; // Pega o parâmetro de consulta (nome ou parte do nome)

  if (!query) {
    return res.status(400).json({ success: false, message: 'Nenhum termo de busca fornecido.' });
  }

  const searchQuery = `
    SELECT * FROM funcionarios
    WHERE name LIKE ?
  `;

  connection.query(searchQuery, [`%${query}%`], (err, results) => {
    if (err) {
      console.error('Erro ao buscar funcionário:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar funcionário.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Nenhum funcionário encontrado.' });
    }

    res.status(200).json({ success: true, funcionarios: results });
  });
});

// Endpoint para editar empresa
app.post('/editar-empresa', (req, res) => {
  const { nameEmpresa, endereco } = req.body; // Pegue os dados enviados pelo formulário
  const userId = req.session.userId; // Pegue o ID do usuário da sessão

  if (!userId) {
      return res.status(401).send('Usuário não autenticado.');
  }

  if (!nameEmpresa || !endereco) {
      return res.status(400).send('Nome da empresa e endereço são obrigatórios.');
  }

  const query = `
      UPDATE users
      SET empresa = ?, endereco = ?
      WHERE id = ?
  `;

  connection.query(query, [nameEmpresa, endereco, userId], (err, results) => {
      if (err) {
          console.error('Erro ao editar empresa:', err);
          return res.status(500).send('Erro ao editar empresa.');
      }

      res.redirect('/empresa'); // Redirecionar de volta para a página da empresa
  });
});



// Endpoint excluir conta (deletar)
app.post('/deletar', (req, res) => {
  const userId = req.session.userId;
  const { password } = req.body;

  if (!userId) {
    return res.redirect('/');
  }

  const query = 'SELECT * FROM users WHERE id = ?';
  connection.query(query, [userId], async (err, results) => {
    if (err) {
      res.status(500).send('Erro ao consultar dados');
      return;
    }
    if (results.length === 0) {
      res.status(404).send('Usuário não encontrado');
    } else {
      const userRecord = results[0];

      // Verificar a senha antes de excluir o usuário
      const isPasswordValid = await bcrypt.compare(password, userRecord.password);

      if (isPasswordValid) {
        const deleteQuery = 'DELETE FROM users WHERE id = ?';
        connection.query(deleteQuery, [userId], (err) => {
          if (err) {
            res.status(500).send('Erro ao deletar usuário');
            return;
          }

          req.session.destroy((err) => {
            if (err) {
              return res.status(500).send('Erro ao encerrar sessão!');
            }
            res.redirect('/');
          });
        });
      } else {
        res.status(401).send('Senha incorreta!');
      }
    }
  });
});

// Adicionar Doador
app.post('/add-doacao', (req, res) => {
  const {
      name,
      documento,
      tipo_sangue,
      telefone,
      email,
      complemento,
      condicao_1,
      condicao_2,
      condicao_3,
  } = req.body;

  adicionarDoador(
      {
          name,
          documento,
          tipo_sangue,
          telefone,
          email,
          complemento,
          condicao_1: condicao_1 === 'on',
          condicao_2: condicao_2 === 'on',
          condicao_3: condicao_3 === 'on',
      },
      (err, result) => {
          if (err) {
              console.error('Erro ao registrar doador:', err);
              return res.status(500).send('Erro ao registrar doador.');
          }

          // Verificar o tipo de usuário na sessão
          if (req.session.userType === 'admin') {
              return res.redirect('/empresa'); // Redirecionar para a página do administrador
          } else if (req.session.userType === 'funcionario') {
              return res.redirect('/funcionario'); // Redirecionar para a página do funcionário
          } else {
              return res.redirect('/'); // Fallback para a página inicial
          }
      }
  );
});



  //Buscar Doador
  app.get('/buscar-doador', (req, res) => {
    const { query } = req.query;

    const sql = `
        SELECT * FROM doadores
        WHERE name LIKE ? OR tipo_sangue = ?
    `;

    connection.query(sql, [`%${query}%`, query], (err, results) => {
        if (err) {
            console.error('Erro ao buscar doadores: ', err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar doadores.' });
        }

        res.json({ success: true, doadores: results });
    });
});

//Adicionar funcionario
app.post('/add-fun', (req, res) => {
    const {
        name, cargo, cpf, pis, telefone, email, complemento, empresa_id, password
    } = req.body;

    // Verificar se o CPF já existe
    const verificarCpf = 'SELECT * FROM funcionarios WHERE cpf = ?';
    connection.query(verificarCpf, [cpf], (err, results) => {
        if (err) {
            console.error('Erro ao verificar CPF:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor.' });
        }

        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'CPF já cadastrado.' });
        }

        // Hash da senha
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Erro ao hashear senha:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor.' });
            }

            // Inserir funcionário no banco de dados
            const query = `
                INSERT INTO funcionarios (name, cargo, cpf, pis, telefone, email, complemento, empresa_id, password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            connection.query(query, [name, cargo, cpf, pis, telefone, email, complemento, empresa_id || null, hashedPassword], (err, results) => {
                if (err) {
                    console.error('Erro ao adicionar funcionário:', err);
                    return res.status(500).json({ success: false, message: 'Erro no servidor.' });
                }

                res.status(201).json({ success: true, message: 'Funcionário cadastrado com sucesso!' });
            });
        });
    });
});

//Login funcionario
app.post('/login-funcionario', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM funcionarios WHERE email = ?';
  connection.query(query, [email], (err, results) => {
      if (err) {
          console.error('Erro ao buscar funcionário:', err);
          return res.status(500).json({ success: false, message: 'Erro no servidor.' });
      }

      if (results.length === 0) {
          return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
      }

      // Comparar senha com hash armazenado
      bcrypt.compare(password, results[0].password, (err, match) => {
          if (err) {
              console.error('Erro ao comparar senha:', err);
              return res.status(500).json({ success: false, message: 'Erro no servidor.' });
          }

          if (!match) {
              return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
          }

          // Login bem-sucedido
          res.status(200).json({ success: true, message: 'Login realizado com sucesso!' });
      });
  });
});


// Adicionar bolsa de sangue
app.post('/add-bolsa-sangue', (req, res) => {
  const { tipo_sangue, quantidade } = req.body;

  adicionarBolsaSangue({ tipo_sangue, quantidade }, (err) => {
      if (err) {
          console.error('Erro ao adicionar bolsa de sangue:', err);
          return res.status(500).send('Erro ao adicionar bolsa de sangue.');
      }
      res.redirect('/empresa');
  });
});

// Buscar bolsa de sangue com detalhes do doador
app.get('/buscar-bolsa-sangue', (req, res) => {
  const { tipo_sangue } = req.query;

  if (!tipo_sangue) {
      return res.status(400).json({ success: false, message: 'Tipo sanguíneo não fornecido.' });
  }

  const query = `
      SELECT name, tipo_sangue, telefone, email 
      FROM doadores 
      WHERE tipo_sangue = ?
  `;

  connection.query(query, [tipo_sangue], (err, results) => {
      if (err) {
          console.error('Erro ao buscar bolsa de sangue:', err);
          return res.status(500).json({ success: false, message: 'Erro ao buscar bolsa de sangue.' });
      }

      if (results.length === 0) {
          return res.status(404).json({ success: false, message: 'Nenhum doador encontrado.' });
      }

      res.json({ success: true, doadores: results });
  });
});


// Adicionar insumo
app.post('/add-insumo', (req, res) => {
  const { nome, quantidade } = req.body;

  if (!nome || !quantidade) {
      return res.status(400).json({
          success: false,
          message: 'Nome e quantidade são obrigatórios.',
      });
  }

  adicionarInsumo({ nome, quantidade }, (err) => {
      if (err) {
          console.error('Erro ao adicionar insumo:', err);
          return res.status(500).send('Erro ao adicionar insumo.');
      }
      res.status(201).json({ success: true, message: 'Insumo adicionado com sucesso!' });
  });
});




// Buscar insumos
app.get('/buscar-insumos', (req, res) => {
  const { nome } = req.query;

  buscarInsumos(nome, (err, results) => {
      if (err) {
          console.error('Erro ao buscar insumos:', err);
          return res.status(500).send('Erro ao buscar insumos.');
      }
      res.json({ success: true, insumos: results });
  });
});

//Recuperar Senha
app.post('/recuperar-senha', (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res
          .status(400)
          .json({ success: false, message: 'E-mail é obrigatório.' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], (err, results) => {
      if (err) {
          console.error('Erro ao buscar e-mail:', err);
          return res
              .status(500)
              .json({ success: false, message: 'Erro no servidor.' });
      }

      if (results.length === 0) {
          return res
              .status(404)
              .json({ success: false, message: 'E-mail não encontrado.' });
      }

      // Simulação do envio de e-mail (substitua por um serviço real, como nodemailer)
      console.log(
          `E-mail de recuperação enviado para: ${email} (Simulação).`
      );

      return res.json({
          success: true,
          message: 'E-mail de recuperação enviado.',
      });
  });
});


  

// Inicialização do servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
