const jwt = require('jsonwebtoken');

const generateToken = (id, opts = {}) => {
  const payloadId = id && id.toString ? id.toString() : id;
  const payload = { id: payloadId };
  if (opts.jti) payload.jti = opts.jti;
  const signOptions = { expiresIn: opts.expiresIn || '30d' };
  return jwt.sign(payload, process.env.JWT_SECRET || 'testsecret123', signOptions);
};

module.exports = generateToken;
module.exports.generateToken = generateToken;
module.exports.default = generateToken;
