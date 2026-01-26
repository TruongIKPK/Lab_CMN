const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

exports.loginPage = (req, res) => {
    if (req.session.user) return res.redirect('/products');
    res.render('login', { error: null });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.getUser(username);
        if (user) {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.user = { id: user.id, username: user.username };
                console.log('Login successful for user:', username);
                return res.redirect('/products');
            }
        }
        console.log('Login failed for user:', username);
        res.render('login', { error: 'Invalid username or password' });
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'Login error' });
    }
};

exports.registerPage = (req, res) => {
    res.render('register', { error: null });
};

exports.register = async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = await User.getUser(username);
        if (user) {
            console.log('Register failed: Username already exists:', username);
            return res.render('register', { error: 'Username already exists' });
        }
        await User.createUser({
            id: Date.now().toString(),
            username,
            password: hashedPassword
        });
        console.log('Register successful for user:', username);
        res.redirect('/login');
    } catch (error) {
        console.error('Register error:', error);
        res.render('register', { error: 'Register error' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        console.log('User logged out');
        res.redirect('/login');
    });
};
