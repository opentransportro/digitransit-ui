@ECHO OFF
START "Start node server" CMD /K "CD..&& set NODE_ENV=development&& set CONFIG=opentransport&& nodemon -e js,css,scss,html --watch ./app/ server/server.js"
START "Start node hot load server" CMD /K "CD..&& set NODE_ENV=development&& set CONFIG=opentransport&& yarn run webpack-dev-server"
