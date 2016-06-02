(() => {
    'use strict';
    
    // node and electron modules
    const fs = require('fs');
    const remote = require('electron').remote;
    const app = remote.app;

    angular
        .module('resultsCache')
        .service('ResultsCacheService', ResultsCacheService);

    function ResultsCacheService() {

        this.getResults = getResults;
        this.writeResults = writeResults;

        var cachePath = app.getPath('appData') + '/stamp/results-cache.json';

        function getResults() {

            return new Promise((resolve, reject) => {
                fs.readFile(cachePath, 'utf8', (error, data) => {
                    if (error) {
                        
                        // ignore the error if it's a missing file
                        if (error.toString().indexOf('ENOENT') >= 0) {
                            resolve([]);
                        }
                        else {
                            reject(error);
                        }

                    }
                    else {
                        resolve(JSON.parse(data));
                    }
                });
            });

        }

        function writeResults(results) {

            return new Promise((resolve, reject) => {
                fs.writeFile(cachePath, JSON.stringify(results), {}, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(true);
                    }
                });
            });

        }

    }

})();