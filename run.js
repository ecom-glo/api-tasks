const axios = require('axios');

// Your Domo API credentials
const clientId = process.env.DOMO_CLIENT_ID;
const clientSecret = process.env.DOMO_CLIENT_SECRET;

// Encode as Base64
const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'https://api.domo.com/oauth/token?grant_type=client_credentials',
  headers: { 
    'Authorization': `Basic ${token}`
  }
};

axios.request(config)
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.log(error);
  });
