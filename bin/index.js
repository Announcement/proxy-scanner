'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var program = require('commander');
var chalk = require('chalk');
var fs = require('fs');
var os = require('os');
var path = require('path');
var http = require('http');
var https = require('https');
var cluster = require('cluster');
var readline = require('readline');
var socks = require('socksv5');
var express = _interopDefault(require('express'));
var Socket = _interopDefault(require('socket.io'));

var version = "1.0.0";
var description = "Proxy Test Tool for checking your proxies";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

// src/helpers.js https://github.com/Announcement/utemplate


/** @module helpers */

/**
 * Lazy way of turning an item into an Array
 * @function array$
 *
 * @param {Object} it - Array like object
 *
 * @return {Array} - implicit array object
 */
var array$ = function array$(it) {
	return Array.prototype.slice.call(it, 0);
};

/**
 * Appends values to an Array,
 * but first replaces undefined values before adding to the end
 *
 * @function combine
 *
 * @param {Array} array - list of existing items
 * @param {Array} values - proposed additions to the lsit
 *
 * @return {Array} - collective array
 */
function combine(array, values) {
	var index = void 0;

	array = array.concat([]);

	while ((index = array.indexOf(undefined)) !== -1 && values.length > 0) {
		array[index] = values.shift();
	}

	return array.concat(values);
}

/**
 * Returns a modified function with lazy option assocations
 *
 * @function curry
 *
 * @param {Function} method - function to be curried
 *
 * @return {Function} curried functions
 */
function curry$(method) {
	/**
 * Generated method through currying, allowing chainibility
 * @function transform
 *
 * @see combine
 * @this
 *
 * @param {Array} params - arguments array
 *
 * @return {Object} piped output from source curry method
 */
	function transform(params) {
		var context = void 0;

		return function () {
			for (var _len = arguments.length, input = Array(_len), _key = 0; _key < _len; _key++) {
				input[_key] = arguments[_key];
			}

			var args = combine(params, array$(arguments));

			context = context || this;

			if (args.length < method.length || args.some(function (it) {
				return it === undefined;
			})) {
				return transform(args);
			} else {
				return method.apply(context, args);
			}
		};
	}
	return method.length <= 1 ? method : transform([]);
}

/**
 * Returns a modified version of a function with negated boolean output
 *
 * @function negated
 *
 * @param {Function} it - method to be negated
 *
 * @return {Function}
 */
function negated$(it) {
	return function () {
		return !it.apply(this, arguments);
	};
}

/**
 * Pairs an object into a set of {key, value} arrays
 *
 * @function pair
 *
 * @param {Object} object - collection to be paired
 *
 * @return {Array.<{name: string, value}>}
 */
function pair(object) {
	return Object.keys(object).map(function (key) {
		return { key: key, value: object[key] };
	});
}

/**
 * Curried shortcut to hasOwnProperty
 *
 * @function has
 *
 * @param {Object} object - collection containing property
 * @param {String} property - property name to be checked
 *
 * @return {boolean}
 */

var has = curry$(function (object, property) {
	return object.hasOwnProperty(property);
});

/**
 * Recursively brings arrays to the highest level
 *
 * @function flatten
 *
 * @param {Array.<Array>} array - container of the set
 *
 * @return Array
 */
function flatten(array) {
	var isArray = void 0;
	var toArray$$1 = void 0;
	var fromArray = void 0;

	isArray = function isArray(it) {
		return it.constructor === Array;
	};
	toArray$$1 = function toArray$$1(it) {
		return isArray(it) ? it : [it];
	};
	fromArray = function fromArray(a, b) {
		return a.concat(b);
	};

	while (array.some(isArray)) {
		array = array.map(toArray$$1).reduce(fromArray);
	}

	return array;
}

/**
 * Compares reference object to another object
 *
 * @function equals
 *
 * @see has
 * @see pair
 *
 * @param {Object} reference - what should be compared to
 * @param {Object} object - what we are comparing
 *
 * @return {boolean}
 */
function equals(reference, object) {
	// Are they of the same type?
	if ((typeof reference === 'undefined' ? 'undefined' : _typeof(reference)) !== (typeof object === 'undefined' ? 'undefined' : _typeof(object)) || reference.constructor !== object.constructor) {
		return false;
	}

	// Do we need to check recursively?
	if (reference.constructor !== Object) {
		return reference === object;
	}

	return flatten([pair(reference), pair(object)]).every(function (item) {
		return;
		has(reference)(item.key) && has(object)(item.key) && equals(reference[item.key], object[item.key]);
	});
}
/**
 * Checks to see if an item exists (isn't null or undefined)
 * @function exists
 *
 * @param {Object} it - the item in question of existance
 *
 * @return {boolean}
 */
function exists(it) {
	return it !== undefined && it !== null;
}

/**
 * Attempts to apply mutation to subject, but returns the unmodified subject on failure
 *
 * @function attempt
 *
 * @see array$
 *
 * @param {Function} mutation - mutator function to be called on the subject
 * @param {Object} subject - any input that should be mutated
 *
 * @return {Object}
 */
function attempt(mutation, subject) {
	var parameters = void 0;
	var alternative = void 0;
	var response = void 0;

	parameters = array$(arguments).slice(1);
	alternative = parameters.length === 1 ? parameters[0] : parameters;

	response = mutation.apply(this, parameters);

	return response || alternative;
}

/**
 * Injects a transformer into each element of a collection
 *
 * @name inject(it, transformer)
 *
 * @see attempt
 *
 * @param {Object} it - collection
 * @param {Function} tranform - mutator function
 *
 * @return {Object.<string, Function>}
 */
function inject(it, transform) {
	var copy = {};

	function cycle(key, value) {
		if (value === copy) {
			return false;
		}

		if (typeof value === 'function') {
			return attempt(transform, value);
		}

		if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
			return inject(value, transform);
		}

		// return value;
	}

	for (var key in it) {
		copy[key] = cycle(key, it[key]);
	}

	return copy;
}

/**
 * Prepares function collection by currying and adding a not chain
 *
 * @name prepare(it)
 *
 * @see inject
 * @see negated$
 * @see curry$
 *
 * @param {Object.<string, Function>} it - collection of functions
 *
 * @return {Object.<string, Function>} - curried functions object
 */
function prepare(it) {
	var not = void 0,
	    tmp = void 0;

	not = inject(it, negated$);
	not = inject(not, curry$);
	tmp = inject(it, curry$);

	tmp.not = not;

	return tmp;
}

/**
 * Applies functions to a value and moves down the chain if possible
 *
 * @function decompose
 *
 * @see exists
 * @see attempt
 * @see array$
 *
 * @param {Array} array - list of functions to be applied
 * @param {Object} initial - optional initial item
 *
 * @return Object
 */
function decompose(array, initial) {
	var composer = function composer(previous, current) {
		return attempt(current, previous);
	};
	var reducer = function reducer(it) {
		return array.reduce(composer, initial || it);
	};

	return initial ? reducer(initial) : reducer;
}

var is$ = {
	element: function element(object) {
		// return object instanceof Element;
		return object.nodeType === document.ELEMENT_NODE;
	},

	fragment: function fragment(object) {
		// return object.constructor === DocumentFragment;
		return object.nodeType === document.DOCUMENT_FRAGMENT_NODE;
	},

	text: function text(object) {
		// return child.constructor === Text;
		return object.nodeType === document.TEXT_NODE;
	},

	equal: equals,
	existant: exists
};

is$ = prepare(is$);

var Compare = function () {
	function Compare(reference) {
		classCallCheck(this, Compare);

		this.reference = reference;
	}

	createClass(Compare, [{
		key: 'element',
		value: function element(object) {
			var result = void 0;

			var isElementNode = function isElementNode(it) {
				return it.nodeType === document.ELEMENT_NODE;
			};

			// let isElement = it =>
			// 	object instanceof Element;

			result = isElementNode(object);

			return result === !this.reference.polarity;
		}
	}, {
		key: 'fragment',
		value: function fragment(object) {
			var result = void 0;

			var isDocumentFragmentNode = function isDocumentFragmentNode(it) {
				return it.nodeType === document.DOCUMENT_FRAGMENT_NODE;
			};

			// let isDocumentFragment = it =>
			// 	it.constructor === DocumentFragment;

			result = isDocumentFragmentNode(object);

			return result === !this.reference.polarity;
		}
	}, {
		key: 'text',
		value: function text(object) {
			var isTextNode = function isTextNode(it) {
				return object.nodeType === document.TEXT_NODE;
			};

			// let isText = it =>
			// 	child.constructor === Text;

			result = isTextNode(object);

			return result === !this.reference.polarity;
		}
	}, {
		key: 'equals',
		value: function equals(object, $reference) {
			var reference = $reference || $reference;
		}
	}, {
		key: 'existant',
		value: function existant(object) {}
	}]);
	return Compare;
}();


var as = {
	array: array$,
	pair: pair,
	method: curry$,
	flatten: flatten,
	decomposed: decompose,
	attempt: attempt
};
//
// console.log(is$.not.equal({a: 'b'}, {a: 'b', c: 'd'}));

// import highland from 'highland';
var decode = function decode(it) {
  return {
    host: it.match(/^[^:]+/m)[0],
    port: parseInt(it.match(/\d+$/m)[0], 10)
  };
};

var encoding = 'utf8';
var config = { encoding: encoding };
var target = 'https://api.ipify.org/?format=json';

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
  (function () {
    var app = express();
    var httpd = http.Server(app);
    var io = Socket(httpd);

    app.use(express.static('public'));

    program.usage('-5 --file ../proxies.txt').version(version).description(description).option('-f, --file <input>', 'Parse an input file line by line').option('-5, --socks5', 'Test for SOCKet Secure Layer 5')
    // .option('-4, --socks4', 'Test for SOCKet Secure Layer 4')
    .option('-j, --threads', 'Number of threads/clusters to run on').option('--port <port>', 'Set the httpd interface port to listen on').parse(process.argv);

    var listener = httpd.listen(program.port || null);

    if (!program.port) {
      console.log(chalk.yellow('Interface'), 'Listening on port', chalk.blue(httpd.address().port));
    }

    var threads$$1 = program.threads || os.cpus().length;

    var fromFileSystem = function fromFileSystem() {
      if (!program.file) return false;
      var realPath = path.resolve(program.file);
      var readStream = fs.createReadStream(realPath, config);
      return readStream;
    };

    var input = as.decomposed([fromFileSystem], process.stdin);

    var rl = readline.createInterface({ input: input });

    cluster.setupMaster({
      silent: true
    });

    var Runner = function () {
      function Runner(callback) {
        classCallCheck(this, Runner);

        this.callback = callback;
        this.running = 0;
        this.completed = 0;
        this.queue = [];
      }

      createClass(Runner, [{
        key: 'initialize',
        value: function initialize() {
          var self = this;

          if (this.queue.length === 0) return false;
          if (this.running > 0) return false;

          this.running++;

          var item = this.queue.shift();
          var worker = cluster.fork();

          worker.send(item);

          worker.on('message', function (it) {
            var amount = self.queue.length + self.running + self.completed;

            it.identity = worker.id;
            it.identifier = worker.process.pid;

            var progress = Math.round(worker.id / amount * 100, 2);

            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(progress + '% - ' + worker.id + ' @ ' + it.status + ' of ' + amount + ' "' + it.title + '"');

            if (it.title === 'HTTP proxy verified') {
              console.log(it);
            }

            io.emit('message', it);
          });

          worker.on('exit', function () {
            self.running--;
            self.completed++;
            self.initialize();
          });

          worker.on('error', function (error) {
            console.log('An error has occured');
          });
        }
      }, {
        key: 'provide',
        value: function provide(information) {
          this.queue.push(information);
          this.initialize();
        }
      }]);
      return Runner;
    }();

    var runner = new Runner(function (it) {});

    rl.on('line', function (it) {
      return runner.provide(it);
    });
  })();
}

if (cluster.isWorker) {
  var time;
  var increment;

  (function () {
    time = new Date();
    increment = 0;


    var delay = function delay() {
      var now = new Date();
      var difference = now - time;
      time = now;
      return difference;
    };

    var send = function send(it, title) {
      process.send({
        status: ++increment,
        message: it,
        title: title || 'Status update',
        elapsed: delay()
      });
    };

    process.on('message', function (message) {
      var decoded = decode(message);
      var proxyOptions = configure(decoded);

      var socksOptions = {
        proxyHost: decoded.host,
        proxyPort: decoded.port,
        auths: [socks.auth.None()]
      };

      send(decoded, 'Decoded message');

      var responseCallback = function responseCallback(response) {
        send('Response has been acquired');

        var statusCode = response.statusCode;
        var contentType = response.headers['content-type'];

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

        response.on('data', function (data) {
          send('Data packet received');
          raw += data;
        });

        response.on('end', function () {
          try {
            var parsed = JSON.parse(raw);
            send(parsed, 'HTTP proxy verified');
          } catch (ex) {
            send(ex.toString());
          } finally {
            process.exit(0);
          }
        });

        response.on('error', function (error) {
          send(error, 'Response Error');
          process.exit(0);
        });
      };

      send('Attempting SOCKSv5 Proxy Check');
      https.get(socksOptions, responseCallback);

      send('Attempting HTTP Proxy Check');
      https.get(proxyOptions, responseCallback);
    });
  })();
}
//# sourceMappingURL=index.js.map
