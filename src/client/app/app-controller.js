(() => {
    'use strict';

    // logging
    //const logger = require('stamp-logger');
    //const logfile = 'app-controller.js';

    // node and electron modules
    const fs = require('fs');
    const ipcRenderer = require('electron').ipcRenderer;
    const shell = require('electron').shell;
    const remote = require('electron').remote;
    const app = remote.app;
    const dialog = remote.dialog;

    angular
        .module('app')
        .controller('AppController', appController);

    appController.$inject = ['$mdToast', '$mdDialog', 'ResultsCacheService', 'ResultsHistoryService'];

    function appController($mdToast, $mdDialog, ResultsCacheService, ResultsHistoryService) {

        /* --------------------------------------------- */
        /* --------        public objects       -------- */
        /* --------------------------------------------- */

        /* jshint validthis: true */
        var view = this;

        view.clearRow = clearRow;
        view.closeDialog = closeDialog;
        view.exportSavedTests = exportSavedTests;
        view.runTest = runTest;
        view.saveRow = saveRow;
        view.setTestIndex = setTestIndex;
        view.showHelp = showHelp;
        view.showSettings = showSettings;
        view.showStackTrace = showStackTrace;
        view.showVariables = showVariables;
        view.quitApp = quitApp;
        view.writeConfig = writeConfig;

        view.test = '';
        view.cache = [];
        view.history = [];
        view.testingCancelled = false;

        view.resultsTemplate = './app/jasmine-results.html';
        view.failedResultsTemplate = './app/jasmine-results-failed.html';
        view.allResultsTemplate = './app/jasmine-results-all.html';

        /* --------------------------------------------- */
        /* --------  controller initialisation  -------- */
        /* --------------------------------------------- */

        // get the results collections
        refreshCache();
        refreshHistory();

        // retrieve the config from the server and listen for updates
        ipcRenderer.send('get-config');
        ipcRenderer.on('receive-config', (event, config) => {
            view.config = config;
            //logger.configure(config, false);
        });


        /* --------------------------------------------- */
        /* --------      public functions       -------- */
        /* --------------------------------------------- */

        // removes a result from the appropriate results array
        function clearRow(row, doc) {

            if (typeof doc._id !== 'undefined') {
                view.history.splice(row, 1);
                ResultsHistoryService.removeResult(doc).catch((error) => {
                    displayToast(error.message);
                    refreshHistory();
                });
            }
            else {
                view.cache.splice(row, 1);
                ResultsCacheService.writeResults(view.cache).catch((error) => {
                    displayToast(error.message);
                    refreshCache();
                });
            }

        }

        // hides the active dialog
        function closeDialog() {
            $mdDialog.hide();
        }

        // exports all the saved tests
        function exportSavedTests() {

            dialog.showSaveDialog({
                title: 'Choose the location for the exported data',
                defaultPath: app.getPath('home'),
                filters: [{ name: 'CSV', extensions: ['csv'] }]
            }, (filename) => {

                // set up the CSV export with flattened test data 
                const json2csv = require('json2csv');
                var options = view.config.client.exportOptions;
                options.data = flattenTests(view.history);

                // get the CSV data and write it to disk
                json2csv(options, (error, data) => {
                    if (error) {
                        //logger.error(error, logfile);
                    }
                    else {
                        fs.writeFile(filename, data, (error) => {
                            if (error) {
                                //logger.error(error, logfile);
                                displayToast('Error exporting tests: ' + error.message || error);
                            }
                            else {
                                displayToast('Tests exported');
                            }
                        });
                    }
                });

            });

        }

        // runs the selected test
        function runTest() {

            // check they've selected a test to run
            if (view.testIndex === null) {
                displayToast('Please pick a test');
                return;
            }

            // change to the current tests tab
            view.selectedTab = 0;

            // send the request to the server to run the test
            view.testingCancelled = false;
            //logger.debug('Asking server to run a test: ' + view.test, logfile);
            ipcRenderer.send('run-test', view.testIndex);

            // show the status dialog
            $mdDialog.show({
                controller: 'StatusController',
                controllerAs: 'app',
                templateUrl: './modules/status/status.html',
                parent: angular.element(document.body),
                clickOutsideToClose: false,
                fullscreen: true
            });

        }

        // removes a result from the results array
        function saveRow(row) {

            ResultsHistoryService.addResult(view.cache[row]).then((response) => {
                refreshHistory();
                clearRow(row, view.cache[row]);
            }).catch((error) => {
                displayToast(error.message);
            });

        }

        // sets testIndex to the index in the tests array of the current test
        function setTestIndex() {
            for (var i = 0; i < view.config.tests.length; i++) {
                if (view.config.tests[i].name === view.test) {
                    view.testIndex = i;
                }
            }
        }

        // opens the external help documentation
        function showHelp() {
            shell.openExternal(view.config.client.helpUrl);
        }

        // opens the settings window
        function showSettings() {

            $mdDialog.show({
                controller: 'ConfigController',
                controllerAs: 'app',
                bindToController: true,
                templateUrl: './modules/config/config.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: false,
                fullscreen: true
            });

        }

        // displays the stack trace in a dialog
        function showStackTrace(event, stack) {

            $mdDialog.show({
                controller: appController,
                controllerAs: 'app',
                bindToController: true,
                locals: { stack: stack },
                templateUrl: './app/stack-trace.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true,
                fullscreen: true
            });

        }

        // shows the variables dialog
        function showVariables() {

            $mdDialog.show({
                controller: 'TestVariablesController',
                controllerAs: 'app',
                locals: { selectedTest: view.testIndex },
                bindToController: true,
                templateUrl: './modules/test-variables/test-variables.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: false,
                fullscreen: true
            });

        }

        // quits the application
        function quitApp() {
            ipcRenderer.send('quit-app');
        }

        // gets the server to save the client config
        function writeConfig() {
            ipcRenderer.send('write-config', view.config);
        }

        /* --------------------------------------------- */
        /* --------      private functions      -------- */
        /* --------------------------------------------- */

        // displays a simple toast
        function displayToast(msg, length) {

            if (isNaN(length)) {
                length = 3000;
            }

            $mdToast.show({
                template: '<md-toast class="md-toast">' + msg + '</md-toast>',
                hideDelay: length,
                position: 'bottom right'
            });

        }

        // flattens any specs in a suite
        function flattenSuite(suite) {

            var specs = [];

            // flatten the specs in this suite
            for (var i = 0; i < suite.specs.length; i++) {

                var flat = {
                    suiteCompleted: suite.completed,
                    suiteDescription: suite.description,
                    suiteFullName: suite.fullName,
                    suiteId: suite.id,
                    suiteStarted: suite.started,
                    suiteStatus: suite.status,
                    specCompleted: suite.specs[i].completed,
                    specDescription: suite.specs[i].description,
                    specFullName: suite.specs[i].fullName,
                    specId: suite.specs[i].id,
                    specPendingReason: suite.specs[i].pendingReason,
                    specStarted: suite.specs[i].started,
                    specStatus: suite.specs[i].status,
                    specTotalSeconds: suite.specs[i].totalSeconds,
                };
                specs.push(flat);

            }

            // flatten any suites in this suite
            for (var s = 0; s < suite.suites.length; s++) {
                var newSpecs = flattenSuite(suite.suites[s]);
                for (var n = 0; n < newSpecs.length; n++) {
                    specs.push(newSpecs[n]);
                }
            }

            return specs;

        }

        // flattens the suites and specs array so that all objects are available on the one line
        function flattenTests(tests) {

            var specs = [];
            
            // iterate the tests and first level suites
            for (var i = 0; i < tests.length; i++) {
                for (var s = 0; s < tests[i].suites.length; s++) {

                    // get the flattened specs for this suite
                    var newSpecs = flattenSuite(tests[i].suites[s]);

                    // add the test details and push to the specs array
                    for (var n = 0; n < newSpecs.length; n++) {
                        newSpecs[n].testName = tests[i].testName;
                        newSpecs[n].browser = tests[i].browser;
                        newSpecs[n].environment = tests[i].environment;
                        newSpecs[n].testStarted = tests[i].started;
                        newSpecs[n].testCompleted = tests[i].completed;
                        newSpecs[n].testTotalSeconds = tests[i].totalSeconds;
                        specs.push(newSpecs[n]);
                    }
                }
            }
            return specs;

        }

        // updates the view copy of the results cache collection
        function refreshCache() {
            ResultsCacheService.getResults()
                .then((results) => {
                    view.cache = results;
                })
                .catch((error) => {
                    displayToast(error.message);
                });
        }

        // updates the view copy of the results history collection
        function refreshHistory() {
            ResultsHistoryService.getResults().then((results) => {
                view.history = results;
            }).catch((error) => {
                displayToast(error.message);
            });
        }

        /* --------------------------------------------- */
        /* -------- client/server ipc functions -------- */
        /* --------------------------------------------- */

        // shows an error
        ipcRenderer.on('receive-test-error', (event, error) => {
            displayToast(error.message || error);
        });

        // shows the text in the browser console
        ipcRenderer.on('receive-test-debug', (event, msg) => {
            console.log(msg);
        });

        // received notification that a test was cancelled
        ipcRenderer.on('testing-cancelled', (event) => {
            view.testingCancelled = true;
        });

        // save the test details
        ipcRenderer.on('testing-complete', (event, message) => {

            if (!view.testingCancelled) {

                // update the cache
                if (!view.cache) {
                    view.cache = [message.summary];
                }
                else {

                    // check it's unique - jasmine is a bit chatty
                    for (var i = 0; i < view.cache.length; i++) {
                        if (view.cache[i].started === message.summary.started) {
                            return;
                        }
                    }
                    console.log(message);
                    view.cache.unshift(message.summary);

                }

                // write the results cache
                ResultsCacheService.writeResults(view.cache)
                    .then(() => {
                    })
                    .catch((error) => {
                        displayToast(error.message);
                    });

            }

        });

    }

})();
