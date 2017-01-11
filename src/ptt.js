import { version, description } from '../package.json';

import * as program from 'commander';
// import highland from 'highland';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as cluster from 'cluster';
import * as readline from 'readline';
import {as} from './helpers';

let decode = it => {
  return {
    host: it.match(/^[^:]+/m)[0],
    port: parseInt(it.match(/\d+$/m)[0], 10)
  };
};

let encoding = 'utf8';
let config = {encoding};

function configure(it) {
  return {
    host: it.host,
    port: it.port,
    path: 'https://api.ipify.org?format=json',
    headers: {
      Host: 'https://api.ipify.org?format=json'
    },
    agent: false
  };
}

if (cluster.isMaster) {
  program
    .usage('-5 --file ../proxies.txt')
    .version(version)
    .description(description)
    .option('-f, --file <input>', 'Parse an input file line by line')
    .option('-5, --socks5', 'Test for SOCKet Secure Layer 5')
    .option('-4, --socks4', 'Test for SOCKet Secure Layer 4')
    .parse(process.argv);



  let fromFileSystem = () => {
    if (!program.file) return false;
    let realPath = path.resolve(program.file);
    let readStream = fs.createReadStream(realPath, config);
    return readStream;
  }

  let input = as.decomposed([fromFileSystem], process.stdin);

  let rl = readline.createInterface({input});


  class Runner {
    constructor(callback) {
      this.callback = callback;
      this.running = 0;
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
      worker.on('exit', () => {
        self.running--;
        self.initialize();
      })
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
  process.on('message', function(message) {
    let options = configure(decode(message));
    http.get(options, response => {
      process.stdout.write(chalk.yellow(message));

      const statusCode = response.statusCode;
      const contentType = response.headers['content-type'];

      var raw = '';

      process.stdout.write(' headers...');

      if (response.statusCode !== 200) {
        console.log('bad status code');
        process.exit(0);
      }

      if (!/^(text|application)\/json/.test(contentType)) {
        console.log('bad content-type');
        process.exit(0)
      }

      process.stdout.write(' data');
      response.setEncoding(encoding);

      response.on('data', data => { process.stdout.write('.'); raw += data});

      response.on('end', () => {
        try {
          let parsed = JSON.parse(raw);
          console.log(JSON.stringify(parsed, null, 2));
        } catch (ex) {
          console.log(ex.toString());
        } finally {
          process.exit(0);
        }
      });

      response.on('error', error => {
        console.log(error);
        process.exit(0);
      })
    });
  });
}
