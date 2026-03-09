const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const userRepository = require('../repositories/user.repository');

async function login(username, password) {
    console.log('🔍 [LOGIN] Attempting login for username:', username);
    
    const existingUser = await userRepository.getByUsername(username);
    console.log('🔍 [LOGIN] User found in DB:', existingUser ? 'YES' : 'NO');
    
    if (!existingUser) {
        console.log('❌ [LOGIN] User not found in database');
        return null;
    }

    console.log('🔍 [LOGIN] User data:', {
        userId: existingUser.userId,
        username: existingUser.username,
        role: existingUser.role,
        hasPassword: !!existingUser.password,
        passwordLength: existingUser.password?.length
    });

    const isMatch = await bcrypt.compare(password, existingUser.password);
    console.log('🔍 [LOGIN] Password match:', isMatch ? 'YES' : 'NO');
    
    if (!isMatch) {
        console.log('❌ [LOGIN] Password does not match');
        return null;
    }

    console.log('✅ [LOGIN] Login successful');
    return sanitizeUser(existingUser);
}

async function register({ username, password, role = 'staff' }) {
    console.log('🔍 [REGISTER] Starting registration for username:', username);
    
    const normalizedUsername = username?.trim();
    if (!normalizedUsername || !password) {
        console.log('❌ [REGISTER] Missing username or password');
        throw new Error('Username and password are required');
    }

    const normalizedRole = role === 'admin' ? 'admin' : 'staff';
    console.log('🔍 [REGISTER] Normalized username:', normalizedUsername);
    console.log('🔍 [REGISTER] Role:', normalizedRole);

    const duplicated = await userRepository.getByUsername(normalizedUsername);
    if (duplicated) {
        console.log('❌ [REGISTER] Username already exists');
        const error = new Error('Username already exists');
        error.code = 'USERNAME_EXISTS';
        throw error;
    }

    console.log('🔍 [REGISTER] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
        userId: uuid(),
        username: normalizedUsername,
        password: hashedPassword,
        role: normalizedRole,
        createdAt: new Date().toISOString()
    };

    console.log('🔍 [REGISTER] Creating user in database...');
    console.log('🔍 [REGISTER] User data:', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        hasPassword: !!user.password
    });

    try {
        await userRepository.createUser(user);
        console.log('✅ [REGISTER] User created successfully in DynamoDB');
    } catch (error) {
        console.error('❌ [REGISTER] Error creating user in DynamoDB:', error.message);
        console.error('❌ [REGISTER] Error details:', error);
        throw error;
    }

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
