import { version, description } from '../package.json';
import * as program from 'commander';

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
  .option('--port <port>', 'Set the httpd interface port to listen on')

  // Provide it with arguments passed to the process
  .parse(process.argv);

export default program;
