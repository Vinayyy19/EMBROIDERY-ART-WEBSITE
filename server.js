const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key'; 

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(__dirname));

const getData = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file)));
const setData = (file, data) => fs.writeFileSync(path.join(__dirname, 'data', file), JSON.stringify(data, null, 2));

const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

app.get('/api/products', (req, res) => {
    const products = getData('products.json');
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const products = getData('products.json');
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    const users = getData('users.json');
    if (users.find(u => u.email === email)) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = { id: Date.now(), name, email, password: hashedPassword, cart: [] };
    users.push(newUser);
    setData('users.json', users);
    res.json({ message: 'User registered successfully' });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = getData('users.json');
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.json({ message: 'Logged in successfully', user: { name: user.name, email: user.email } });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/profile', authenticate, (req, res) => {
    const users = getData('users.json');
    const user = users.find(u => u.id === req.user.id);
    res.json({ name: user.name, email: user.email, cart: user.cart });
});

app.post('/api/cart/add', authenticate, (req, res) => {
    const { productId, quantity } = req.body;
    const users = getData('users.json');
    const userIndex = users.findIndex(u => u.id === req.user.id);
    const cartItem = users[userIndex].cart.find(item => item.productId === productId);
    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        users[userIndex].cart.push({ productId, quantity });
    }
    setData('users.json', users);
    res.json({ message: 'Item added to cart', cart: users[userIndex].cart });
});

app.get('/api/cart', authenticate, (req, res) => {
    const users = getData('users.json');
    const user = users.find(u => u.id === req.user.id);
    const products = getData('products.json');
    const cartDetails = user.cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...product, quantity: item.quantity };
    });
    res.json(cartDetails);
});

app.delete('/api/cart/:productId', authenticate, (req, res) => {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) return res.status(400).json({ message: 'Invalid product ID' });

    const users = getData('users.json');
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    users[userIndex].cart = users[userIndex].cart.filter(item => item.productId !== productId);
    setData('users.json', users);
    res.json({ message: 'Item removed from cart', cart: users[userIndex].cart });
});

app.post('/api/checkout', authenticate, (req, res) => {
    const users = getData('users.json');
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    users[userIndex].cart = [];
    setData('users.json', users);

    res.json({ message: 'Order placed successfully! Delivery in 2-3 days.' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;