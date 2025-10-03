const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const { uploadSingleImage } = require('./upload.service');

/**
 * Register new user
 */
const registerUser = async (userData) => {
  const { email, username, password } = userData;

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    throw new AppError('Email or username already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  return user;
};

/**
 * Login user
 */
const loginUser = async (credentials) => {
  const { email, password } = credentials;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if banned or suspended
  if (user.status === 'BANNED') {
    throw new AppError('Your account has been banned', 403);
  }

  if (user.status === 'SUSPENDED') {
    throw new AppError('Your account has been suspended', 403);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return user;
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true,
      avatar: true,
      bio: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

/**
 * Update user profile (with optional avatar upload)
 */
const updateUserProfile = async (userId, updateData, avatarFile = null) => {
  const { username, bio } = updateData;
  let { avatar } = updateData;

  const data = {};
  if (username) data.username = username;
  if (bio !== undefined) data.bio = bio;

  // Upload avatar if file provided
  if (avatarFile) {
    const result = await uploadSingleImage(avatarFile, 'users/avatars');
    avatar = result.url;
  }

  if (avatar) {
    data.avatar = avatar;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      avatar: true,
      bio: true,
    },
  });

  return user;
};

/**
 * Change user password
 */
const changeUserPassword = async (userId, passwords) => {
  const { currentPassword, newPassword } = passwords;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return true;
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  changeUserPassword,
};
