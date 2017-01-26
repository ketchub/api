require('../app/_bootstrap');
const path          = ACQUIRE('path');
const fs            = ACQUIRE('fs');
const async         = ACQUIRE('async');
const tripModel     = ACQUIRE('#/models/trip');
const accountModel  = ACQUIRE('#/models/account');
const r             = ACQUIRE('rethinkdb');
const getConnection = ACQUIRE('#/lib/db/connection');

async.series([
  seedAccountTable,
  seedTripTable
], (err) => {
  if (err) { return console.log('ERROR OCCURRED', err); }
  console.log('Seeding Completed OK');
});

/**
 * Seed the accounts table.
 */
function seedAccountTable(callback) {
  seeder('/account', callback).setHandler((fileName, done) => {
    accountModel.create(loadSeed(`/account/${fileName}`), (err, resp) => {
      if (err) { return done(err); }
      done();
    });
  }).invoke();
}

/**
 * Seed the trips table.
 */
function seedTripTable(callback) {
  seeder('/trip', callback).setHandler((fileName, done) => {
    tripModel.postRide(loadSeed(`/trip/${fileName}`), (err, resp) => {
      if (err) { return done(err); }
      done();
    });
  }).invoke();
}

function seeder(dirPath, _callback) {
  const _path = seedDir(dirPath);
  let _handler;
  return {
    setHandler(_h) { _handler = _h; return this; },
    invoke() {
      fs.readdir(_path, (err, files) => {
        if (err) { return _callback(err); }
        async.eachSeries(files, _handler, _callback);
      });
    }
  };
}

function loadSeed(_path) {
  return require(seedDir(_path));
}

/**
 * Return absolute path to a subdirectory or file in the seeds path.
 * @param  {string} _path string
 * @return {string}       Absolute path
 */
function seedDir(_path) {
  return path.join(__dirname, '../config/seeds', _path);
}
