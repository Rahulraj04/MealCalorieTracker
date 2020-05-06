const MealRecords = require('../models/userMealRecords');
const dailyRecordHelper = require('../helpers/mealCalorieHelper');
const userHelper = require('../helpers/userHelper');
//a helper function to calculate the color according to daylimit for user
/**
 *
 * @param {Array} mealList //array of mealdata
 * @param {Number} userCalorieLimit //calorie limit of user
 */
let calorieDayStatus = async function (mealList, userCalorieLimit,userId) {
    try {
    
        let length = mealList.length;
        console.log("mealListLength",length);
        let matchingArray = [];
        let finalArray = [];
        let nextMeal = '';
        let currentMeal = '';
        let color = '';
        for (let i = 0; i < length; i++) {
            currentMeal = mealList[i];
            if(i+1 < length){
                nextMeal = mealList[i + 1];
            }else{
                nextMeal = {"date":null};
            }

            //check whether date are same
            if (nextMeal.date === currentMeal.date) {

                //add it to matching Array
                if (matchingArray.length === 0) {
                    matchingArray.push(currentMeal, nextMeal);
                } else {
                    matchingArray.push(nextMeal);
                }
            } else {
                if (matchingArray.length === 0) {
                    currentMeal.color = userCalorieLimit <= currentMeal.calories ? 'RED':'GREEN';
                    if(nextMeal.data != null){
                        nextMeal.color = userCalorieLimit <= nextMeal.calories ? 'RED':'GREEN';
                        finalArray.push(currentMeal,nextMeal);
                    }else{
                        finalArray.push(currentMeal);
                    }
                    
                } else {
                    //fetch daily value of that user from mealcalorie daily record
                    let dayConsumedValue = await dailyRecordHelper.getDailyConsumedData(matchingArray[0].date,userId);
                    let color = dayConsumedValue > userCalorieLimit ? 'RED':'GREEN';
                    //now set this color to matching array
                    for (let j = 0; j < matchingArray.length; j++) {
                        matchingArray[j].color = color;
                        finalArray.push(matchingArray[j]);
                    }
                    //reset the matching array
                    console.log(matchingArray.length,i,"this is for demo");
                    matchingArray = [];
                    
                }
            }
        }
        return finalArray;
    } catch (exception) {
        console.log("error",exception);
        return null;
    }
};

/**
 *
 * @param {Array} mealList //array of mealdata
 * 
 */
let adminCalorieStatus = async function(mealList){
    try{
        let length = mealList.length;
        console.log("mealListLength",length);
        let finalArray = [];
        let userId ='';
        let userObject = '';
        let userCalorieLimit = '';
        let dailyRecord = '';
        let date = '';
        let color = '';
        for (let i = 0; i < length; i++) {
            let mealData = mealList[i];
            userId = mealData.userId;
            date = mealData.date;
            userObject = await userHelper.getUser('uniqueId',userId);
            userCalorieLimit = userObject.calorieLimit;
            dailyRecord = await dailyRecordHelper.getDailyConsumedData(date,userId);
            color = userCalorieLimit < dailyRecord ? 'RED':'GREEN';
            mealData.color = color; //setting color value 
            finalArray.push(mealData);
        }
        return finalArray;
    }catch (exception) {
        console.log("error",exception);
        return null;
    }
}
module.exports = {
    //meallist retrieval with limit either by user or by top 15 records
    /**
     * @param {String} role //for eg user or admin
     * @param {Object} user  //user or admin db object
     * @param {Object} filter //contains filter options such as from date ,to date, limit and page
     */
    getMealList: async function (role, user, filter) {
        try {
            console.log("user", role, user);
            let fromDate = filter.fromDate;
            let toDate = filter.toDate;
            let mealRecords = '';
            let mealQueryObject = {};
            let result = {}
            let fromIsoDate = '';
            let toIsoDate = '';
            console.log('Date parse', Date.parse(fromDate));
            //if no date filter is applied defualt limit is applied
            if (fromDate !== null && toDate !== null) {
                fromIsoDate = Date.parse(fromDate);
                toIsoDate = Date.parse(toDate);
                mealQueryObject = {
                    $and: [
                        {
                            isoDate: {
                                $gte: fromIsoDate
                            },
                            isoDate: {
                                $lte: toIsoDate
                            }
                        }
                    ]

                }
            } else if (fromDate !== null) {
                fromIsoDate = Date.parse(fromDate);
                console.log("Dara", fromIsoDate, Date.parse(fromDate), fromDate);
                mealQueryObject = {
                    isoDate: {
                        $gte: fromIsoDate
                    }

                }
            } else if (toDate !== null) {
                toIsoDate = Date.parse(toDate);
                mealQueryObject = {
                    isoDate: {
                        $lte: toIsoDate
                    }
                }
            }
            if (role === 'user') {
                mealQueryObject.userId = user.uniqueId;
                let calorieLimit = user.calorieLimit;
                mealRecords = await MealRecords
                    .find(mealQueryObject)
                    .sort({date: -1});
                mealRecords = JSON.parse(JSON.stringify(mealRecords));
                if (mealRecords !== null && mealRecords.length > 1) {
                    mealRecords = await calorieDayStatus(mealRecords, calorieLimit,user.uniqueId);
                } else if (mealRecords !== null && mealRecords.length == 1) {

                    mealRecords[0].color = mealRecords[0].calories >= calorieLimit
                        ? 'RED'
                        : 'GREEN';
                    console.log("Data parsed", mealRecords, user.calorieLimit);

                }

            } else {
                mealRecords = await MealRecords
                    .find(mealQueryObject)
                    .sort({date: -1});
                mealRecords = JSON.parse(JSON.stringify(mealRecords));
                if(mealRecords){
                    mealRecords = await adminCalorieStatus(mealRecords);
                }  
            }
            if (mealRecords) {
                result = {
                    "status": 200,
                    "result": mealRecords
                };
            } else {
                result = {
                    "status": 422,
                    "message": 'No meal record found'
                };
            }
            console.log("result", result);
            return result;
        } catch (exception) {
            console.log("ex", exception);
            return {"status": 500, "message": 'Some error occured'};
        }
    },

    //creating meal list according to list
    /**
     *
     * @param {Object} mealObject  //meal object such as calorie,item,type etc
     *
     */
    createMeal: async function (mealObject) {
        try {
            console.log("meal", mealObject);
            let createdAt = new Date().toISOString();
            let updatedAt = new Date().toISOString();
            let uniqueId = uuidv1();
            let addMeal = new MealRecords({
                userId: mealObject.userId,
                email: mealObject.email,
                uniqueId: uniqueId,
                name: mealObject.name,
                items: mealObject.items,
                calories: mealObject.calorie,
                date: mealObject.date,
                isoDate: mealObject.isoDate,
                createdAt: createdAt,
                updatedAt: updatedAt
            });

            let savedData = await addMeal
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

        } catch (exception) {
            console.log('exception', exception);
            return {status: 500, message: 'Something went Wrong'};
        }
    },

    //check meal records exist
    /**
     *
     * @param {String} name  //meal name such as lunch,dinner etc
     * @param {String} date //meal date for eg : 01-01-1999
     *
     */
    checkMeal: async function (name, date) {
        try {
            console.log(name,date);
            let getMeal = await MealRecords.findOne({name: name, date: date});
            console.log("meal", getMeal);
            if (getMeal === null) {
                return 200
            } else {
                return 422
            }
        } catch (exception) {
            console.log('exception', exception);
            return 500;
        }
    },

    //get a meal record by given key and value
    /**
     *
     * @param {String} key  //meal object key  such as name,uniqueId etc
     * @param {String} value //vale of given key  for eg : if name then lunch etc
     *
     */
    getMeal: async function (key, value) {
        try {
            let getMeal = await MealRecords.findOne({[key]: value});
            if (getMeal) {
                return {status: 200, result: getMeal};
            } else {
                return {status: 422, message: 'No record found with given id'};
            }
        } catch (exception) {
            console.log('exception', exception);
            return {status: 500, message: 'Something went Wrong'};
        }
    },

    //edit meal for a given uniqueId with given updated data
    /**
     *
     * @param {String} uniqueId  //meal object id
     * @param {object} mealObject //object of data which has to be updated
     *
     */
    editMeal: async function (uniqueId, mealObject) {
        try {
            console.log("uniq edit ", uniqueId, mealObject);
            let filter = {
                'uniqueId': uniqueId
            };
            let update = {
                'name': mealObject.name,
                'items': mealObject.items,
                'calories': mealObject.calorie,
                'date': mealObject.date,
                'isoDate':mealObject.isoDate
            }
            console.log("upd",update);
            let updateMeal = await MealRecords.findOneAndUpdate(filter, update, {
                new: true
            }, function (error, updated) {
                if (error) {
                    console.log("error", error);
                    return null;
                }
            });
            console.log("update meal", updateMeal);
            if (updateMeal) {
                return {status: 200, result: updateMeal};
            } else {
                return {status: 422, 'message': 'No record found or update failed'};
            }
        } catch (exception) {
            console.log('exception', exception);
            return {status: 500, message: 'Something went Wrong'};
        }
    },

    //delete record by given id of record
    /**
     *
     * @param {String} uniqueId  //meal object id
     *
     *
     */
    deleteMeal: async function (uniqueId) {
        try {
            let filter = {
                'uniqueId': uniqueId
            };
            let deletedData = MealRecords.findOneAndDelete(filter, function (error) {
                if (error) {
                    console.log('error', error);
                    return null;
                }
            })
            if (deletedData) {
                return {status: 200, message: 'Record Deleted Successfully'};
            } else {
                return {status: 422, message: 'Some error occured while deleting'};
            }

        } catch (exception) {
            console.log('exception', exception);
            return {status: 500, message: 'Something went Wrong'};
        }
    }
}