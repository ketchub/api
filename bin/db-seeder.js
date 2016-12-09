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
    // @todo make this use actual insert code from the application
    const polyVertices = data.containmentPolygon.map((v) => {
      return [v.lng, v.lat];
    });
    r.table('rides').insert({
      containmentPolygon: r.polygon(r.args(polyVertices)),
      destinationPoint: r.point(+(data.destinationPoint.lng), +(data.destinationPoint.lat)),
      originPoint: r.point(+(data.originPoint.lng), +(data.originPoint.lat)),
      encodedPolyline: data.encodedPolyline,
      originZip: data.originZip,
      originCity: data.originCity,
      destinationZip: data.destinationZip,
      destinationCity: data.destinationCity
    }).run(conn, done);
  }
});
