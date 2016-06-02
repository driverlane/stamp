// third party modules
const mkdirp = require('mkdirp');
const del = require('del');

// logger
const logger = require('stamp-logger');
const logfile = 'server.js';

// node and electron modules
const ipc = require('electron').ipcMain;
const app = require('app');
const fs = require('fs');

// local modules
const runner = require('stamp-runner');

// module variables
var rendererWindow;
var configPath = app.getPath('appData') + '/stamp/config.json';
var masterConfigPath = app.getAppPath() + '/server/config.json';
var serverConfig = null;

// server initialisation
function init(mainWindow) {
    rendererWindow = mainWindow;
    if (!serverConfig) {
        readConfig()
            .then((result) => {
                logger.configure(result, true);
            });
    }
    else {
        logger.configure(serverConfig, true);
    }
}

// read the config file into the serverConfig object
function readConfig() {

    return new Promise((resolve, reject) => {
        fs.readFile(configPath, 'utf8', (error, data) => {
            if (error) {
                resetConfig()
                    .then((result) => {
                        resolve(result);
                    });
            }
            else {
                if (data === 'null') {
                    resetConfig()
                        .then((result) => {
                            resolve(result);
                        });
                }
                else {
                    serverConfig = JSON.parse(data);
                    resolve(serverConfig);
                }
            }
        });
    });
}

// reset the config by copying the master config
function resetConfig() {

    return new Promise((resolve, reject) => {
        fs.readFile(masterConfigPath, 'utf8', (error, data) => {
            if (error) {
                reject(error);
            }
            else {
                serverConfig = JSON.parse(data);
                resolve(serverConfig);
            }
        });
    });
}

// save the global config
function writeConfig() {
    return new Promise((resolve, reject) => {
        fs.writeFile(configPath, JSON.stringify(serverConfig), (error, data) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(serverConfig);
            }
        });
    });
}

// run a test when asked by the renderer
// args is the index number of the tests array to run
ipc.on('run-test', (event, args) => {

    logger.debug('Received request from client to run test:  ' + serverConfig.tests[args].name, logfile);

    // get the details for the chosen test
    var testPath = serverConfig.tests[args].filePath || app.getAppPath() + '/tests/' + serverConfig.tests[args].fileName;

    // check if the test file exists and create the testing folder
    var targetDir = app.getAppPath() + '/testing';
    var targetPath = targetDir + '/test.spec.js';
    if (fs.existsSync(testPath)) {

        mkdirp(targetDir, () => {
            del([targetPath])
                .then(() => {

                    // copy the file to the testing area
                    var stream = fs.createReadStream(testPath)
                        .pipe(fs.createWriteStream(targetPath));

                    // when the file is copied, pass the options to the runner and execute
                    stream.on('close', () => {
                        logger.debug('Sending request to stamp-runner to execute test:  ' + serverConfig.tests[args].name, logfile);
                        runner.init(args, serverConfig, rendererWindow);
                        runner.execute();
                    });

                });
        });
    }
    else {
        event.sender.send('receive-test-error', 'Test file does not exist.');
        return;
    }

});

// lists the current test specs
ipc.on('get-config', (event, args) => {

    if (serverConfig === null) {
        readConfig()
            .then(() => {
                event.sender.send('receive-config', serverConfig);
            })
            .catch((error) => {
                event.sender.send('receive-config', { error: error });
            });
    }
    else {
        event.sender.send('receive-config', serverConfig);
    }

});

// updates the client specs
ipc.on('write-config', (event, args) => {

    // update the config object
    serverConfig = args;

    // update the logger
    logger.configure(args, true);

    // write the file
    writeConfig()
        .then((result) => {
            event.sender.send('receive-config', serverConfig);
        })
        .catch((error) => {
            rendererWindow.webContents.send('receive-test-error', 'Error writing configuration: ' + (error.message || error));
        });

});

// resets the config upon client request
ipc.on('reset-config', (event) => {
    logger.debug('Received request to reset the config', logfile);
    resetConfig()
        .then((result) => {
            event.sender.send('receive-config', serverConfig);
        });
});

// using IPC instead of an angular solution
ipc.on('testing-cancelled', () => {
    rendererWindow.webContents.send('testing-cancelled');
});

// using IPC instead of an angular solution
ipc.on('testing-complete', (event, message) => {
    rendererWindow.webContents.send('testing-complete', message);
});

exports.init = init;