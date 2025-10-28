const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const payloadId = id && id.toString ? id.toString() : id;
  return jwt.sign(
    { id: payloadId },
    process.env.JWT_SECRET || 'testsecret123',
    {
      expiresIn: '30d',
    }
  );
};

module.exports = generateToken;
module.exports.generateToken = generateToken;
module.exports.default = generateToken;
