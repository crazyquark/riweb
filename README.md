**Quick Start**  
(Or at least, how I did it)  

Install [ndenv](https://github.com/riywo/ndenv#install) and [node-build](https://github.com/riywo/node-build#install) if not already installed:  

Install exact NodeJS version for project
*ndenv install && ndenv rehash*  

Get NodeJS dependencies from cache:  
*npm install --cache-min 999999*  

Install docker:  
https://docs.docker.com/installation/ubuntulinux/  

If you run into TLS trouble with docker, see this:  
http://alexjerez.net/docker-apparmor/  

Start mongoDB server:  
*cd docker && ./start_mongo.sh*  

Install bower:  
*npm install -g bower*  

Install packages with bower from cache:  
*bower install --offline*  

Start server:  
*npm install -g grunt-cli*  
*grunt serve*  





