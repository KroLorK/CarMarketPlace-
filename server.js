const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors'); // Импортируем cors

const app = express();
const port = 3000;

// Настройка подключения к базе данных
const db = new sqlite3.Database('C:/Users/kotel/DataGripProjects/car_market/identifier.sqlite');

// Используем cors для разрешения кросс-доменных запросов
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // разрешаем доступ к ресурсу любому источнику
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// Настройка статических файлов
app.use(express.static(__dirname));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Маршрут для получения данных
app.get('/data', (req, res) => {
    db.all('SELECT * FROM brands', [], (err, rows) => {
        if (err) {
            console.error('Ошибка при запросе к базе данных:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
            return;
        }
        console.log('Данные из базы данных:', rows); // Выводим данные в консоль
        res.json(rows); // Возвращаем данные в формате JSON
    });
});

// Начало прослушивания сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

