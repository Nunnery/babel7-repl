require('@babel/polyfill');

const babel = require('@babel/core');
const debug = require('debug')('babel7-repl');
const os = require('os');
const path = require('path');
const repl = require('repl');
const replHistory = require('repl.history');
const vm = require('vm');

const babelConfig = {
    presets: [
        ['@babel/preset-env', {
            modules: false
        }]
    ]
};

function evaluate(code, context, file, callback) {
    let err, result, script;
    // first, create the Script object to check the syntax
    try {
        script = vm.createScript(code, {
            filename: file,
            displayErrors: false
        });
    } catch (e) {
        err = e;
        debug('parse error %j', code, e);
    }

    if (!err) {
        try {
            if (this.useGlobal) {
                result = script.runInThisContext({
                    displayErrors: false
                });
            } else {
                result = script.runInContext(context, {
                    displayErrors: false
                });
            }
        } catch (e) {
            err = e;
            if (err && process.domain) {
                debug('not recoverable, send to domain');
                process.domain.emit('error', err);
                process.domain.exit();
                return;
            }
        }
    }

    callback(err, result);
}

function start(options) {
    const defaults = {
        eval: function (code, context, file, callback) {
            code = babel.transform(code, babelConfig).code;
            evaluate.call(this, code, context, file, callback);
        },
        prompt: 'babel> ',
        useGlobal: true
    };

    options = options || {};

    for (var k in defaults) {
        if (!(k in options)) {
            options[k] = defaults[k];
        }
    }

    const historyFile = path.join(os.homedir(), '.node_history');
    const startedRepl = repl.start(options);
    replHistory(startedRepl, historyFile);
}

module.exports = {
    evaluate: evaluate,
    start: start
};