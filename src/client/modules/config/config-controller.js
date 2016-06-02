(() => {
    'use strict';

    // third party dependencies
    const mkdirp = require('mkdirp');

    // logging
    //const logger = require('stamp-logger');
    //const logfile = 'config-controller.js';

    // node and electron dependencies
    const fs = require('fs');
    const path = require('path');
    const ipcRenderer = require('electron').ipcRenderer;
    const shell = require('electron').shell;
    const remote = require('electron').remote;
    const app = remote.app;
    const dialog = remote.dialog;

    angular
        .module('config')
        .controller('ConfigController', configController);

    configController.$inject = ['$mdDialog', '$mdToast'];

    function configController($mdDialog, $mdToast) {

        /* --------------------------------------------- */
        /* --------        public objects       -------- */
        /* --------------------------------------------- */

        /* jshint validthis: true */
        var view = this;

        view.addTest = addTest;
        view.closeDialog = closeDialog;
        view.deleteTest = deleteTest;
        view.exportConfig = exportConfig;
        view.getPath = getPath;
        view.openLogs = openLogs;
        view.resetConfig = resetConfig;
        view.showHelp = showHelp;
        view.showIEConfig = showIEConfig;
        view.updateTest = updateTest;

        /* --------------------------------------------- */
        /* --------  controller initialisation  -------- */
        /* --------------------------------------------- */

        // request the config from the server
        ipcRenderer.send('get-config');

        /* --------------------------------------------- */
        /* --------      public functions       -------- */
        /* --------------------------------------------- */

        // adds a custom test to the app tests folder
        function addTest() {

            // get the new test config
            var testDefinition = createTestConfig(true);

            // exit if there's already a test with this name
            var exists = view.config.tests.filter((test) => {
                return test.name === testDefinition.name;
            }).length;
            if (exists > 0) {
                displayToast('A test with this name already exists. Either change the name or use the Update Test section.');
                return;
            }

            // copy the test
            copyTest(true)
                .then(() => {
                    displayToast('New test added');
                    view.testPath = null;
                    view.configPath = null;
                }, (error) => {
                    displayToast('Error copying the test: ' + error.message || error);
                });

        }

        // close the dialog and write the changes if required
        function closeDialog(write) {
            if (write) {
                ipcRenderer.send('write-config', view.config);
            }
            $mdDialog.hide();
        }

        // deletes a user test
        function deleteTest() {
            for (var i = 0; i < view.config.tests.length; i++) {
                if (view.config.tests[i].name === view.testToDelete) {
                    view.config.tests.splice(i, 1);
                    ipcRenderer.send('write-config', view.config);
                    displayToast('Test deleted');
                }
            }
        }

        // exports the name and testVariables from the selected test
        function exportConfig() {

            dialog.showSaveDialog({
                title: 'Choose the location for the new configuration file',
                defaultPath: app.getPath('home'),
                filters: [{ name: 'JavaScript', extensions: ['json'] }]
            }, (filename) => {

                // create the config to export
                var testConfig = getTestConfigByName(view.testToExport).test;
                var exportConfig = {};
                exportConfig.name = testConfig.name;
                exportConfig.testVariables = testConfig.testVariables;

                // write the file
                fs.writeFile(filename, JSON.stringify(exportConfig), {}, (error) => {
                    if (error) {
                        //logger.error('Error exporting a test config', logfile);
                        //logger.error(error, logfile);
                        displayToast('Error writing the config file: ' + error.message || error);
                    }
                    else {
                        //logger.debug('Config for ' + view.testToExport + ' exported', logfile);
                        app.testToExport = null;
                    }
                });

            });
        }

        // opens a file select dialog for the test file upload
        function getPath(target) {

            var path;
            if (target === 'test') {

                path = dialog.showOpenDialog({
                    title: 'Choose the test file',
                    defaultPath: app.getPath('home'),
                    filters: [{ name: 'JavaScript', extensions: ['js'] }],
                    properties: ['openFile']
                });
                view.testPath = path;

            }
            else if (target === 'config') {

                path = dialog.showOpenDialog({
                    title: 'Choose the test configuration file',
                    defaultPath: app.getPath('home'),
                    filters: [{ name: 'JavaScript', extensions: ['json'] }],
                    properties: ['openFile']
                });
                view.configPath = path;

            }

        }

        // opens the logs folder
        function openLogs() {
            var logPath = app.getPath('appData') + '/stamp/logs/client.log';
            shell.showItemInFolder(logPath);
        }

        // resets the config to the application defaultPath
        function resetConfig() {
            //logger.debug('User initiated reset of config', logfile);
            ipcRenderer.send('reset-config');
        }

        // opens the external help documentation
        function showHelp() {
            var url = view.config.client.helpUrl + 'settings.html';
            shell.openExternal(url);
        }

        // opens the external IE configuration documentation
        function showIEConfig() {
            shell.openExternal(view.config.client.ieConfigUrl);
        }

        // uploads a new test file and/or config file for a user test
        function updateTest() {

            // no test or config file
            if (!view.testPath && !view.configPath) {
                displayToast('Either a test file or config file is required to update the test');
                return;
            }

            // just the test file
            if (view.testPath !== null && !view.configPath) {
                copyTest(false)
                    .then(() => {
                        displayToast('Test file copied');
                        view.testPath = null;
                        view.configPath = null;
                        view.testToUpdate = null;
                        return;
                    }, (error) => {
                        displayToast('Error copying the test: ' + error.message || error);
                        return;
                    });
                    return;
            }

            // just the config file
            if (!view.testPath && view.configPath !== null) {
                updateTestConfig();
                displayToast('Configuration updated');
                view.testPath = null;
                view.configPath = null;
                view.testToUpdate = null;
                return;
            }

            // new test and config files
            if (view.testPath !== null && view.testConfig !== null) {
                copyTest(false)
                    .then(() => {
                        updateTestConfig();
                        displayToast('Test and configuration updated');
                        view.testPath = null;
                        view.configPath = null;
                        view.testToUpdate = null;
                        return;
                    }, (error) => {
                        displayToast('Error copying the test: ' + error.message || error);
                        return;
                    });
                    return;
            }

        }

        /* --------------------------------------------- */
        /* --------      private functions      -------- */
        /* --------------------------------------------- */

        // copies the new test to the users appData folder
        function copyTest(newTest) {

            return new Promise((resolve, reject) => {

                // copy the test
                var config = createTestConfig(newTest);
                var createDir = path.dirname(config.filePath);
                mkdirp(createDir, () => {

                    // copy the file
                    var stream = fs.createReadStream(view.testPath[0])
                        .pipe(fs.createWriteStream(config.filePath));
                    //logger.debug('Test file copied', logfile);

                    // update the config
                    stream.on('close', () => {

                        // add the test config to the master config if it's a new one
                        if (newTest) {
                            view.config.tests.push(config);
                            view.config.tests.sort((a, b) => {
                                return a.name.localeCompare(b.name);
                            });
                            ipcRenderer.send('write-config', view.config);
                            //logger.debug('New test details added to config', logfile);
                        }

                        resolve();

                    });

                    // handle a write error
                    stream.on('error', (error) => {
                        reject(error);
                    });

                });

            });

        }

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

        // creates a new test definition object
        function createTestConfig(newTest) {

            // get the user supplied config
            var userDefinition = {};
            if (view.configPath) {
                userDefinition = require(view.configPath[0]);
            }

            // build a new test config
            var testDefinition;
            if (newTest) {
                testDefinition = {};    
                testDefinition.core = false;
                var fileName = path.basename(view.testPath[0]);
                testDefinition.name = userDefinition.name || fileName.replace('.js', '');

                // add a date/time stamp to keep the filenames unique in the user appdata
                testDefinition.fileName = testDefinition.name + (new Date()).toLocaleString().replace(/[^a-zA-Z0-9.-]/g, '_') + '.js';
                testDefinition.filePath = app.getPath('appData') + '/stamp/tests/' + testDefinition.fileName;
            }

            // or retrieve an existing one
            else {
                testDefinition = getTestConfigByName(view.testToUpdate).test;
            }

            // add the environments data
            if (userDefinition.testVariables) {
                testDefinition.testVariables = userDefinition.testVariables;
                testDefinition.selectedVariables = 0;
            }

            return testDefinition;

        }

        // returns a test config by the test name
        function getTestConfigByName(name) {
            for (var i = 0; i < view.config.tests.length; i++) {
                if (view.config.tests[i].name === name) {
                    return {
                        test: view.config.tests[i],
                        id: i
                    };
                }
            }
        }

        // updates the config of an existing test object
        function updateTestConfig() {
            view.config.tests[getTestConfigByName(view.testToUpdate).id] = createTestConfig(false);
            //logger.debug('Existing test config updated', logfile);
        }

        /* --------------------------------------------- */
        /* -------- client/server ipc functions -------- */
        /* --------------------------------------------- */

        // update the local config when the server sends an updated config
        ipcRenderer.on('receive-config', (event, config) => {
            view.config = config;
            view.userTests = config.tests.filter((test) => {
                return test.core === false;
            });
        });

    }
})();