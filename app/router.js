const router  = require('express').Router();
const r       = require('rethinkdb');
const getConn = r.connect({
  db: 'test',
  host: process.env.RETHINK_HOST,
  port: 28015
});

module.exports = router;

router.get('/test', (req, res, next) => {
  // console.log(`Via ${process.env.RETHINK_HOST}`);
  // res.json({
  //   yea: 'sure'
  // });
  getConn.then((conn) => {
    r.table('lorem').insert({
      name: 'someone',
      testing: 'indiceX'
    }).run(conn, (err, result) => {
      if (err) {
        process.stdout.write(`Error on write: ${err.message}\n`);
        return res.json({ok:false, message: err.message});
      }
      console.log(`Request handled via ${process.env.RETHINK_HOST}`);
      res.json({ok:true, result:result});
    });
  }).error((err) => {
    process.stdout.write(`Error GENERIC: ${err.message}\n`);
    res.json({ok:false, message: err.message});
  });
});
