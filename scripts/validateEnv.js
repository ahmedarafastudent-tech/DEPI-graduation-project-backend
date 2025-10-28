

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const requiredInDev = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
];

const recommendedInDev = [
  'FRONTEND_URL',
  'BACKEND_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
];

function validateEnvForDev() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('\n❌ .env file not found! Copy .env.example to .env and configure it.\n');
    process.exit(1);
  }

  const envConfig = dotenv.config().parsed;

  const missing = [];
  for (const key of requiredInDev) {
    if (!envConfig[key]) {
      missing.push(key);
    }
  }

  const warnings = [];
  for (const key of recommendedInDev) {
    if (!envConfig[key]) {
      warnings.push(key);
    }
  }

  console.log('\nEnvironment Validation');
  console.log('=====================');

  if (missing.length > 0) {
    console.error('\n❌ Missing required variables:');
    missing.forEach(key => console.error(`   ${key}`));
    process.exit(1);
  } else {
    console.log('\n✅ All required variables are set');
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Missing recommended variables:');
    warnings.forEach(key => console.warn(`   ${key}`));
  } else {
    console.log('\n✅ All recommended variables are set');
  }

  if (envConfig.FRONTEND_URL) {
    try {
      new URL(envConfig.FRONTEND_URL);
      console.log(`\n✅ FRONTEND_URL is valid: ${envConfig.FRONTEND_URL}`);
    } catch (e) {
      console.warn(`\n⚠️  FRONTEND_URL is not a valid URL: ${envConfig.FRONTEND_URL}`);
    }
  }

  if (envConfig.BACKEND_URL) {
    try {
      new URL(envConfig.BACKEND_URL);
      console.log(`✅ BACKEND_URL is valid: ${envConfig.BACKEND_URL}`);
    } catch (e) {
      console.warn(`⚠️  BACKEND_URL is not a valid URL: ${envConfig.BACKEND_URL}`);
    }
  }

  console.log('\n✨ Development environment validation complete\n');
}

if (require.main === module) {
  validateEnvForDev();
}

module.exports = validateEnvForDev;