// third party modules
var webdriver = require('selenium-webdriver');
var By = require('selenium-webdriver').By;
var chrome = require('selenium-webdriver/chrome');
var ie = require('selenium-webdriver/ie');

// logger
const logger = require('stamp-logger');
const logfile = 'stamp-helper\index.js';

// node and electron modules
var path = require('path');

/* --------------------------------------------- */
/* --------    module initialisation    -------- */
/* --------------------------------------------- */

// add the external drivers to the path
process.env.PATH += ';' + path.dirname(require('chromedriver').path);
process.env.PATH += ';' + path.dirname(require('iedriver').path);

// module level variables
var helper = {
    webdriverError: null
};

// handle unhandled webdriver exceptions
webdriver.promise.controlFlow().on('uncaughtException', (error) => {
    manageWebDriverException(error);
});

/* --------------------------------------------- */
/* --------       public functions      -------- */
/* --------------------------------------------- */

// stores options for use by the other functions
module.exports.init = function (test, config, window, browser, reporter) {
    helper.test = test;
    helper.config = config;
    helper.window = window;
    helper.browser = browser;
    helper.reporter = reporter;
    buildTestVariables();
    logger.debug('stamp-helper initialised', logfile);
};

// returns an instance of the current browser
module.exports.initBrowser = function () {
    if (helper.browser === 'Firefox') {
        logger.debug('Initalising a Firefox driver', logfile);
        return new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.firefox())
            .build();
    }
    else if (helper.browser === 'Chrome') {
        logger.debug('Initalising a Chrome driver', logfile);
        return new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.chrome())
            .build();
    }
    else if (helper.browser === 'Internet Explorer') {
        logger.debug('Initalising an Internet Explorer driver', logfile);
        var capabilities = webdriver.Capabilities.ie();
        capabilities.set('ignoreZoomSetting', helper.config.runner.browsers[2].capabilities.ignoreZoomSetting);
        capabilities.set('introduceFlakinessByIgnoringProtectedModeSettings', helper.config.runner.browsers[2].capabilities.introduceFlakinessByIgnoringProtectedModeSettings);
        return new webdriver.Builder()
            .withCapabilities(capabilities)
            .build();
    }
    else {
        helper.window.webContents.send('receive-test-error', helper.browser + ' is not a supported browser');
    }
};

// sends an error message to the client
module.exports.sendError = function (msg) {
    helper.window.webContents.send('receive-test-error', msg);
};

// return the test variables
module.exports.getTestVariables = function () {
    return helper.testVariables;
};

// checks if manual Content Server authentication is required
module.exports.checkCSAuthentication = function (browser, username, password) {

    return new Promise((resolve, reject) => {

        username = username || helper.testVariables.username;
        password = password || helper.testVariables.password;

        // check if we've got an OTDS sign in page
        browser.findElement(By.id('signin-submit'))
            .then((auth) => {
                browser.findElement(By.name('otds_username')).sendKeys(username);
                browser.findElement(By.name('otds_password')).sendKeys(password);
                auth.findElement(By.className('button')).click();
                logger.debug('Manual authentication completed', logfile);
                resolve();
            },
            (error) => {
                logger.debug('No authentication required.', logfile);
                resolve();
            });

        // handle other auth pages - if anyone ever needs them

    });

};

// checks if an element with the ID is on the page and returns a boolean
module.exports.idIsPresent = (browser, id) => {

    logger.debug('Checking if element is present by ID', logfile);
    try {
        if (browser.findElements(By.id(id)).length > 0) {
            logger.debug('Element is present', logfile);
            return true;
        }
        else {
            logger.debug('Element is not present', logfile);
            return false;
        }
    }
    catch (err) {
        logger.debug('Element is not present', logfile);
        return false;
    }

};

// adds a (hopefully) unique string to any supplied string
module.exports.generateUniqueName = (name) => {
    return name.trim() + ' ' + (new Date()).toLocaleString().replace(/[^a-zA-Z0-9.-]/g, '_');
};

// returns the webdriver error
module.exports.webdriverError = () => {
    return helper.webdriverError;
};

// resets the webdriver error message
module.exports.resetWebdriverError = () => {
    helper.webdriverError = null;
};

// pass through to the logger functions
module.exports.debug = logger.debug;
module.exports.info = logger.info;
module.exports.warn = logger.warn;
module.exports.error = logger.error;

/* --------------------------------------------- */
/* --------      private functions      -------- */
/* --------------------------------------------- */

// converts the selected variables array to dot notation values
function buildTestVariables() {

    helper.testVariables = {};
    if (helper.config.tests[helper.test].selectedVariables >= 0) {
        var variables = helper.config.tests[helper.test].testVariables[helper.config.tests[helper.test].selectedVariables].variables;
        variables.forEach((variable) => {
            helper.testVariables[variable.name] = variable.value;
        });
    }

}

// logs the webdriver error and sends it to the Jasmine reporter
function manageWebDriverException(error) {
    logger.error(error, logfile);
    helper.webdriverError = {
        name: error.name,
        message: error.toString()
    };
}
