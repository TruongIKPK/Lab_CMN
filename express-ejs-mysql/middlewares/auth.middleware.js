function ensureAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

function ensureRole(...roles) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        if (!roles.includes(req.session.user.role)) {
            return res.status(403).render('error', {
                message: 'Ban khong co quyen truy cap chuc nang nay.'
            });
        }
        next();
    };
}

module.exports = {
    ensureAuthenticated,
    ensureAdmin: ensureRole('admin')
};
