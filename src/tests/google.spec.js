/*  --------------------------------------------------------------------------------
    Version history
    --------------------------------------------------------------------------------
    0.0.1 - initial version February 2016 Mark Farrall
    --------------------------------------------------------------------------------  */

var selenium = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until;

var helper = require('stamp-helper');
helper.testInfo = {};
var browser;

// the test suite
/* ---------------------------------------------------------------------------------------- */

describe('Google search page testing', function () {

    beforeEach(function () {
        browser = helper.initBrowser();
    });

    afterEach(function (done) {
        browser.quit()
        .then(done);
    });

    it('should have a search button', function (done) {

        browser.get('https://www.google.com/');
        var element = browser.findElement(By.name('btnK'));
        element.getAttribute('value').then(function (value) {
            expect(value).toContain('Google Search');
            done();
        });

    });

    it('should find results', function () {
        browser.get('https://www.google.com');
        browser.findElement(By.name('q'))
            .sendKeys('testy');
        browser.findElement(By.name('btnG')).click();
        browser.wait(until.titleIs('testy - Google Search'));
        expect(browser.findElement(By.id('resultStats')).getText()).not.toBeUndefined();
    });

});
