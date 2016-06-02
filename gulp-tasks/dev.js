const gulp = require('gulp');

const changed = require('gulp-changed');
const del = require('del');
const electron = require('electron-connect').server.create({
    path: "stage",
    verbose: true
});
const gulpif = require('gulp-if');
const htmlreplace = require('gulp-html-replace');
const livereload = require('gulp-livereload');
const runsequence = require('run-sequence');
const todolist = require('gulp-todo');

/* -------------- globals --------------- */

var develop = false;
var build = true;

/* ----------- staging tasks ------------ */

// clean out the staging folder
function cleanstage(done) {
    del(['./stage/**/*'])
        .then(function () {
            done();
        });
}
cleanstage.description = 'Cleans generated content out of the stage folder';
gulp.task('cleanstage', cleanstage);

// clean out any custom node modules
function cleanmodules(done) {
    del(['./node_modules/stamp-*/'])
        .then(function () {
            done();
        });
}
cleanmodules.description = 'Cleans project modules out of the node_modules folder';
gulp.task('cleanmodules', cleanmodules);

// clean out folders windows struggles with
function cleanfinal(done) {
    del(['./node_modules/', './cache/node_modules/'])
        .then(function () {
            done();
        });
}
cleanfinal.description = 'Cleans folders too deep for Windows to delete';
gulp.task('cleanfinal', cleanfinal);

// stage the first level files
function core() {
    gulp.src('./src/*.*')
        .pipe(changed('./stage/'))
        .pipe(gulp.dest('./stage/'));
}
core.description = 'Stages the core files';
gulp.task('core', core);

// stage the renderer index HTML file
function index() {
    gulp.src('./src/client/index.html')
        .pipe(gulpif(develop, htmlreplace({
            'livereload': 'http://localhost:35729/livereload.js'
        })))
        .pipe(gulpif(build, htmlreplace({})))
        .pipe(gulp.dest('./stage/client/'))
        .pipe(gulpif(develop, livereload()));
}
index.description = 'Stages index.html, inserting livereload if needed';
gulp.task('index', index);

// stage the remainging client files
function client() {
    gulp.src(['./src/client/**/*.*', '!./src/client/index.html'])
        .pipe(changed('./stage/client/'))
        .pipe(gulp.dest('./stage/client/'))
        .pipe(gulpif(develop, livereload()));
}
client.description = 'Stages the remaining client files';
gulp.task('client', client);

// stage the server files
function server() {
    gulp.src('./src/server/*.*')
        .pipe(changed('./stage/server/'))
        .pipe(gulp.dest('./stage/server/'));
}
server.description = 'Stages the server files';
gulp.task('server', server);

// stage the test files
function tests() {
    gulp.src('./src/tests/*.*')
        .pipe(changed('./stage/tests/'))
        .pipe(gulp.dest('./stage/tests/'));
}
tests.description = 'Stages the test files';
gulp.task('tests', tests);

// copy any custom modules to the modules folder
function modules() {
    gulp.src('./src/server/modules/**/*')
        .pipe(changed('./node_modules/'))
        .pipe(gulp.dest('./node_modules/'));
}
modules.description = 'Copies the project modules to the node_modules folder';
gulp.task('modules', modules);

// all the tasks to populate the stage folder
function stage() {
    return;
}
stage.description = 'Stages all files';
gulp.task('stage', ['core', 'index', 'client', 'server', 'tests', 'modules'], stage);

/* ------------- dev tasks -------------- */

// restarts Electron
function restart(done) {
    if (develop) {
        electron.restart();
        done();
    }
}
restart.description = 'Restarts Electron';
gulp.task('restart', ['server'], restart);

// start Electron and watch for changes
function watch() {

    // set up for development
    electron.start();
    livereload.listen();
  
    // watch stuff
    gulp.watch(['./src/*.*'], ['core', 'restart']);
    gulp.watch(['./src/server/*.js'], ['lint', 'server', 'restart']);
    gulp.watch(['./src/server/*.json)'], ['server', 'restart']);
    gulp.watch(['./src/server/modules/**/*'], ['lint', 'modules', 'restart']);
    gulp.watch(['./src/client/index.html'], ['index']);
    gulp.watch(['./src/client/**/*.js'], ['lint', 'client']);
    gulp.watch(['./src/client/**/!(*.js)'], ['client']);
    gulp.watch(['./src/tests/**/*'], ['lint', 'tests']);

}
watch.description = 'Starts Electron and watches for changes';
gulp.task('watch', watch);

// start the app
function defaultTask(done) {
    build = false;
    develop = true;
    runsequence('cleanstage', 'cleanmodules', 'stage', 'watch', done);
}
defaultTask.description = 'Default development start task';
gulp.task('default', defaultTask);

// get a list of todo comments in JavaScript files
function todo() {
    gulp.src(['./{gulp-tasks,src}/**/*.js', './gulpfile.js'])
        .pipe(todolist())
        .pipe(gulp.dest('./'));
}
todo.description = 'Adds all todo comments from code to TODO.md';
gulp.task('todo', todo);

