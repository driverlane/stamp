(() => {
    'use strict';

    var angular = require('angular');

    angular.module('app', [
        
        // npm installed modules
        require('angular-material', 'angular-animate'),
        
        // local modules
        'config', 'resultsCache', 'resultsHistory', 'status', 'testVariables'
    ]);
    
    // include module components
    require('./app-controller.js');

    // local modules
    require('../modules/config/config-module.js');
    require('../modules/results-cache/results-cache-module.js');
    require('../modules/results-history/results-history-module.js');
    require('../modules/status/status-module.js');
    require('../modules/test-variables/test-variables-module.js');
    
})();
