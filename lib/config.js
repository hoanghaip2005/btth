require('dotenv').config();

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: numberFromEnv('PORT', 23162),
  jwtSecret: process.env.JWT_SECRET || 'media_for_you_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  grpc: {
    authUrl: process.env.AUTH_GRPC_URL || 'localhost:50051',
    songUrl: process.env.SONG_GRPC_URL || 'localhost:50052',
    playlistUrl: process.env.PLAYLIST_GRPC_URL || 'localhost:50053'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: numberFromEnv('DB_PORT', 15432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'media_for_you',
    url: process.env.DATABASE_URL
  }
};
