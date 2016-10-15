/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'),
  app = express(),
  vcapServices = require('vcap_services'),
  extend = require('util')._extend,
  watson = require('watson-developer-cloud'),
  server = require('http').createServer(app),
  io = require('socket.io')(server);
var expressBrowserify = require('express-browserify');

var watson = require('watson-developer-cloud');

var alchemy_language = new watson.alchemy_language({  api_key: '401003686a765f8f10fcdd0e598ce6bb08c82350'});

var sentimentPrevious = 0;

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);


    var params = {
      text: msg
    };

    alchemy_language.sentiment(params, function (err, response) {
      if (err){
        //console.log('error sentiment:', err);
        var change= + (Math.random()-0.5)*0.1;
        sentimentPrevious =sentimentPrevious*0.5 + change;
        sentimentPrevious=Math.max(sentimentPrevious,-0.1);
        sentimentPrevious=Math.min(sentimentPrevious,0.1);
        console.log(change)

        console.log(sentimentPrevious)

        io.emit('sentiment', sentimentPrevious< 0 ? 'negative_mockup' : 'positive_mockup');
        console.log(sentimentPrevious< 0 ? 'negative sentiment (mockup)' : 'positive sentiment (mockup)');
      }
      else{
        //console.log(JSON.stringify(response, null, 2));
        if (response && response.docSentiment && response.docSentiment.type && response.docSentiment.score){

        console.log(response.docSentiment.type);

        io.emit('sentiment', response.docSentiment.type);
        sentimentPrevious=response.docSentiment.score;

        }

      }

    });

    // alchemy_language.emotion(params, function (err, response) {
    //   if (err){
    //     //console.log('error emotion:', err);
    //     io.emit('emotion', err);
    //   }
    //   else{
    //     console.log(JSON.stringify(response, null, 2));
    //     if (response && response.docSentiment && response.docSentiment.type){
    //     io.emit('emotion', response.docEmotions.anger + ":"+response.docEmotions.disgust + ":"+response.docEmotions.fear + ":"+response.docEmotions.joy + ":"+response.docEmotions.sadness);}
    //   }

    // });





    io.emit('transcript', msg);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});



// load environment properties from a .env file for local development
require('dotenv').load({silent: true});

// Bootstrap application settings
require('./config/express')(app);

// automatically compile and serve the front-end js
app.get('/js/index.js', expressBrowserify('src/index.js', {
  watch: process.env.NODE_ENV !== 'production'
}));

// For local development, replace username and password
var config = extend({
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api',
  username: process.env.STT_USERNAME || 'd584f29f-db32-4c45-9582-8d23270189b6',
  password: process.env.STT_PASSWORD || 'wZUUNhvwp8IX'
}, vcapServices.getCredentials('speech_to_text'));

var authService = watson.authorization(config);

app.get('/', function(req, res) {
  res.render('index', {
    ct: req._csrfToken,
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID
  });
});

// Get token using your credentials
app.post('/api/token', function(req, res, next) {
  authService.getToken({url: config.url}, function(err, token) {
    if (err)
      next(err);
    else
      res.send(token);
  });
});


// error-handler settings
require('./config/error-handler')(app);

module.exports = server;
