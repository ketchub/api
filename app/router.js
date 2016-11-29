const _       = require('lodash');
const async   = require('async');
const router  = require('express').Router();
const r       = require('rethinkdb');
const getConn = r.connect({
  db: process.env.NODE_ENV,
  host: process.env.RETHINK_HOST,
  port: 28015
});

console.log(`\n\n RUNNING WITH NODE_ENV: ${process.env.NODE_ENV} \n\n`)

module.exports = router;

router.post('/search', (req, res, next) => {
  res.json({ok:'sure'});
});

// router.post('/make-request', (req, res, next) => {
//   getConn.then((conn) => {
//     r.table('rides').insert({
//       startPoint: r.point(+(req.body.startLng), +(req.body.startLat)),
//       endPoint: r.point(+(req.body.endLng), +(req.body.endLat)),
//       wouldDrive: stringToBool(req.body.wouldDrive),
//       flexible: stringToBool(req.body.flexible),
//       polypath: req.body.polypath
//     }).run(conn, (err, resp) => {
//       res.json({err, resp});
//     });
//   });
// });

router.get('/recent', (req, res, next) => {
  getConn.then((conn) => {
    r.table('rides').limit(10).run(conn, (err, cursor) => {
      if (err) { return res.json({err}); }
      cursor.toArray((err, results) => {
        if (err) { return res.json({err}); }
        res.json(results);
      });
    });
  });
});


function stringToBool(v) {
  return !!(v === "true" || v === true);
}
