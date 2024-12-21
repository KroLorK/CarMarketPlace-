// Импортируем необходимые модули
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Для хеширования паролей

const app = express();
const port = 3000;

// Настройка подключения к базе данных PostgreSQL
const pool = new Pool({
    user: 'postgres', // Замените на имя пользователя PostgreSQL
    host: 'localhost', // Хост базы данных
    database: 'car_market_place', // Имя базы данных
    password: '1509', // Пароль пользователя
    port: 5432, // Порт PostgreSQL (по умолчанию 5432)
});

// Используем middlewares
app.use(cors()); // Для разрешения кросс-доменных запросов
app.use(express.json()); // Для парсинга JSON-данных
app.use(express.static(__dirname)); // Для статических файлов

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Маршрут для получения данных
app.get('/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM brands'); // Выполняем запрос к базе данных
        console.log('Данные из базы данных:', result.rows); // Выводим данные в консоль
        res.json(result.rows); // Возвращаем данные в формате JSON
    } catch (err) {
        console.error('Ошибка при запросе к базе данных:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для регистрации пользователей
app.post('/register', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Добавляем данные в таблицу users
        await pool.query(
            'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)',
            [first_name, last_name, email, hashedPassword]
        );

        res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
    } catch (err) {
        console.error('Ошибка при регистрации:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Email уже используется' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    }
});

// Маршрут для входа пользователя
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Получаем пользователя по email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }

        res.json({ message: 'Успешный вход', userId: user.id });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Начало прослушивания сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
