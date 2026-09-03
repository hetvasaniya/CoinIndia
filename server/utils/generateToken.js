const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'coinindia_default_jwt_secret';
  const token = jwt.sign({ id: userId }, secret, {
    expiresIn: '30d',
  });

  // Detect production: NODE_ENV or FRONTEND_URL pointing to https
  const isProduction = process.env.NODE_ENV === 'production' ||
    (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https'));

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  
  return token;
};

module.exports = generateToken;

