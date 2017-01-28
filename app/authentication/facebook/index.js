const tokenizer = ACQUIRE('#/authentication/tokenizer');
const passport = ACQUIRE('passport');
const router = ACQUIRE('express').Router();
const accountModel = ACQUIRE('#/models/account');
const FacebookStrategy = ACQUIRE('passport-facebook').Strategy;
const request = ACQUIRE('request');
const writeSeedFile   = ACQUIRE('#/util/writeSeedFile');

module.exports = { router };

passport.use(new FacebookStrategy({
  clientID: FETCH_CONFIG('services.facebook.appID'),
  clientSecret: FETCH_CONFIG('services.facebook.secret'),
  callbackURL: 'https://lo.cal:4434/auth/facebook/callback',
  profileFields: [
    'id',
    'displayName',
    'about',
    'email',
    'first_name',
    'last_name',
    'gender',
    'hometown',
    'is_verified',
    'link',
    'location', // current location where person lives, as stated in profile
    'age_range',
    'cover'
  ]
}, function(accessToken, refreshToken, profile, cb) {
  console.log('FB LOGIN WITH:', profile._json);
  accountModel.loadByFacebookId(profile._json.id, (err, record) => {
    if (err) { // assume user hasn't created account yet, so set one up!
      request.get({
        url: `https://graph.facebook.com/v2.8/${profile._json.id}/picture?type=large&redirect=0`,
        headers: {
          'Authorization': accessToken
        }
      }, (err, resp, body) => {
        if (err) { return cb(err); } // @todo: move the picture query to a job
        const pictureResp = JSON.parse(body);
        const payload = {
          facebookId: profile._json.id,
          email: profile._json.email,
          firstName: profile._json.first_name,
          lastName: profile._json.last_name,
          image: pictureResp.data.url,
          facebookAccessToken: accessToken
        };
        console.log('facebook api resp: ', payload, profile._json);

        accountModel.create(payload, (err, record) => {
          if (err) { return cb(err); }
          cb(null, record);

          // @todo: make this configurable
          writeSeedFile('account', record, (err) => {
            if (err) {
              return console.log('FAILED WRITIN FACEBOOK ACCOUNT SEED');
            }
            console.log('Facebook account seed created');
          });
        });
      });
      return;
    }
    cb(null, record);
  });
}));

/**
 * Authenticate with facebook route (mounted at /auth/facebook).
 */
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['user_friends']
}));

router.get('/facebook/callback',
  passport.authenticate('facebook', {session:false}),
  ( req, res ) => {
    // @todo: unhardcode this url!
    res.redirect('https://lo.cal:4433/tokenized/' + tokenizer(tokenizer.SCOPES.WEBUI, req.user));
  }
);
