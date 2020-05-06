const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserMealRecords = new Schema({
userId:{type:String},
email:{type:String,required:true},
uniqueId:{type:String,required:true,unique:true},
name:{type:String,index:true},
items:{type:String,required:true},
calories:{type:Number,required:true},
date:{type:String,required:true},
isoDate:{type:Number,required:true},
createdAt:{type:String},
updatedAt:{type:String}
});


//export the model
module.exports = mongoose.model('UserMealRecords',UserMealRecords);