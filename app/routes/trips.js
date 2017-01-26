const r               = require('rethinkdb');
const async           = ACQUIRE('async');
const tripModel       = ACQUIRE('#/models/trip');
const authentication  = ACQUIRE('#/authentication');
const writeSeedFile   = ACQUIRE('#/util/writeSeedFile');
const router          = ACQUIRE('express').Router();
router.MOUNT_POINT    = '/trips';

module.exports = router;

/**
 * Fetch user's rides / history.
 */
router.get('/list', authentication.check, (req, res, next) => {
  tripModel.list({
    accountId: req.requestToken.accountId,
    query: req.query
  }, (err, response) => {
    if (err) { return res.json({err}); }
    res.json(response);
  });
});

/**
 * Search (using POST because we send a pretty huge array defining the route
 * polyline).
 */
router.post('/search', (req, res, next) => {
  tripModel.search(req.body, (err, response) => {
    if (err) { return res.json({err}); }
    res.json(response);
  });
});

/**
 * Post a ride (write to the database).
 */
router.post('/add', authentication.check, (req, res, next) => {
  const data = req.body;
  data.accountId = req.requestToken.accountId;

  tripModel.postRide(data, (err, response) => {
    if (err) { return res.json({err}); }
    res.json({err, response});

    // @todo: make this configurable
    data.id = response.id;
    writeSeedFile('trip', data, (err) => {
      if (err) {
        return console.log('\n\n-- FAILED WRITING TRIP FILE --\n\n', err);
      }
      console.log('Seed file generated OK.');
    });
  });
});


// router.get('/recent', (req, res, next) => {
//   getConn.then((conn) => {
//     r.table('rides').limit(10).run(conn, (err, cursor) => {
//       if (err) { return res.json({err}); }
//       cursor.toArray((err, results) => {
//         if (err) { return res.json({err}); }
//         res.json({err, results});
//       });
//     });
//   });
// });

function stringToBool(v) {
  return !!(v === "true" || v === true);
}
