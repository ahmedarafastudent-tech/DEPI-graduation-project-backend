// Stable test entry point that re-exports the existing Express app without
// starting the HTTP server. Tests should import this file instead of the
// production server starter to avoid listening twice.
module.exports = require('./index');
