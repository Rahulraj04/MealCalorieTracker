const user = require('../../database/models/users');
const userDBHelper = require('../../database/helpers/userHelper');
const admin = require('../../database/models/admins');
const adminDBHelper = require('../../database/helpers/adminHelper')
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
module.exports = {

    //for user login check
    isUserLogin: (req, res, next) => {
        try {
            let token = req.headers.authorization || req.body.token;
            console.log('token', token);
            jwt.verify(token, process.env.SECRET, async function (err, decoded) {
                if (err) {
                    return res.send(responseHelper.error(401, "please login again."));
                } else {
                    console.log("user decoded", decoded);
                    let role = decoded.role;
                    let userObject = '';
                    let uniqueId = '';
                    if (role === 'user') {
                        console.log("ddec", decoded);
                        uniqueId = decoded.userId;
                        userObject = await userDBHelper.getUser('uniqueId', uniqueId);
                    } else {
                        uniqueId = decoded.userId;
                        userObject = await adminDBHelper.getAdmin('uniqueId', uniqueId);
                    }
                    req.role = role;
                    req.user = userObject;
                    next();
                }
            })
            //  next();
        } catch (error) {
            console.log("err", error);
            return res.send(responseHelper.error(500, "Server Error occured"))
        }
    },

    //for admin login check
    isAdminLogin: (req, res, next) => {
        try {
            let token = req.headers.authorization || req.body.token;
            jwt.verify(token, process.env.SECRET, async function (err, decoded) {
                if (err) {
                    return res.send(responseHelper.error(401, "please login again."));
                } else {
                    console.log("user decoded", decoded);
                    let role = decoded.role;
                    let userObject = '';
                    let uniqueId = '';
                    if (role === 'user') {
                        return res.send(responseHelper.error(422, "You dont have access rights"));
                    } else {
                        uniqueId = decoded.userId;
                        userObject = await adminDBHelper.getAdmin('uniqueId', uniqueId);
                    }
                    req.role = role;
                    req.user = userObject;
                    next();
                }
            })
            //  next();
        } catch (error) {
            console.log("err", error);
            return res.send(responseHelper.error(500, "Server Error occured"))
        }
    },

    //validation middleware starts here login register fields validation
    loginRegisterModuleValidaiton: async(req, res, next) => {
        try {
            await check('email')
                .not()
                .isEmpty()
                .withMessage('Email should not be blank')
                .trim()
                .escape()
                .isEmail()
                .withMessage('Enter valid email address.')
                .run(req);
            await check('password')
                .not()
                .isEmpty()
                .withMessage('Password should not be blank')
                .trim()
                .escape()
                .isLength(3)
                .withMessage('Minimum password length should be 3 atleast')
                .custom(value => !/\s/.test(value))
                .withMessage('No spaces are allowed in the password')
                .run(req);
            await check('role')
                .not()
                .isEmpty()
                .withMessage('Role should not be blank')
                .trim()
                .escape()
                .custom((value) => {
                    if (value != 'user' && value != 'admin') {
                        return false;
                    } else {
                        return true;
                    }
                })
                .withMessage('Role should be either admin or user')
                .run(req)

            var errors = validationResult(req);
            console.log("errors validation", errors);
            if (!errors.isEmpty()) {
                return res.send(responseHelper.error(204, errors.array()[0].param + ' : ' + errors.array()[0].msg));
            } else {
                next();
            }
        } catch (error) {
            return res.send(responseHelper.error(500, "Server Error occured"));
        }
    },

    //add meal form validation
    addMealValidation: async(req, res, next) => {
        try {
            await check('name')
                .not()
                .isEmpty()
                .withMessage('Meal name should not be blank')
                .trim()
                .escape()
                .run(req)
            await check('items')
                .not()
                .isEmpty()
                .withMessage('items should not be blank')
                .trim()
                .escape()
                .run(req)
            await check('calorie')
                .not()
                .isEmpty()
                .withMessage('calorie should not be blank')
                .trim()
                .escape()
                .isNumeric()
                .withMessage('Numbers only allowed')
                .run(req)
            await check('date')
                .not()
                .isEmpty()
                .withMessage('Date should not be blank')
                .trim()
                .escape()
                .custom((value) => {
                    // First check for the pattern
                    if (!/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) 
                        return false;
                    
                    // Parse the date parts to integers
                    var parts = value.split("-");
                    var day = parseInt(parts[1], 10);
                    var month = parseInt(parts[0], 10);
                    var year = parseInt(parts[2], 10);

                    // Check the ranges of month and year
                    if (year < 1000 || year > 3000 || month == 0 || month > 12) 
                        return false;
                    
                    var monthLength = [
                        31,
                        28,
                        31,
                        30,
                        31,
                        30,
                        31,
                        31,
                        30,
                        31,
                        30,
                        31
                    ];

                    // Adjust for leap years
                    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) 
                        monthLength[1] = 29;
                    
                    // Check the range of the day
                    return day > 0 && day <= monthLength[month - 1];
                })
                .withMessage('Date should be in mm-dd-yyyy format')
                .run(req)
            await check('email')
                .optional()
                .not()
                .isEmpty()
                .withMessage('User Email Id should not be blank')
                .trim()
                .escape()
                .isEmail()
                .withMessage('Enter valid email address.')
                .run(req);
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.send(responseHelper.error(204, errors.array()[0].param + ' : ' + errors.array()[0].msg));
            } else {
                next();
            }
        } catch (error) {
            console.log('data format', 'server error occureed', error);
            return res.send(responseHelper.error(500, "Server Error occured"));
        }
    },

    //get meal list form validation
    getMealValidation: async(req, res, next) => {
        try {
            await check('from')
                .optional()
                .not()
                .isEmpty()
                .withMessage('Date should not be blank')
                .trim()
                .escape()
                .custom((value) => {
                    // First check for the pattern
                    if (!/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) 
                        return false;
                    
                    // Parse the date parts to integers
                    var parts = value.split("-");
                    var day = parseInt(parts[1], 10);
                    var month = parseInt(parts[0], 10);
                    var year = parseInt(parts[2], 10);

                    // Check the ranges of month and year
                    if (year < 1000 || year > 3000 || month == 0 || month > 12) 
                        return false;
                    
                    var monthLength = [
                        31,
                        28,
                        31,
                        30,
                        31,
                        30,
                        31,
                        31,
                        30,
                        31,
                        30,
                        31
                    ];

                    // Adjust for leap years
                    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) 
                        monthLength[1] = 29;
                    
                    // Check the range of the day
                    return day > 0 && day <= monthLength[month - 1];
                })
                .withMessage('Date should be in mm-dd-yyyy format')
                .run(req)
            await check('to')
                .optional()
                .not()
                .isEmpty()
                .withMessage('Date should not be blank')
                .trim()
                .escape()
                .custom((value, {
                    req
                }) => {
                    if (value === req.body.from) {
                        return false
                    } else {
                        return true
                    }
                })
                .withMessage('From and to date should not be same')
                .custom((value) => {
                    // First check for the pattern
                    if (!/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) 
                        return false;
                    
                    // Parse the date parts to integers
                    var parts = value.split("-");
                    var day = parseInt(parts[1], 10);
                    var month = parseInt(parts[0], 10);
                    var year = parseInt(parts[2], 10);

                    // Check the ranges of month and year
                    if (year < 1000 || year > 3000 || month == 0 || month > 12) 
                        return false;
                    
                    var monthLength = [
                        31,
                        28,
                        31,
                        30,
                        31,
                        30,
                        31,
                        31,
                        30,
                        31,
                        30,
                        31
                    ];

                    // Adjust for leap years
                    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) 
                        monthLength[1] = 29;
                    
                    // Check the range of the day
                    return day > 0 && day <= monthLength[month - 1];
                })
                .withMessage('Date should be in mm-dd-yyyy format')
                .run(req)
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.send(responseHelper.error(204, errors.array()[0].param + ' : ' + errors.array()[0].msg));
            } else {
                next();
            }
        } catch (error) {
            console.log('data format', 'server error occureed', error);
            return res.send(responseHelper.error(500, "Server Error occured"));
        }
    },

    //edit meal validation
    editMealValidation: async(req, res, next) => {
        try {
            await check('mealId')
                .not()
                .isEmpty()
                .withMessage('Meal Id should not be blank')
                .isAlpha()
                .trim()
                .escape()
                .run(req)
            await check('name')
                .optional()
                .not()
                .isEmpty()
                .withMessage('Meal name should not be blank')
                .trim()
                .escape()
                .run(req)
            await check('items')
                .optional()
                .not()
                .isEmpty()
                .withMessage('items should not be blank')
                .trim()
                .escape()
                .run(req)
            await check('calorie')
                .optional()
                .not()
                .isEmpty()
                .withMessage('calorie should not be blank')
                .trim()
                .escape()
                .isNumeric()
                .withMessage('Numbers only allowed')
                .run(req)
            await check('date')
                .optional()
                .not()
                .isEmpty()
                .withMessage('Date should not be blank')
                .trim()
                .escape()
                .custom((value) => {
                    // First check for the pattern
                    if (!/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) 
                        return false;
                    
                    // Parse the date parts to integers
                    var parts = value.split("-");
                    var day = parseInt(parts[1], 10);
                    var month = parseInt(parts[0], 10);
                    var year = parseInt(parts[2], 10);

                    // Check the ranges of month and year
                    if (year < 1000 || year > 3000 || month == 0 || month > 12) 
                        return false;
                    
                    var monthLength = [
                        31,
                        28,
                        31,
                        30,
                        31,
                        30,
                        31,
                        31,
                        30,
                        31,
                        30,
                        31
                    ];

                    // Adjust for leap years
                    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) 
                        monthLength[1] = 29;
                    
                    // Check the range of the day
                    return day > 0 && day <= monthLength[month - 1];
                })
                .withMessage('Date should be in mm-dd-yyyy format')
                .run(req)
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.send(responseHelper.error(204, errors.array()[0].param + ' : ' + errors.array()[0].msg));
            } else {
                next();
            }
        } catch (error) {
            console.log('data format', 'server error occureed', error);
            return res.send(responseHelper.error(500, "Server Error occured"));
        }
    },

    //delete meal validation
    deleteMealValidation: async(req, res, next) => {
        try {
            await check('mealId')
                .not()
                .isEmpty()
                .withMessage('Meal Id should not be blank')
                .trim()
                .escape()
                .run(req)
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.send(responseHelper.error(204, errors.array()[0].param + ' : ' + errors.array()[0].msg));
            } else {
                next();
            }
        } catch (error) {
            console.log('data format', 'server error occureed', error);
            return res.send(responseHelper.error(500, "Server Error occured"));
        }
    },

    //setting validation
    settingValidation: async(req, res, next) => {
        try {
            await check('calorie')
                .not()
                .isEmpty()
                .withMessage('calorie should not be blank')
                .trim()
                .escape()
                .isNumeric()
                .withMessage('Numbers only allowed')
                .run(req)
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.send(responseHelper.error(204, errors.array()[0].param + ' : ' + errors.array()[0].msg));
            } else {
                next();
            }
        } catch (error) {
            console.log('data format', 'server error occureed', error);
            return res.send(responseHelper.error(500, "Server Error occured"));
        }
    }
}