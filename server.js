// Импортируем необходимые модули
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

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

// Используем cors для разрешения кросс-доменных запросов
app.use(cors());

// Настройка статических файлов
app.use(express.static(__dirname));

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

// Начало прослушивания сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});