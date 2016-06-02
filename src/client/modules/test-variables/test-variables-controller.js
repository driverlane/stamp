(() => {
    'use strict';

    // logging
    //const logger = require('stamp-logger');
    //const logfile = 'test-variables-controller.js';

    // node and electron modules
    const ipcRenderer = require('electron').ipcRenderer;
    const shell = require('electron').shell;

    angular
        .module('testVariables')
        .controller('TestVariablesController', testVariablesController);

    testVariablesController.$inject = ['$mdDialog', '$mdToast'];

    function testVariablesController($mdDialog, $mdToast) {

        /* --------------------------------------------- */
        /* --------        public objects       -------- */
        /* --------------------------------------------- */

        /* jshint validthis: true */
        var view = this;

        view.closeDialog = closeDialog;
        view.createEnvironment = createEnvironment;
        view.deleteEnvironment = deleteEnvironment;
        view.environmentUpdate = environmentUpdate;
        view.renameEnvironment = renameEnvironment;
        view.saveAsEnvironment = saveAsEnvironment;
        view.showHelp = showHelp;

        view.oldEnvironment = 0;
        view.newEnvironment = null;
        view.newEnvironmentShow = false;

        /* --------------------------------------------- */
        /* ------------  controller globals  ----------- */
        /* --------------------------------------------- */

        var invalidControls = [];

        /* --------------------------------------------- */
        /* --------  controller initialisation  -------- */
        /* --------------------------------------------- */

        // request the config from the server
        ipcRenderer.send('get-config');

        /* --------------------------------------------- */
        /* --------      public functions       -------- */
        /* --------------------------------------------- */

        // close the dialog and write the changes if required
        function closeDialog(write) {
            if (write) {

                if (invalidControls.length > 0) {
                    displayToast("Please fix errors before saving changes.");
                    return;
                }
                ipcRenderer.send('write-config', view.config);
            }
            $mdDialog.hide();
        }

        // copies the values from one set of test variables to a new set
        function createEnvironment() {

            // check we've got a new name
            if (!view.newEnvironment) {
                displayToast('Please populate enter a new environment name.');
                return;
            }

            // check the new name doesn't already exist
            if (environmentNameExists(view.newEnvironment)) {
                displayToast('That name is already used. Please choose a new environment name.');
                return;
            }

            // copy the environment
            view.config.tests[view.selectedTest].testVariables.push({
                name: view.newEnvironment,
                variables: JSON.parse(JSON.stringify(view.config.tests[view.selectedTest].testVariables[view.oldEnvironment].variables))
            });
            view.oldEnvironment = 0;
            view.newEnvironment = null;
            displayToast('Environment created');

        }

        // deletes an existing set of test variables
        function deleteEnvironment(index) {

            // don't delete the last environment
            if (view.config.tests[view.selectedTest].testVariables.length === 1) {
                displayToast("You can't delete the last environment");
                return;
            }

            view.config.tests[view.selectedTest].testVariables.splice(index, 1);
            displayToast('Environment deleted');
        }

        // renames or copies the current set of testVariables
        function environmentUpdate(takeAction, index) {

            if (takeAction) {
                if (view.newEnvironmentAction === 'rename') {
                    if (environmentNameExists(view.newEnvironment)) {
                        displayToast('That name is already used. Please choose a new environment name.');
                        return;
                    }
                    view.config.tests[view.selectedTest].testVariables[index].name = view.newEnvironment;
                }
                else if (view.newEnvironmentAction === 'copy') {
                    view.oldEnvironment = index;
                    createEnvironment();
                }
            }

            view.newEnvironmentAction = null;
            view.newEnvironmentShow = false;
            view.newEnvironment = null;

        }

        // renames an existing set of test variables
        function renameEnvironment() {
            view.newEnvironmentShow = true;
            view.newEnvironmentAction = 'rename';
        }

        // copies the current environment as a new one
        function saveAsEnvironment() {
            view.newEnvironmentShow = true;
            view.newEnvironmentAction = 'copy';
        }

        // opens the external help documentation
        function showHelp() {
            var url = view.config.client.helpUrl + 'variables.html';
            shell.openExternal(url);
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

        // determines if an environment name is already used
        function environmentNameExists(name) {

            var existing = view.config.tests[view.selectedTest].testVariables.filter((env) => {
                return env.name === name;
            }).length;
            if (existing > 0) {
                return true;
            }
            else {
                return false;
            }

        }

        /* --------------------------------------------- */
        /* -------- client/server ipc functions -------- */
        /* --------------------------------------------- */

        // update the local config when the server sends an updated config
        ipcRenderer.on('receive-config', (event, config) => {
            view.config = config;
        });

    }
})();