# ODA Client

The On-line Data Access (ODA) client provides simple web-base user inteface to the ODA Server.

## Technologies used

The application uses [Yeoman](http://yeoman.io/) which integrates:

* [Yo](https://github.com/yeoman/yo) : scaffolds out the application, writing the Grunt configuration and pulling in relevant Grunt tasks that you might need for your build.
* [Grunt](http://gruntjs.com/) : which allows building, previewing and testing the project
* [Bower](http://bower.io/) : which allows managing of dependencies and automatic download, thus making the application easily extendible.

## Libraries used

* [require](http://requirejs.org/)
* [Underscore](http://underscorejs.org/)
* [jQuery](http://jquery.com/)
* [Backbone](http://backbonejs.org/)
* [Backbone Marionette](http://marionettejs.com/)

## How to setup development environmet (on a Linux machine)

0.  Get the code from GitHub [DREAM Client repository](https://github.com/DREAM-ODA-OS/ODAClient):

    ```
    git clone git@github.com:DREAM-ODA-OS/ODAClient.git
    ```

    or, just for inspecting the code without the possibility to push changes back to github:

    ```
    git clone https://github.com/DREAM-ODA-OS/ODAClient.git
    ```

0.  Install development enviroment:

    Make sure [Node.js](http://nodejs.org) and [NPM](https://npmjs.org) are installed
    on your machine and run:

    ```
    cd ./ODAClient
    sudo npm install -g grunt-cli
    sudo npm install -g bower 
    npm install 
    ```

    These commands install the needed Node.js packages. In case of any trouble try to use 
    a reasonably recent version of Node.js. Also note that newer versions of Node.js contain 
    the NPM already bundled in the baseline installation. 

0.  Install client dependencies:  

    The required JavaScript frameworks can be installed by: 

    ```
    bower install
    ```
0.  To use the Ingestion Admin T5 component, you'll need have the T5 ingestion engine
    intalled and running before you start the ODAClient. Note the Ingestion Engine will
    also need the DREAM ngEO-download-manager to download products.

    Make or choose a suitable directory ie_inst-dir to intall the Ingestion Engine (it is
    recommended not to make it a subtree of the ODA Client installation tree).
    Get the T5 Ingestion Engine from github[DREAM Ingestion Engine repository],
    `https://github.com/DREAM-ODA-OS/IngestionEngine`.
    and install according to the README.md there.  In your ie_inst-dir use one of the following:

    ```
    git clone git@github.com:DREAM-ODA-OS/IngestionEngine.git
    ```

    or

    ```
    git clone https://github.com/DREAM-ODA-OS/IngestionEngine.git
    ```
    
   Then configure according the to Ingestion Engine's README.

0.  Start the [Grunt](http://gruntjs.com/) development server:

    ```
    grunt server 
    ```

    and point your browser to port 9000 of the machine where the grunt is running.  

If you managed to reach this the last step you can start to hack the code. 
The browser view refreshes itself automatically reflecting the code changes made. 


## How to deploy the code on a server 

0.  Create deployment package: 

    ```
    grunt build
    ```

    This command creates `./ODAClient/dist/` directory containing the produced deployment 
    version. Take the directory and mode it to other location: 
    
    ```
    mv ./ODAClient/dist ./ODAClient-my-build-x.y.z
    ```
    
    This directory should be then packed by some archiving tool (`zip`, `tar`, `cpio` ... etc.)
    creating the *deployment package*, e.g., as follows:
    ```
    tar -cvzf ./ODAClient-my-build-x.y.z.tgz ./ODAClient-my-build-x.y.z
    ```
    
    This *deployment package* is independent of the grunt *development environment* and can be deployed
    as static content with any web-server capable of serving static files. 
    

0.  Copy and unpack the content of the deployment package to your server and make sure
    the web-server can access the `index.html` file.

0.  Tailor the client's cofiguration (`config.json` and `data.json` files) to fit your application. 


## Setting up the development environment on Ubuntu 12.4 

0.  Setup PPA repository to get latest Node.js: 

    Copy following lines to `/etc/apt/sources.list` 

    ```
    deb http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main 
    deb-src http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main 
    ```

    Add PPA keys: 

    ```
    sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys C7917B12
    ```

    Update the apt sources: 

    ```
    sudo apt-get update 
    ```

    And finally install the Node.JS:

    ```
    sudo apt-get install nodejs
    ```

0.  Install Ruby, Ruby Gems and Compass 

    Run following commands: 

    ```
    sudo apt-get install ruby rubygems
    gem install compass
    ```

0.  Install global Node.JS components: 

    ```
    sudo npm install -g grunt-cli
    sudo npm install -g bower 
    ```

0.  Get the code from GitHub [DREAM Client repository](https://github.com/DREAM-ODA-OS/ODAClient):

    ```
    git clone git@github.com:DREAM-ODA-OS/ODAClient.git
    ```

    or

    ```
    git clone https://github.com/DREAM-ODA-OS/ODAClient.git
    ```

0.  Install development enviroment:

    ```
    cd ./ODAClient
    npm install 
    npm install grunt-svgmin
    ```
    
0.  Install client dependencies:  

    The required JavaScript frameworks can be installed by: 

    ```
    bower install
    ```

0.  Start the [Grunt](http://gruntjs.com/) development server:

    ```
    grunt server 
    ```

    and point your browser to port 9000 of the machine where the grunt is running.  
