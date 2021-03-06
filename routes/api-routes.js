// Requiring our models and passport as we've configured it
var db = require('../models');
var passport = require('../config/passport');
var astroJs = require('aztro-js');
var axios = require('axios');

function isUniqueSearch(date, id) {
  return db.Search.count({ where: { date: date, userId: id } })
    .then(function (count) {
      if (parseInt(count) !== 0) {
        return false;
      }
      return true;
    });
}

module.exports = function (app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post('/api/login', passport.authenticate('local'), function (req, res) {
    res.json(req.user);
  });

  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  app.post('/api/signup', function (req, res) {
    var signRes;
    axios({
      method: 'POST',
      url: 'https://astrology-horoscope.p.rapidapi.com/zodiac_finder/result',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': 'astrology-horoscope.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        useQueryString: true,
      },
      data: {
        v4: 'json',
        mystic_dob: req.body.DOB,
      },
    }).then(function (response) {
      // console.log(response.data);
      signRes = response.data.data.sunsign;
      db.User.create({
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        DOB: req.body.DOB,
        sign: signRes,
      }).then(function () {
        res.redirect(307, '/api/login');
      }).catch(function (err) {
        // console.log(err);
        res.status(422).json(err.errors[0].message);
      });
    }).catch(function () {
      // if DOB is not valid
      res.status(422).json('Birthday is not valid');
    });
    // console.log(signRes);
  });

  // Route for logging user out
  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  // Route for getting some data about our user to be used client side
  app.get('/api/user_data', function (req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        username: req.user.username,
        id: req.user.id,
        DOB: req.user.DOB,
        name: req.user.name,
        sign: req.user.sign
      });
    }
  });

  // Routes for getting horoscopes calling astroJs npm package
  app.get('/api/allHoroscopes/', function (req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      var sign = req.user.sign;
      astroJs.getAllHoroscope(sign, function (response) {
        res.json(response);
      });
    }
  });

  app.post('/api/saveSearch', function (req, res) {

    db.Search.create({
      date: req.body.search.date,
      description: req.body.search.description,
      mood: req.body.search.mood,
      color: req.body.search.color,
      lucky_number: req.body.search.lucky_number,
      lucky_time: req.body.search.lucky_time,
      UserId: req.user.id,
    })
      .then(function (results) {
        res.json(results);
      })
      .catch(function (err) {
        // console.log(err);
        res.status(401).json(err);
      });
  });

  // return user object from database
  app.get('/api/search/:date', function (req, res) {
    isUniqueSearch(req.params.date, req.user.id).then(function (isUnique) {
      res.json(isUnique);
    });
  });

  app.get('/api/searches', function (req, res) {
    db.Search.findAll({
      where: {
        UserId: req.user.id,
      },
    })
      .then(function (results) {
        res.json(results);
      })
      .catch(function (err) {
        // console.log(err);
        res.status(401).json(err);
      });
  });
};
