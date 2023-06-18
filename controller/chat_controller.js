const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const LocalStrategy = require("passport-local").Strategy;

passport.use(
    new LocalStrategy(async(username, password, done) => {
      try {
        const user = await User.findOne({ username: username });
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        };
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            // passwords match! log user in
            return done(null, user)
          } else {
            // passwords do not match!
            return done(null, false, { message: "Incorrect password" })
          }
        })
        
        return done(null, user);
      } catch(err) {
        return done(err);
      };
    })
  );
  
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(async function(id, done) {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch(err) {
      done(err);
    };
  });

exports.sign_up_get = (req, res, next) => {
    res.render('sign_up');
};

exports.sign_up_post = [
    // sanitization and validation
    body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isAscii().withMessage('Must use letters or numbers or special characters')
    .customSanitizer((value) => {
        // forcing all letters to lowercase so unique usernames aren't case sensitive
        return value.toLowerCase();
    })
    .escape(),

    body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isAscii().withMessage('Musst use letters or numbers or special characters')
    .escape(),

    body('firstname')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isAlpha().withMessage('Must use letters')
    .escape(),

    body('lastname')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isAlpha().withMessage('Must use letters')
    .escape(),

    body('membership')
    .notEmpty().withMessage('Membership status is required'),

    body('admin')
    .notEmpty().withMessage('Admin status is required'),

    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('sign_up', {
                username: req.body.username,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                errors: errors.array()
            });
        }

            try {
              const hashedPassword = await bcrypt.hash(req.body.password, 10);
          
              const user = new User({
                first_name: req.body.firstname,
                last_name: req.body.lastname,
                username: req.body.username,
                password: hashedPassword,
                membership: req.body.membership,
                admin: req.body.admin
              });
              const result = await user.save();
              res.redirect("/");
            } catch(err) {
              return next(err);
            };
        })
];


exports.log_in = [
    passport.authenticate('local', { failureRedirect: '/bs' }),

    function (req, res, next) { 
      res.render('index', { user: req.user}); 
    }
]
