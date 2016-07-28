/*****************************************************************
*                           Created By
*                        David Aben Athar
*
* Last update: 30/07/2016               email: abenatha@jct.ac.il
******************************************************************/

/*****************************************************************
* FUNCTION
*    chrome.runtime.onMessage.addListener
*
* RETURN VALUE
*   This function execute the sendResponse function
*  and send an object
*
* PARAMETERS
*   request - an object with contain:
*             + login = (true/false/undefined)
*                   + username = to login
*                   + password = to login
*             + updatedata  = (true/false/undefined)
*             + changeIcon  = (true/false/undefined)
*
* MEANING
*   This function will get the request maded by anothers
*  pages in the extension
*   In case the object received contain true in login
*  then the function will login in moodle.jct.ac.il with
*  the username and password into the object 
*   In case the object received contain true in updatedata
*  then the function will update the course and task list 
*   In case the object received contain changeIcon
*  the function will change the extension icon 
*
**********************************************************************/
var ajaxAns = {status:"undefined" };
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {

    //In case that the request is null or not an object return Invalid Parameter
    if(request == null || typeof request != "object")
    	{   if(undefined != sendResponse)
    		sendResponse({operationCompleted:false,error:"Invalid Parameter",request:request});
    		return;
    	}
     //In case that the request contains login and is equal true
     if(undefined != request.login && request.login == true)
     {
        //check if there the username and password
        if(undefined == request.username||request.password == undefined)
        	sendResponse({operationCompleted:false,error:"Invalid login arguments",request:request});

        //make the login
        login(request.username,request.password,false);
        //because is sychronus we wait 
        if(request.async != true)
       		while(ajaxAns.status == "undefined");//because is sychronus we wait 
       	else
       	{
       		DataAccess.Data(function(data)
       		{
       			if(data.enable && data.Config != null && data.Config.checkLogin && data.username != null && data.password != null)
       				login(data.username,window.btoa(data.password));
       		})
       	}
        //if there is an error return the error
        if(sendResponse != undefined && ajaxAns.status == "error" )
        {  
        	sendResponse({operationCompleted:false,error:ajaxAns.error,request:request});
        	return;
        }
    }
    //In case that the request contains updatedata and is equal true
    if(request.updatedata)
    {
        //update the data
        updateData(false);
        //if there is an error return the error
        if(sendResponse != undefined && ajaxAns.status == "error")
        {
        	sendResponse({operationCompleted:false,error:ajaxAns.error,request:request});
        	return;
        }
    }
    //In case that the request contains changeIcon.
    if(request.changeIcon != undefined)
    	DataAccess.Data(function(data)
    	{
    		changeIcon(request.changeIcon && data.username && data.password)
    	})  


    //in case that everythink is ok, return true
    if(sendResponse != undefined)
    	sendResponse({operationCompleted:true,request:request});

});
/******************************************************
* This funcion will executade when the chrome start
********************************************************/
document.addEventListener('DOMContentLoaded', function () {
    //get The data of the data an send it to onStart
    DataAccess.Data(onStart);
    showTodayEvents(null);
});



function onStart(data)
{
	updateData(true);
	if(data == undefined)
		return;

	chrome.alarms.onAlarm.addListener(function (alarm){
		createEventNotification(alarm.name);
	});
	chrome.notifications.onClicked.addListener(function (id){
		if(id.includes("event") ||  id.includes("update"))
			return;

	window.open("http://moodle.jct.ac.il/mod/assign/view.php?id="+id);


	});
   //Set the icon of the extension status (active/inactive)
   changeIcon(data.enable && data.username != null && data.password != null);
   if(data.Config != null && data.Config.hwUpdate != null)
   		chrome.alarms.create("updatedata", {when:(Date.now()),periodInMinutes:60*data.Config.hwUpdate});
   if(data.Config != null && data.Config.todaysHW)
   		showTodayEvents(data.tasks,data.courses);
   if(data.tasks != undefined && data.Config != null && data.Config.firstAlarm != false);
  		setAlarms(data);
}
function showTodayEvents(events,courses)
{
	if(events == null || events.length ==0 || courses == null || courses.length == 0)
		return

	var today = new Date();
	var deadline = new Date();
	var j = 0;
	var list = [];
	for (var i = 0; i < events.length; i++) {
		deadline = new Date(Date.parse(events[i].deadLine));
		
		if(deadline.getDate() == today.getDate() &&  deadline.getMonth() == today.getMonth() && Date.parse(deadline)> Date.now())
			list[j++] = {title: events[i].name, message: ((events[i].type == "homework")?courses[events[i].courseId].name:" אירוע")}
	}

	if(events == null || j == 0)
		return;
	chrome.notifications.create(
		'name-for-notification',{
			type: "list",
			title: "ש\"ב להיום",
			iconUrl: 'image/icons/jct128.png',
			message: "", 
			items: list
		});

}

function setAlarms(data)
{
	var events = data.tasks;
	var firstAlarm = parseFloat(data.Config.HWfirstAlarm);
	if(isNaN(firstAlarm))
		return;
	var secondAlarm = parseFloat(data.Config.HWSecondAlarm);
	var deadLine = Date.now();
	for (var i = 0; i < events.length; i++) 
	{

		if(data.eventDone != null && data.eventDone[events[i].id] != null && (!data.eventDone[events[i].id].notifications || data.eventDone[events[i].id].done || data.eventDone[events[i].id].checked))
			continue;

		if(events[i] == null || Date.parse(events[i].deadLine)< Date.now())
			continue;

		deadLine = Date.parse(events[i].deadLine) - firstAlarm*60*60*1000;  
       	chrome.alarms.create(events[i].id + "(1)", {when:deadLine});
       	if(secondAlarm == null || isNaN(secondAlarm))
        		return;
       	deadLine = Date.parse(events[i].deadLine) - secondAlarm*60*60*1000; 

       	chrome.alarms.create(events[i].id + "(2)", {when:deadLine});

    }


}

function createEventNotification(eventId)
{
		
	DataAccess.Data(function(data){
		  
		var event = null;
		eventId= eventId.substring(0, eventId.length - 3);
		for (var i = 0; i < data.tasks.length; i++) {
			if(data.tasks[i].id == eventId)
				event = data.tasks[i];
		}
		if(event == null)
			return;

		var n = chrome.notifications.create(
			(event.type == "homework")?eventId:"event " + eventId,{   
				type: 'basic', 
				iconUrl: 'image/icons/jct128.png', 
				title: ("תזכורת" + ((event.type == "homework")?" על שיעורי בית":" אירוע")),
				message: (event.name + "\n" + ((event.type == "homework")?data.courses[event.courseId].name+"\n":"") + getDate(new Date(Date.parse(event.deadLine))))  
			})

	});

}

/*****************************************************************
* FUNCTION
*   login
*
* RETURN VALUE
*   This function use the object ajaxAns to return the data
*
* PARAMETERS
*   username  - The username to login
*   password  - The password to login
*   asyncType - True in case we want to use async
*
* MEANING
*    This function will try to login to the moodle page by send it a 
*   post that contains the username and password (received) 
*
**********************************************************************/
function login(username, password, asyncType = true)
{
    const promise = new Promise(function (resolve, reject) {
		var request =  $.post( "https://moodle.jct.ac.il/login/index.php", 
			{username:username,password:password} );

		request.done( function(data){
			resolve(ajaxAns = {status:"ok"});
		});

		request.fail(function (data) {
			resolve(ajaxAns = {status:"error",error:data.statusText});
		});
	});
	
	return promise;
}


/*****************************************************************
* FUNCTION
*   updateData
*
* RETURN VALUE
*   This function use the object ajaxAns to return the data
*
* PARAMETERS
*   asyncType - True in case we want to use async
*
* MEANING
*    This function will update the courses and homework list in the
*   database
*
**********************************************************************/
function updateData(asyncType)
{
	if(typeof asyncType != "boolean")
		return;
    // async: false

    // login();
    var request =  $.ajax({
    	url:"http://moodle.jct.ac.il",
    	type:'GET',
    	async: asyncType,

    }); 

    request.done( function(data){
    	if(undefined == data || 0 == data.length)
    	{
    		ajaxAns = {status:"error",error:"data is null"};
    		return;
    	}

        // Get htm with div
        var html = jQuery('<div>').html(data);
        if(html.find(".courses").length == 0)
        {
        	ajaxAns = {status:"error",error:"Login is requiered"};
        	return;
        }
        // Get courses list
        var courses = html.find(".courses");
        //  wrapAllAttributes(courses);
        var coursesObject = getAllCourses(courses);
        // Get homework list
        var homework = html.find("#inst121811").find(".content");
        var homeworkObject  = getAllHomeworks(homework);
        // $('#hidden').html(homework);
        // $('#hidden').html(courses);
        DataAccess.setData({courses:coursesObject.data,coursesIndex:coursesObject.index,tasks:homeworkObject},function()
       	{
       		 DataAccess.Data(setAlarms);
       	}); 
        ajaxAns = {status:"ok"};
       
       // Reset the alarms
      
   });

    request.fail(function (data) {
    	ajaxAns = {status:"error",error:data};
    });

    //return {status:"ok"};
}

/*****************************************************************
* FUNCTION
*   wrapAllAttributes
*
* RETURN VALUE
*   This function doesn't return nothing
*
* PARAMETERS
*   html - An html document
*
* MEANING
*    This function wrap all attribute from the html
*
* ATTENTION
*   This function is not in use 
*
**********************************************************************/
function wrapAllAttributes(html)
{
    //delete attributes from the main div 
    $(html).each(function() {
    	var attributes = this.attributes;
    	var i = attributes.length;
    	while( i-- ){
    		this.removeAttributeNode(attributes[i]);
    	}
    });
    //delete all attributes from the children of main div
    $(html).children().each(function () {
    	$(this).each(function() {
    		var attributes = this.attributes;
    		var i = attributes.length;
    		while( i-- ){
    			this.removeAttributeNode(attributes[i]);
    		}
    	});
    });
}

/*****************************************************************
* FUNCTION
*   getAllCourses
*
* RETURN VALUE
*    Return an object that contains the courses data (data) and the
*  hash table order(index)
*
* PARAMETERS
*   html - An html document
*
* MEANING
*   This function will take the couse div in the moodle, then insert 
*   evey course in an object (with name, id, MoodleId)
*
*  ATTENTION
*   This function help the updateData function 
*
**********************************************************************/
function getAllCourses(html)
{
	var data = {};
	var index =[];
	var i = 0;
	$(html).children().each(function () {
        // Find the url of the course (where is contain all data)
        var courseLink = $(this).find('a');
        // Find the course id
        var id = $( this ).attr( "data-courseid" );

        // if there is an error just stop
        if(courseLink.length ==0 || id == undefined ||id.length == 0)
        	return true;
        
        // copy the text of the url 
        var text = courseLink.text();
        // Separe the data by id and name
        var courseDetails = separateCoursesData(text);
        // Save the url
        courseDetails.Url = courseLink.attr('href');
        // Save the moodle id
        courseDetails.moodleId = id;
        // Save the current place of the course in moodle
        index[i] = id;
        i++;
        // Make the id as the hash id and save the courses data
        data[id] = courseDetails;

    });
	return {data:data,index:index};
}
/***************************************
* Separe data from courses 
* Example 120221.3.5776 - אלגברה לינארית ב
*
* The function will search for numbers and
* save it as id and then take the rest 
* and save as name 
*****************************************/
function separateCoursesData(data)
{
	var idNumber = "";
	var character;
	for (var i = 0; i < data.length; i++)
	{
		character = data.charAt(i);
		if(character == '.' || (character != ' ' && !isNaN(character)))
			idNumber += character;
		else
			break;

	}
    // check if is a course
    var name = data.substring((idNumber.length>0)?(idNumber.length+3):0);

    return {id:idNumber,name:name}
}

/*****************************************************************
* FUNCTION
*   getAllHomeworks
*
* RETURN VALUE
*    Return an object that contains all homeworks data
*
* PARAMETERS
*   html - An html document
*
* MEANING
*   This function will take the homeworks div in the moodle, then insert 
*   evey course in an object (with name, id,deadline, type)
*
*  ATTENTION
*   This function help the updateData function 
*
**********************************************************************/
function getAllHomeworks(html)
{
	var data = [];
	var i = 0;
	$(html).children().each(function () {
		var homeworkDetails;

		if($(this).find("img").attr("alt"))
			homeworkDetails = userEventData(this);
		else
			homeworkDetails = separateHomeworkData(this);

		if(homeworkDetails == undefined)
			return true;

		if(homeworkDetails.id != undefined)
			data[i] = homeworkDetails;
		else
		{
            //check if the i is not in use
            while(data[i] != undefined){i++};

            homeworkDetails.id = i;
            data[i] = homeworkDetails;
        }
        i++;
    });
	return data;
}
/***************************************
* Separe data from homework div 
*
*  The function will search for the name
*  and the date then save it in an object 
*  with the type "userEvent"   
*****************************************/
function userEventData(usData)
{
	var name = (($(usData).find("a"))[0]).text;
	var deadLine = stringToDate($(usData).find(".date").text());
	deadLine = deadLine.toString();
	return{type:"userEvent",name:name,deadLine:deadLine}
}
//
function separateHomeworkData(hwdata)
{
    /**************************************
    * Search the homework id and name
    ***************************************/
    var datatemp = ($(hwdata).find("a"))[0];
    if(datatemp == undefined || datatemp.length==0)
    	return undefined;
    // Save the homework name 
    var homeworkName = $(datatemp).text();
    datatemp = $(datatemp).attr('href');
    // Get id from href (ex: http://moodle.jct.ac.il/mod/assign/view.php?id=224301)
    datatemp = datatemp.substring(datatemp.lastIndexOf("id")+3);
    // Save the homework id
    var homeworkId = datatemp;

    /**************************************
    * Search the homework course id
    ***************************************/
    datatemp = $(hwdata).find('.course').find('a');
    if(datatemp == undefined || datatemp.length == 0)
    	return undefined;
    datatemp = $(datatemp).attr('href');
    // Get id from href (ex: http://moodle.jct.ac.il/course/view.php?id=28513)
    datatemp = datatemp.substring(datatemp.lastIndexOf("id")+3);
    // Save the course id
    var courseId = datatemp;

    /**************************************
    * Search the homework dead line
    ***************************************/
    datatemp = $(hwdata).find('.date');
    if(datatemp == undefined || datatemp.length == 0)
    	return undefined;


    var homeworkDeadLine = stringToDate($(datatemp).text());
    homeworkDeadLine = homeworkDeadLine.toString();
    if(homeworkDeadLine == undefined)
    	return undefined;

    return {type:"homework",id:homeworkId,name:homeworkName,courseId:courseId,deadLine:homeworkDeadLine}
}
/********************************************
* The function get an day in format DD/MM/YY
* and a time in format HH:MM then return 
* a string with the date
*************************************************/
function stringToDate(date)
{

	var dayArray = new Array();
	if(date.includes("מחר"))
	{
		var tomorow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
		dayArray[0] = tomorow.getDate();
		dayArray[1] = tomorow.getMonth();
		dayArray[2] = tomorow.getFullYear();

	}else
	if(date.includes("היום"))
	{
		var today = new Date();
		dayArray[0] = today.getDate();
		dayArray[1] = today.getMonth();
		dayArray[2] = today.getFullYear();
	}
	else
	{
		dayArray = date.split("/");
		dayArray[1] = Number(dayArray[1])-1;
		if(dayArray[2] ==undefined)
			return undefined;
		dayArray[2] = dayArray[2].substring(0,4);
	}


	var timeArray = new Array();
	timeArray = date.split(":");

	if(timeArray[1] == undefined)
		return undefined;

	timeArray[0] = timeArray[0].substring(timeArray[0].length-2);


	return new Date(dayArray[2],dayArray[1],dayArray[0],timeArray[0],timeArray[1],0);

}
/***********************************
this function change the extension
icon when the user active/desactive
the extension
************************************/
function changeIcon(flag)
{
	if(flag)
		chrome.browserAction.setIcon({path: "../image/icons/jct128.png"});
	else
		chrome.browserAction.setIcon({path: "../image/icons/jctDisable.png"});
}
/**************************************
    Test only
    **************************************/

    $(document).ready(function(){
    	chrome.storage.local.get(null,function(result)
    	{
    		DataAccess.getData = result;
    	});
    	$( "#button" ).click(function(){
    		
    		//console.log("Background");
    		//updateData(false);
    		//alert(ajaxAns.status);
    	});  
    });
