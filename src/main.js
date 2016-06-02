// electron & node modules
var app = require('app');
var BrowserWindow = require('browser-window');
var ipcMain = require('electron').ipcMain;

// load the server module for interaction with the client
var server = require(app.getAppPath() + '/server/server.js');

// global window reference - stops the window being automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// quit the application
ipcMain.on('quit-app', function (event, args) {
    app.quit();
});

// quit when all windows are closed.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// app events
app.on('ready', function () {

    // start the renderer
    var path = require('path');
    var fs = require('fs');
    var windowConfigPath = path.join(app.getPath('appData'), '/stamp/main-window.json');
    var windowConfig;

    // get the config
    try {
        windowConfig = JSON.parse(fs.readFileSync(windowConfigPath, 'utf8'));
    }
    catch (e) {
        windowConfig = { width: 1000, height: 800 };
    }
	
    // open the main window and load the view
    mainWindow = new BrowserWindow(windowConfig);
    mainWindow.setAutoHideMenuBar(true);
    mainWindow.setMenuBarVisibility(false);
    if (windowConfig.maximised) {
        mainWindow.maximize();
    }
    if (windowConfig.minimised) {
        mainWindow.minimize();
    }
    mainWindow.loadURL(app.getAppPath() + '/client/index.html');
    
    // start the server initialisation
    server.init(mainWindow);

    // track the main window position
    mainWindow.on('maximize', function () {
        updatePosition();
    });
    mainWindow.on('unmaximize', function () {
        updatePosition();
    });
    mainWindow.on('minimize', function () {
        updatePosition();
    });
    mainWindow.on('restore', function () {
        updatePosition();
    });
    mainWindow.on('resize', function () {
        updatePosition();
    });
    mainWindow.on('move', function () {
        updatePosition();
    });
    mainWindow.on('enter-full-screen', function () {
        updatePosition();
    });
    mainWindow.on('leave-full-screen', function () {
        updatePosition();
    });

    // clean up the global window object when the window is closed.
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
	
    // record the change in main window position
    function updatePosition() {
		
        // get the current settings
        var getBounds = true;
        if (mainWindow.isMaximized() || mainWindow.isMinimized() || mainWindow.isFullScreen()) {
            getBounds = false;
        }
        if (getBounds) {
            windowConfig = mainWindow.getBounds();
        }
        windowConfig.maximised = mainWindow.isMaximized();
        windowConfig.minimised = mainWindow.isMinimized();
        windowConfig.fullscreen = mainWindow.isFullScreen();
		
        // write to the file
        try {
            fs.writeFileSync(windowConfigPath, JSON.stringify(windowConfig));
        }
        catch (e) {
            mainWindow.webContents.send('receive-test-error', 'Error writing configuration: ' + e.message);
        }

    }

});
