const r                 = ACQUIRE('rethinkdb');
const getConnection     = ACQUIRE('#/lib/db/connection');
const mapboxPolyline    = ACQUIRE('@mapbox/polyline');
module.exports.search   = _search;
module.exports.postRide = _postRide;

/**
 * Issue search data to Rethink.
 * @todo: data parameter validation
 * @param  {Object}   data Query parameters
 * @param  {Function} done  Callback
 * @return {void}
 */
function _search(data, done) {
  const { tripDistance, originSearchRadius, destinationSearchRadius } = data;
  const routeLine = makeRouteLine(data);
  const containmentPolygon = makeContainmentPolygon(data);
  const originPoint = makeOriginPoint(data);
  const originRadius = makeOriginRadius(originPoint, data);
  const destinationPoint = makeDestinationPoint(data);
  const destinationRadius = makeDestinationRadius(destinationPoint, data);
  const pluck = ['_discrep', '_fromOrigin', '_fromDestination', '_account', 'encodedPolyline', 'id', 'tripDistance', 'originCity', 'destinationCity', 'accountId'];

  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table('rides', {readMode:'outdated'})
      .getIntersecting(containmentPolygon, {index:'containmentPolygon'})
      .filter(r.row('routeLine').intersects(routeLine))
      // do the routes intersect?
      // .getIntersecting(routeLine, {index:'routeLine'})
      // "where record's distance is at least the distance of the trip being
      // searched for, minus the radiuses of the origin/destination points"
      .filter(r.row('tripDistance').gt(tripDistance - originSearchRadius - destinationSearchRadius))
      .filter(r.row('routeLine').intersects(originRadius))
      .filter(r.row('routeLine').intersects(destinationRadius))
      .map((row) => {
        return row.merge({
          _fromOrigin: row('originPoint').distance(originPoint),
          _fromDestination: row('destinationPoint').distance(destinationPoint),
          _discrep: row('originPoint').distance(originPoint).add(row('destinationPoint').distance(destinationPoint)),
          _account: r.table('accounts').getAll(
            row('accountId'), {index:'id'}
          ).nth(0).without(['email'])
        });
      })
      .pluck(pluck)
      .orderBy('_discrep')
      .run(conn, {profile:true}, (err, response) => {
        if (err) { return done({err}); }
        // response.value is the cursor when profile:true
        response.value.toArray((err, results) => {
          if (err) { return done(err); }
          conn.close();
          done(null, {err, results, profile:response.profile});
        });
      });
  });
}


/**
 * Post a ride request.
 * @param  {Object}   data Ride details
 * @param  {Function} done Callback
 * @return {void}
 */
function _postRide(data, done) {
  const routeLine = makeRouteLine(data);
  const containmentPolygon = makeContainmentPolygon(data);
  const originPoint = makeOriginPoint(data);
  const destinationPoint = makeDestinationPoint(data);

  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table('rides').insert({
      routeLine,
      containmentPolygon,
      originPoint,
      destinationPoint,
      tripDistance: +(data.tripDistance),
      encodedPolyline: data.encodedPolyline,
      originZip: +(data.originZip),
      originCity: data.originCity,
      destinationZip: +(data.destinationZip),
      destinationCity: data.destinationCity,
      accountId: data.accountId
    }).run(conn, (err, resp) => {
      if (err) { return done(err); }
      conn.close();
      done(null, {err, resp});
    });
  });
}

function makeRouteLine(data) {
  return r.line(r.args(
    // The decoded polyline returns pairs in the form: [[lat, lng],...],
    // but we need to reverse it to [[lng, lat], ...]
    mapboxPolyline.decode(data.encodedPolyline).map((tuple) => {
      return [tuple[1], tuple[0]];
    })
  ));
}

function makeContainmentPolygon(data) {
  return r.polygon(r.args(data.containmentPolygon.map((pair) => {
    return [pair.lng, pair.lat];
  })));
}

function makeOriginPoint(data) {
  return r.point(+(data.originPoint.lng), +(data.originPoint.lat));
}

function makeDestinationPoint(data) {
  return r.point(+(data.destinationPoint.lng), +(data.destinationPoint.lat));
}

function makeOriginRadius(originPoint, data) {
  return r.circle(originPoint, +(data.originSearchRadius));
}

function makeDestinationRadius(destinationPoint, data) {
  return r.circle(destinationPoint, +(data.destinationSearchRadius));
}
