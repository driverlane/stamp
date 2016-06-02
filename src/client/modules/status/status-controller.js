(() => {
    'use strict';

    // logging
    //const logger = require('stamp-logger');
    //const logfile = 'config-controller.js';

    // node and electron dependencies
    const ipcRenderer = require('electron').ipcRenderer;

    angular
        .module('status')
        .controller('StatusController', statusController);

    statusController.$inject = ['$mdToast', '$mdDialog', '$scope'];

    function statusController($mdToast, $mdDialog, $scope) {

        /* --------------------------------------------- */
        /* --------        public objects       -------- */
        /* --------------------------------------------- */

        /* jshint validthis: true */
        var view = this;
        view.cancelTesting = cancelTesting;

        view.testRunning = true;
        view.testRunningText = 'Tests running. ';
        view.status = view.testRunningText + 'Results: ';

        /* --------------------------------------------- */
        /* --------      public functions       -------- */
        /* --------------------------------------------- */

        // close the dialog and write the changes if required
        function cancelTesting() {
           //logger.info('Testing cancelled by the user', logfile);
            ipcRenderer.send('testing-cancelled');
            $mdDialog.hide();
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

        /* --------------------------------------------- */
        /* -------- client/server ipc functions -------- */
        /* --------------------------------------------- */

        // displays the test results
        ipcRenderer.on('receive-test-results', (event, results) => {

            // split them if we've got more than one message
            var messages = [];
            if (results.indexOf('}\n{') > 0) {
                messages = results.replace('}\n{', '}*~*{').split('*~*');
            }
            else {
                messages.push(results);
            }

            // process the messages
            messages.forEach((message) => {

                try {
                    message = JSON.parse(message);
                }
                catch (e) {
                    displayToast(e.message);
                }

                // if Jasmine is finished send the message to the app and close the dialog
                if (message.event === 'jasmineDone') {
                    ipcRenderer.send('testing-complete', message);
                    if (message.testRunsLeft === 0) {
                        view.testRunning = false;
                        view.status = view.status.replace(view.testRunningText, '');
                        setTimeout(() => { $mdDialog.hide(); }, 1500);
                    }
                }

                // update the status if it's a completed spec
                else if (message.event === 'specDone') {

                    if (message.details.failedExpectations.length > 0) {
                        view.status = view.status + ' N ';
                    }
                    else {
                        view.status = view.status + ' Y ';
                    }

                }

                // update the model
                $scope.$apply();

            });
        });

    }
})();