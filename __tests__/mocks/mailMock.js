module.exports = {
  sendMail: () => Promise.resolve(true),
  createTransport: () => ({
    sendMail: () => Promise.resolve(true),
  }),
  default: async function sendEmailMock() { return true; },
};