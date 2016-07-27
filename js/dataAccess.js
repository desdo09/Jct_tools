var globalvar;
var inUsed = false;
var DataAccess = {
    
    setData: function (objName, value = null, callBackFunction = null)
    {
        

        if(typeof objName == 'object')
            chrome.storage.local.set(objName);
        else
        { 
            // Creating a new object variable
            var dataValue = new Object();
            // add a value into our dynamic property
            dataValue[objName] = value;
            // Store in chrome
            chrome.storage.local.set(dataValue);
        }

       
    },


    setObject:function(objName, hash, value = null,callBackFunction = null)
    {

        // I am tring to make a singeton
        if(inUsed)
           return setTimeout(function(){DataAccess.setObject(objName, hash, value,callBackFunction)},100);

       inUsed = true;
       this.Data(function(data)
       {
            var obj = {};
            if(undefined != data[objName])
                obj = data[objName];
            
            obj[hash] = (value == null)?true:value;

            var nObj = {}
            nObj[objName] = obj;
            chrome.storage.local.set(nObj,function(result){
                inUsed = false;
                if(typeof callBackFunction == "function")
                 callBackFunction(result);
            });
           
       });
    },
     
    setObjectInObject:function(objName,hash1, hash2, value = null,callBackFunction = null)
    {

        // I am tring to make a singeton
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
                    callBackFunction(result);
            });
           
       });
    },
  
    Data:function(callBackFunction) 
    {  
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

    remove:function(objName,hash = null,callBackFunction = null)
    {
        if(hash == null)
            chrome.storage.local.remove(objName,callBackFunction);
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
                chrome.storage.local.set(nObj,callBackFunction);
               
           });
        }
    },
    reset:function(){
        chrome.storage.local.clear();
        location.reload();
        console.log("Database erased");
    }

}    






