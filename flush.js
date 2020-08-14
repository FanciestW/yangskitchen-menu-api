require('dotenv').config();
const Memcached = require('memcached');

module.exports.handler = (_event, _context, callback) => {
  const memcached = new Memcached(process.env.MEMCACHED_URL, { timeout: 10 });
  memcached.connect(process.env.MEMCACHED_URL, (err) => {
    if (err) console.error(err);
  });
  console.log(`Memcached URL: ${process.env.MEMCACHED_URL}`);
  memcached.flush((err) => {
    let response;
    if (err) {
      response = {
        statusCode: 500,
        body: {
          message: `An error occurred: ${err}`,
        },
      };
    } else {
      response = {
        statusCode: 200,
        body: {
          message: 'Memcached flush successful',
        },
      };
    }
    callback(null, response);
  });
};
