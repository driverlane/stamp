exports = module.exports = JsonReporter;

// logger
const logger = require('stamp-logger');
const logfile = 'stamp-json-reporter\index.js';

// local modules
var helper = require('stamp-helper');

function JsonReporter() {

    var self = this;
    var currentSpec;
    var currentSuite = false;
    var parentSuiteId = false;
    var openSuites = [];
    var summary = {};

    self.jasmineStarted = function (data) {

        logger.debug('Jasmine started', logfile);

        // reset the summary object
        summary.testName = this.config.tests[this.test].name;
        if (this.config.tests[this.test].testVariables) {
            summary.environment = this.config.tests[this.test].testVariables[this.config.tests[this.test].selectedVariables].name;
        }
        else {
            summary.environment = '';
        }
        summary.browser = this.browser;
        summary.suites = [];
        summary.failedExpectations = [];
        summary.passedSpecs = 0;
        summary.failedSpecs = 0;
        summary.pendingSpecs = 0;
        summary.totalSpecsDefined = data.totalSpecsDefined;
        summary.started = new Date();

        // send the status message
        var status = { event: 'jasmineStarted', details: data, summary: summary };
        if (typeof this.window !== 'undefined') {
            this.window.webContents.send('receive-test-results', JSON.stringify(status));
        }
        else {
            throw new Error('No window defined, cannot communicate with renderer');
        }

    };

    self.suiteStarted = function (data) {

        // handle any parent suite
        if (currentSuite) {
            parentSuiteId = currentSuite.id;
            openSuites.push(currentSuite);
        }

        // reset the currentSuite object
        currentSuite = data;
        currentSuite.suites = [];
        currentSuite.specs = [];
        if (parentSuiteId) {
            currentSuite.parentSuiteId = parentSuiteId;
        }
        currentSuite.started = new Date();

        // send the status message
        var status = { event: 'suiteStarted', details: data, summary: summary };
        if (typeof this.window !== 'undefined') {
            this.window.webContents.send('receive-test-results', JSON.stringify(status));
        }
    };

    self.specStarted = function (data) {

        // reset the currentSpec object
        currentSpec = data;
        currentSpec.started = new Date();
        helper.resetWebdriverError();

        // send the status message
        var status = { event: 'specStarted', details: data, summary: summary };
        if (typeof this.window !== 'undefined') {
            this.window.webContents.send('receive-test-results', JSON.stringify(status));
        }
    };

    self.specDone = function (data) {

        // update the currentSpec object
        currentSpec.completed = new Date();
        currentSpec.totalSeconds = (currentSpec.completed - currentSpec.started) / 1000;

        // update the currentSuite object
        currentSuite.specs.push(currentSpec);

        // update the summary object
        if (data.status === 'failed') {
            summary.failedSpecs = summary.failedSpecs + 1;
        }
        else if (data.status === 'passed') {
            summary.passedSpecs = summary.passedSpecs + 1;
        }
        else {
            summary.pendingSpecs = summary.pendingSpecs + 1;
        }

        // add the data object to the failedExpectations array
        if (data.failedExpectations.length > 0) {
            for (var i = 0; i < data.failedExpectations.length; i++) {

                // replace the error with the webdriver error, if there is one 
                var webdriverError = helper.webdriverError();
                if (webdriverError) {
                    data.failedExpectations[i].message = webdriverError.name;
                    data.failedExpectations[i].stack = webdriverError.message;
                }

                // add the expectations to the suite level array as well as this spec
                currentSuite.failedExpectations.push(data);
                data.suiteDescription = currentSuite.description;
                summary.failedExpectations.push(data);
            }
        }

        // send the status message
        var status = { event: 'specDone', details: data, summary: summary };
        if (typeof this.window !== 'undefined') {
            this.window.webContents.send('receive-test-results', JSON.stringify(status));
        }
    };

    self.suiteDone = function (data) {

        // close the currentSuite object
        currentSuite.completed = new Date();
        if (parentSuiteId) {

            // add the currentSuite object to it's parent
            openSuites[openSuites.length - 1].suites.push(currentSuite);

            // make the parent the currentSuite object
            currentSuite = openSuites.pop();
            parentSuiteId = currentSuite.parentSuiteId || false;
        }
        else {
            summary.suites.push(currentSuite);
            currentSuite = false;
            parentSuiteId = false;
        }

        // send the status message
        var status = { event: 'suiteDone', details: data, summary: summary };
        if (typeof this.window !== 'undefined') {
            this.window.webContents.send('receive-test-results', JSON.stringify(status));
        }

    };

    self.jasmineDone = function () {

        logger.debug('Jasmine completed', logfile);

        // update the summary object
        var completed = new Date();
        summary.completed = completed;
        summary.completedLocale = completed.toLocaleString();
        summary.totalSeconds = (summary.completed - summary.started) / 1000;

        // add any test specific information that may have been captured by the test
        if (helper.testInfo) {
            summary.testInfo = helper.testInfo;
        }

        // send the status message
        var status = { event: 'jasmineDone', summary: summary, testRunsLeft: this.testRunsLeft - 1 };
        if (typeof this.window !== 'undefined') {
            this.window.webContents.send('receive-test-results', JSON.stringify(status));
        }

    };

}