require('../app/_bootstrap');
const r             = ACQUIRE('rethinkdb');
const async         = ACQUIRE('async');
const schema        = ACQUIRE('../config/schema.json');
const getConnection = ACQUIRE('#/lib/db/connection');
const dbName        = process.env.NODE_ENV;

getConnection((err, conn) => {
  if (err) {
    return console.warn('\n\n-- FAILED CONNECTING TO DATABASE --\n\n');
  }

  async.series([
    dropDatabase,
    createDatabase,
    createTables,
    createTableIndices
  ], (err) => {
    conn.close();
    if (err) {
      return console.log('__ERRORED__: ', err);
    }
    console.log('DB Setup Completed OK.');
  });

  /**
   * Drop the database before recreating it (should be made configurable via
   * CLI parameter?).
   * @param  {Function} callback onComplete
   * @return {void}
   */
  function dropDatabase(callback) {
    r.dbDrop(dbName).run(conn, (err, resp) => {
      if (err) {
        if (err.message.indexOf('does not exist') === -1) {
          console.log('!! Unable to drop DB, discontinuing !!');
          return callback(err);
        }
      }
      console.log(`-- Database dropped OK: ${dbName}`);
      callback();
    });
  }

  /**
   * Create database.
   * @param  {Function} callback onComplete
   * @return {void}
   */
  function createDatabase(callback) {
    r.dbCreate(dbName).run(conn, (err, resp) => {
      if (err) {
        console.log('!! Unable to create DB, discontinuing !!');
        return callback(err);
      }
      console.log(`-- Database created OK: ${dbName}`);
      callback();
    });
  }

  /**
   * Loop through the schema definition and create tables.
   * @param  {Function} callback onComplete
   * @return {void}
   */
  function createTables(callback) {
    async.each(schema, _makeTable, (err) => {
      // log messages occur in the iterator fn; just return err on failure
      if (err) { return callback(err); }
      callback();
    });

    function _makeTable(schemaObj, _makeTableDone) {
      const { tableName, options } = schemaObj;
      r.tableCreate(tableName, options || {}).run(conn, (err, resp) => {
        if (err) {
          console.log('!! Unable to create table, discontinuing !!');
          return _makeTableDone(err);
        }
        console.log(`-- Table created OK: ${dbName}.${tableName}`);
        _makeTableDone();
      });
    }
  }

  /**
   * Loop through schema definition again and create indices for given
   * tables.
   * @param  {Function} callback onComplete
   * @return {void}
   */
  function createTableIndices(callback) {
    async.each(schema, _makeTableIndices, (err) => {
      // log messages occur in the iterator fn; just return err on failure
      if (err) { return callback(err); }
      callback();
    });

    function _makeTableIndices(schemaObj, _makeTableIndexDone) {
      const { tableName } = schemaObj;
      // if no indices defined, just move on
      if (!schemaObj.indices) {
        console.log(`-- No indices defined for table ${dbName}.${tableName}`);
        return _makeTableIndexDone();
      }
      // indices are defined, loop through em
      async.eachSeries(schemaObj.indices, (indexDef, _makeIndexDone) => {
        const { indexName, opts } = indexDef;
        r.table(tableName)
          .indexCreate(indexName, opts || {})
          .run(conn, (err) => {
            if (err) {
              console.log('!! Unable to create index, discontinuing !!');
              return _makeIndexDone(err);
            }
            console.log(`-- Index created OK: ${dbName}.${tableName}/${indexName}`);
            _makeIndexDone();
          });
      }, (err) => {
        _makeTableIndexDone(err);
      })
    }
  }
});
