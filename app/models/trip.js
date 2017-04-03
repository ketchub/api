const _                 = ACQUIRE('lodash');
const r                 = ACQUIRE('rethinkdb');
const moment            = ACQUIRE('moment');
const getConnection     = ACQUIRE('#/lib/db/connection');
const mapboxPolyline    = ACQUIRE('@mapbox/polyline');
module.exports.search   = _search;
module.exports.postRide = _postRide;
module.exports.list  = _list;

function _list(params, done) {
  const { accountId } = params;
  const chronology = _.get(params, 'query.chronology', null);

  getConnection((err, conn) => {
    if (err) { return done(err); }
    let rdbQuery = r.table('rides').getAll(accountId, {index:'accountId'});

    if (chronology && chronology === 'upcoming') {
      rdbQuery = rdbQuery
        .filter(r.row('when').gt(r.now()))
        .orderBy(r.asc('when'));
    }
    if (chronology && chronology === 'previous') {
      rdbQuery = rdbQuery
        .filter(r.row('when').lt(r.now()))
        .orderBy(r.desc('when'));
    }

    rdbQuery
      .coerceTo('array')
      .run(conn, (err, response) => {
        if (err) { return done(err); }
        conn.close();
        done(null, response);
      });
  });
}

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
  const boxedRoute = makeBoxedRoute(data);
  const pluck = [
    'id', 'when', 'encodedPolyline', 'tripDistance', 'originAddress',
    'destinationAddress',
    '_discrep', '_fromOrigin', '_fromDestination',
    '_account',
  ];

  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table('rides', {readMode:'outdated'})
      .getIntersecting(boxedRoute, {index:'containmentPolygon'})
      // .getIntersecting(containmentPolygon, {index:'containmentPolygon'})
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
          ).without(['email', 'password']).nth(0) // this can cause reql errors (not particularly safe)
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
  const accountId = data.accountId;
  const routeLine = makeRouteLine(data);
  const containmentPolygon = makeContainmentPolygon(data);
  const originPoint = makeOriginPoint(data);
  const destinationPoint = makeDestinationPoint(data);
  const when = makeWhen(data);
  const payload = {
    accountId,
    routeLine,
    containmentPolygon,
    originPoint,
    destinationPoint,
    when,
    tripDistance: +(data.tripDistance),
    encodedPolyline: data.encodedPolyline,
    originAddress: data.originAddress,
    destinationAddress: data.destinationAddress,
    rideOrDrive: data.rideOrDrive ? data.rideOrDrive : 'RIDE',
    seatCapacity: data.seatCapacity ? +(data.seatCapacity) : null
  };

  if (data.id) { payload.id = data.id; }

  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table('rides').insert(payload, {returnChanges:true, conflict:"error"})
      .run(conn, (err, reply) => {
        conn.close();
        if (err) { return done(err); }
        if (reply && reply.errors) {
          return done(new Error(reply.first_error));
        }
        if (reply && reply.changes && !reply.changes.length) {
          return done(new Error('Error occurred, trip not created.'));
        }
        done(null, reply.changes[0].new_val);
      });
  });
}

function makeWhen(data) {
  const when = data.when ? moment.utc(data.when) : moment.utc();
  return r.time(
    when.year(),
    when.month() + 1, // month is 0 offset
    when.date(),
    when.hour(),
    when.minute(),
    0, // seconds
    'Z'
  );
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
  const { containmentPolygon } = data;
  return r.polygon(
    [containmentPolygon.east, containmentPolygon.north],
    [containmentPolygon.east, containmentPolygon.south],
    [containmentPolygon.west, containmentPolygon.south],
    [containmentPolygon.west, containmentPolygon.north]
  );
  // return r.polygon(r.args(data.containmentPolygon.map((pair) => {
  //   return [pair.lng, pair.lat];
  // })));
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

function makeBoxedRoute(data) {
  var d = data.routeBoxes.reduce((accumulator, current) => {
    accumulator.push([current.east, current.north]);
    accumulator.push([current.east, current.south]);
    accumulator.push([current.west, current.south]);
    accumulator.push([current.west, current.north]);
    return accumulator;
  }, []);
  // console.log(_.uniq(d));
  // return d;

  return r.polygon(r.args(
    data.routeBoxes.reduce((accumulator, current) => {
      accumulator.push([current.east, current.north]);
      accumulator.push([current.east, current.south]);
      accumulator.push([current.west, current.south]);
      accumulator.push([current.west, current.north]);
      return accumulator;
    }, [])
  ));
}
