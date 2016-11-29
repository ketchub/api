const async = require('async');
const r = require('rethinkdb');
const seeds = require('../config/seeds.json');
const getConn = r.connect({
  db: process.env.NODE_ENV,
  host: process.env.RETHINK_HOST,
  port: 28015
});

getConn.then((conn) => {
  async.each(seeds, addRecord, (err) => {
    if (err) {
      conn.close();
      throw err;
    }
    console.log('DATABASE SEEDED');
    conn.close();
  });

  function addRecord(data, done) {
    r.table('rides').insert({
      startPoint: r.point(data.startLng, data.startLat),
      endPoint: r.point(data.endLng, data.endLat),
      wouldDrive: data.wouldDrive,
      flexible: data.flexible
    }).run(conn, done);
  }
});
