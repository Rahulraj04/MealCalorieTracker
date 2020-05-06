var LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const user = require('../database/models/users');
const userDBHelper = require('../database/helpers/userHelper');
const admin = require('../database/models/admins');
const adminDBHelper = require('../database/helpers/adminHelper')

module.exports = function (passport) {
    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.email);
    });

    //password comparison logic helper method
    const comparePassword = async function (cryptPassword, normalPassword) {
        
        var res = await bcrypt.compare(cryptPassword, normalPassword);
        return res;
    }

    //local strategy for user generation 
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
      },
        async function (req, email, password, done) {
            process.nextTick(async function () {
                // find a user whose email is the same as the forms email
                var userResponse = await userDBHelper.checkUser(email);
                
                if (userResponse === 200) {
                    // var hashPassword = generateHash(password);
                    var hashPassword = await bcrypt.hash(password, saltRounds)
                        .catch(function (err) {
                            return done(null, null, "Error in exchange Password hash.");
                        });
                    var createUser = await userDBHelper.createUser(email, hashPassword);
                    
                    if (createUser.status === 200) {
                        var result = ({
                            status: 1,
                            message: createUser.message,
                            result: createUser.id
                        });
                        return done(null, result, null);
                    } else {
                        return done(null, null, createUser.message);
                    }
                } else if(userResponse === 401){
                    return done(null, false, 'Email id already exist');
                }else{
                    return done(null, false,'Something Went Wrong');
                }
            });
        }));

        

        passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
          },
            async function (req, email, password, done) {
                process.nextTick(async function () {
                    // find a user whose email is the same as the forms email
                    var userResponse = await userDBHelper.getUser('email',email);
                    console.log('userRes',userResponse);
                    if(userResponse === 200)
                        return done(null,false,'Email id does not exist');
                    if(userResponse === 500)
                    return done(null,false,'Something went Wrong');
                    if (userResponse.password == null || (!await comparePassword(password, userResponse.password)))
                        return done(null, false, 'Email Id or Password is Incorrect.'); // create the loginMessage and save it to session as flashdata
                    // all is well, return successful user
                    return done(null, userResponse);
                });
            }));   
            
            passport.use('admin-signup', new LocalStrategy({
                // by default, local strategy uses username and password, we will override with email
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true // allows us to pass back the entire request to the callback
              },
                async function (req, email, password, done) {
                    process.nextTick(async function () {
                        // find a user whose email is the same as the forms email
                        var adminResponse = await adminDBHelper.checkAdmin(email);
                        
                        if (adminResponse === 200) {
                            // var hashPassword = generateHash(password);
                            var hashPassword = await bcrypt.hash(password, saltRounds)
                                .catch(function (err) {
                                    return done(null, null, "Error in exchange Password hash.");
                                });
                            var createAdmin = await adminDBHelper.createAdmin(email, hashPassword);
                            
                            if (createAdmin.status === 200) {
                                var result = ({
                                    status: 1,
                                    message: createAdmin.message,
                                    result: createAdmin.id
                                });
                                return done(null, result, null);
                            } else {
                                return done(null, null, createAdmin.message);
                            }
                        } else if(userResponse === 401){
                            return done(null, false, 'Email id already exist');
                        }else{
                            return done(null, false,'Something Went Wrong');
                        }
                    });
                }));
        
                
        
                passport.use('admin-login', new LocalStrategy({
                    // by default, local strategy uses username and password, we will override with email
                    usernameField: 'email',
                    passwordField: 'password',
                    passReqToCallback: true // allows us to pass back the entire request to the callback
                  },
                    async function (req, email, password, done) {
                        process.nextTick(async function () {
                            // find a user whose email is the same as the forms email
                            var adminResponse = await adminDBHelper.getAdmin(email);
        
                            if(adminResponse === 200)
                                return done(null,false,'Email id does not exist');
                            if(adminResponse === 500)
                            return done(null,false,'Something went Wrong');
                            if (adminResponse.password == null || (!await comparePassword(password, adminResponse.password)))
                                return done(null, false, 'Email Id or Password is Incorrect.'); // create the loginMessage and save it to session as flashdata
                            // all is well, return successful user
                            return done(null, adminResponse);
                        });
                    }));   
                    
                
}
