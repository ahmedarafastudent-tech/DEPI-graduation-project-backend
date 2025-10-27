const axios = require('axios');

const PAYTABS_BASE_URL = 'https://secure.paytabs.com/payment/request';

const paytabsConfig = {
  profile_id: process.env.PAYTABS_PROFILE_ID || 'test_profile',
  server_key: process.env.PAYTABS_SERVER_KEY || 'test_key',
  region: process.env.PAYTABS_REGION || 'EGY',
  currency: process.env.PAYTABS_CURRENCY || 'EGP',
};

// In test environment, export a lightweight stub to avoid real network calls
if (process.env.NODE_ENV === 'test') {
  const instance = {
    createPaymentPage: async (payload) => ({
      tran_ref: 'test_transaction_ref',
      redirect_url: 'https://secure.paytabs.com/payment/page',
      payment_url: 'https://secure.paytabs.com/payment/page',
    }),
    verifyPayment: async (payload) => ({
      response_status: 'A',
      tran_ref: 'test_transaction_ref',
      cart_amount: '99.99',
    }),
    refundPayment: async (payload) => ({
      response_status: 'A',
      tran_ref: 'test_transaction_ref',
    }),
  };

  module.exports = {
    paytabsConfig,
    paytabsClient: null,
    instance,
  };
} else {

  const paytabsClient = axios.create({
  baseURL: PAYTABS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: paytabsConfig.server_key,
  },
});

// Provide an `instance` wrapper with named methods so tests can mock them easily
const instance = {
  createPaymentPage: async (payload) => {
    const res = await paytabsClient.post('/', payload);
    return res.data;
  },
  verifyPayment: async (payload) => {
    // Some PayTabs integrations use a /verify endpoint
    const res = await paytabsClient.post('/verify', payload);
    return res.data;
  },
  refundPayment: async (payload) => {
    const res = await paytabsClient.post('/refund', payload);
    return res.data;
  },
  };

  module.exports = {
    paytabsConfig,
    paytabsClient,
    instance,
  };

}
