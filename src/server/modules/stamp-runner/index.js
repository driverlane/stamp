// third party modules
var Jasmine = require('jasmine');

// logger
const logger = require('stamp-logger');
const logfile = 'stamp-runner\index.js';

// node and electron modules
const app = require('app');
const path = require('path');

// local modules
var JsonReporter = require('stamp-json-reporter');
var helper = require('stamp-helper');

// module level variables
var runner = {};
var testRunsLeft = 1;
var jasmineCompleted;

/* --------------------------------------------- */
/* --------       public functions      -------- */
/* --------------------------------------------- */

// sets the module options
module.exports.init = function (test, config, window) {
    runner.test = test;
    runner.config = config;
    runner.window = window;
    logger.debug('stamp-runner initialised', logfile);
};

// run the test
module.exports.execute = function () {

    // run for each requested browser
    var selectedBrowsers = runner.config.runner.browsers.filter((browser) => {
        return browser.selected === true;
    });

    runTests(selectedBrowsers)
        .then(() => {
            logger.debug('All tests completed.', logfile);
        });

};

/* --------------------------------------------- */
/* --------      private functions      -------- */
/* --------------------------------------------- */

// initialises jasmine and the reporters
function initialiseJasmine(browser) {

    // remove any cached tests
    logger.debug('Removing cached node resources for Jasmine', logfile);
    var modId = require.resolve('jasmine');
    deleteRequireCache(modId);

    // initialise the new objects
    logger.debug('Configuring Jasmine and the reporters', logfile);
    var jasmine = new Jasmine();
    var jsonReporter = new JsonReporter();

    // add the custom reporter
    jasmine.addReporter(jsonReporter);

    // set options
    if (runner.config.runner.timeout) {
        jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = runner.config.runner.timeout;
    }
    if (runner.window) {
        jsonReporter.test = runner.test;
        jsonReporter.config = runner.config;
        jsonReporter.window = runner.window;
        jsonReporter.testRunsLeft = testRunsLeft;
        jsonReporter.browser = browser;
    }
    // add the config
    jasmine.projectBaseDir = app.getAppPath();
    jasmine.loadConfig({
        spec_dir: 'testing',
        spec_files: [
            '**/*.js'
        ],
        helpers: []
    });

    // track when jasmine completes
    jasmine.onComplete((result) => {
        jasmineCompleted(result);
    });

    return jasmine;

}

// tracking the jasmine completion via a promise/event
function runTest(browser) {

    try {
        return new Promise((resolve, reject) => {

            var jasmine = initialiseJasmine(browser.name);

            logger.debug('Running test against browser ' + browser.name, logfile);

            // allow the jasmine.onComplete to resolve this promise
            jasmineCompleted = resolve;

            // execute the test
            runner.config.currentBrowser = browser.name;
            helper.init(runner.test, runner.config, runner.window, browser.name);
            jasmine.execute();

        });
    }
    catch (error) {
        logger.error(error, logfile);
    }

}

// iterates synchronously through the selected browsers
function runTests(browsers) {
    testRunsLeft = browsers.length;
    return browsers.reduce((promise, browser) => {
        return promise.then(() => {
            return runTest(browser).then((result) => {
                testRunsLeft = testRunsLeft -1;
            });
        });
    }, Promise.resolve());
}

// cleans the Node cache of items from the supplied module id
function deleteRequireCache(id) {

    var files = require.cache[id];

    if (files !== undefined) {
        Object.keys(files.children).forEach(function (file) {
            deleteRequireCache(files.children[file].id);
        });

        if (id.indexOf('testing') > 0) {
            delete require.cache[id];
        }
    }
}
