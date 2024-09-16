// Importar middleware JSON
import express from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import session from 'express-session';
import { Request, Response, NextFunction } from 'express';
import './types'; // Importa as definições de tipo

const app = express();

// Middleware global
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware específico para a rota de cadastro
app.use('/register', bodyParser.json());

// Configuração da sessão
app.use(session({
    secret: 'your-secret-key', // Altere para um segredo seguro
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Mude para true em produção com HTTPS
}));

// Servir arquivos estáticos da pasta 'views'
app.use(express.static(path.join(__dirname, 'views')));

// Inicializar o banco de dados
const dbPromise = open({
    filename: 'src/database.db',
    driver: sqlite3.Database
});

// Middleware para verificar se o usuário está logado
const requireLogin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Rota para página de cadastro
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Rota para página de login
app.get('/login', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Rota para login
app.post('/login', async (req: Request, res: Response) => {
    const { name, password } = req.body;

    try {
        const db = await dbPromise;
        const user = await db.get('SELECT * FROM users WHERE name = ? AND password = ?', [name, password]);

        if (user) {
            req.session.userId = user.id; // Armazena o ID do usuário na sessão
            req.session.userName = user.name; // Armazena o nome do usuário na sessão

            const users = await db.all('SELECT name, email, id FROM users');
            res.send(`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Usuários Cadastrados</title>
                <style>
                    /* Adicione o estilo aqui */
                </style>
            </head>
            <body>
                <h1>Usuários Cadastrados</h1>
                <div class="center">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.name}</td>
                                    <td>${user.email}</td>
                                    <td>
                                        <form action="/edit/${user.id}" method="GET" style="display:inline;">
                                            <button type="submit">Alterar</button>
                                        </form>
                                        <form action="/delete/${user.id}" method="POST" style="display:inline;">
                                            <button type="submit">Excluir</button>
                                        </form>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <a href="/login" class="back-btn">Voltar para Login</a>
                </div>
            </body>
            </html>`);
        } else {
            res.status(401).send('Nome ou senha incorretos!');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao tentar fazer login');
    }
});

// Rota para registrar um novo usuário
app.post('/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
        const db = await dbPromise;
        await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
        res.status(201).send('Usuário cadastrado com sucesso!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao registrar usuário');
    }
});

// Rota para editar um usuário
app.get('/edit/:id', requireLogin, async (req: Request, res: Response) => {
    const userId = req.params.id;

    if (req.session.userId !== Number(userId)) {
        return res.status(403).send('Acesso negado');
    }

    try {
        const db = await dbPromise;
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

        if (user) {
            res.send(`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Alterar Dados</title>
            </head>
            <body>
                <h1>Alterar Dados</h1>
                <form action="/edit/${userId}" method="POST">
                    <label for="name">Nome:</label>
                    <input type="text" id="name" name="name" value="${user.name}" required>
                    <br>
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" value="${user.email}" required>
                    <br>
                    <label for="password">Senha:</label>
                    <input type="password" id="password" name="password" required>
                    <br>
                    <button type="submit">Salvar</button>
                </form>
                <a href="/login">Voltar para Login</a>
            </body>
            </html>`);
        } else {
            res.status(404).send('Usuário não encontrado');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao tentar carregar os dados');
    }
});

// Rota para atualizar um usuário
app.post('/edit/:id', requireLogin, async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { name, email, password } = req.body;

    if (req.session.userId !== Number(userId)) {
        return res.status(403).send('Acesso negado');
    }

    try {
        const db = await dbPromise;
        await db.run('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', [name, email, password, userId]);
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao tentar atualizar os dados');
    }
});

// Rota para excluir um usuário
app.post('/delete/:id', requireLogin, async (req: Request, res: Response) => {
    const userId = req.params.id;

    if (req.session.userId !== Number(userId)) {
        return res.status(403).send('Acesso negado');
    }

    try {
        const db = await dbPromise;
        await db.run('DELETE FROM users WHERE id = ?', [userId]);
        req.session.destroy(() => res.redirect('/login'));
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao tentar excluir o usuário');
    }
});

// Configuração da porta do servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});