/***************
 * node-unblocker: Web Proxy for evading firewalls and content filters,
 * similar to CGIProxy or PHProxy
 *
 *
 * This project is hosted on github:  https://github.com/nfriedly/nodeunblocker.com
 *
 * By Nathan Friedly - http://nfriedly.com
 * Released under the terms of the Affero GPL v3
 */

var url = require('url');
var querystring = require('querystring');
var express = require('express');
var unblocker = require('unblocker');
var Transform = require('stream').Transform;

var app = express();

var google_analytics_id = process.env.GA_ID || null;

function discord(data) {
    if (data.url.match(/^https?:\/\/discordapp.com\//)) {
        data.headers['Origin'] = "https://discordapp.com" 
    }
}

function iframe(data) {
    data.headers['X-Frame-Options'] = "KOMEGA" 
    data.headers['Access-Control-Allow-Origin'] = "*" 
}

function requireHTTPS(data) {
    if (data.headers['x-forwarded-proto'] == "http") {
        data.status(301).redirect('https://ushistoryonline.herokuapp.com' + data.url)
    }
}

function antiPorn(data) {
    if (data.url.match(/porn|sex|xxx|xnxx|xhamster|redtube|rule34/)) {
        data.clientResponse.status(301).redirect('/no.jpg')
    }
}

function discord2(data) {
    if (data.url.match(/^https?:\/\/discordapp.com\/login/)) {
        data.body.replace('/cdnID/https:', '')
    }
}

var unblockerConfig = {
    prefix: '/cdnID/',
    requestMiddleware: [
        discord,
        antiPorn
    ],
    responseMiddleware: [
        iframe,
        requireHTTPS,
        discord2
    ]
};



// this line must appear before any express.static calls (or anything else that sends responses)
app.use(unblocker(unblockerConfig));

// serve up static files *after* the proxy is run
app.use('/', express.static(__dirname + '/public'));

// this is for users who's form actually submitted due to JS being disabled or whatever
app.get("/no-js", function(req, res) {
    // grab the "url" parameter from the querystring
    var site = querystring.parse(url.parse(req.url).query).url;
    // and redirect the user to /proxy/url
    res.redirect(unblockerConfig.prefix + site);
});

// for compatibility with gatlin and other servers, export the app rather than passing it directly to http.createServer
module.exports = app;
