import {as} from './helpers';
import program from './options';
import {encoding, decode} from './decoders'

import * as path from 'path';
import * as fs from 'fs';

let config = {encoding};

// File Systems Input Driver
let fromFileSystem = () => {
  if (!program.file) return false;

  // locate the file and prepare to read it
  let realPath = path.resolve(program.file);
  let readStream = fs.createReadStream(realPath, config);

  return readStream;
}

let waterfall = [
  fromFileSystem
];

// Load the best Input Driver
export default as.decomposed(waterfall, process.stdin);
