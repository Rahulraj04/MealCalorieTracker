const Admin = require('../models/admins');
module.exports = {
    //create a Admin 
    /**
     * @param {String} email 
     * @param {String} password 
     */
    createAdmin: async function(email,password){
        try{
            let uniqueId = uuidv1();
            let status = true;
            let createdAt = new Date().toISOString();
            let updatedAt = new Date().toISOString();
   
            let add_Admin = new Admin({
                email: email,
                password: password,
                uniqueId: uniqueId,
                status: status,
                createdAt: createdAt,
                updatedAt: updatedAt 
            });
   
            let savedData = await add_Admin.save().catch(error => {
                if(error){
                    return 0;
                }
            });
            
            if(savedData){
                return {status:200,message:'Admin Created Successfully'};
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
    checkAdmin: async function(email){
        try{
            getAdmin = await Admin.findOne({email:email});
            if(getAdmin == null){
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
     * @param {String} email 
     *
     */
    getAdmin: async function(email){
        try{
            getAdmin = await Admin.findOne({email:email});
            if(getAdmin == null){
                return 200;
            }else{
                return getAdmin;
            }
        }catch(exception){
            return 500;
        }
    },

}