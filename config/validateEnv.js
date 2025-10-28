const requiredInProduction = [
  'MONGO_URI',
  'JWT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'PAYTABS_PROFILE_ID',
  'PAYTABS_SERVER_KEY',
  'BACKEND_URL',
  'FRONTEND_URL',
];

function validateEnv() {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    const missing = requiredInProduction.filter((k) => !process.env[k]);
    if (missing.length) {
      throw new Error(
        `Missing required environment variables for production: ${missing.join(', ')}`
      );
    }
  } else {
    const recommended = ['MONGO_URI', 'JWT_SECRET'];
    const missing = recommended.filter((k) => !process.env[k]);
    if (missing.length) {
      console.warn(
        `Warning: recommended environment variables not set: ${missing.join(', ')}. Tests may set defaults.`
      );
    }
  }
}

module.exports = validateEnv;
