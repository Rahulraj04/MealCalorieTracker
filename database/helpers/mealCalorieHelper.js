const MealCalorieDailyRecords = require('../models/mealCalorieDayRecords');

module.exports = {

    //a method to do update the daily consumed calorie level of a user 
    /**
     * 
     * @param {Object} mealObject //contains the data which will be used modify 
     */ 
    dailyLimitModifier: async function (mealObject) {
        try {
            //first check whether db contains a record with that data
            let filter = {
                'userId': mealObject.userId,
                'date': mealObject.date
            }
            let mealDailyLimit = await MealCalorieDailyRecords.findOne(filter);
            console.log("mea",mealDailyLimit);
            if (mealDailyLimit) {
                let mealDailyId = mealDailyLimit.uniqueId;
                let oldCalorie = mealDailyLimit.calories;
                let newCalorie = Number(oldCalorie) + Number(mealObject.calorie);
                let updateFilter = {
                    'uniqueId': mealDailyId
                }
                let updateContent = {
                    'calories': newCalorie
                }
                let result = await MealCalorieDailyRecords.findOneAndUpdate(updateFilter, updateContent, {
                    new: true
                }, function (error, updated) {
                    if (error) {
                        console.log("error", error);
                        return null;
                    }
                });
                if (result) {
                    return {"status": 200, "message": 'successfully modified'};
                } else {
                    return {"status": 422, "message": 'something went wrong while updating'};
                }
                //update the record
            } else {
                //add a new record to table
                let uniqueId = uuidv1();
                let createdAt = new Date().toISOString();
                let updatedAt = new Date().toISOString();
                let addMealDaily = new MealCalorieDailyRecords({
                    userId: mealObject.userId,
                    email: mealObject.email,
                    uniqueId: uniqueId,
                    calories: Number(mealObject.calorie),
                    date: mealObject.date,
                    isoDate: mealObject.isoDate,
                    createdAt: createdAt,
                    updatedAt: updatedAt
                });

                let savedData = await addMealDaily
                    .save()
                    .catch(error => {
                        if (error) {
                            console.log('error', error);
                            return null;
                        }
                    });

                if (savedData) {
                    return {status: 200, message: 'Record Created Successfully'};
                } else {
                    return {status: 500, message: 'Some Error Occured'};
                }
            }

        } catch (exception) {
            console.log("ex", exception);
            return {"status": 500, "message": 'Some error occured'};
        }
    },
    //a method to fetch the calorie value of a particular day
    /**
     * 
     * @param {String} date  //a particular date which have to be fetched
     * @param {String} userId  // user id 
     */ 
    getDailyConsumedData: async function(date,userId){
        try{
            let dailyRecord = await MealCalorieDailyRecords.findOne({'date':date,'userId':userId});
            if(dailyRecord){
                return dailyRecord.calories;
            }else{
                return 0;
            }
        }catch (exception) {
            return null;
        }
    }
}