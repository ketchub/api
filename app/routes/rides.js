const r               = require('rethinkdb');
const async           = ACQUIRE('async');
const tripModel       = ACQUIRE('#/models/trip');
const writeSeedFile   = ACQUIRE('#/util/writeSeedFile');
const router          = ACQUIRE('express').Router();
router.MOUNT_POINT    = '/rides';

module.exports = router;

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
router.post('/add', (req, res, next) => {
  const data = req.body;
  // @todo: use real accountId - this is only for stubbing out during development
  data.accountId = r.db('development').table('accounts').sample(1).nth(0)('id');
  tripModel.postRide(data, (err, response) => {
    if (err) { return res.json({err}); }
    res.json(response);
  });
  // @todo: make this configurable
  writeSeedFile(req.body, (err) => {
    if (err) {
      return console.log('\n\n-- FAILED WRITING SEED FILE --\n\n');
    }
    console.log('Seed file generated OK.');
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
