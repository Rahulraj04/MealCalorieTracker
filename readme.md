# MealCalorieTracker

MealCalorieTracker is a calorie tracking api in which user can add,edit and delete meal reords.
A meal record consist of 4 fields which are as follows 
1.Name (For eg BreakFast/Lunch/Dinner)
2.Items (For eg Museli,Soup etc)
3.Calorie (Number of calorie consumed in that particular meal)
4.Date (On which date)

## Installation
cd MealCalorieTracker/
npm install
npm start 

## Directory Structure
+ bin/www --- All the server related settings are defined here such as which is the port number and app defenition etc

+ config  ---All configuration related files are defined inside this folder to keep it separated and to make a modular structure
 + --database.js  --Db connection string and other static properties are defined here 
 + -- passport.js  -- passport js is user for authentication purpose in our case we have used it for signup and login module but in future if we wish to add facebook,gmail,github login it can be easily done using passport 

+ controller -- All different Api controllers are defined inside here (we can define different controller as per urls such as indexController for '/' routes, userController for '/users' )
 + --indexController   --All index route api function are defined here for eg.(Login,Register,Users)
 helper  -- All controller related or any common generic methods are defined under this directory for easy to reuse
 + --responseHelper -- I have created a response helper file which will create the return result structure according to the type and criteria such as success,error etc

+ database -- this folder consist of db realated files such as model ,dbhelper etc
 + models -- Contains all the Schemas used in this projects (For eg. User.js,Admin.js,MealREcords.js,DailyRecords.js)
 + helpers -- in this helper folder only those methods are defined which are related to db CRUD operations that to separated by models for eg userHelper contains only methods which are related to USER model

+ routes -- all routing management and url definition are done here
 + --index.js -- all routes realted to '/'
 + middleware -- middleware is used for validation purpose and add it as middle layer before processing the request with logic 
  it consist of various middleware methods such as isLoggedIn validation and form validation usage of middleware helps us to reduce the rewriting of same code and making it mode modular 

+ env.sample -- its an sample environment file you can create your own environment file by .env and define all the properties given here 

+ app.js 
This is the main header file in which all header files are defined and even basic definition of the projects routes call ,session management and even the files which has to be loaded at start of application can be defined here (All starting points are defined here)

+ package.json 
All necessary packages,3rd party libraries which are used in project are defined here and npm install uses this files for installation and even the project start script are defined here 

## Api Endpoints 
base_Url = '{BaseUrl}:portNumber/' for eg in my case it is (http://localhost:8080)
 + '/register' -- registeration api 
	       --required fields (email,password,role) Note: role can be only admin or user
               -- validations(email validation,not empty, password should be minimum length 3)
 + '/login'     -- login api 
	       --required fields (email,password,role) Note: role can be only admin or user
               -- validations(email validation,not empty, password should be minimum length 3)
	       -- On success returns (Session token which have to be used in all authenticated apis for communication)
+ '/settings'  -- user setting  api 
	       --required fields (calorie and authentication header) Note: this api is only for user to modify its calorie intake
               -- validations(calorie should not be empty and only number allowed)
	       -- On success returns (the modified calorie amount)
+ '/meallist'  -- returns the list of meal records (if  user logged in  then only his records if admin then whole records)
	       --optional fields (from and to date which will be used to filter records)
	       -- validations(from and to date should be only a valid date format i.e. mm-dd-yyyy)
	       -- On success returns (returns list of meal records if any otherwise blank list also it contains color field which will give idea whether user daily limit has reached or not of that particular day so that it can be used in dashboard to show user the status)

+ '/create    -- to add  a meal record	
	       --required fields (name,items,calorie,date and email*) *email this is only for admin user if he is trying to add a record he has to mention the email id of the user otherwise it will directly fetched from session token for logged in user
	       -- validations(name,items should not be empty ,calorie should be only number, date should be a valid date with format (mm-dd--yyyy))
	       -- On success returns (returns list of meal records if any otherwise blank list also it contains color field which will give idea whether user daily limit has reached or not of that particular day so that it can be used in dashboard to show user the status)

+ '/edit'   -- to edit a meal record with it mealId 
	    -- required Field(mealId and any one atleast new edited field such as name,items,calorie,date)
            -- validations(same as add meal plus meal id should be string and not empty also it will check whether newly edit records cause duplicate record eg same name and date record should not exist)
	    -- on success( returns new record of meal list)

+ '/delete'  -- to delete a meal record with it mealId
	    -- required Field(mealId)
            -- validations(meal id should be string and not empty  and given id should exist in record)
	    -- on success( returns new record of meal list)
+ '/users'  -- to retrieve the list of users (This is only for role admin if you try to access it with user account it will not allow to access)
	    --on success(returns list of user registered)


## Security
used JWT token for authentication and session management since it will reduce the load on server session management and it will be present on client side

### Database and framework used
+ DB : MongoDB
+ Framework : Express (NodeJs)

###Other information
I have tried to add or create all apis which will work for both user kind such as admin and user
also have left option for enhancements such as i have kept admin and user has different schema so that both can have their on properties 

Tried to achieve a modular structure and also have added comments in all necessary area and logic 
params fields are added in helper method which will give an idea of datatype and parameters

Red,green color change have incorporated in meal list itself not a different api or so 

Admin can do all CRUD opeartion on any records whereas user is only allowed to edit his/her valid records


### Enhancements
+ --Logger have to be added in it which will help to find the errors and logs etc (for eg Morgan Logger)

+ --Authenticted Apis with apikey and secret key logic  using sha hash generation and payload encryption which will avoid middlelayer tampering for high security endpoints 
