#stamp

stamp provides a simple graphical user interface for running Jasmine based tests against Content Server instances. It is a desktop 
application for system administrators not used to using Node or other command line tools used to run automated testing, hopefully
allowing these users access to these tools so they don't have to spend tens of thousands on proprietary solutions that are never
maintained. In addition it provides basic timings for tests, which provides a simplistic tool for tracking system performance 
over time.

More information on the functionality is available [here](http://markfarrall.github.io/stamp/)

## development

After cloning all that's needed to get the app running for development is:

```
npm install
gulp

```
Try `gulp --tasks` for more information on the various tasks used for development and packaging.

## testing

There's a lint task built into the standard gulp tasks. Other testing is yet to be built.

## updating Electron

If you're updating electron-prebuilt to use a newer version of Electron remember to update the version number in 
`.\gulp-tasks\build.js`. The variable is `electronVersion`. 

## build

Build is relatively slow and has been split into the package and installer phases. Packaging is creating the basic electron app 
including the node modules. Installer is creating any OS specific installers that are needed.

As npm has changed to use a much less hierarchical approach to storage of modules the previous method of copying the node_modules to
the pacakge is no longer working. Follow the steps below once you're ready to build the package to update the cached copy of 
npm_modules that is added to the Electron package as part of the buildPackage step. The steps are:

* `gulp cleanfinal` to empty the node_modules folder and the cached copy.
* `npm install --production` to install only the modules required for the Electron package
* copy the npm_modules folder to the cache directory
* `npm install` to install all the dev dependencies

Now you can use gulp to build the package and installers
 
```
gulp buildPackage
gulp buildInstallers
```

## stamp-helper

Documentation on writing tests to take advantage of the stamp-helper module is available [here](./docs/tests.md)
