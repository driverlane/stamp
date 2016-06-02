const gulp = require('gulp');
const del = require('del');
const runsequence = require('run-sequence');
const changed = require('gulp-changed');
const electronBuild = require('gulp-electron');
const winInstaller = require('electron-installer-squirrel-windows');

/* -------------- globals --------------- */

const release = require('../src/package.json');
var electronVersion = 'v0.37.8';
var platforms = ['win32-ia32'];

/* --------- 1. create packages --------- */

// clean the package folder
function cleanPackage() {
    return del(['./package/**']);
}
cleanPackage.description = 'Cleans the package folder of any generated content';
gulp.task('cleanPackage', cleanPackage);

// creates electron packages, downloads the appropriate version of Electron if it's not cached
function packageElectron() {
    return gulp.src('')
        .pipe(electronBuild({
            src: './src',
            packageJson: release,
            release: './package',
            cache: './cache',
            version: electronVersion,
            packaging: false,
            platforms: platforms,
            platformResources: {
                win: {
                    "version-string": release.version,
                    "file-version": release.version,
                    "product-version": release.version
                }
            }
        }))
        .pipe(gulp.dest(''));
}
packageElectron.description = 'Creates the Electron packages';
gulp.task('packageElectron', packageElectron);

// copies the cached node modules to the newly built Electron app
function packageNodeModules() {

    for (var platform of platforms) {
        var path = './package/' + electronVersion + '/' + platform + '/resources/node_modules/';
        gulp.src(['./cache/node_modules/**/*'])
            .pipe(changed(path))
            .pipe(gulp.dest(path));
    }
    return;
}
packageNodeModules.description = 'Copies the cached node modules to the Electron packages';
gulp.task('packageNodeModules', packageNodeModules);

// copies the project's internal node modules to the newly built Electron app
function packageCustomModules() {

    for (var platform of platforms) {
        var path = './package/' + electronVersion + '/' + platform + '/resources/node_modules/';
        gulp.src('./src/server/modules/**/*')
            .pipe(changed(path))
            .pipe(gulp.dest(path));
    }
    return;
}
packageCustomModules.description = 'Copies the custom modules to the Electron packages';
gulp.task('packageCustomModules', packageCustomModules);

// creates the package ready for creating installers
function buildPackage(done) {
    runsequence('cleanPackage', 'packageElectron', 'packageNodeModules', 'packageCustomModules', done);
}
buildPackage.description = 'Builds the Electron packages and adds the node modules';
gulp.task('buildPackage', buildPackage);

/* --------- 2. create installers --------- */

// clean the dist windows folder
function cleanWindowsDist() {
    return del(['./dist/win32-ia32/**']);
}
cleanWindowsDist.description = 'Cleans the dist folder of any generated content';
gulp.task('cleanWindowsDist', cleanWindowsDist);

// builds the Windows installer
function buildWindowsInstaller(done) {
    winInstaller({
        path: './package/' + electronVersion + '/win32-ia32',
        out: './dist/win32-ia32',
        authors: 'Mark Farrall',
        exe: 'stamp.exe',
        icon: './src/client/img/stamp.ico',
        description: 'User interface for webdriver based testing and timing'
    }, done);
}
buildWindowsInstaller.description = 'Builds the Windows installer';
gulp.task('buildWindowsInstaller', buildWindowsInstaller);

// build the installers
function buildInstallers(done) {
    runsequence('cleanWindowsDist', 'buildWindowsInstaller', done);
}
buildInstallers.description = 'Builds the installers';
gulp.task('buildInstallers', buildInstallers);

