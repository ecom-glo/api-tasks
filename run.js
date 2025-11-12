const axios = require('axios');

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'https://api.domo.com/oauth/token?grant_type=client_credentials',
  headers: { 
    'Authorization': 'Basic ZDY4Y2FjNTUtY2UzMy00NDQ4LTg1OWEtMTMwNjYxOTc2NzQ4OmU2NDY4NGMxMDdlZDc4ODBlYWFlY2NhMzJlMzVkZThjOThkMTMxZmI5NGJjNWZkYTc3MmE2NGM3MDE0YjVlYWE='
  }
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
