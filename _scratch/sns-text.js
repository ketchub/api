const AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
const sns = new AWS.SNS();

// sns.publish({
//   Message: 'Ketch.com verification code: a2nz9x1d',
//   MessageStructure: 'string',
//   PhoneNumber: '+14439565918'
// }, (err, data) => {
//   if (err) { return console.log('SNS ERROR: ', err, err.stack); }
//   console.log('AWS SNS OK: ', data);
// });
