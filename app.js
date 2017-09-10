/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
// create a new express server
var app = express();
var bluemix = require('./config/bluemix');
var watson = require('watson-developer-cloud');
var extend = require('util')._extend;
var jsonfile = require('jsonfile');

//avoid "request too large" exception
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.use('/data',  express.static(__dirname + '/data'));
app.use(express.static('minimum'));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');



// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var createjson = require('./config/createjson');

app.get('/',function(req,res){
  res.sendfile("index.html");
});

app.post('/login',function(req,res){
  var bank_name=req.body.bank_name;
  var loan_details=req.body.loan_details;
  var growth_rate=req.body.growth_rate;
  var emi_nmi=req.body.emi_nmi;
  var loantocost=req.body.loantocost;
  var colltoloan=req.body.colltoloan;
  var Experience=req.body.Experience;
  var qual=req.body.qual;
  var loyalty=req.body.loyalty;
  createjson({bank_name: bank_name,loan_details:loan_details,growth_rate:growth_rate,emi_nmi:emi_nmi,loantocost:loantocost,
	colltoloan:colltoloan,Experience:Experience,qual:qual,loyalty:loyalty}, bank_name);
  res.end("yes");
});

// if bluemix credentials exists, then override local
var credentials = extend({
  version: 'v1',
  url: '<url>',
  username: '<username>',
  password: '<password>'
}, bluemix.getServiceCreds('tradeoff_analytics')); // VCAP_SERVICES

// Create the service wrapper
var tradeoffAnalytics = watson.tradeoff_analytics(credentials);

app.post('/demo/dilemmas/', function(req, res) {
  var params = extend(req.body);
  params.metadata_header = getMetadata(req);
  params.generate_visualization = false;
  tradeoffAnalytics.dilemmas(params, function(err, dilemma) {
    if (err) 
      return res.status(Number(err.code) || 502).send(err.error || err.message || 'Error processing the request');
    else {
      createjson(dilemma, "result");
      return res.json(dilemma);
    }
  });
});

app.post('/demo/events/', function(req, res) {
  var params = extend(req.body);
  params.metadata_header = getMetadata(req);
  
  tradeoffAnalytics.events(params, function(err) {
    if (err)
      return res.status(Number(err.code) || 502).send(err.error || err.message || 'Error forwarding events');
    else
      return res.send();
  });
});

app.post('/filter',  function(req,res){
console.log(req.body);
var allIncludedOptionKeys=req.body.allIncludedOptionKeys;
createjson(allIncludedOptionKeys, 'filter');
  var count=0;
  for(var i=0;i<allIncludedOptionKeys.length;i++){
	var readfile=require("./public/problems/data.json");
	if(readfile.options[allIncludedOptionKeys[i]].values.loan_status=="1")
	{
		count++;		
	}
}
var data=(count/allIncludedOptionKeys.length)*30;

res.end(""+data);
});

app.post('/static',  function(req,res){
createjson(req.body, req.body.Name);
});

app.post('/score',  function(req,res){
createjson(req.body, req.body.smename+"1");
});
app.post('/smename',  function(req,res){
createjson(req.body, "smename");
});
app.get('/tradeoff', function(req, res) {
  res.render('index.jade');
});

app.get('/showscore', function(req, res) {
  res.sendfile('public/showscore.html');
});

function getMetadata(req) {
	var metadata = req.header('x-watson-metadata');
	if (metadata) {
		metadata += "client-ip:" + req.ip;
	}
	return metadata;
}

//Personality insights

var Twitter = require('twitter')

app.post('/sunburst',  function(req,res){
var name = req.body.Name;

var tweet =" ";
var twitterClient = new Twitter({
  consumer_key: 'frSEbjDdgI5nR35Kyz099VEr9',
  consumer_secret: 'fdl02lW9Ke25iiJfambmlaB1ncpqtuAxf6s148xJTXl1Eu0yuj',
  access_token_key: '1171680805-CuOloGIRj3r9XylE3GOzpovXEnwhIKANzZczPuM',
  access_token_secret: 'dnXopvlgmm09vo5Tz131fabK6G1g8Lp7WSwObJSvbbTtJ'
});
var personality_insights = watson.personality_insights({
  username: '<username>',
password: '<password>',
version: 'v2'
});

var params = {q: name, count: 100};
twitterClient.get('search/tweets', params, function(error, tweets, response) {
console.log("tweets"+JSON.stringify(tweets));
   for(var i=0;i<tweets.statuses.length;i++)
   {
 	tweet += " " + tweets.statuses[i].text;
   }
   console.log(tweets.statuses.length);
   console.log(tweets.statuses[0].text);
   personality_insights.profile({text: ""+tweet, language: 'en' }, function (err, response) {
	if (err)
	  console.log('error:', err);
	else
	{
		var obj = response.tree;
		console.log(response);
		jsonfile.writeFile("data/person.json", obj, function (err) {
  			console.error(err)
  			res.end("1");
		})
	}
   
   });

});

});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

