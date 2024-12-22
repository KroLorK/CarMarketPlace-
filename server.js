// Импортируем необходимые модули
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Настройка приложения
const app = express();
const port = 3000;

// Настройка подключения к базе данных PostgreSQL с использованием Sequelize
const sequelize = new Sequelize('car_market_place', 'postgres', '1509', {
    host: 'localhost',
    dialect: 'postgres'
});

// Проверка подключения к базе данных
const startDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Подключение к базе данных успешно.');
    } catch (error) {
        console.error('Не удалось подключиться к базе данных:', error);
    }
};

// Функция для вывода данных из таблицы User
const logUsersFromDatabase = async () => {
    try {
        const users = await User.findAll();
        console.log('Данные пользователей:', users);
    } catch (error) {
        console.error('Ошибка при получении данных пользователей:', error);
    }
};

startDatabase();

// Определяем модели с использованием Sequelize
const User = sequelize.define('user', {
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
    }
}, {
    timestamps: false // Отключаем автоматическое создание полей createdAt и updatedAt
});


const Brand = sequelize.define('brand', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false // Отключаем автоматическое создание полей createdAt и updatedAt
});

const Model = sequelize.define('model', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    weight: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    engine_power: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false // Отключаем автоматическое создание полей createdAt и updatedAt
});

const Car = sequelize.define('car', {
    year: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mileage: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false // Отключаем автоматическое создание полей createdAt и updatedAt
});

const Ad = sequelize.define('ad', {
    description: {
        type: DataTypes.STRING(1000),
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false // Отключаем автоматическое создание полей createdAt и updatedAt
});


// Устанавливаем связи между моделями
Brand.hasMany(Model, {
    foreignKey: 'brand_id', // Указываем внешний ключ в модели Model
    onDelete: 'SET NULL'    // При удалении бренда, устанавливаем brand_id в NULL в моделях
});
Model.belongsTo(Brand, {
    foreignKey: 'brand_id'   // Указываем внешний ключ в модели Model
});

// Модель принадлежит к автомобилю
Model.hasMany(Car, {
    foreignKey: 'model_id',  // Указываем внешний ключ в модели Car
    onDelete: 'CASCADE'       // При удалении модели, удаляем все соответствующие автомобили
});
Car.belongsTo(Model, {
    foreignKey: 'model_id'    // Указываем внешний ключ в модели Car
});

// Пользователь может иметь много автомобилей
User.hasMany(Car, {
    foreignKey: 'user_id',    // Указываем внешний ключ в модели Car
    onDelete: 'CASCADE'       // При удалении пользователя, удаляем все соответствующие автомобили
});
Car.belongsTo(User, {
    foreignKey: 'user_id'     // Указываем внешний ключ в модели Car
});

// Автомобиль может иметь много объявлений
Car.hasMany(Ad, {
    foreignKey: 'car_id',     // Указываем внешний ключ в модели Ad
    onDelete: 'CASCADE'       // При удалении автомобиля, удаляем все соответствующие объявления
});
Ad.belongsTo(Car, {
    foreignKey: 'car_id'      // Указываем внешний ключ в модели Ad
});

// Создание папки для загрузки, если её нет
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

// Используем middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Синхронизация модели с базой данных
sequelize.sync()
    .then(async () => {
        console.log('Все модели синхронизированы с базой данных.');

        // Логирование пользователей из базы данных
        await logUsersFromDatabase();
    })
    .catch((error) => {
        console.error('Ошибка при синхронизации моделей:', error);
    });

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Получение данных о брендах
app.get('/api/brands', async (req, res) => {
    try {
        const brands = await Brand.findAll();
        res.json(brands);
    } catch (err) {
        console.error('Ошибка при получении брендов:', err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Регистрация пользователя
app.post('/register', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            first_name,
            last_name,
            email,
            password: hashedPassword
        });
        res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
    } catch (err) {
        console.error('Ошибка при регистрации:', err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ error: 'Email уже используется' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера', details: err.message });
        }
    }
});

// Вход пользователя
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        // Создаем токен с ролью
        const token = jwt.sign({ id: user.id, role: user.role }, 'Ваш_секретный_ключ', { expiresIn: '1h' });
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                first_name: user.first_name, 
                last_name: user.last_name, 
                email: user.email, 
                role: user.role
            } 
        });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Получение моделей по ID бренда
app.get('/models', async (req, res) => {
    const { brand_id } = req.query;
    try {
        const models = await Model.findAll({ where: { brand_id } });
        res.json(models);
    } catch (err) {
        console.error('Ошибка при получении моделей:', err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Добавление автомобиля
app.post('/cars', async (req, res) => {
    const { year, mileage, model_id, user_id } = req.body;
    if (!user_id) {
        return res.status(400).json({ error: 'user_id является обязательным полем' });
    }

    try {
        const car = await Car.create({ year, mileage, model_id, user_id });
        res.status(201).json({ message: 'Автомобиль успешно добавлен', car });
    } catch (err) {
        console.error('Ошибка при добавлении автомобиля:', err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Получение автомобилей пользователя по user_id
app.get('/cars', async (req, res) => {
    const { user_id } = req.query;
    try {
        const cars = await Car.findAll({
            where: { user_id },
            include: [{ model: Model, include: [Brand] }]
        });
        res.json(cars);
    } catch (err) {
        console.error('Ошибка при получении автомобилей:', err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Изменение авто
app.put('/cars/:id', async (req, res) => {
    const { id } = req.params;
    const { year, mileage } = req.body;

    try {
        const car = await Car.findByPk(id);
        if (!car) {
            return res.status(404).json({ error: 'Автомобиль не найден' });
        }

        car.year = year;
        car.mileage = mileage;
        await car.save();

        res.json({ message: 'Автомобиль успешно обновлён', car });
    } catch (err) {
        console.error('Ошибка при обновлении автомобиля:', err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Маршрут для удаления автомобиля
app.delete('/cars/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Car.destroy({ where: { id } });
        if (result === 0) {
            return res.status(404).json({ error: 'Автомобиль не найден' });
        }
        res.json({ message: 'Автомобиль успешно удалён' });
    } catch (err) {
        console.error('Ошибка при удалении автомобиля:', err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

//получение объявлений
app.get('/ads', async (req, res) => {
    const { id, brand, price, year } = req.query;
    let whereClause = {};

    if (id) {
        whereClause['id'] = id;
    }
    if (brand) {
        whereClause['$car.model.brand.id$'] = brand;
    }
    if (year) {
        whereClause['year'] = year; 
    }
    if (price) {
        whereClause['price'] = price; 
    }

    try {
        const ads = await Ad.findAll({
            include: {
                model: Car,
                include: {
                    model: Model,
                    include: Brand
                }
            },
            where: whereClause
        });

        res.json(ads);
    } catch (err) {
        console.error('Ошибка при получении объявлений:', err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});





// Добавление объявления
app.post('/ads', upload.single('photo'), async (req, res) => {
    const { description, price, car_id } = req.body;
    const photo = req.file ? req.file.filename : null;

    // Проверка, что photo не равно null
    if (!photo) {
        return res.status(400).json({ error: 'Файл фотографии не загружен' });
    }

    try {
        const ad = await Ad.create({ description, price, car_id, photo });
        res.status(201).json({ message: 'Объявление успешно создано', ad });
    } catch (err) {
        console.error('Ошибка при добавлении объявления:', err);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
