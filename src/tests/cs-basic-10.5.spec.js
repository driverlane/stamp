/*  --------------------------------------------------------------------------------
    Version history
    --------------------------------------------------------------------------------
    0.0.1 - initial version February 2016 Mark Farrall
    --------------------------------------------------------------------------------  */

var selenium = require('selenium-webdriver');
var By = require('selenium-webdriver').By;
var until = require('selenium-webdriver').until;
var helper = require('stamp-helper');

// global test variables
var browser, docXpath;
var testVariables = helper.getTestVariables();
helper.testInfo = {};

// the test suite
/* ---------------------------------------------------------------------------------------- */

describe('Content Server 10.5 basics', function () {

    beforeEach(function () {
        browser = helper.initBrowser();
    });

    afterEach(function (done) {
        browser.quit().then(done);
    });

    it('should be CS 10.5', function (done) {

        var aboutUrl = testVariables.baseUrl + '?func=ll.index';
        browser.get(aboutUrl);
        helper.checkCSAuthentication(browser);

        // wait for redirect (for drivers that don't handle this implicitly - I'm looking at you IE)
        browser.wait(until.elementLocated(By.className('copyright')), 30000);

        var element = browser.findElement(By.className('copyright'));
        element.getText().then(function (text) {
            helper.testInfo.csVersion = text.substring(text.indexOf('version') + 8, text.indexOf('Copyright') - 2);
            expect(text).toContain('Content Server version 10.5');
            done();
        });

    });

    it('should access the Enterprise workspace', function (done) {

        var entepriseUrl = testVariables.baseUrl + '?func=llworkspace';
        browser.get(entepriseUrl);
        helper.checkCSAuthentication(browser);

        // wait for redirect (for drivers that don't handle this implicitly - I'm looking at you IE)
        browser.wait(until.elementLocated(By.className('pageTitleIcon')), 30000);

        var element = browser.findElement(By.className('pageTitleIcon'));
        element = element.findElement(By.tagName('img'));
        element.getAttribute('title').then(function (att) {
            expect(att).toEqual('Enterprise Workspace');
            done();
        });

    });

    it('should add a document', function (done) {

        var docName = helper.generateUniqueName('stamp document');
        docXpath = "//*[@tnode='" + docName + "']";
        var folderUrl = testVariables.baseUrl + '/open/' + testVariables.testFolderId;
        browser.get(folderUrl);
        helper.checkCSAuthentication(browser);

        // wait for redirect (for drivers that don't handle this implicitly - I'm looking at you IE)
        browser.wait(until.elementLocated(By.xpath('//*[@id="tAddItemPane"]/div[1]/div[2]/a')), 30000);

        browser.findElement(By.xpath('//*[@id="tAddItemPane"]/div[1]/div[2]/a')).click();
        browser.findElement(By.id('versionFile')).sendKeys(testVariables.testFilePath);
        browser.findElement(By.id('name')).clear();
        browser.findElement(By.id('name')).sendKeys(docName);

        if (browser.findElements(By.id('addButton')).length > 0) {
            helper.debug('Found the add button, using a standard document add page.');
            browser.findElement(By.id('addButton')).click();
        }
        else {
            helper.debug('Found the finish button, using a document wizard page.');
            browser.findElement(By.id('FinishButton')).click();
        }

        // wait for redirect (for drivers that don't handle this implicitly - I'm looking at you IE)
        browser.wait(until.elementLocated(By.xpath(docXpath)), 30000);

        // see if we've got the new document
        browser.findElements(By.xpath(docXpath)).then(function (elements) {
            expect(elements.length).toEqual(1);
            done();
        });

    });

    it('should delete a document', function (done) {

        var folderUrl = testVariables.baseUrl + '/open/' + testVariables.testFolderId;
        browser.get(folderUrl);
        helper.checkCSAuthentication(browser);

        // wait for redirect (for drivers that don't handle this implicitly - I'm looking at you IE)
        browser.wait(until.elementLocated(By.xpath(docXpath)), 30000);

        var row = browser.findElement(By.xpath(docXpath));
        row.findElement(By.css('input[type="checkbox"]')).click();
        browser.findElement(By.name('Delete')).click();
        browser.findElement(By.id('deleteButton')).click();
        browser.findElement(By.id('okButton')).click();
        
        browser.findElements(By.xpath(docXpath)).then(function (elements) {
            expect(elements.length).toEqual(0);
            done();
        });
    });

    it('should return search results', function () {

        var folderUrl = testVariables.baseUrl + '/open/' + testVariables.testFolderId;
        browser.get(folderUrl);
        helper.checkCSAuthentication(browser);

        // wait for redirect (for drivers that don't handle this implicitly - I'm looking at you IE)
        browser.wait(until.elementLocated(By.id('fulltextwhere1')), 30000);

        browser.findElement(By.id('fulltextwhere1')).sendKeys(testVariables.searchTerm);
        browser.findElement(By.id('fulltextsubmitButton')).click();
        browser.wait(until.titleIs('Content Server - Result Page'), 30000);        
        expect(browser.findElement(By.className('countAndButtonComponentLeft')).getInnerHtml()).not.toContain('No results found');

    });

    it('should have no search process errors', function (done) {

        var searchUrl = testVariables.baseUrl + '?func=ll&objtype=148&objaction=browse';
        browser.get(searchUrl);
        helper.checkCSAuthentication(browser);

        // wait for redirect (for drivers that don't handle this implicitly - I'm looking at you IE)
        browser.wait(until.elementLocated(By.xpath('//*[@id="admin-servers"]/table/tbody/tr[1]/td[1]/table/tbody/tr[2]/td/table/tbody/tr[3]/td[6]')), 30000);

        browser.findElement(By.xpath('//*[@id="admin-servers"]/table/tbody/tr[1]/td[1]/table/tbody/tr[2]/td/table/tbody/tr[3]/td[6]')).getInnerHtml()
            .then(function (val) {
                val = val.replace(/&nbsp;/g, '').trim();
                helper.testInfo.val = val;
                expect(val).toEqual('0');
                done();
            });

    });

});

