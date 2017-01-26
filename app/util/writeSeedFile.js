const fs      = ACQUIRE('fs');
const path    = ACQUIRE('path');
const mkdirp  = ACQUIRE('mkdirp');

module.exports = function writeSeedFile(tableName, data, done) {
  const dirPath = path.join(__dirname, `../../config/seeds/${tableName}`);
  mkdirp(dirPath, (err) => {
    if (err) { return done(err); }
    const marshalled = JSON.stringify(data);
    // every seed should have an 'id' property
    const filePath = path.join(dirPath, `${data.id}.json`);
    fs.writeFile(filePath, marshalled, 'utf-8', (err) => {
      if (err) { return done(err); }
      done();
    });
  });
};
