export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'dev_secret_change_me',
  expiresIn: Number(process.env.JWT_EXPIRATION) || 3600,
};
