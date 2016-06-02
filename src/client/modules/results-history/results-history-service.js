(() => {
    'use strict';

    // third party modules
    var db = new PouchDB('resultsHistory', { adapter: 'websql' });

    angular
        .module('resultsHistory')
        .service('ResultsHistoryService', ResultsHistoryService);

    function ResultsHistoryService() {

        this.getResults = getResults;
        this.addResult = addResult;
        this.removeResult = removeResult;

        function getResults() {

            return new Promise((resolve, reject) => {

                function map(doc) {
                    emit([doc.started]);
                }
                db.query(map, { descending: true, include_docs: true }).then((response) => {
                    var results = [];
                    response.rows.forEach((result) => {
                        results.push(result.doc);
                    });
                    resolve(results);
                }).catch((error) => {
                    reject(error);
                });

            });

        }

        function addResult(result) {

            return new Promise((resolve, reject) => {

                db.post(result).then((response) => {
                    resolve(response);
                }).catch((error) => {
                    reject(error);
                });

            });
        }

        function removeResult(doc, options) {

            return new Promise((resolve, reject) => {

                db.remove(doc, options).then((response) => {
                    resolve(response);
                }).catch((error) => {
                    reject(error);
                });

            });
        }
    }

})();