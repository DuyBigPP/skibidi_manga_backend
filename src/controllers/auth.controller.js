const asyncHandler = require('../utils/asyncHandler.util');
const { sendTokenResponse, verifyRefreshToken, generateAccessToken } = require('../utils/jwt.util');
const authService = require('../services/auth.service');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const user = await authService.registerUser(req.body);
  sendTokenResponse(user, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const user = await authService.loginUser(req.body);
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await authService.getUserById(decoded.id);
    const accessToken = generateAccessToken(user.id);

    res.json({
      success: true,
      accessToken,
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await authService.getUserById(req.user.id);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update user profile (with optional avatar upload)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const user = await authService.updateUserProfile(req.user.id, req.body, req.file);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  await authService.changeUserPassword(req.user.id, req.body);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});
