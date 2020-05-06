const User = require('../models/users');
module.exports = {
    //create a user 
    /**
     * @param {String} email 
     * @param {String} password 
     */
    createUser: async function(email,password){
        try{
            let uniqueId = uuidv1();
            let status = true;
            let createdAt = new Date().toISOString();
            let updatedAt = new Date().toISOString();
   
            let add_user = new User({
                email: email,
                password: password,
                uniqueId: uniqueId,
                calorieLimit: null,
                status: status,
                createdAt: createdAt,
                updatedAt: updatedAt 
            });
   
            let savedData = await add_user.save().catch(error => {
                if(error){
                    return 0;
                }
            });
            
            if(savedData){
                return {status:200,message:'User Created Successfully'};
            }
            else{
                return {status:500,message:'Some Error Occured'};
            }
           }
           catch(error){
            return {status:500,message:'Some Error Occured'};
           }
    },

    //check whether given email id already exist in collection or not 
    /**
     * @param {String} email 
     *
     */
    checkUser: async function(email){
        try{
            getUser = await User.findOne({email:email});
            if(getUser == null){
                return 200;
            }else{
                return 401;
            }
        }catch(exception){
            return 500;
        }
    },

    //check whether given email id already exist in collection or not 
    /**
     * @param {String} key
     * @param {String} value 
     *
     */
    getUser: async function(key,value){
        try{
            getUser = await User.findOne({[key]:value});
            if(getUser == null){
                return 422;
            }else{
                return getUser;
            }
        }catch(exception){
            return 500;
        }
    },

    //user setting modification
    /**
     * 
     * @param {String} userId //user uniqueId
     * @param {*} calorie //daily calorie limit which user want to set
     */
    updateSettings: async function(userId,calorie){
        try{
            let getUser = await User.findOneAndUpdate({'uniqueId':userId},{'calorieLimit':calorie},{
                new: true
            }, function (error, updated) {
                if (error) {
                    console.log("error", error);
                    return null;
                }
            });
            if(getUser){
                return {status:200,message:'User updated successfully',result:getUser};
            }else{
                return {status:422,message:'Was not successfully updated'}
            }
        }catch(exception){
            return {status:500,message:'Some error occured while updating it'}
        }
    },
    //retrieve all users with only certian fields
    users: async function(){
        try{
            let users = await User.find({}).select("-password");
            if(users){
                return{status:200,message:'List of Users',result:users};
            }else{
                return {status:422,message:'No users Found'}
            }
        }catch(exception){
            return {status:500,message:'Some error occured while fetching users'}
        }
    }

}