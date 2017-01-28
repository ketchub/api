const AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
const ses = new AWS.SES();

// ses.sendEmail({
//   Source: 'test@ketchr.com',
//   Destination: {
//     ToAddresses: ['jhartman86@gmail.com']
//   },
//   Message: {
//     Subject: {
//       Data: 'Ketch test verification'
//     },
//     Body: {
//       Html: {
//         Data: `
//           <!doctype html>
//           <html>
//             <head>
//               <title>Simple Transactional</title>
//             </head>
//             <body>
//               <h4>Ketch Ride Notification</h4>
//               <p>this is a test</p>
//               <p>Verification code</p>
//             </body>
//           </html>
//         `
//       }
//     }
//   }
// }, (err, data) => {
//   if (err) { return console.log('SES ERROR: ', err, err.trace); }
//   console.log('AWS SES OK: ', data);
// });
