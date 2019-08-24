/**
 * 
 * Primary file for the API
 * 
 */

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');


//Instantiating the httpServer
const httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

//Instantiating the httpsServer
const httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res);
});


//Start the server 
httpServer.listen(config.httpPort, function () {
    console.log('This http server is listening on port ' + config.httpPort + ' in ' + config.envName + ' now!');
});

//Start the https server
httpsServer.listen(config.httpsPort, function () {
    console.log('This https server is listening on port ' + config.httpsPort + ' in ' + config.envName + ' now!');
});

//All the server logic for both http and https server
const unifiedServer = function (req, res) {
    //Get the url and parse it
    let parsedUrl = url.parse(req.url, true);


    //Get the path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as an object
    let queryStringObject = parsedUrl.query;

    //Get the http method
    let method = req.method.toLowerCase();

    //Get the headers as an object
    let headers = req.headers;

    //Get the payload, if any
    const decoder = new StringDecoder('utf8');
    let buffer = '';

    //Handle incoming payload stream
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });

    //
    req.on('end', function () {
        buffer += decoder.end();

        //Choose the handler this request should go to, if no found choose the notfound handler
        const choosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notfound;

        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };

        //Route the request to the handler specified in the router
        choosenHandler(data, function (statusCode, payload) {
            //Use the statusCode called back by the handler, or default to 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            //Use the payload called back by the handler, or default to an empty object
            payload = typeof (payload) == 'object' ? payload : {};

            //Convert the payload to a string
            payloadString = JSON.stringify(payload);

            //Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);


            //Log the request path
            console.log('Return this response: ', statusCode, payloadString)
        });

    });

};

//Define handlers
const handlers = {}

//Define not found handler
handlers.notfound = function (data, callback) {
    callback(404);
};

//Define Hello handler, Parses query parameters, if using GET  or form data, if using POST and processes it to output a customized Hello message
handlers.hello = function (data, callback) {
    const method = typeof (data) == 'object' ? data.method : 'get';
    let paramBag = {}; //Data access object 
    paramBag.name = 'World'; // Default
    paramBag.helloName = function () {
        return this.FName && this.LName ? this.FName + ' ' + this.LName : this.name;
    }
    switch (method) {
        case 'get':
            if (typeof (data.queryStringObject.FName) == 'string') paramBag.FName = data.queryStringObject.FName;
            if (typeof (data.queryStringObject.LName) == 'string') paramBag.LName = data.queryStringObject.LName;
            if (typeof (data.queryStringObject.name) == 'string') paramBag.name = data.queryStringObject.name;
            break;
        case 'post':
            const contentType = typeof (data.headers['content-type']) == 'string' ? data.headers['content-type'] : 'text/plain; charset=UTF-8';
            if (contentType.startsWith('application/x-www-form-urlencoded')) { //If params are send as form url encoded
                if (data.payload) {
                    const form = data.payload.split(/&/g);
                    form.forEach(element => {
                        const keyVar = element.split(/=/);
                        paramBag[keyVar[0]] = keyVar[1];
                    });
                }
            } else if (contentType.startsWith('multipart/form-data')) { //if send as multipart form data
                const boundary = contentType.split(/;/)[1].split(/=/)[1];
                if (data.payload) {
                    const form = data.payload.split(boundary);
                    form.forEach(element => {
                        if (!element.startsWith('--')) {
                            const disposition = element.trim().split(/;/)[0].split(/:/)[1].trim();
                            if (disposition === 'form-data') {
                                content = element.split(/;/)[1].trim().replace(/--/, '');
                                const dataVars = content.split(/\r?\n/g);
                                let namekey = dataVars[0].trim().split(/=/)[1].replace(/"/g, '');
                                const val = dataVars[2].trim();
                                paramBag[namekey] = val;
                            }
                        }
                    });
                }
            }
            break;
    }
    console.log('The parameters recieved are: ' + JSON.stringify(paramBag));
    callback(200, { 'message': 'Hello ' + paramBag.helloName() + '!' });
}

handlers.ping = function (data, callback) {
    callback(200);
}


//Define a request router
const router = {
    'hello': handlers.hello,
    'ping': handlers.ping
}