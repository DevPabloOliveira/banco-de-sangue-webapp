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
app.post('/entrar', async (req, res) => { // A rota agora é 'async'
    try {
        const { email, password } = req.body;

        // 1. Procura na tabela de administradores (users)
        const adminQuery = 'SELECT * FROM users WHERE email = ?';
        const [adminResults] = await connection.query(adminQuery, [email]);

        if (adminResults.length > 0) {
            const adminRecord = adminResults[0];
            const isPasswordValid = await bcrypt.compare(password, adminRecord.password || '');

            if (isPasswordValid) {
                req.session.userId = adminRecord.id;
                req.session.userName = adminRecord.name;
                req.session.userType = 'admin';
                return res.redirect('/empresa'); // Redireciona em caso de sucesso
            } else {
                return res.status(401).json({ success: false, message: 'Senha incorreta!' });
            }
        }

        // 2. Se não for admin, procura na tabela de funcionários
        const funcQuery = 'SELECT * FROM funcionarios WHERE email = ?';
        const [funcResults] = await connection.query(funcQuery, [email]);

        if (funcResults.length > 0) {
            const funcionarioRecord = funcResults[0];
            const isPasswordValid = await bcrypt.compare(password, funcionarioRecord.password || '');
            
            if (isPasswordValid) {
                req.session.userId = funcionarioRecord.id;
                req.session.userName = funcionarioRecord.name;
                req.session.userType = 'funcionario';
                return res.redirect('/funcionario'); // Redireciona em caso de sucesso
            } else {
                return res.status(401).json({ success: false, message: 'Senha incorreta!' });
            }
        }

        // 3. Se não encontrou o e-mail em nenhuma das tabelas
        return res.status(404).json({ success: false, message: 'E-mail não encontrado!' });

    } catch (error) {
        // Um único 'catch' para capturar qualquer erro (do banco, do bcrypt, etc.)
        console.error('Erro durante o processo de login:', error);
        return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
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
app.post('/add-doacao', async (req, res) => {
    try {
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

        const query = `
            INSERT INTO doadores 
            (name, documento, tipo_sangue, telefone, email, complemento, condicao_1, condicao_2, condicao_3)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.query(query, [
            name,
            documento,
            tipo_sangue,
            telefone,
            email,
            complemento,
            condicao_1 === 'on',
            condicao_2 === 'on',
            condicao_3 === 'on',
        ]);

        // Redireciona com base no tipo de usuário da sessão
        if (req.session.userType === 'admin') {
            return res.redirect('/empresa');
        } else if (req.session.userType === 'funcionario') {
            return res.redirect('/funcionario');
        } else {
            return res.redirect('/');
        }
    } catch (error) {
        console.error('Erro ao registrar doador:', error);
        return res.status(500).send('Erro ao registrar doador.');
    }
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
app.post('/add-fun', async (req, res) => {
    try {
        const {
            name, cargo, cpf, pis, telefone, email, complemento, empresa_id, password
        } = req.body;

        // Verificar se o CPF já existe
        const verificarCpfQuery = 'SELECT * FROM funcionarios WHERE cpf = ?';
        const [existingFuncionarios] = await connection.query(verificarCpfQuery, [cpf]);

        if (existingFuncionarios.length > 0) {
            return res.status(400).json({ success: false, message: 'CPF já cadastrado.' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir funcionário no banco de dados
        const insertQuery = `
            INSERT INTO funcionarios (name, cargo, cpf, pis, telefone, email, complemento, empresa_id, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(insertQuery, [name, cargo, cpf, pis, telefone, email, complemento, empresa_id || null, hashedPassword]);

        return res.status(201).json({ success: true, message: 'Funcionário cadastrado com sucesso!' });

    } catch (error) {
        console.error('Erro ao adicionar funcionário:', error);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
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


  

if (process.env.NODE_ENV !== 'test') {
  app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
  });
}

// Exporta o app para que ele possa ser importado e usado pelos nossos testes
export default app; 