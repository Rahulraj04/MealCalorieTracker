const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Users = new Schema({
name:{type:String},
email:{type:String,required:true,unique:true},
password:{type:String,required:true},
uniqueId:{type:String,required:true,unique:true},
calorieLimit:{type:Number,default:0},
status:{type:Boolean,default:true},
createdAt:{type:String},
updatedAt:{type:String}
});


//export the model
module.exports = mongoose.model('Users',Users);