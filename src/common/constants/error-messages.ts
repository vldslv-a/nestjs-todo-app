export const ErrorMessages = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_ALREADY_EXISTS: 'User with such email already exists',

  // User errors
  INCORRECT_PASSWORD: 'Current password is incorrect',
  USER_NOT_FOUND: 'User not found',

  // Token errors
  INVALID_ACCESS_TOKEN: 'Invalid access token',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',

  // Verification errors
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  INVALID_TOKEN_TYPE: 'Invalid token type',
  TOKEN_ALREADY_USED: 'Token has already been used',
  TOKEN_EXPIRED: 'Token has expired',
  VERIFICATION_TOKEN_NOT_FOUND: 'Verification token not found',

  // File errors
  INVALID_FILE_FORMAT: 'Only image files are allowed (jpg, jpeg, png, gif, webp, svg)',
};
