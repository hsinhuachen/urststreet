var fs = require('fs');
var bodyParser = require('body-parser')
var express = require('express');
var app = express();
//var multer = require('multer');

var createFolder = function(folder){
	try{
		fs.accessSync(folder); 
	}catch(e){
		fs.mkdirSync(folder);
	} 
};

var uploadFolder = './uploads/';
createFolder(uploadFolder);

//var upload = multer();

//app.use(bodyParser.json({limit: '50mb', type: 'application/*+json'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '50mb',parameterLimit:50000}));

exports.post = function (req, res) {
   	var imgData = req.body.imgData;
console.log(imgData)
  	/*var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer(base64Data, 'base64');
    fs.writeFile("uploads/out.png", dataBuffer, function(err) {
        if(err){
          res.send(err);
        }else{
          res.send("保存成功！");
        }
    });*/
    res.send('create photo')
}

exports.get = function (req, res) {
	res.status(200).send('upload photo')
}


