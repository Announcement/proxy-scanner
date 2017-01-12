export let encoding = 'utf8';

// Quick and Dirty File Line Parsing Decoder
export let decode = it => {
  return {
    host: it.match(/^[^:]+/m)[0],
    port: parseInt(it.match(/\d+$/m)[0], 10)
  };
};
