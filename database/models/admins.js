const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Admins = new Schema({
name:{type:String},
email:{type:String,required:true,unique:true},
password:{type:String,required:true},
uniqueId:{type:String,required:true,unique:true},
status:{type:Boolean,default:true},
createdAt:{type:String},
updatedAt:{type:String}
});


//export the model
module.exports = mongoose.model('Admins',Admins);