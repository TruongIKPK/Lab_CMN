const authService = require('../services/auth.service');

exports.loginPage = (req, res) => {
    if (req.session.user) return res.redirect('/products');
    res.render('login', { error: null });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await authService.login(username, password);
        if (!user) {
            console.log('Login failed for user:', username);
            return res.render('login', { error: 'Sai thong tin dang nhap' });
        }
        req.session.user = user;
        console.log('Login successful for user:', username);
        res.redirect('/products');
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'Khong the dang nhap luc nay' });
    }
};

exports.registerPage = (req, res) => {
    res.render('register', {
        error: null,
        allowRoleSelection: req.session.user?.role === 'admin'
    });
};

exports.register = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const selectedRole = req.session.user?.role === 'admin' ? (role || 'staff') : 'staff';
        await authService.register({ username, password, role: selectedRole });
        console.log('Register successful for user:', username);
        res.redirect('/login');
    } catch (error) {
        console.error('Register error:', error);
        const message = error.code === 'USERNAME_EXISTS'
            ? 'Ten dang nhap da ton tai'
            : 'Khong the tao tai khoan luc nay';
        res.render('register', {
            error: message,
            allowRoleSelection: req.session.user?.role === 'admin'
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        console.log('User logged out');
        res.redirect('/login');
    });
};
