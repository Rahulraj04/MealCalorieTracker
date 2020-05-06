const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let MealCalorieDayRecords = new Schema({
userId:{type:String},
email:{type:String,required:true},
uniqueId:{type:String,required:true,unique:true},
calories:{type:Number,required:true},
date:{type:String,index:true,required:true},
isoDate:{type:Number,required:true},
createdAt:{type:String},
updatedAt:{type:String}
});


//export the model
module.exports = mongoose.model('MealCalorieDayRecords',MealCalorieDayRecords);