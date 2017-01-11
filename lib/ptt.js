import { version, description } from '../package.json';

import * as program from 'commander';
// import highland from 'highland';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as cluster from 'cluster';
import * as readline from 'readline';
import * as socks from 'socksv5';
import express from 'express';
import Socket from 'socket.io';

import { as } from './helpers';

let decode = it => {
  return {
    host: it.match(/^[^:]+/m)[0],
    port: parseInt(it.match(/\d+$/m)[0], 10)
  };
};

const encoding = 'utf8';
let config = { encoding };
const target = 'https://api.ipify.org/?format=json';

function configure(it) {
  return {
    host: it.host,
    port: it.port,
    path: target,
    headers: {
      Host: target
    },
    agent: false
  };
}

if (cluster.isMaster) {
  let app = express();
  let httpd = http.Server(app);
  let io = Socket(httpd);

  app.use(express.static('public'));

  program.usage('-5 --file ../proxies.txt').version(version).description(description).option('-f, --file <input>', 'Parse an input file line by line').option('-5, --socks5', 'Test for SOCKet Secure Layer 5')
  // .option('-4, --socks4', 'Test for SOCKet Secure Layer 4')
  .option('-j, --threads', 'Number of threads/clusters to run on').option('--port <port>', 'Set the httpd interface port to listen on').parse(process.argv);

  let listener = httpd.listen(program.port || null);

  if (!program.port) {
    console.log(chalk.yellow('Interface'), 'Listening on port', chalk.blue(httpd.address().port));
  }

  let threads = program.threads || os.cpus().length;

  let fromFileSystem = () => {
    if (!program.file) return false;
    let realPath = path.resolve(program.file);
    let readStream = fs.createReadStream(realPath, config);
    return readStream;
  };

  let input = as.decomposed([fromFileSystem], process.stdin);

  let rl = readline.createInterface({ input });

  cluster.setupMaster({
    silent: true
  });

  class Runner {
    constructor(callback) {
      this.callback = callback;
      this.running = 0;
      this.completed = 0;
      this.queue = [];
    }

    initialize() {
      let self = this;

      if (this.queue.length === 0) return false;
      if (this.running > 0) return false;

      this.running++;

      let item = this.queue.shift();
      let worker = cluster.fork();

      worker.send(item);

      worker.on('message', it => {
        let amount = self.queue.length + self.running + self.completed;

        it.identity = worker.id;
        it.identifier = worker.process.pid;

        let progress = Math.round(worker.id / amount * 100, 2);

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${ progress }% - ${ worker.id } @ ${ it.status } of ${ amount } "${ it.title }"`);

        if (it.title === 'Verified') {
          console.log(it);
        }

        io.emit('message', it);
      });

      worker.on('exit', () => {
        self.running--;
        self.completed++;
        self.initialize();
      });

      worker.on('error', error => {
        console.log('An error has occured');
      });
    }

    provide(information) {
      this.queue.push(information);
      this.initialize();
    }
  }

  let runner = new Runner(it => {});

  rl.on('line', it => runner.provide(it));
}

if (cluster.isWorker) {
  var time = new Date();
  var increment = 0;

  let delay = () => {
    let now = new Date();
    let difference = now - time;
    time = now;
    return difference;
  };

  let send = (it, title) => {
    process.send({
      status: ++increment,
      message: it,
      title: title || 'Status update',
      elapsed: delay()
    });
  };

  process.on('message', function (message) {
    let decoded = decode(message);
    let proxyOptions = configure(decoded);

    let socksOptions = {
      proxyHost: decoded.host,
      proxyPort: decoded.port,
      auths: [socks.auth.None()]
    };

    send(decoded, 'Decoded message');

    let responseCallback = response => {
      send('Response has been acquired');

      const statusCode = response.statusCode;
      const contentType = response.headers['content-type'];

      var raw = '';

      if (response.statusCode !== 200) {
        send('bad status code', 'Request Error');
        process.exit(0);
      }

      if (!/^(text|application)\/json/.test(contentType)) {
        send('bad content-type', 'Request Error');
        process.exit(0);
      }

      send('Headers verified');

      response.setEncoding(encoding);

      response.on('data', data => {
        send('Data packet received');
        raw += data;
      });

      response.on('end', () => {
        try {
          let parsed = JSON.parse(raw);
          send(parsed, 'Verified');
        } catch (ex) {
          send(ex.toString());
        } finally {
          process.exit(0);
        }
      });

      response.on('error', error => {
        send(error, 'Response Error');
        process.exit(0);
      });
    };

    send('Attempting SOCKSv5 Proxy Check');
    https.get(socksOptions, responseCallback);

    send('Attempting HTTP Proxy Check');
    https.get(proxyOptions, responseCallback);
  });
}