'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var express = _interopDefault(require('express'));
var Socket = _interopDefault(require('socket.io'));
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

var encoding = 'utf8';

// Quick and Dirty File Line Parsing Decoder
var decode = function decode(it) {
  return {
    host: it.match(/^[^:]+/m)[0],
    port: parseInt(it.match(/\d+$/m)[0], 10)
  };
};

var config = { encoding: encoding };

// HTTP Proxy Support
function configureProxy(it) {
  return {
    host: it.host,
    port: it.port,
    path: 'https://api.ipify.org',
    headers: {
      Host: 'api.ipify.org'
    },
    agent: false
  };
}

// SOCKSv5 Proxy Support
function configureSocks(it) {
  var socksConfig = {
    proxyHost: it.host,
    proxyPort: it.port,
    auths: [socks.auth.None()]
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
  var queue;
  var completed;

  (function () {

    // The HTTPd Interface
    var app = express();
    var httpd = http.Server(app);
    var io = Socket(httpd);

    // Serve the HTTPd Static Interface Driver
    app.use(express.static('public'));

    // Command Line Interface Configuration
    program.usage('-5 --file ../proxies.txt')

    // Pulled from package.json
    .version(version).description(description)

    // Options
    .option('-f, --file <input>', 'Parse an input file line by line').option('-5, --socks5', 'Test for SOCKet Secure Layer 5').option('-4, --socks4', 'Test for SOCKet Secure Layer 4').option('-j, --threads <amount>', 'Number of threads/clusters to run on').option('--port <port>', 'Set the httpd interface port to listen on')

    // Provide it with arguments passed to the process
    .parse(process.argv);

    // Allow the HTTPd to listen on specified port
    var listener = httpd.listen(program.port || null);

    // If a port was not specified on the HTTPd, then output the assigned one
    if (!program.port) {
      console.log(chalk.yellow('Interface'), 'Listening on port', chalk.blue(httpd.address().port));
    }

    // Configure the amount of threads to be used
    var threads$$1 = program.threads || os.cpus().length;

    // File Systems Input Driver
    var fromFileSystem = function fromFileSystem() {
      if (!program.file) return false;

      // locate the file and prepare to read it
      var realPath = path.resolve(program.file);
      var readStream = fs.createReadStream(realPath, config);

      return readStream;
    };

    // Load the best Input Driver
    var input = as.decomposed([fromFileSystem], process.stdin);

    // Create a Readable Stream capable of line-by-line parsing
    var rl = readline.createInterface({ input: input });

    // Silence children
    cluster.setupMaster({
      // silent: true
    });

    var distribute = function distribute(workload) {
      for (var id in cluster.workers) {
        workload(cluster.workers[id]);
      }
    };

    var count = function count() {
      var i = 0;
      distribute(function () {
        return i++;
      });
      return i;
    };

    queue = [];
    completed = 0;


    var attempt = function attempt(it) {
      var amount = count();
      var total = amount + completed + queue.length;

      var assign = function assign(worker) {
        worker.send(it);

        worker.on('message', function (message) {
          console.log('Message', worker.id, message);
        });

        worker.on('error', function (error) {
          console.log('Error', error);
        });

        worker.on('exit', function () {
          completed++;

          if (queue.length > 0) {
            attempt(queue.shift());
          }
        });
      };

      if (threads$$1 > amount) {
        assign(cluster.fork());
      } else {
        queue.push(it);
      }
    };

    // Run each line as a task
    rl.on('line', function (it) {
      attempt(it);
    });
  })();
}

// Children Workers
if (cluster.isWorker) {
  process.on('message', function (message) {

    // convert line into address:port
    var decoded = decode(message);

    // prepare each method
    var proxyOptions = configureProxy(decoded);
    var socksOptions = configureSocks(decoded);

    // promises for ease of continuity
    var get$$1 = function get$$1(options) {
      return new Promise(function (resolve$$1, reject) {
        process.send({ message: 'Sending Request' });
        try {
          var connection = https.get(options, function (response) {
            var statusCode = response.statusCode;
            var contentType = response.headers['content-type'];

            var raw = '';

            process.send({ statusCode: statusCode, contentType: contentType });

            if (statusCode !== 200) {
              reject('Status Code ' + statusCode);
            }

            if (!/^(text|application)\/json/.test(contentType)) {
              reject('Content Type ' + contentType);
            }

            response.setEncoding(encoding);

            response.on('error', function (error) {
              reject(error);
            });

            response.on('data', function (data) {
              raw += data;
            });

            response.on('end', function () {
              resolve$$1(raw);
            });
          });
        } catch (exception) {
          reject(exception);
        }
      });
    };

    var passthrough = function passthrough(it) {
      return process.send({ message: it });
    };

    var socks$$1 = get$$1(socksOptions).then(passthrough).catch(passthrough);
    var proxy = get$$1(proxyOptions).then(passthrough).catch(passthrough);
  });
}
//# sourceMappingURL=index.js.map
