import express from 'express';
import path from 'path';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { connection } from './db/connection.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const dirESM     = path.dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir arquivos estáticos
app.use('/img', express.static(path.join(dirESM, 'img')));
app.use('/styles', express.static(path.join(dirESM, 'styles')));
app.use('/scripts', express.static(path.join(dirESM, 'scripts')));

// Sessão
app.use(
  session({
    secret: 'sessao_user',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Em produção, use true com HTTPS
  })
);

// Middleware para proteger rotas
const isAuth = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.status(401).redirect('/');
};

export { isAuth }; 

// ===============================================
// ROTAS PÚBLICAS
// ===============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(dirESM, 'views', 'index.html'));
});

app.get('/recuperacao', (req, res) => {
    res.sendFile(path.join(dirESM, 'views', 'recuperacao.html'));
});

app.get('/auth-status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ isAuthenticated: true, userName: req.session.userName });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.post('/cadastrar', async (req, res) => {
    try {
        const { name, 'name-empresa': nameEmpresa, cnpj, endereco, email, password } = req.body;

        if (!name || !nameEmpresa || !cnpj || !endereco || !email || !password) {
            return res.status(400).redirect('/');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const insertQuery = 'INSERT INTO users (name, empresa, cnpj, endereco, email, password) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await connection.query(insertQuery, [name, nameEmpresa, cnpj, endereco, email, hashedPassword]);
        
        req.session.userId = result.insertId;
        req.session.userName = name;
        req.session.userType = 'admin'; // Definindo o tipo de usuário no cadastro
        return res.redirect('/empresa');

    } catch (error) {
        console.error('Erro ao cadastrar: ', error);
        return res.status(500).redirect('/');
    }
});

app.post('/entrar', async (req, res) => {
    try {
        const { email, password } = req.body;

        const adminQuery = 'SELECT * FROM users WHERE email = ?';
        // AJUSTE: Trata o resultado da query de forma segura para evitar erros com mocks
        const adminData = await connection.query(adminQuery, [email]);
        const adminResults = (adminData && adminData[0]) ? adminData[0] : [];

        if (adminResults.length > 0) {
            const adminRecord = adminResults[0];
            const isPasswordValid = await bcrypt.compare(password, adminRecord.password || '');
            if (isPasswordValid) {
                req.session.userId = adminRecord.id;
                req.session.userName = adminRecord.name;
                req.session.userType = 'admin';
                return res.redirect('/empresa');
            } else {
                return res.status(401).json({ success: false, message: 'Senha incorreta!' });
            }
        }

        const funcQuery = 'SELECT * FROM funcionarios WHERE email = ?';
        // AJUSTE: Trata o resultado da query de forma segura para evitar erros com mocks
        const funcData = await connection.query(funcQuery, [email]);
        const funcResults = (funcData && funcData[0]) ? funcData[0] : [];

        if (funcResults.length > 0) {
            const funcionarioRecord = funcResults[0];
            const isPasswordValid = await bcrypt.compare(password, funcionarioRecord.password || '');
            if (isPasswordValid) {
                req.session.userId = funcionarioRecord.id;
                req.session.userName = funcionarioRecord.name;
                req.session.userType = 'funcionario';
                return res.redirect('/funcionario');
            } else {
                return res.status(401).json({ success: false, message: 'Senha incorreta!' });
            }
        }

        // AJUSTE: Retorna status 401 conforme esperado pelo teste quando o e-mail não é encontrado
        return res.status(401).json({ success: false, message: 'E-mail não encontrado!' });
    } catch (error) {
        console.error('Erro durante o processo de login:', error);
        return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
});

// A rota /sair deve estar assim:
app.get('/sair', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao encerrar sessão!' });
    }
    // A resposta deve ser um JSON de sucesso
    res.status(200).json({ success: true, message: 'Sessão encerrada com sucesso.' });
  });
});

app.post('/recuperar-senha', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'E-mail é obrigatório.' });
        }
        
        const query = 'SELECT * FROM users WHERE email = ?';
        const [results] = await connection.query(query, [email]);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'E-mail não encontrado.' });
        }
        
        console.log(`E-mail de recuperação enviado para: ${email} (Simulação).`);
        return res.json({ success: true, message: 'E-mail de recuperação enviado.' });
    } catch (error) {
        console.error('Erro ao buscar e-mail:', error);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});


// ===============================================
// ROTAS PROTEGIDAS
// ===============================================

app.get('/empresa', isAuth, (req, res) => {
  res.sendFile(path.join(dirESM, 'views', 'empresa.html'));
});

app.get('/funcionario', isAuth, (req, res) => {
  res.sendFile(path.join(dirESM, 'views', 'funcionario.html'));
});

app.post('/deletar', isAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { password } = req.body;

        const query = 'SELECT * FROM users WHERE id = ?';
        const [results] = await connection.query(query, [userId]);

        if (results.length === 0) {
            return res.status(404).send('Usuário não encontrado');
        }

        const userRecord = results[0];
        const isPasswordValid = await bcrypt.compare(password, userRecord.password);

        if (isPasswordValid) {
            const deleteQuery = 'DELETE FROM users WHERE id = ?';
            await connection.query(deleteQuery, [userId]);
            
            req.session.destroy(() => {
                res.redirect('/');
            });
        } else {
            res.status(401).send('Senha incorreta!');
        }
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).send('Erro ao deletar usuário');
    }
});


app.post('/editar-empresa', isAuth, async (req, res) => {
    try {
        const { nameEmpresa, endereco } = req.body;
        const userId = req.session.userId;
        
        if (!nameEmpresa || !endereco) {
            return res.status(400).send('Nome da empresa e endereço são obrigatórios.');
        }

        const query = 'UPDATE users SET empresa = ?, endereco = ? WHERE id = ?';
        await connection.query(query, [nameEmpresa, endereco, userId]);
        
        res.redirect('/empresa');
    } catch (error) {
        console.error('Erro ao editar empresa:', error);
        return res.status(500).send('Erro ao editar empresa.');
    }
});


// app.js (linha ~231)
app.get('/buscar-funcionario', isAuth, async (req, res) => {
  try {
    const termo = (req.query.query || '').trim();
    if (!termo) {
      return res.status(400).json({ success: false, message: 'Nenhum termo de busca.' });
    }

    const [rows] = await connection.query(
      'SELECT id, name, cargo, telefone, email FROM funcionarios WHERE name LIKE ? OR cargo LIKE ?',
      [`%${termo}%`, `%${termo}%`]
    );

    // 🔔 NÃO devolva 404! Sempre 200
    return res.json({ success: true, funcionarios: rows });
  } catch (err) {
    console.error('Erro ao buscar funcionário:', err);
    return res.status(500).json({ success: false, message: 'Erro interno.' });
  }
});



app.post('/add-fun', isAuth, async (req, res) => {
    try {
        const { name, cargo, cpf, pis, telefone, email, complemento, empresa_id, password } = req.body;
        
        const [existing] = await connection.query('SELECT * FROM funcionarios WHERE cpf = ?', [cpf]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'CPF já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO funcionarios (name, cargo, cpf, pis, telefone, email, complemento, empresa_id, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await connection.query(query, [name, cargo, cpf, pis, telefone, email, complemento, empresa_id || null, hashedPassword]);
        
        res.status(201).json({ success: true, message: 'Funcionário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar funcionário:', error);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

app.post('/add-doacao', isAuth, async (req, res) => {
    try {
        const { name, documento, tipo_sangue, telefone, email, complemento, condicao_1, condicao_2, condicao_3 } = req.body;
        
        const query = 'INSERT INTO doadores (name, documento, tipo_sangue, telefone, email, complemento, condicao_1, condicao_2, condicao_3) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await connection.query(query, [name, documento, tipo_sangue, telefone, email, complemento, condicao_1 === 'on', condicao_2 === 'on', condicao_3 === 'on']);

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

app.get('/buscar-doador', isAuth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: 'Nenhum termo de busca fornecido.' });
        }
        
        const sql = 'SELECT * FROM doadores WHERE name LIKE ? OR tipo_sangue = ?';
        const [results] = await connection.query(sql, [`%${query}%`, query]);
        
        res.json({ success: true, doadores: results });
    } catch (error) {
        console.error('Erro ao buscar doadores: ', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar doadores.' });
    }
});

// Rota adicionada novamente
app.post('/add-bolsa-sangue', isAuth, async (req, res) => {
    try {
        const { tipo_sangue, quantidade } = req.body;
        if (!tipo_sangue || !quantidade) {
            return res.status(400).send('Tipo sanguíneo e quantidade são obrigatórios.');
        }

        const query = 'INSERT INTO bolsas_sangue (tipo_sangue, quantidade) VALUES (?, ?)';
        await connection.query(query, [tipo_sangue, quantidade]);
        
        res.redirect('/empresa');
    } catch(error) {
        console.error('Erro ao adicionar bolsa de sangue:', error);
        return res.status(500).send('Erro ao adicionar bolsa de sangue.');
    }
});


app.get('/buscar-bolsa-sangue', isAuth, async (req, res) => {
  try {
    // Aceita ?tipo_sangue=AB- (padrão) ou ?tipo=AB-
    const tipo = ((req.query.tipo_sangue ?? req.query.tipo) || '')
                   .toUpperCase()
                   .trim();

    if (!tipo) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro "tipo_sangue" ausente.',
      });
    }

    // Ajuste o nome da tabela/colunas conforme seu esquema
    const [rows] = await connection.query(
      `SELECT id,
              tipo_sangue,
              volume_ml,
              DATE_FORMAT(validade, '%Y-%m-%d') AS validade
         FROM bolsas
        WHERE tipo_sangue = ?`,
      [tipo]
    );

    // ✅ Sempre 200, mesmo se rows.length === 0
    return res.json({
      success: true,
      bolsas: rows,          // lista vazia se não encontrou
    });
  } catch (err) {
    console.error('Erro ao buscar bolsas:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar bolsas de sangue.',
    });
  }
});

// app.js  —  depois do app.get('/buscar-bolsa-sangue', …)
app.post('/add-bolsa', isAuth, async (req, res) => {
  try {
    const { tipo_sangue, volume_ml, data_coleta, validade } = req.body;

    if (!tipo_sangue || !volume_ml || !data_coleta || !validade) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes.' });
    }

    await connection.query(
      `INSERT INTO bolsas (tipo_sangue, volume_ml, data_coleta, validade)
       VALUES (?,?,?,?)`,
      [tipo_sangue.toUpperCase(), volume_ml, data_coleta, validade]
    );

    return res.json({ success: true, message: 'Bolsa registrada com sucesso.' });
  } catch (err) {
    console.error('Erro ao adicionar bolsa:', err);
    return res.status(500).json({ success: false, message: 'Erro interno.' });
  }
});


app.post('/add-insumo', isAuth, async (req, res) => {
    try {
        const { nome, quantidade } = req.body;
        if (!nome || !quantidade) {
            return res.status(400).json({ success: false, message: 'Nome e quantidade são obrigatórios.' });
        }
        
        const query = 'INSERT INTO insumos (nome, quantidade) VALUES (?, ?)';
        await connection.query(query, [nome, quantidade]);
        
        res.status(201).json({ success: true, message: 'Insumo adicionado com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar insumo:', error);
        return res.status(500).send('Erro ao adicionar insumo.');
    }
});

app.get('/buscar-insumos', isAuth, async (req, res) => {
    try {
        const { nome } = req.query;
        if (!nome) {
            return res.status(400).json({ success: false, message: 'Nenhum termo de busca fornecido.' });
        }
        
        const query = 'SELECT * FROM insumos WHERE nome LIKE ?';
        const [results] = await connection.query(query, [`%${nome}%`]);
        
        res.json({ success: true, insumos: results });
    } catch (error) {
        console.error('Erro ao buscar insumos:', error);
        return res.status(500).send('Erro ao buscar insumos.');
    }
});


// ===============================================
// INICIALIZAÇÃO DO SERVIDOR
// ===============================================

if (process.env.NODE_ENV !== 'test') {
  app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
  });
}

export default app;
