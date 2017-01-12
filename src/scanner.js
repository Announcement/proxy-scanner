import * as https from 'https';

export default function(message) {

  // convert line into address:port
  let decoded = decode(message);

  // prepare each method
  let proxyOptions = configureProxy(decoded);
  let socksOptions = configureSocks(decoded);

  // promises for ease of continuity
  let get = (options) => {
    return new Promise(function(resolve, reject) {
      process.send({message: 'Sending Request'});

      let connection = https.get(options, (response) => {
        const statusCode = response.statusCode;
        const contentType = response.headers['content-type'];

        var raw = '';

        process.send({statusCode, contentType});

        if (statusCode !== 200) {
          reject(`Status Code ${statusCode}`);
        }

        if (!/^(text|application)\/json/.test(contentType)) {
          reject(`Content Type ${contentType}`);
        }

        response.setEncoding(encoding);

        response.on('error', error => {
          reject(error);
        });

        response.on('data', data => {
          raw += data;
        });

        response.on('end', () => {
          resolve(raw);
        });
      });
    });
  }

  let passthrough = it => process.send({message: it});

  let socks = get(socksOptions).then(passthrough).catch(passthrough);
  let proxy = get(proxyOptions).then(passthrough).catch(passthrough);
}
