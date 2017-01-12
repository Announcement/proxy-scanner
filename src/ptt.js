import { version, description } from '../package.json';

import {as} from './helpers';

import express from 'express';
import Socket from 'socket.io';

import * as program from 'commander';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as cluster from 'cluster';
import * as readline from 'readline';
import * as socks from 'socksv5';

const encoding = 'utf8';

// Quick and Dirty File Line Parsing Decoder
let decode = it => {
  return {
    host: it.match(/^[^:]+/m)[0],
    port: parseInt(it.match(/\d+$/m)[0], 10)
  };
};

let config = {encoding};

// HTTP Proxy Support
function configureProxy(it) {
  return {
    host: it.host,
    port: it.port,
    path: 'https://api.ipify.org',
    headers: {
      Host: 'api.ipify.org'
    }
  };
}

// SOCKSv5 Proxy Support
function configureSocks(it) {
  let socksConfig = {
    proxyHost: it.host,
    proxyPort: it.port,
    auths: [ socks.auth.None() ]
  };

  return {
    host: 'api.ipify.org',
    port: 443,
    path: '/',
    agent: new socks.HttpsAgent(socksConfig)
  };
}

// Main Process
if (cluster.isMaster) {

  // The HTTPd Interface
  let app = express();
  let httpd = http.Server(app);
  let io = Socket(httpd);

  // Serve the HTTPd Static Interface Driver
  app.use(express.static('public'));

  // Command Line Interface Configuration
  program
    // Example usage
    .usage('-5 --file ../proxies.txt')

    // Pulled from package.json
    .version(version)
    .description(description)

    // Options
    .option('-f, --file <input>', 'Parse an input file line by line')
    .option('-5, --socks5', 'Test for SOCKet Secure Layer 5')
    .option('-4, --socks4', 'Test for SOCKet Secure Layer 4')
    .option('-j, --threads <amount>', 'Number of threads/clusters to run on')
    .option('-s, --timeout <seconds>', 'Timeout to kill, defaults to infinity')
    .option('--port <port>', 'Set the httpd interface port to listen on')

    // Provide it with arguments passed to the process
    .parse(process.argv);

  // Allow the HTTPd to listen on specified port
  if (program.port !== null) {
    httpd.listen(program.port);
  } else {
    httpd.listen();
  }

  // If a port was not specified on the HTTPd, then output the assigned one
  if(!program.port) {
    console.log(chalk.yellow('Interface'), 'Listening on port', chalk.blue(httpd.address().port));
  }

  // Configure the amount of threads to be used
  let threads = program.threads || os.cpus().length;

  // File Systems Input Driver
  let fromFileSystem = () => {
    if (!program.file) return false;

    // locate the file and prepare to read it
    let realPath = path.resolve(program.file);
    let readStream = fs.createReadStream(realPath, config);

    return readStream;
  }

  // Load the best Input Driver
  let input = as.decomposed([
    fromFileSystem
  ], process.stdin);

  // Create a Readable Stream capable of line-by-line parsing
  let rl = readline.createInterface({input});

  // Silence children
  cluster.setupMaster({
    // silent: true
  });

  let distribute = (workload) => {
    for (const id in cluster.workers) {
      workload(cluster.workers[id]);
    }
  };

  let count = () => {
    var i = 0;
    distribute(() => i++);
    return i;
  }

  var queue = [];
  var completed = 0;

  let attempt = it => {
    let amount = count();
    let total = amount + completed + queue.length;

    let assign = worker => {
      worker.send(it);

      worker.on('message', function(it) {
        if (it.constructor === String && it[0] === '!') {
          console.log(it.substrnig(1));
          return false;
        }
        process.stdout.write((worker.id + ''));

        for (var i = worker.id.toString().length; i < 4; i++) {
          process.stdout.write(' ');
        }

        process.stdout.write(chalk.yellow(it.type.toUpperCase()));
        process.stdout.write(' ');
        for (var i = it.host.length; i < 15; i++) {
          process.stdout.write(' ');
        }
        process.stdout.write(it.host);
        process.stdout.write(':');
        process.stdout.write(chalk.gray(it.port + ''));
        for (var i = it.port.toString().length; i < 5; i++) {
          process.stdout.write(' ');
        }
        process.stdout.write(it.elapsed + chalk.gray('ms'));
        for (var i = it.elapsed.toString().length; i < 5; i++) {
          process.stdout.write(' ');
        }
        process.stdout.write(' ');
        process.stdout.write(JSON.stringify(it.message || it.error));
        console.log('');
      });

      worker.on('error', function(error) {
        console.log('Error', error.toString());
      });

      if (program.timeout) {
        setTimeout(function(){
          worker.kill();
        }, parseInt(program.timeout, 10) * 1000);
      }

      worker.on('exit', function() {
        completed++;

        if (queue.length > 0) {
          attempt(queue.shift());
        } else {
          process.exit();
        }
      });
    };

    if (threads > amount) {
      assign(cluster.fork());
    } else {
      queue.push(it);
    }
  }

  // Run each line as a task
  rl.on('line', it => { attempt(it) });
}


// Children Workers
if (cluster.isWorker) {
  process.on('message', function(message) {
    // convert line into address:port
    let decoded = decode(message);

    // prepare each method
    let proxyOptions = configureProxy(decoded);
    let socksOptions = configureSocks(decoded);

    // promises for ease of continuity
    let get = (options) => {
      return new Promise(function(resolve, reject) {
        https.get(options, function (response) {
          const statusCode = response.statusCode;

          var raw = '';

          if (statusCode !== 200) {
            reject({'error': `Status Code ${statusCode}`, 'from': 'status'});
          } else {
            process.send('!http is working so far');
            response.setEncoding(encoding);

            response.on('error', error => {
              reject({'error': error, 'from': 'response'});
            });

            response.on('data', data => {
              process.send('!receiving data via http');
              raw += data;
            });

            response.on('end', () => {
              resolve({'data': raw});
            });
          }
        }).on('error', function(e) {
          reject(e);
        })
      });
    }

    function createPacket(packet) {
      let object = {
        line: message,
        host: decoded.host,
        port: decoded.port
      };

      Object.keys(packet).forEach(function(key) {
        object[key] = packet[key];
      });

      return object;
    }

    let socks = get(socksOptions).then(it => {
      let packet = createPacket({
        type: 'socks',
        data: it
      });
    }).catch(it => {
      let packet = createPacket({
        type: 'socks',
        data: it,
        error: true
      });
    });

    let proxy = get(proxyOptions).then(it => {
      let packet = createPacket({
        type: 'https',
        data: it
      });
    }).catch(it => {
      let packet = createPacket({
        type: 'https',
        data: it,
        error: true
      });
    });
  });
}
