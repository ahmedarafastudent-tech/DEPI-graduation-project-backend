const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  // Ensure we store the id as a string in the token payload to avoid
  // issues when decoding ObjectId instances from different runtimes/tests.
  const payloadId = id && id.toString ? id.toString() : id;
  return jwt.sign(
    { id: payloadId },
    process.env.JWT_SECRET || 'testsecret123',
    {
      expiresIn: '30d',
    }
  );
};

// Export function as default and as named property to support both import styles
module.exports = generateToken;
module.exports.generateToken = generateToken;
module.exports.default = generateToken;
