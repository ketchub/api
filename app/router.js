const _       = require('lodash');
const async   = require('async');
const router  = require('express').Router();
const r       = require('rethinkdb');
const getConn = r.connect({
  db: process.env.NODE_ENV,
  host: process.env.RETHINK_HOST,
  port: 28015
});

console.log(`\n\n RUNNING WITH NODE_ENV: ${process.env.NODE_ENV} \n\n`);

module.exports = router;

router.post('/search', (req, res, next) => {
  const query = req.body;
  const polyVertices = query.containmentPolygon.map((v) => {
    return [v.lng, v.lat];
  });
  const rqlContainmentPolygon = r.polygon(r.args(polyVertices));
  const originPoint = r.point(+(query.originPoint.lng), +(query.originPoint.lat));

  getConn.then((conn) => {
    r.table('rides')
      // .getIntersecting(
      //   rqlContainmentPolygon, {index: 'containmentPolygon'}
      // )
      .getNearest(originPoint, {index: 'originPoint'})
      // .pluck(
      //   'id',
      //   'encodedPolyline',
      //   'originPoint',
      //   'destinationPoint'
      // )
      .run(conn, (err, cursor) => {
        if (err) { return res.json({err}); }
        cursor.toArray((err, results) => {
          if (err) { return res.json({err}); }
          res.json({err, results});
        });
      });
  });
});


router.post('/post-ride', (req, res, next) => {
  const query = req.body;
  const polyVertices = query.containmentPolygon.map((v) => {
    return [v.lng, v.lat];
  });

  getConn.then((conn) => {
    r.table('rides').insert({
      containmentPolygon: r.polygon(r.args(polyVertices)),
      destinationPoint: r.point(+(query.destinationPoint.lng), +(query.destinationPoint.lat)),
      originPoint: r.point(+(query.originPoint.lng), +(query.originPoint.lat)),
      encodedPolyline: query.encodedPolyline,
      originZip: query.originZip,
      originCity: query.originCity,
      destinationZip: query.destinationZip,
      destinationCity: query.destinationCity
    }).run(conn, (err, resp) => {
      res.json({err, resp});
    });
  });
});


router.get('/recent', (req, res, next) => {
  getConn.then((conn) => {
    r.table('rides').limit(10).run(conn, (err, cursor) => {
      if (err) { return res.json({err}); }
      cursor.toArray((err, results) => {
        if (err) { return res.json({err}); }
        res.json({err, results});
      });
    });
  });
});


function stringToBool(v) {
  return !!(v === "true" || v === true);
}
