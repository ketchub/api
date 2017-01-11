const fs      = ACQUIRE('fs');
const path    = ACQUIRE('path');
const crypto  = ACQUIRE('crypto');

module.exports = function writeSeedFile(data, done) {
  const marshalled = JSON.stringify(data);
  const md5 = crypto.createHash('md5').update(marshalled, 'utf8').digest('hex');
  const filePath = path.join(__dirname, `../../config/seeds/trip/${md5}.json`);
  fs.writeFile(filePath, marshalled, 'utf-8', (err) => {
    if (err) { return done(err); }
    done();
  });
};
