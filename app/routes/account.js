const _               = ACQUIRE('lodash');
const router          = ACQUIRE('express').Router();
const authentication  = ACQUIRE('#/authentication');
const bcrypt          = ACQUIRE('bcrypt');
const accountModel    = ACQUIRE('#/models/account');
const tokenizer       = ACQUIRE('#/authentication/tokenizer');
const writeSeedFile   = ACQUIRE('#/util/writeSeedFile');
router.MOUNT_POINT    = '/account';

module.exports = router;

/**
 * Create a new user account.
 * @type {[type]}
 */
router.post('/', (req, res, next) => {
  const payload = req.body;

  // temporary hack for user image management!
  payload.image = {
    thumbnail: 'https://randomuser.me/api/portraits/thumb/men/12.jpg',
    full: 'https://randomuser.me/api/portraits/men/12.jpg'
  };

  // hash the submitted password and create user account
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(payload.password, salt, (err2, hash) => {
      if (err2) { return next(err2); }
      payload.password = hash;
      accountModel.create(payload, (err3, userObj) => {
        if (err3) { return next(err3); }
        res.json({
          token: tokenizer(tokenizer.SCOPES.WEBUI, userObj)
        });

        // @todo: make this configurable
        payload.id = userObj.id;
        writeSeedFile('account', payload, (err) => {
          if (err) {
            return console.log('\n\n-- FAILED WRITING ACCOUNT SEED --\n\n', err);
          }
          console.log('Account seed generated OK.');
        });
      });
    });
  });
});

router.get('/', authentication.check, ( req, res, next ) => {
  accountModel.loadById(req.requestToken.accountId, (err, userObj) => {
    if (err) { return next(err); }
    // userObj contains potentially sensitive info, so we only want to return
    // a specific subset of fields
    res.json({
      id: userObj.id,
      email: userObj.email,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      image: userObj.image
    });
  });
});
