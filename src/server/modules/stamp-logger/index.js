// third party dependencies
const logger = require('winston');
const logfile = 'stamp-logger\index.js';
const mkdirp = require('mkdirp');

// electron/node dependencies

// globals
var consoleConfigured = false;
var fileConfigured = false;
var config;

// exported functions
module.exports.configure = configure;
module.exports.debug = debug;
module.exports.info = info;
module.exports.warn = warn;
module.exports.error = error;

function debug(message, file) {
    if (!logger) {
        configure();
    }
    logger.debug(message, { file: file });
}

function info(message, file) {
    if (!logger) {
        configure();
    }
    logger.info(message, { file: file });
}

function warn(message, file) {
    if (!logger) {
        configure();
    }
    logger.warn(message, { file: file });
}

function error(message, file) {
    if (!logger) {
        configure();
    }
    logger.error(message, { file: file });
}

// configures the logger
function configure(config, server) {
    
    // don't exit on unhandled exceptions
    logger.exitOnError = false;

    var message;
    if (server) {
        message = 'Server -';
    }
    else {
        message = 'Client -';
    }

    // reconfigure the console transport 
    if (consoleConfigured === false) {

        // configure the console transport
        logger.remove(logger.transports.Console);
        logger.add(logger.transports.Console, {
            level: 'debug',
            handleExceptions: true,
            colorize: true
        });
        consoleConfigured = true;
        message = message + ' Console transport enabled.';

    }

    // configure the file transport
    if (config && config.logging && config.logging.file) {

        getLogsPath(server)
            .then((logPath) => {

                // complete the log path
                if (server === true) {
                    logPath = logPath + '/server.log';
                }
                else {
                    logPath = logPath + '/client.log';
                }

                // turn on the file transport
                if (fileConfigured) {
                    logger.remove(logger.transports.File);
                    message = message + ' File transport reconfigured.';
                }
                else {
                    message = message + ' File transport enabled.';
                }
                logger.add(logger.transports.File, {
                    level: config.logging.level,
                    filename: logPath,
                    handleExceptions: true,
                    json: true,
                    maxsize: 5242880, // 5 mb
                    maxFiles: 5
                });
                fileConfigured = true;
                logger.debug(message);

            });

    }
    else {
        
        if (fileConfigured) {
            logger.remove(logger.transports.File);
            fileConfigured = false;
            message = message + ' File transport disabled.';
        }
        
        if (message.slice(-2) === ' -') {
            message = message + ' no transports changed.';
        }
        logger.debug(message);
    }
}

// resturns the path to the logs folder
function getLogsPath(server) {

    return new Promise((resolve, reject) => {

        // create the app object depending on which processing is calling
        var app;
        if (server === true) {
            app = require('electron').app;
        }
        else {
            const remote = require('electron').remote;
            app = remote.app;
        }

        // get the logs path
        var path = app.getPath('appData') + '/stamp/logs';

        // create the folder
        mkdirp(path, () => {
            resolve(path);
        });

    });

}