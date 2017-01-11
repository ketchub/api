const router          = ACQUIRE('express').Router();
const authentication  = ACQUIRE('#/authentication');
const bcrypt          = ACQUIRE('bcrypt');
const accountModel    = ACQUIRE('#/models/account');
const tokenizer       = ACQUIRE('#/authentication/tokenizer');
router.MOUNT_POINT    = '/account';

module.exports = router;

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
        // res.json(userObj);
      });
    });
  });
});

// router.get('/', authentication.check, ( req, res ) => {
//   res.json(req.requestToken);
// });
