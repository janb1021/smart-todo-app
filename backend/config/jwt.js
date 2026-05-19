module.exports = {
  secret: process.env.JWT_SECRET || 'your-secret-key-here',
  expiresIn: '7d'
};