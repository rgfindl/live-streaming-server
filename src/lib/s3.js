const AWS = require('aws-sdk');
const stream = require('stream');
const s3 = new AWS.S3();

var functions = {};

functions.putObject = (params) => {
  console.log('s3.putObject');
  return s3.putObject(params).promise();
}

module.exports = functions;
