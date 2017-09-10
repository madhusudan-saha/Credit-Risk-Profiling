'use strict';
var express      = require("express"),
	jsonfile = require('./jsonfile');

module.exports = function(obj, filename) {
	var file = 'data/'
	file += filename+".json";
	jsonfile.writeFile(file, obj, function (err) {
  		console.error(err)
	})
	
}
