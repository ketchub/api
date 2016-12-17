const _       = require('lodash');
const async   = require('async');
const router  = require('express').Router();
const r       = require('rethinkdb');
const getConn = r.connect({
  db: process.env.NODE_ENV,
  host: process.env.RETHINK_HOST,
  port: 28015
});

console.log(`\n\n RUNNING WITH NODE_ENV: ${process.env.NODE_ENV} ${process.env.RETHINK_HOST} \n\n`);

module.exports = router;

router.get('/testing2', (req, res, next) => {
  res.json({testing:true, hey:'world'});
});

router.post('/search', (req, res, next) => {
  const query = req.body;
  const routeLine = r.line(r.args(query.routeLine.map((pair) => {
    return [pair.lng, pair.lat];
  })));
  const containmentPolygon = r.polygon(r.args(query.containmentPolygon.map((v) => {
    return [v.lng, v.lat];
  })));
  const tripDistance = query.tripDistance;

  const originPoint = r.point(+(query.originPoint.lng), +(query.originPoint.lat));
  const originRadius = r.circle(originPoint, +(query.originSearchRadius));
  const destinationPoint = r.point(+(query.destinationPoint.lng), +(query.destinationPoint.lat));
  const destinationRadius = r.circle(destinationPoint, +(query.destinationSearchRadius));

  getConn.then((conn) => {
    r.table('rides')
      .getIntersecting(routeLine, {index:'routeLine'})
      // "where record's distance is >= 90% of the search trip dist"
      .filter(r.row('tripDistance').gt(tripDistance * 0.9))
      .filter(r.row('routeLine').intersects(originRadius))
      .filter(r.row('routeLine').intersects(destinationRadius))
      .map((row) => {
        return row.merge({
          _fromOrigin: row('originPoint').distance(originPoint),
          _fromDestination: row('destinationPoint').distance(destinationPoint),
          _discrep: row('originPoint').distance(originPoint).add(row('destinationPoint').distance(destinationPoint))
        });
      })
      .distinct()
      .run(conn, {profile:true}, (err, cursor) => {
        if (err) { return res.json({err}); }
        return res.json({err, duration:cursor.profile[0]['duration(ms)'], results:cursor.value});
        // return res.json({err, results:cursor.value, duration:cursor.profile[0]['duration(ms)']});
      });
  });

  // getConn.then((conn) => {
  //   r.table('rides')
  //     .getIntersecting(originRadius, {index:'containmentPolygon'})
  //     .union(
  //       r.table('rides').getIntersecting(destinationRadius, {index:'containmentPolygon'})
  //     )
  //     .map((row) => {
  //       return row.merge({
  //         _fromOrigin: row('originPoint').distance(originPoint),
  //         _fromDestination: row('destinationPoint').distance(destinationPoint),
  //         _discrep: row('originPoint').distance(originPoint).add(row('destinationPoint').distance(destinationPoint))
  //       });
  //     })
  //     .distinct()
  //
  //     // the RECORD containment poly intersects the SEARCH origin radius
  //     // .filter(r.row('containmentPolygon').intersects(originRadius))
  //     // // the RECORD origin point intersects the originRadius
  //     // .filter(r.row('originPoint').intersects(originRadius))
  //     // // the RECORD containment poly intersects the SEARCH dest radius
  //     // .filter(r.row('containmentPolygon').intersects(destinationRadius))
  //     // // the RECORD dest point intersects the SEARCH dest radius
  //     // // THIS IS THE KEY TO "ALONG" A ROUTE, IF WE DO NOT FILTER BY THIS
  //     // .filter(r.row('destinationPoint').intersects(destinationRadius))
  //
  //
  //
  //
  //     .run(conn, {profile:true}, (err, cursor) => {
  //       if (err) { return res.json({err}); }
  //       // when profile:true, cursor is a response
  //       return res.json({err, results:cursor.value, queryDuration:cursor.profile[0]['duration(ms)']});
  //
  //       // cursor.toArray((err, results) => {
  //       //   if (err) { return res.json({err}); }
  //       //   res.json({err, results});
  //       // });
  //     });
  // });
});


router.post('/post-ride', (req, res, next) => {
  const query = req.body;
  const routeLine = r.line(r.args(query.routeLine.map((pair) => {
    return [pair.lng, pair.lat];
  })));
  const containmentPolygon = r.polygon(r.args(query.containmentPolygon.map((v) => {
    return [v.lng, v.lat];
  })));
  const originPoint = r.point(+(query.originPoint.lng), +(query.originPoint.lat));
  // const originRadius = r.circle(originPoint, +(query.originSearchRadius));
  const destinationPoint = r.point(+(query.destinationPoint.lng), +(query.destinationPoint.lat));
  // const destinationRadius = r.circle(destinationPoint, +(query.destinationSearchRadius));


  getConn.then((conn) => {
    r.table('rides').insert({
      routeLine,
      containmentPolygon,
      originPoint,
      // originRadius: originRadius,
      destinationPoint,
      // destinationRadius,
      // originDestinationMulti: [originPoint, destinationPoint],
      tripDistance: query.tripDistance,
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
