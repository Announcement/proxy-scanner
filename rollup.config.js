import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import sourcemaps from 'rollup-plugin-sourcemaps';
import * as path from 'path';

export default {
  entry: 'src/main.js',
  format: 'cjs',
  moduleName: 'Scanner',
  sourceMap: true,
  external: [
    "fs",
    "http",
    "path",
    "readline",
    "chalk",
    "commander",
    "highland",
    "cluster"
  ],
  plugins: [
    sourcemaps(),
    json(),
    babel({
      babelrc: false,
      "presets": [
        [
          "es2015",
          {
            "modules": false
          }
        ]
      ],
      "plugins": ["external-helpers"]
    })
  ],
  dest: 'bin/main.js'
};
