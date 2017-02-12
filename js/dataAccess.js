/*****************************************************************
*                           Created By
*                        David Aben Athar
*
* Last update: 30/07/2016               email: abenatha@jct.ac.il
******************************************************************/

/*****************************************************************
*  This file will help the extension to manager the Database
******************************************************************/

/*****************************************************************
*  inUsed object:
*   This object will lock the database and until the operation (set
*  only) finish
*   To lock the Database the program will make a new async funtion
*  by using setTimeout and return it (because is async: undefined)
******************************************************************/

var inUsed = false;
var DataAccess = {

    /*****************************************************************
    *  This Function will save the data into chrome.storage.local
    ******************************************************************/
    setData: function (objName, value = null, callBackFunction = null)
    {
        // In case that the Database is in used (locked) it will be make a new async function
        if(inUsed)
           return setTimeout(function(){DataAccess.setData(objName,value,callBackFunction)},100);
       // Lock the Database
        inUsed = true;
        // Check if object name is an object
        if(typeof objName == 'object')
            chrome.storage.local.set(objName,function(data){
                // Insert and unlock the database.
                inUsed = false;
                // run the callBackFunction
                if(typeof callBackFunction == "function")
                    callBackFunction(data);

                setTimeout(function(){chrome.runtime.sendMessage({setBadge:true});},1000);

            });
        else
        {
            // Creating a new object variable
            var dataValue = new Object();
            // add a value into our dynamic property
            dataValue[objName] = value;
            // Store in chrome
            chrome.storage.local.set(dataValue,function(data){
                inUsed = false;
                if(typeof callBackFunction == "function")
                    callBackFunction(data);

                setTimeout(function(){chrome.runtime.sendMessage({setBadge:true});},1000);
            });
        }

    },
    /*****************************************************************
    *  This Function will manager an objects inside the dataBase
    ******************************************************************/
    setObject:function(objName, hash, value = null,callBackFunction = null)
    {

        if(inUsed)
           return setTimeout(function(){DataAccess.setObject(objName, hash, value,callBackFunction)},100);

       inUsed = true;
       this.Data(function(data)
       {
            // In case the object doesnt exist yet
            var obj = {};
            // Get the object
            if(undefined != data[objName])
                obj = data[objName];
            // insert the data in his hash
            obj[hash] = (value == null)?true:value;
            // Save it in the database
            var nObj = {}
            nObj[objName] = obj;
            chrome.storage.local.set(nObj,function(result){
                // unlock database
                inUsed = false;
                if(typeof callBackFunction == "function")
                    callBackFunction(result);
                setTimeout(function(){chrome.runtime.sendMessage({setBadge:true});},1000);
            });

       });
    },
    /*****************************************************************
    *   This Function will manager an objects inside another objects
    *  in the dataBase
    ******************************************************************/
    setObjectInObject:function(objName,hash1, hash2, value = null,callBackFunction = null)
    {


        if(inUsed)
           return setTimeout(function(){DataAccess.setObjectInObject(objName, hash1, hash2, value,callBackFunction)},100);

       inUsed = true;
       this.Data(function(data)
       {
            var obj = {};
            if(undefined != data[objName])
                obj = data[objName];

            if(undefined == obj[hash1])
              obj[hash1] =  {}


            obj[hash1][hash2] = (value == null)?true:value;

            var nObj = {}
            nObj[objName] = obj ;
            chrome.storage.local.set(nObj,function(result){
                inUsed = false;
                if(typeof callBackFunction == "function")
                    if(typeof callBackFunction == "function")
                        callBackFunction(result);
                setTimeout(function(){chrome.runtime.sendMessage({setBadge:true});},1000);
            });

       });
    },
    /*****************************************************************
    *   This Function get a call back function and return the data in
    *  dataBase
    ******************************************************************/
    Data:function(callBackFunction)
    {
        //This function use a promise to make more easy to manager
        const promise = new Promise(function (resolve, reject) {
                            if(callBackFunction == null || typeof callBackFunction != "function")
                                reject(new Error('Invalid funcion'));
                            else
                                chrome.storage.local.get(null,function(data)
                                {
                                        resolve(callBackFunction(data));
                               });
                        });
        return promise;
    },
    /*****************************************************************
    *  This function delete data from the database
    ******************************************************************/
    remove:function(objName,hash = null,callBackFunction = null)
    {
        if(inUsed)
           return setTimeout(function(){DataAccess.remove(objName, hash,callBackFunction)},100);

        inUsed = true;
        if(hash == null)
            chrome.storage.local.remove(objName,function(data){
                 inUsed = false;
                if(typeof callBackFunction == "function")
                    callBackFunction(data)
            });
        else
        {
            this.Data(function(data)
            {
                var obj = data[objName];
                if(obj == null || typeof obj != 'object' || obj[hash] == undefined)
                    return;

                delete obj[hash]

                var nObj = {}
                nObj[objName] = obj;
                chrome.storage.local.set(nObj,function(data){
                    inUsed = false;
                    if(typeof callBackFunction == "function")
                        callBackFunction(data)
                });

           });
        }
    },
    /*****************************************************************
    *  This function will clear the database and change the icon
    ******************************************************************/
    reset:function(){
        chrome.runtime.sendMessage({changeIcon:false,setBadge:true,message:"Database erased"});
        chrome.storage.local.clear();
        location.reload();
        DataAccess.setData({
         Config:
            {
                HWSecondAlarm   :   "0.5", HWfirstAlarm:    "1",UESecondAlarm:"0.5",UEfirstAlarm:"1",checkLogin:true,hiddeModdelHelp:false,
                hiddeUE:false,hwChanges:true,hwDays:"30",hwUpdate:"1",style:"new",todaysHW:true,updateOnPopup:true
            },
            mo:true,mz:true,wf:true,
            moodleCoursesTable:{}
    	 });
    }

}

/*****************************************************************
*  getDate function:
*   This function receive an date object and return a string of
*   the date in hebrew
******************************************************************/
function getDate(date)
{
    var weekday = new Array(7);
    weekday[0]=  "יום ראשון";
    weekday[1] = "יום שני";
    weekday[2] = "יום שלישי";
    weekday[3] = "יום רביעי";
    weekday[4] = "יום חמישי";
    weekday[5] = "יום שישי";
    weekday[6] = "שבת";

    var month = new Array();
    month[0] = "ינואר";
    month[1] = "פברואר";
    month[2] = "מרץ";
    month[3] = "אפריל";
    month[4] = "מאי";
    month[5] = "יוני";
    month[6] = "יולי";
    month[7] = "אוגוסט";
    month[8] = "ספטמבר";
    month[9] = "אוקטובר";
    month[10] = "נובמבר";
    month[11] = "דצמבר";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if the event will be tomorrow
    if(date.getDate() == tomorrow.getDate()  && date.getMonth() == tomorrow.getMonth())
        return "מחר " + zeroIsRequiered(date.getHours()) + ":" + zeroIsRequiered(date.getMinutes());

    if(date.getDate() == (new Date).getDate()  && date.getMonth() == (new Date).getMonth())
        return "היום " + zeroIsRequiered(date.getHours()) + ":" + zeroIsRequiered(date.getMinutes());

    return zeroIsRequiered(date.getHours()) + ":" + zeroIsRequiered(date.getMinutes())+", " + weekday[date.getDay()] + ", " + zeroIsRequiered(date.getDate()) + " " + month[date.getMonth()] +" " + date.getFullYear();
}
/*****************************************************************
*  zeroIsRequiered function:
*   Check if the number have only a digit, In case yes then will be
*  added an 0;
******************************************************************/
function zeroIsRequiered(number)
{
    if(number<10)
        return "0" + number;
    return number;
}

function stringDateToDateObject(day,time)
{
    var DateArray = day.split('/');
    if(time == null)
        return new Date(DateArray[2],DateArray[1]-1,DateArray[0],0,0,0,0);
    
    var timeArray = time.split(':');
    
    return new Date(DateArray[2],DateArray[1]-1,DateArray[0],timeArray[0],timeArray[1],0,0);
    

}