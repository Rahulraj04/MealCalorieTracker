const passport = require('passport');
const jwt = require('jsonwebtoken');
const userHelper = require('../database/helpers/userHelper');
const mealDBHelper = require('../database/helpers/mealHelper');
const mealCalorieHelper = require('../database/helpers/mealCalorieHelper');
const moment = require('moment');
module.exports = {

    //regsiter module logic for  user and admin  
    register: (req, res, next) => {
        let roleType = req.body.role;
        let passportLogic = '';
        let successMessage = '';
        if (roleType.toLowerCase() === 'user') {
            passportLogic = 'local-signup';
            successMessage = 'User created Successfully';
        } else if (roleType.toLowerCase() === 'admin') {
            passportLogic = 'admin-signup';
            successMessage = 'Admin created Successfully';
        } else {
            return res.send(responseHelper.error(500, 'No such role available'));
        }
        passport.authenticate(passportLogic, {
            session: false,
            failureMessage: true,
            failureFlash: true
        }, async (error, user, info) => {
            try {
                if (error || !user || info) {

                    var message = error ? null : info;
                    return res.send(responseHelper.error(302, message));
                }
                return res.send(responseHelper.successWithUpdateMessage(successMessage));
            } catch (exception) {
                return res.send(responseHelper.error(500, exception));
            }
        })(req, res, next);

    },

    // both admin and user can login with this method by role type
    login: (req, res, next) => {
        console.log("req.body", req.body);
        let roleType = req.body.role;
        let passportLogic = '';
        let successMessage = '';
        if (roleType.toLowerCase() === 'user') {
            passportLogic = 'local-login';
            successMessage = 'User Logged In Successfully';
        } else if (roleType.toLowerCase() === 'admin') {
            passportLogic = 'admin-login';
            successMessage = 'Admin Logged In Successfully';
        } else {
            return res.send(responseHelper.error(500, 'No such role available'));
        }
        passport.authenticate(passportLogic, {
            session: false,
            failureMessage: true,
            failureFlash: true
        }, async (error, user, info) => {
            try {
                if (error || !user || info) {

                    var message = error ? null : info;
                    return res.send(responseHelper.error(302, message));
                }
                //create jwt token for the logged in user/admin 
                //jwt session generation 
                console.log("user jwt", user);
                let token = '';
                if (roleType.toLowerCase() === 'user') {
                    token = jwt.sign({
                        userId: user.uniqueId,
                        email: user.email,
                        calorie: user.calorieLimit,
                        role: roleType
                    }, process.env.SECRET, {
                        expiresIn: process.env.tokenLife
                    });
                } else {
                    token = jwt.sign({
                        userId: user.uniqueId,
                        email: user.email,
                        role: roleType
                    }, process.env.SECRET, {
                        expiresIn: process.env.tokenLife
                    });
                }

                return res.send(responseHelper.successWithResult(200, successMessage, token));
            } catch (exception) {
                return res.send(responseHelper.error(500, exception));
            }
        })(req, res, next);
    },

    //for list of top 15 meals of a user or last 15 meals depeding upon the role type of loggedin user
    mealsList: async function (req, res) {
        try {
            let role = req.role;
            let userObject = req.user;
            let fromDate = req.body.from === undefined ? null : req.body.from;
            let toDate = req.body.to === undefined ? null : req.body.to;
            let filter = {
                "fromDate": fromDate,
                "toDate": toDate
            };
            var data = moment('04-05-2020').format("X");
            console.log("filter", filter, data);
            let getMealList = await mealDBHelper.getMealList(role, userObject, filter);
            if (getMealList.status === 200) {
                return res.send(responseHelper.successWithResult(200, 'List of Meals', getMealList.result));
            } else {
                return res.send(responseHelper.error(getMealList.status, getMealList.message));
            }
        } catch (exception) {
            console.log("exception data",exception);
            return res.send(responseHelper.error(500, 'Server Error'));
        }
    },

    //for creating a meal record
    createMeal: async function (req, res) {
        try {
            let name = req.body.name;
            let items = req.body.items;
            let calorie = req.body.calorie;
            let date = Date.parse(req.body.date); //it will reduce one month since in js months start from zero 
            console.log('mydate', date);
            let email = '';
            let user = '';
            let userId = '';
            if(req.role ==='admin'){
                email = req.body.email;
                //check email existence
                let getUser = await userHelper.getUser('email',email);
                if(getUser === 422){
                    return res.send(responseHelper.error(422, 'User email id doesnt Exist'));
                }else{
                     user = getUser;
                     userId = user.uniqueId;
                }
            }else{
                user = req.user;
                userId = user.uniqueId;
                email = user.email;
            }
            let mealObject = {
                "name": name,
                'userId': userId,
                'email': email,
                'items': items,
                'calorie': calorie,
                "date": req.body.date,
                "isoDate": date
            };
            console.log("date", date);
            //check whether already same record exist 
            let checkMeal = await mealDBHelper.checkMeal(name, req.body.date);
            if (checkMeal === 200) {
                let createMeal = await mealDBHelper.createMeal(mealObject);
                if (createMeal.status === 200) {
                    //add/edit daily limit of it 
                    let createDailyRecord = await mealCalorieHelper.dailyLimitModifier(mealObject);
                    if(createDailyRecord.status === 200){
                        let filter = {
                            "fromDate": null,
                            "toDate": null
                        };
                        let mealList = await mealDBHelper.getMealList(req.role, user, filter);
                        return res.send(responseHelper.successWithResult(200, 'List of Meals', mealList.result));
                    }else{
                        return res.send(responseHelper.error(createDailyRecord.status, createDailyRecord.message));
                    } 
                } else {
                    return res.send(responseHelper.error(createMeal.status, createMeal.message));
                }
            } else if (checkMeal == 422) {
                return res.send(responseHelper.error(422, 'Record Already Exist'));
            } else {
                return res.send(responseHelper.error(500, 'something went wrong while check record existence'));
            }
        } catch (exception) {

            return res.send(responseHelper.error(500, 'Server Error'));
        }
    },

    //edit meal by given uniqueid of meal 
    editMeal: async function (req, res) {
        try {
            let uniqueId = req.body.mealId;
            
            let name = req.body.name;
            let items = req.body.items;
            let calorie = req.body.calorie;
            let date = req.body.date;
            if(name === undefined && items === undefined && calorie === undefined && date === undefined){
                return res.send(responseHelper.error(422,'Atleast anyone one field have to be given '));
            }
            let isoDate = '';
            let user = req.user;
            let userId = user.uniqueId;
            let email = user.email;
            let role = req.role;
            let mealObject = {
                
            }
            //fetch mealrecord by given uniqueId
            let getMeal = await mealDBHelper.getMeal('uniqueId', uniqueId);
            console.log('userid ', userId, getMeal);
            if (getMeal.status === 200) {
                name = name===undefined ? getMeal.result.name:name;
                if(items === undefined){
                    items = getMeal.result.items;
                }
                calorie = Number(calorie===undefined?getMeal.result.calories:calorie);
                date = date===undefined?getMeal.result.date:date;
                isoDate = Date.parse(date);
                mealObject = {
                    "name": name,
                    "items": items,
                    "calorie": calorie,
                    "date": date,
                    "isoDate":isoDate
                }
                console.log('dateeeee',name,items,calorie,date,isoDate);
                if (role === 'user') {
                    if (userId != getMeal.result.userId) {
                        return res.send(responseHelper.error(422, 'You don`t have access right to edit this record.'));
                    }
                }

                //check whether with same name and date record exist
                let checkMeal = ''
                if(name != getMeal.result.name && date != getMeal.result.date){
                    checkMeal = await mealDBHelper.checkMeal(name, date);
                }else{
                    checkMeal = 200;
                }
                
                if (checkMeal === 200) {
                    createMeal = await mealDBHelper.editMeal(uniqueId, mealObject);
                    if (createMeal.status === 200) {
                        //modify dailyRecord if calorie is modified
                        if(calorie != getMeal.result.calories){
                            let dailyRecord ={
                                "userId":getMeal.result.userId,
                                "date":getMeal.result.date,
                                "calorie":  calorie - getMeal.result.calories
                            }
                            let updateCalorie = await mealCalorieHelper.dailyLimitModifier(dailyRecord);
                        }
                        let filter = {
                            "fromDate": null,
                            "toDate": null
                        };
                        let mealList = await mealDBHelper.getMealList(role, user, filter);
                        return res.send(responseHelper.successWithResult(200, 'Meal edited Successfully', mealList.result));
                    } else {
                        return res.send(responseHelper.error(createMeal.status, createMeal.message));
                    }
                } else if (checkMeal == 422) {
                    return res.send(responseHelper.error(422, 'Record Already Exist'));
                } else {
                    return res.send(responseHelper.error(500, 'something went wrong while check record existence'));
                }

            } else if (getMeal.status === 422) {
                return res.send(responseHelper.error(getMeal.status, getMeal.message));
            } else {
                return res.send(responseHelper.error(500, 'Something went while fetching record'));
            }


        } catch (exception) {

            return res.send(responseHelper.error(500, 'Server Error'));
        }
    },

    //edit meal by given uniqueid of meal 
    deleteMeal: async function (req, res) {
        try {
            let uniqueId = req.body.mealId;
            let name = req.body.name;
            let items = req.body.items;
            let calorie = req.body.calorie;
            let date = req.body.date;
            let user = req.user;
            let userId = user.uniqueId;
            let email = user.email;
            let role = req.role;
            let mealObject = {
                "name": name,
                "items": items,
                "calorie": calorie,
                "date": date
            }
            //fetch mealrecord by given uniqueId
            let getMeal = await mealDBHelper.getMeal('uniqueId', uniqueId);
            console.log('userid ', userId, getMeal);
            if (getMeal.status === 200) {
                if (role === 'user') {
                    if (userId != getMeal.result.userId) {
                        return res.send(responseHelper.error(422, 'You don`t have access right to edit this record.'));
                    }
                }

                //delete meal record 
                deleteMeal = await mealDBHelper.deleteMeal(uniqueId, mealObject);
                if (deleteMeal.status === 200) {
                    let dailyRecord ={
                        "userId":getMeal.result.userId,
                        "date":getMeal.result.date,
                        "calorie":  -1 * getMeal.result.calories
                    }
                    let updateCalorie = await mealCalorieHelper.dailyLimitModifier(dailyRecord);

                    let filter = {"fromDate":null,"toDate":null};
                    let mealList = await mealDBHelper.getMealList(req.role, user,filter);
                    return res.send(responseHelper.successWithResult(200, 'Meal deleted Successfully', mealList.result));
                } else {
                    return res.send(responseHelper.error(deleteMeal.status, deleteMeal.message));
                }

            } else if (getMeal.status === 422) {
                return res.send(responseHelper.error(getMeal.status, getMeal.message));
            } else {
                return res.send(responseHelper.error(500, 'Something went while fetching record'));
            }


        } catch (exception) {
            return res.send(responseHelper.error(500, 'Server Error'));
        }
    },

    //edit user settings 
    settings: async function(req,res){
        try{
            let calorie = req.body.calorie;
            let userId = req.user.uniqueId;
            let updatedUser = await userHelper.updateSettings(userId,calorie);
            if(updatedUser.status ===200){
                return res.send(responseHelper.successWithResult(200, 'User updated Successfully', {updatedCalorieLimit:updatedUser.result.calorieLimit}));
            }else{
                return res.send(responseHelper.error(updatedUser.status,updatedUser.message));
            }
        }catch(exception){
            return res.send(responseHelper.error(500,'Server Error'));
        }
    },

    //user list for admin 
    users: async function(req,res){
        try{
            let users = await userHelper.users();
            if(users.status === 200){
                res.send(responseHelper.successWithResult(200, users.message,users.result));
            }else{
                return res.send(responseHelper.error(users.status,users.message));
            }

        }catch(exception){
            console.log('users helper',exception)
            return res.send(responseHelper.error(500,'Server Error'));
        }
    }

}