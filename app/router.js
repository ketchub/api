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
  const originRadius = r.circle(originPoint, +(query.originSearchRadius));
  const destinationPoint = r.point(+(query.destinationPoint.lng), +(query.destinationPoint.lat));
  const destinationRadius = r.circle(destinationPoint, +(query.destinationSearchRadius));

  getConn.then((conn) => {
    r.table('rides')
      // the RECORD containment poly intersects the SEARCH origin radius
      .filter(r.row('containmentPolygon').intersects(originRadius))
      // the RECORD origin point intersects the originRadius
      .filter(r.row('originPoint').intersects(originRadius))
      // the RECORD containment poly intersects the SEARCH dest radius
      .filter(r.row('containmentPolygon').intersects(destinationRadius))
      // the RECORD dest point intersects the SEARCH dest radius
      // THIS IS THE KEY TO "ALONG" A ROUTE, IF WE DO NOT FILTER BY THIS
      .filter(r.row('destinationPoint').intersects(destinationRadius))


      // .filter(r.row('originRadius').intersects(rqlContainmentPolygon))
      // .filter(r.row('destinationRadius').intersects(rqlContainmentPolygon))
      // .getIntersecting(rqlContainmentPolygon, {index: 'containmentPolygon'})
      // .filter(r.row('containmentPolygon').intersects(rqlContainmentPolygon))
      // .filter(
      //   r.row('originPoint').intersects(originRadius)
      // )
      // .filter(
      //   r.row('destinationPoint').intersects(destinationRadius)
      // )
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

  const originPoint = r.point(+(query.originPoint.lng), +(query.originPoint.lat));
  const originRadius = r.circle(originPoint, +(query.originSearchRadius));
  const destinationPoint = r.point(+(query.destinationPoint.lng), +(query.destinationPoint.lat));
  const destinationRadius = r.circle(destinationPoint, +(query.destinationSearchRadius));

  getConn.then((conn) => {
    r.table('rides').insert({
      containmentPolygon: r.polygon(r.args(polyVertices)),
      originPoint: originPoint,
      originRadius: originRadius,
      destinationPoint: destinationPoint,
      destinationRadius,
      // originDestinationMulti: [originPoint, destinationPoint],
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
