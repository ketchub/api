const r = require('rethinkdb');
const async = require('async');
const schema = require('../config/schema.json');
const getConn = r.connect({
  db: process.env.NODE_ENV,
  host: process.env.RETHINK_HOST,
  port: 28015
});

getConn.then((conn) => {
  async.series([
    // Drop the database first
    (callback) => {
      r.dbDrop(process.env.NODE_ENV)
        .run(conn, (err, resp) => {
          if (err) {
            // console.warn(err.message);
            return callback();
          }
          // console.log(resp);
          return callback(null, resp);
        });
    },

    // Recreate the database
    (callback) => {
      r.dbCreate(process.env.NODE_ENV)
        .run(conn, (err, resp) => {
          if (err) {
            // console.warn(err.message);
            return callback();
          }
          // console.log(resp);
          return callback(null, resp);
        });
    },

    // Setup database tables
    (callback) => {
      async.each(schema, (schema, eachDone) => {
        r.tableCreate(schema.name, schema.options || {})
          .run(conn, (err, createResp) => {
            if (err) {
              // console.warn(err.message);
              return eachDone(err);
            }
            // if no secondary indexes, bail
            if (!schema.indices) {
              return eachDone(null, createResp);
            }
            // otherwise create secondary indexes
            async.each(schema.indices, (definition, indexDone) => {
              r.table(schema.name).indexCreate(
                definition[0],
                definition[1] || {}
              ).run(conn, (err, indexResp) => {
                if (err) {
                  // console.warn(err.message);
                  return indexDone(err);
                }
                // console.log(indexResp);
                indexDone(null, indexResp);
              });
            }, (err, indicesResults) => {
              if (err) {
                return eachDone(err);
              }
              eachDone(null, indicesResults);
            });
          })
      }, (err, tableResults) => {
        if (err) { return callback(err); }
        callback(null, tableResults);
      });
    }
  ], (err, results) => {
    if (err) {
      console.warn('ASYNC ERRORED WITH: ', err);
      return conn.close();
    }
    console.log('ASYNC COMPLETED WITH: ', results);
    conn.close();
  });
});
