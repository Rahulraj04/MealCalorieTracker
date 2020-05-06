var express = require('express');
var router = express.Router();
var index = require('../controller/indexController');
var middleware = require('./middleware/middleware');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*user and admin registeration */ 
router.post('/register',[middleware.loginRegisterModuleValidaiton],index.register);

//for user and admin login 
router.post('/login',[middleware.loginRegisterModuleValidaiton],index.login);

//for retrieving meal list of a user or latest by depending upon role 
router.post('/mealslist',[middleware.isUserLogin,middleware.getMealValidation],index.mealsList); 

//create a meal record for user 
router.post('/create',[middleware.isUserLogin,middleware.addMealValidation],index.createMeal);

//edit a meal record either by user or admin (Note:user can only edit his/her record)
router.post('/edit',[middleware.isUserLogin],index.editMeal);

//delte a meal record either by user or admin (Note:user can only delete his/her record)
router.post('/delete',[middleware.isUserLogin,middleware.deleteMealValidation],index.deleteMeal);

//edit user settings
router.post('/settings',[middleware.isUserLogin,middleware.settingValidation],index.settings);

//user list for admin
router.post('/users',[middleware.isAdminLogin],index.users);

module.exports = router;
