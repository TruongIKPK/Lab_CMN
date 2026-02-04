const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const userRepository = require('../repositories/user.repository');

async function login(username, password) {
    const existingUser = await userRepository.getByUsername(username);
    if (!existingUser) return null;

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) return null;

    return sanitizeUser(existingUser);
}

async function register({ username, password, role = 'staff' }) {
    const normalizedUsername = username?.trim();
    if (!normalizedUsername || !password) {
        throw new Error('Username and password are required');
    }

    const normalizedRole = role === 'admin' ? 'admin' : 'staff';

    const duplicated = await userRepository.getByUsername(normalizedUsername);
    if (duplicated) {
        const error = new Error('Username already exists');
        error.code = 'USERNAME_EXISTS';
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
        userId: uuid(),
        username: normalizedUsername,
        password: hashedPassword,
        role: normalizedRole,
        createdAt: new Date().toISOString()
    };

    await userRepository.createUser(user);
    return sanitizeUser(user);
}

async function getUserProfile(userId) {
    const user = await userRepository.getById(userId);
    return user ? sanitizeUser(user) : null;
}

function sanitizeUser(user) {
    return {
        userId: user.userId,
        username: user.username,
        role: user.role || 'staff',
        createdAt: user.createdAt
    };
}

module.exports = {
    login,
    register,
    getUserProfile
};
