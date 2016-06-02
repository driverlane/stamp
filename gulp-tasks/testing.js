const gulp = require('gulp');
const jshint = require('gulp-jshint');
const jsHintOptions = require('../jshint.json');

// lint the scripts
function lint() {
    return gulp.src(['./src/**/*.js', './*.js'])
        .pipe(jshint(jsHintOptions))
        .pipe(jshint.reporter('default'));
}
lint.description = 'Lints the JavaScript files';
gulp.task('lint', lint);

// TODO: add some unit testing

// TODO: add some system testing with protractor