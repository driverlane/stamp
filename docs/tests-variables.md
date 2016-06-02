# Test variables

Test variables are values that will change between different environments. Things like URLs or ID numbers. Users can edit these 
through the variables dialog that appears when they click the Edit Variables button.

## Defining variables

Test variables can be added to the application through a JSON file that accompanies the JavaScript test file. The file should 
contain a top level object with the name of the test that will appear in the application and the testVariables array of JavaScript 
objects representing the user's environments.

An environment is a set of variables with values specific to that environment, e.g. Production, Test, etc. Each configuration file 
needs at least one environment object in the testVariables array.

An environment object contains the name of the environment and the variables array. Each object in the variables array is one of the
test variables. Each object can contain the following attributes:  
 
 * name (required) - the name of the test variable
 * value (required) - the default value of the variable
 * label - the label for the variable to be displayed in the settings page. If not supplied the name will be used as the label.
 * type - the type of control to be displayed in the settings page. If not supplied it will default to a text input. The following 
 types are currently supported:
    * text
    * password
    * number
    * filePath
 * values - an array of valid values. If this is supplied the user will be given a select list to choose a value (not currently implemented, waiting for someone to need this).

Currently changing the input based on the type and values attributes are not supported. All variables are edited using a text input 
field. This will change in a future version where the control for the variable is based on the type or values attributes. All 
attributes are considered mandatory.

Example: 
```
{
    "name" : "CS 16 basics",
    "testVariables": [
        {
            "name": "Default",
            "variables": [
                {
                    "name": "baseUrl",
                    "value": "http://localhost/otcs/cs.exe"
                },
                {
                    "name": "username",
                    "value": "admin"
                },
                {
                    "name": "password",
                    "value": "livelink"
                },
                {
                    "name": "searchTerm",
                    "value": "OpenText"
                },
                {
                    "name": "testFolderId",
                    "value": "2000"
                },
                {
                    "name": "testFilePath",
                    "value": "C://testfile.txt"
                }
            ]
        }
    ]
}
```

## Using variables

When these values are supplied to your test via the getTestVariables function they will be supplied as an array of key/value pairs 
so you can use simple dot notation in your test to retrieve the values, e.g.:

```
var helper = require('stamp-helper');
var testVars = helper.getTestVariables();

browser.get(testVars.baseurl);
```
