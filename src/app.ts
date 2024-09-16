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

            res.redirect('/users.html'); // Redireciona para a página de usuários
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
        res.status(500).send('Email já registrado, tente outro email');
    }
});

// Rota para página de atualização de usuário
app.get('/atualizar/:id', requireLogin, async (req: Request, res: Response) => {
    const userId = req.params.id;

    if (req.session.userId !== Number(userId)) {
        return res.status(403).send('Acesso negado');
    }

    try {
        const db = await dbPromise;
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

        if (user) {
            res.sendFile(path.join(__dirname, 'views', 'atualizar.html')); // Página de atualização do usuário
        } else {
            res.status(404).send('Usuário não encontrado');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao tentar carregar os dados');
    }
});

// Rota para atualizar um usuário
app.post('/update', requireLogin, async (req: Request, res: Response) => {
    const { id, name, email, password } = req.body;

    if (req.session.userId !== Number(id)) {
        return res.status(403).send('Acesso negado');
    }

    try {
        const db = await dbPromise;
        await db.run('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', [name, email, password, id]);
        res.redirect('/users.html'); // Redireciona de volta para a lista de usuários
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
        req.session.destroy(() => res.redirect('/login')); // Destruir sessão e redirecionar
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao tentar excluir o usuário');
    }
});

// Rota para excluir todos os usuários
app.post('/delete-all', requireLogin, async (req: Request, res: Response) => {
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM users');
        req.session.destroy(() => res.redirect('/login')); // Destruir sessão e redirecionar
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao tentar excluir todos os usuários');
    }
});

// Rota para API de usuários
app.get('/api/users', requireLogin, async (req: Request, res: Response) => {
    try {
        const db = await dbPromise;
        const users = await db.all('SELECT name, email, id FROM users');
        res.json(users); // Envia a lista de usuários como JSON
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar usuários');
    }
});

// Configuração da porta do servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
