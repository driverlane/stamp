#stamp-helper

The stamp-helper module has been created to simplify a few common scenarios. These are:
* initialisation of your browser/driver
* managing variables that change between environments, e.g. URLs, IDs
* check if manual authentication is required on a page and log in using user supplied variables

## Browser Initialisation

If you use the helper.initBrowser() function the browsers that the user has specified in the stamp settings dialog will be initialised
in turn. At the start of each function use the initBrowser funciton and the module will intialise the current browser and return it to
your script.

```
var helper = require('stamp-helper');
var browser;

describe('Doing some testing', function () {

    beforeEach(function () {
        browser = helper.initBrowser();
    });

    afterEach(function (done) {
        browser.quit().then(done);
    });

    it('should test something', function () {

        ...

    }

}
```

## Handling variables

For test details that change between environments, like URLs and IDs the helper.getTestVariables() function will return the values
maintained in the stamp variables dialog. This avoids having different versions of your test for each of their environments, prod, test, etc.

```
var helper = require('stamp-helper');
var testVars = helper.getTestVariables();

...

browser.get(testVars.baseurl);
```

To define these variables in a format the test import function expects see [tests-variables.md](./test-variables.md).

## Authentication

If the users environment doesn't have single sign on operating you may have to manually authenticate. The helper.checkCSAuthentication()
function will check to see if the page is a manual authentication page. If it is it will enter the username and password variables
in the appropriate fields and click the log on button.

```
browser.get(testVars.baseUrl);
helper.checkCSAuthentication(browser);
var element = browser.findElement(By.className('copyright'));
```
The function assumes the username and password variables are used for authentication. This approach minimises passing credentials 
around the application. If you want to supply other values, use: 

```
helper.checkCSAuthentication(browser, username, password);
```

## Check existence

You can use the following to test if an element is on the page. Just supply the browser and selector and it will return true if present, false if not.

* helper.idIsPresent(browser, id)


## Timeouts

Nothing is specifically set for Selenium timeouts. The only timeout set is for the Jasmine tests, which defaults to 60 seconds. 
Tests seem to work best when implicit waits are used, rather than setting an explicit wait and hoping the customer's performance 
is within your expectations.

## Asynchronous tests

For me it's still a mystery which selenium function is synchronous and which isn't. My current thinking is if there's a promise 
in the documentation assume it's async and use the done() based approach e.g.:

```
it('should be CS 10.5', function (done) {

    var aboutUrl = testVars.baseUrl + '?func=ll.index';
    browser.get(aboutUrl);
    helper.checkCSAuthentication(browser);
    var element = browser.findElement(By.className('copyright'));
    element.getText()
        .then(function (text) {
            helper.testInfo.csVersion = text.substring(text.indexOf('version') + 8, text.indexOf('Copyright') - 2);
            expect(text).toContain('Content Server version 10.5');
            done();
        });

});
```

Default test scripts can be found in the ..<install folder>\resources\app\tests folder if you want a starting point.
