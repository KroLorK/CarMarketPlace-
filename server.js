// Импортируем необходимые модули
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Настройка подключения к базе данных PostgreSQL
const pool = new Pool({
    user: 'postgres', 
    host: 'localhost', 
    database: 'car_market_place',
    password: '1509', 
    port: 5432, 
});

// Используем middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Получение данных о брендах
app.get('/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM brands');
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при запросе к базе данных:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Регистрация пользователя
app.post('/register', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
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

// Вход пользователя
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        res.json({ 
            message: 'Успешный вход', 
            user: { 
                id: user.id, 
                first_name: user.first_name, 
                last_name: user.last_name, 
                email: user.email 
            } 
        });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение моделей по ID бренда
app.get('/models', async (req, res) => {
    const { brand_id } = req.query;
    try {
        const result = await pool.query('SELECT * FROM models WHERE brand_id = $1', [brand_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении моделей:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавление автомобиля
app.post('/cars', async (req, res) => {
    const { year, mileage, model_id, user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id является обязательным полем' });
    }

    try {
        await pool.query(
            'INSERT INTO cars (year, mileage, model_id, user_id) VALUES ($1, $2, $3, $4)',
            [year, mileage, model_id, user_id]
        );
        res.status(201).json({ message: 'Автомобиль успешно добавлен' });
    } catch (err) {
        console.error('Ошибка при добавлении автомобиля:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение автомобилей пользователя по user_id
app.get('/cars', async (req, res) => {
    const { user_id } = req.query;
    try {
        const result = await pool.query(
            `SELECT cars.id, cars.year, cars.mileage, models.name AS model, brands.name AS brand 
             FROM cars 
             JOIN models ON cars.model_id = models.id 
             JOIN brands ON models.brand_id = brands.id 
             WHERE cars.user_id = $1`, 
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении автомобилей:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

//изменения авто
app.put('/cars/:id', async (req, res) => {
    const { id } = req.params;
    const { year, mileage } = req.body;

    try {
        const result = await pool.query(
            'UPDATE cars SET year = $1, mileage = $2 WHERE id = $3 RETURNING *',
            [year, mileage, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Автомобиль не найден' });
        }

        res.json({ message: 'Автомобиль успешно обновлён', car: result.rows[0] });
    } catch (err) {
        console.error('Ошибка при обновлении автомобиля:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});



// Маршрут для удаления автомобиля
app.delete('/cars/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM cars WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Автомобиль не найден' });
        }

        res.json({ message: 'Автомобиль успешно удалён', car: result.rows[0] });
    } catch (err) {
        console.error('Ошибка при удалении автомобиля:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
