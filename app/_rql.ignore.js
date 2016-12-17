Copy-able directly into ReQL browser terminal
var orgPt = r.point(-104.96313800000001, 39.746302); // 1882 race st
var orgPt2 = r.point(-104.9631380102, 39.749302); // "near" 1882 st
var dstPt = r.point(-105.93473840000001, 39.5791675); // keystone
var orgR = r.circle(orgPt, 100);
var dstR = r.circle(dstPt, 150000);

r.db('development').table('rides')
  .getIntersecting(orgR, {index:'originPoint'})
  //.map(function(row) { return row.merge({_fromOrigin: row('originPoint').distance(orgPt2)}) })
  .union(
    r.db('development').table('rides')
    .getIntersecting(dstR, {index:'destinationPoint'})
    //.map(function(row) { return row.merge({_fromDest: row('destinationPoint').distance(dstPt)}) })
  )
  .map(function(row){
    return row.merge({
      _fromOrigin: row('originPoint').distance(orgPt2),
      _fromDest: row('destinationPoint').distance(dstPt),
      _discrep: row('originPoint').distance(orgPt2).add(row('destinationPoint').distance(dstPt))
    })
  })
  .distinct()
  .pluck(
    'id',
    'originCity',
    'destinationCity',
    'originZip',
    'destinationZip',
    '_fromOrigin',
    '_fromDest',
    '_totalDiscrep'
  )
  .orderBy('_totalDiscrip')
