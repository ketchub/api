const _ = ACQUIRE('lodash');
const passport = ACQUIRE('passport');
const passportJwt = ACQUIRE('passport-jwt');
const StrategyJwt = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

/**
 * Export passport module (this is the only way it should be accessed; by
 * require('authentication').passport) to ensure middleware and configurations
 * have occurred.
 * @todo: this is a good argument for a DI framework?
 * @type {Object}
 */
module.exports = { passport, check };

/**
 * Bind passport middleware to use the JWT strategy.
 */
passport.use(new StrategyJwt({
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: FETCH_CONFIG('authentication.secret'),
  algorithms: [FETCH_CONFIG('authentication.algorithm')],
  issuer: FETCH_CONFIG('authentication.issuer')
}, (payload, done) => {
  // Only get here if the token validates; otherwise the passport.authenticate
  // method is invoked automatically and any arguments passed in are blank. In
  // order to pass an Error as the argument to passport.authenticate, we'd have
  // to return done(new Error('...')) here; but since we're just passing the
  // unencrypted token on as the data, we don't do any error handling stuff
  // here.
  done(null, payload);
}));

/**
 * Express middleware function for protected / routes that require
 * authentication.
 */
function check(req, res, next) {
  return passport.authenticate('jwt', {session:false}, (err, requestToken) => {
    if (err) { return next(err); }
    if (!requestToken) { return next(new Error('Authentication token missing.')); }
    if (!_.get(requestToken, 'accountId')) { return next(new Error('Malformed token.')); }
    req.requestToken = requestToken;
    next();
  })(req, res, next);
}
