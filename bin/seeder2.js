require('../app/_bootstrap');
const accountModel = ACQUIRE('@/models/account');

// accountModel.loadById('21dbfb34-f6b4-462a-99a7-20d8bf917f5f', (err, reply) => {
//   console.log(err, reply);
// });

// accountModel.create({
//   email: 'jhartman864@gmail.com',
//   firstName: 'Jon',
//   lastName: 'Hartman'
// }, (err, reply) => {
//   console.log(err, reply);
// });
// accountModel.loadByEmail('jhartman86@gmail.com', (err, reply) => {
//   console.log(err, reply);
// });

// const _       = ACQUIRE('lodash');
// const request = ACQUIRE('request');
// const googleApiKey = 'AIzaSyAx4-FySy-SIddLxQ8ez7JhtOowhJ15qg0';
//
// const address1 = '1886 Race St, Denver, CO 80206, USA';
// const address2 = '301 E Kentucky Ave, Denver, CO 80209, USA';
//
// randomUserPic((err, pic) => { console.log(err, pic); });
// randomUserPic((err, pic) => { console.log(err, pic); });
// randomUserPic((err, pic) => { console.log(err, pic); });
//
// function randomUserPic(done) {
//   randomUserPicList()
//     .then(list => {
//       done(null, list[Math.floor(Math.random() * list.length)]);
//     })
//     .catch(done);
// }
//
// function randomUserPicList() {
//   if (!randomUserPicList._promise) {
//     const url = 'https://randomuser.me/api/?results=20&inc=picture';
//     randomUserPicList._promise = new Promise((resolve, reject) => {
//       GET(url, (err, data) => {
//         if (err) { return reject(err); }
//         resolve(data.results.map((record) => {
//           return _.get(record, 'picture.thumbnail');
//         }));
//       });
//     });
//   }
//   return randomUserPicList._promise;
// }
//
// function GET( url, done ) {
//   request.get({url, json:true}, (err, resp, data) => {
//     if (err) { return done(err); }
//     done(null, data);
//   });
// }
