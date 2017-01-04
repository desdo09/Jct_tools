var localData;
/*************************************************
* FUNCTION:
*	$(document).ready
*
* MEANING:
* 	The DataAccess work with promise so when
* the document is ready to work, the function
* will set the data in the acount div, then
* will set all button functions.
**************************************************/
$(document).ready(function () {

	DataAccess.Data(setAccountData)
	.then(function(){return DataAccess.Data(setTabla)})
	.then(function(){return DataAccess.Data(setAdvancedData)})
	.then(function(){return DataAccess.Data(setNotificationsData)})
	.then(function(){
		// All links in menu will be set to go to the funcion "changediv",
		// and the parameter will be the content of the attribute "div-id"
		$('#menu').find('a').click(function(){changediv($(this).attr('div-id'));});
		// The refresh button will initialize the function setdata
		$("#submit").click(setData);
		// The reset data button will initialize the function reset in the dataBase
		$("#reset_Data").click(DataAccess.reset);
		// The refresh button will initialize the function refreshData
		$("#Refresh").click(refreshData);
		$("#updateNotifications").click(setNotifications);
		$("#updateSettings").click(setAdvanced);
		$("#version").text(chrome.runtime.getManifest().version_name);

	});
});

/*************************************************
* FUNCTION
*    setAccountData
*
* RETURN VALUE
*	This function does not return parameters
*
* PARAMETERS
*    Data  – The object data from the DataAccess
*
* MEANING
*    The function will prepare the account div
*
**************************************************/
function setAccountData(data)
{
	localData = data;
	// in case the data object is null (undefined)
	// meaning that is the first time (or the user make
	// a reset data), so by default all "checkbox" in
	// account div will be checked
	if(data != null)
	{
		if(data["wf"] == undefined || data["wf"])
		document.getElementById("wf").checked = true;

		if(data["mz"] == undefined || data["mz"])
		 document.getElementById("mz").checked = true;

		if(data["mo"] == undefined || data["mo"])
		 document.getElementById("mo").checked = true;
	}
	else
	{
		document.getElementById("wf").checked = true;
		document.getElementById("mz").checked = true;
		document.getElementById("mo").checked = true;
	}
}
/*************************************************
* FUNCTION
*    setData
*
* RETURN VALUE
*	This function does not return parameters
*
* PARAMETERS
*   This function does not receive any parameters
*
* MEANING
*   When the user make a submit in the account div
*	the function will set into the database
*
* ATTENTION
* 	Because the funcion have no access to "DataAccess"
* objects, the funcion cannot check if the username/password
* already exist.
******************************************************/
function setData() {

	// in case the user leave the username/password field empty,
	// means that the user dont want to change it
	if($("#un").val() != "")
		DataAccess.setData("username",$("#un").val());

	if( $("#pw").val() != "")
		DataAccess.setData("password",window.btoa($("#pw").val()));

	//make a new object and send it to the database
	DataAccess.setData({
						wf:document.getElementById('wf').checked,
						mz:document.getElementById('mz').checked ,
						mo:document.getElementById('mo').checked,
					//	re:document.getElementById('re').checked,
						enable:true
						})

	chrome.runtime.sendMessage({changeIcon:true});
	notification("המאגר עודכן");
}


/*************************************************
* FUNCTION
*    changediv
*
* RETURN VALUE
*	This function does not return parameters
*
* PARAMETERS
*   toDiv - The div to show
*
* MEANING
*   The function will hidde al divs and open the
*	the div name received the parameter
*
******************************************************/
function changediv(toDiv)
{
	// in case the data is unvalid stop
	if(undefined == toDiv || 0 == toDiv.length)
		return;

	toDiv = '#' + toDiv;
	// In case the div doesn't exist stop
	if(undefined == $(toDiv) || 0 == ($(toDiv)).length)
		return;
	// Every div in the conteiner will be hide
	$('#contenedor').children().each(function(){
			$(this).hide(500);
	});
	// Then will show the div
	$(toDiv).show(500);
}
/*************************************************
* FUNCTION
*    setTabla
*
* RETURN VALUE
*	This function does not return parameters
*
* PARAMETERS
*    Data  – The object data from the DataAccess
*
* MEANING
*    The function will prepare the tabla of all
*	courses
*
**************************************************/
function setTabla(data)
{
	// in case there is no data then break
	if(data == undefined || data.length ==0 || data.courses == undefined || data.courses.length == 0)
		return;

	// Remove all items
	$("td").remove();
	//Get all hash values
	var course = data.courses;
	var keys = data.coursesIndex;
	for (var i = 0; i < keys.length; i++) {

		 if(i%2 == 0)
			$('#coursesTable').find('tbody:last').append('<tr>');

		var input;
		if(data.moodleCoursesTable != undefined && data.moodleCoursesTable[keys[i]] != null)
			input = '<input type="checkbox" course-id="'+course[keys[i]].moodleId+'" checked  />'
		else
			input = '<input type="checkbox" course-id="'+course[keys[i]].moodleId+'"   />'
		// how can I add the <tr> tag? This is an hack


		$('#coursesTable').find('tbody:last').append(
			'<td>' +input
			+
			'</td><td>' +
			 course[keys[i]].name+
			 '</td>'
		);
	}

	$('#coursesTable').find("input[type='checkbox']").each(function()
	{
		$(this).change(function(){
			updatedata(this.checked,$(this).attr("course-id"));
			chrome.runtime.sendMessage({setBadge:true});
		});
	});

	var progress = $('#courses').find("progress");
	if(	$(progress).attr('value') == "1")
			$(progress).attr('value',2);
}
/*************************************************
* FUNCTION
*    refreshData
*
* RETURN VALUE
*	This function doesn't return parameters
*
* PARAMETERS
*   This function does not receive any parameters
*
* MEANING
*   When the user request a refresh of the courses table,
* the function will send and "message" to the background
* page to refresh the database
*
******************************************************/
function refreshData()
{

	DataAccess.Data(function (data)
	{
		if((data["username"] == undefined) || (data["password"] == undefined))
			return notification("שם משתמש או סיסמא אינו מוגדר","error")
		var progress = $('#courses').find("progress");
		//show the progress bar
		$(progress).show();
		// Set the progress bar 0/2

		chrome.runtime.sendMessage({updatedata:true});

		$(progress).attr('value',1);

	})

}

function updatedata(hide,id)
{
	if(hide)
		DataAccess.setObject("moodleCoursesTable",id);
	else
		DataAccess.remove("moodleCoursesTable",id);
}

function setNotificationsData(data)
{


	if(data.Config == undefined)
		data.Config = {}
	//homework
	if(data.Config.HWfirstAlarm != undefined && data.Config.HWfirstAlarm != false)
	{
		$("#HWfirstAlarm").prop('checked',true);
		$("#HWNotifications").find("label[for='HWfirstAlarmTime']" ).show();
   		$("#HWfirstAlarmTime").show();
   		$("#HWfirstAlarmTime").val(data.Config.HWfirstAlarm);
   		$("#HWSecondAlarm").show();
   		$("#HWNotifications").find("span[for='HWSecondAlarm']" ).show();
	}

	if(data.Config.HWSecondAlarm != undefined && data.Config.HWSecondAlarm != false)
	{
		$("#HWSecondAlarm").prop('checked',true);
		$("#HWNotifications").find("label[for='SecondAlarm']" ).show();
   		$("#HWSecondAlarmTime").show();
   		$("#HWSecondAlarmTime").val(data.Config.HWSecondAlarm);
	}

	//user Event
	if(data.Config.UEfirstAlarm != undefined && data.Config.UEfirstAlarm != false)
	{
		$("#UEfirstAlarm").prop('checked',true);
		$("#UENotifications").find("label[for='firstAlarmTime']" ).show(400);
   		$("#UEfirstAlarmTime").show(400);
   		$("#UESecondAlarm").show(400);
   		$("#UENotifications").find("span[for='UESecondAlarm']" ).show(400);
	}

	if(data.Config.UESecondAlarm != undefined && data.Config.UESecondAlarm != false)
	{
		$("#UESecondAlarm").prop('checked',true);
		$("#UENotifications").find("label[for='SecondAlarm']" ).show();
   		$("#UESecondAlarmTime").show();
	}

	setCheckers();
}

/*************************************************
* FUNCTION
*    setCheckers
*
* RETURN VALUE
*	This function doesn't return parameters
*
* PARAMETERS
*   This function does not receive any parameters
*
* MEANING
*  The function will set animations to the checkbox
* into the div notifications3
*
******************************************************/
function setCheckers()
{


	if(($("#HWfirstAlarm")).length == 0)
		return;

	$("#HWfirstAlarm").change(function () {
   		 if (this.checked) {
   		 	$("#HWNotifications").find("label[for='HWfirstAlarmTime']" ).slideDown(400);
   		 	$("#HWfirstAlarmTime").slideDown(400);
   		 	$("#HWSecondAlarm").slideDown(400);
   		 	$("#HWNotifications").find("span[for='HWSecondAlarm']" ).slideDown(400);
		}
		else
		{
			$("#HWNotifications").find("label[for='HWfirstAlarmTime']" ).slideUp(400);
   		 	$("#HWfirstAlarmTime").slideUp(400);
   		 	document.getElementById("HWSecondAlarm").checked = false;
   		 	$("#HWSecondAlarm").slideUp(400);
   		 	$("#HWNotifications").find("span[for='HWSecondAlarm']" ).slideUp(400);

   		 	$("#HWNotifications").find("label[for='SecondAlarm']" ).slideUp();
   		 	$("#HWSecondAlarmTime").slideUp();
		}

 	});

 	$("#HWSecondAlarm").change(function () {
   		 if (this.checked)
   		 {
   		 	$("#HWNotifications").find("label[for='SecondAlarm']" ).slideDown();
   		 	$("#HWSecondAlarmTime").slideDown();
   		 }else
   		 {
   		 	$("#HWNotifications").find("label[for='SecondAlarm']" ).slideUp();
   		 	$("#HWSecondAlarmTime").slideUp();
   		 }

   	});

   	if(($("#UEfirstAlarm")).length == 0)
		return;

	$("#UEfirstAlarm").change(function () {
   		 if (this.checked) {
   		 	$("#UENotifications").find("label[for='firstAlarmTime']" ).slideDown(400);
   		 	$("#UEfirstAlarmTime").slideDown(400);
   		 	$("#UESecondAlarm").slideDown(400);
   		 	$("#UENotifications").find("span[for='UESecondAlarm']" ).slideDown(400);
		}
		else
		{
			$("#UENotifications").find("label[for='firstAlarmTime']" ).slideUp(400);
			$("#UEfirstAlarmTime").slideUp(400);
   		 	document.getElementById("UESecondAlarm").checked = false;
   		 	$("#UESecondAlarm").slideUp(400);
   		 	$("#UENotifications").find("span[for='UESecondAlarm']" ).slideUp(400);

   		 	$("#UENotifications").find("label[for='SecondAlarm']" ).slideUp();
   		 	$("#UESecondAlarmTime").slideUp();
		}

 	});

 	$("#UESecondAlarm").change(function () {
   		 if (this.checked)
   		 {
   		 	$("#UENotifications").find("label[for='SecondAlarm']" ).slideDown();
   		 	$("#UESecondAlarmTime").slideDown();
   		 }else
   		 {
   		 	$("#UENotifications").find("label[for='SecondAlarm']" ).slideUp();
   		 	$("#UESecondAlarmTime").slideUp();
   		 }

   	});
}

function setNotifications()
{
	//Homework
	if($("#HWfirstAlarm").is(':checked'))
	{
		if($("#HWfirstAlarmTime") == null || isNaN(parseInt($("#HWfirstAlarmTime").val())) || parseFloat($("#HWfirstAlarmTime").val()) < 0)
		{
			notification("זמן לא חוקי","error");
			return;
		}
		else
			DataAccess.setObject("Config","HWfirstAlarm",$("#HWfirstAlarmTime").val());


	}
	else
	{
		DataAccess.setObject("Config","HWfirstAlarm",false);
	}

	if($("#HWSecondAlarm").is(':checked') && $("#HWfirstAlarm").is(':checked'))
	{
		if($("#HWSecondAlarmTime") == null ||isNaN(parseInt($("#HWSecondAlarmTime").val())) || parseFloat($("#HWSecondAlarmTime").val()) < 0.5)
		{
			notification("זמן לא חוקי","error");
			return;
		}
		else
			DataAccess.setObject("Config","HWSecondAlarm",$("#HWSecondAlarmTime").val());
	}
	else
	{
		DataAccess.setObject("Config","HWSecondAlarm",false);
	}


	//User Event
	if($("#UEfirstAlarm").is(':checked'))
	{
		if($("#UEfirstAlarmTime") == null || isNaN(parseInt($("#UEfirstAlarmTime").val())) || parseFloat($("#UEfirstAlarmTime").val()) < 0.5)
		{
			notification("זמן לא חוקי","error");
			return;
		}
		else
			DataAccess.setObject("Config","UEfirstAlarm",$("#UEfirstAlarmTime").val());


	}
	else
	{
		DataAccess.setObject("Config","UEfirstAlarm",false);

	}
	if($("#UESecondAlarm").is(':checked') && $("#UEfirstAlarm").is(':checked'))
	{
		if($("#UESecondAlarmTime") == null ||isNaN(parseInt($("#UESecondAlarmTime").val())) || parseFloat($("#UESecondAlarmTime").val()) < 0.5 )
		{
			notification("Invalid time","error");
			return;
		}
		else
			DataAccess.setObject("Config","UESecondAlarm",$("#UESecondAlarmTime").val());
	}
	else
	{
		DataAccess.setObject("Config","UESecondAlarm",false);
	}

	notification("המאגר עודכן");

}

function setAdvancedData(data)
{
	$("#calendar").click(function(){
		$(this).prop('checked',false);
		$("#portal").prop('checked',true);
		notification("מתצוגת לוח-שנה: "+"אנחנו עובדים על זה","warning");
	});
	
	$("#checkLogin").change(function(){
		if(this.checked == false)
			notification("זְהִירוּת: "+"\n"+" נדרש להיות מחובר למודל כדי לעדכן את הנתונים.","warning");
	});

	$("#limitedHw").change(function(){
		if( $("#limitedHw").is(':checked'))
			$( "#limitedHwAmount" ).removeAttr( "disabled" );
		else
			$("#limitedHwAmount").attr('disabled', 'disabled');
			
			
	});
	if(data.Config == undefined)
		data.Config = {}

	if(data.Config.checkLogin == undefined || data.Config.checkLogin)
		$("#checkLogin").attr('checked',true);
	else
		$("#checkLogin").attr('checked',false);

	if(data.Config.moodleTopic != undefined && data.Config.moodleTopic)
		$("#moodleTopic").attr('checked',true);
	else
		$("#moodleTopic").attr('checked',false);

	if(data.Config.hiddeModdelHelp != undefined && data.Config.hiddeModdelHelp)
		$("#hiddeModdelHelp").attr('checked',true);
	else
		$("#hiddeModdelHelp").attr('checked',false);

	if(data.Config.eventsOnTop != undefined && data.Config.eventsOnTop)
		$("#eventsOnTop").attr('checked',true);
	else
		$("#eventsOnTop").attr('checked',false);

	if(data.Config.hiddeNofication != undefined && data.Config.hiddeNofication)
		$("#hiddeNofication").attr('checked',true);
	else
		$("#hiddeNofication").attr('checked',false);

	if(data.Config.MoodleHiddeUE != undefined && data.Config.MoodleHiddeUE)
		$("#MoodleHiddeUE").attr('checked',true);
	else
		$("#MoodleHiddeUE").attr('checked',false);

	if(data.Config.showTestDay != false)
		$("#showTestDay").attr('checked',true);
	else
		$("#showTestDay").attr('checked',false);

	if(data.Config.showBadge != false)
		$("#showBadge").attr('checked',true);
	else
		$("#showBadge").attr('checked',false);

	if(data.Config.hiddeUE != undefined && data.Config.hiddeUE)
		$("#hiddeUE").attr('checked',true);
	else
		$("#hiddeUE").attr('checked',false);

	if(data.Config.from != undefined && data.Config.from == "calendar")
		$("#calendar").attr('checked',true);
	else
		$("#portal").attr('checked',true);

	if(data.Config.hwDays != undefined)
		$("#hwDays").val(data.Config.hwDays);

	if(data.Config.hwUpdate != undefined)
		$("#hwUpdate").val(data.Config.hwUpdate);


	if(data.Config.todaysHW == undefined || data.Config.todaysHW)
		$("#todaysHW").attr('checked',true);
	else
		$("#todaysHW").attr('checked',false);

	if(data.Config.hiddeNoSelectedCourseInWindows == undefined || data.Config.hiddeNoSelectedCourseInWindows)
		$("#hiddeNoSelectedCourseInWindows").attr('checked',true);
	else
		$("#hiddeNoSelectedCourseInWindows").attr('checked',false);

	if(data.Config.hiddeNoSelectedCourseInMoodle == undefined || data.Config.hiddeNoSelectedCourseInMoodle)
		$("#hiddeNoSelectedCourseInMoodle").attr('checked',true);
	else
		$("#hiddeNoSelectedCourseInMoodle").attr('checked',false);

	if(data.Config.updateOnPopup == undefined || data.Config.updateOnPopup)
		$("#updateOnPopup").attr('checked',true);
	else
		$("#updateOnPopup").attr('checked',false);

	if(data.Config.hiddeTasksDone == undefined || data.Config.hiddeTasksDone)
		$("#hiddeTasksDone").attr('checked',true);
	else
		$("#hiddeTasksDone").attr('checked',false);

	if(data.Config.hwChanges == undefined || data.Config.hwChanges)
		$("#hwChanges").attr('checked',true);
	else
		$("#hwChanges").attr('checked',false);

	if(data.Config.style != undefined && data.Config.style == "classic")
		$("#classic").attr('checked',true);
	else
		$("#new").attr('checked',true);

	if(data.Config.hiddeSameDay != undefined && data.Config.hiddeSameDay)
		$("#hiddeSameDay").attr('checked',true);
	else
		$("#hiddeSameDay").attr('checked',false);

	if(data.Config.limitedHw != undefined && data.Config.limitedHw)
	{
		$("#limitedHw").attr('checked',true);
		$("#limitedHwAmount").val(data.Config.limitedHwAmount);
	}	
	else
	{
		$("#limitedHw").attr('checked',false);
		$("#limitedHwAmount").attr('disabled', 'disabled');
	}
	


}

function setAdvanced()
{

	if($("#hwDays") == null || isNaN(parseFloat($("#hwDays").val())) || parseFloat($("#hwDays").val()) < 1)
	{
		notification("Invalid days","error");
		return;
	}
	if($("#hwUpdate") == null ||isNaN(parseFloat($("#hwUpdate").val())) || parseFloat($("#hwUpdate").val()) < 0.5)
	{
		notification("Invalid hours","error");
		return;
	}
	var limitedHw = $("#limitedHw").is(':checked');
	if( limitedHw == true && ($("#limitedHwAmount") == null ||isNaN(parseFloat($("#limitedHwAmount").val())) || parseFloat($("#limitedHwAmount").val()) < 1))
	{
		notification("כמות של מטלות, לא חוקי","error");
		return;
	}

	DataAccess.setObject("Config","checkLogin",$("#checkLogin").is(':checked'));
	DataAccess.setObject("Config","hiddeModdelHelp",$("#hiddeModdelHelp").is(':checked'));
	DataAccess.setObject("Config","hiddeNofication",$("#hiddeNofication").is(':checked'));
	DataAccess.setObject("Config","hiddeNoSelectedCourseInWindows",$("#hiddeNoSelectedCourseInWindows").is(':checked'));
	DataAccess.setObject("Config","hiddeNoSelectedCourseInMoodle",$("#hiddeNoSelectedCourseInMoodle").is(':checked'));
	DataAccess.setObject("Config","eventsOnTop",$("#eventsOnTop").is(':checked'));
	DataAccess.setObject("Config","moodleTopic",$("#moodleTopic").is(':checked'));
	DataAccess.setObject("Config","hiddeUE",$("#hiddeUE").is(':checked'));
	DataAccess.setObject("Config","MoodleHiddeUE",$("#MoodleHiddeUE").is(':checked'));
	DataAccess.setObject("Config","showBadge",$("#showBadge").is(':checked'));
	DataAccess.setObject("Config","showTestDay",$("#showTestDay").is(':checked'));
	DataAccess.setObject("Config","style",$("input[name='from']:checked").attr('id'));
	DataAccess.setObject("Config","hwDays",$("#hwDays").val());
	DataAccess.setObject("Config","hwUpdate",$("#hwUpdate").val());
	DataAccess.setObject("Config","updateOnPopup",$("#updateOnPopup").is(':checked'));
	DataAccess.setObject("Config","hiddeTasksDone",$("#hiddeTasksDone").is(':checked'));
	DataAccess.setObject("Config","todaysHW",$("#todaysHW").is(':checked'));
	DataAccess.setObject("Config","hwChanges",$("#hwChanges").is(':checked'));
	DataAccess.setObject("Config","todaysHW",$("#todaysHW").is(':checked'));
	DataAccess.setObject("Config","hiddeSameDay",$("#hiddeSameDay").is(':checked'));
	DataAccess.setObject("Config","limitedHw",limitedHw);
	DataAccess.setObject("Config","limitedHwAmount",((limitedHw))?($("#limitedHwAmount").val()):(0));

		


	DataAccess.setObject("Config","style",$("input[name='style']:checked").attr('id'));
	notification("המאגר עודכן");
	// until the database will update.
	setTimeout(function(){chrome.runtime.sendMessage({setBadge:true});},1000);

}

/*************************************************
* FUNCTION
*    notification
*
* RETURN VALUE
*	This function doesn't return parameters
*
* PARAMETERS
*   message - The message to show
* 	error   - true in case is a error
*
* MEANING
*   When the user request a refresh of the courses table,
* the function will send and "message" to the background
* page to refresh the database
*
******************************************************/
function notification(message, type = "success")
{
	if(type == "error")
		$.notify(message,{position:"top right", className: 'error'} );

	if(type == "warning")
		$.notify(message,{position:"top right",className: 'warn'});

	if(type == "success")
		$.notify(message,{position:"top right",className: 'success'});
}


function onBackgroundEvent(eventType)
{
	if(typeof eventType != "object")
		return;

		console.log("onBackgroundEvent:");
		console.log(eventType);

	switch (eventType.type) {
		case "login" :
			if(eventType.operationCompleted == false)
				notification(eventType.error,"error");
		break;
		case "updateData":
			var progress = $('#courses').find("progress");
			if(	$(progress).attr('value') != "1" )
				break;
			if(eventType.operationCompleted != true)
				notification(eventType.error,"error");
			else {
				DataAccess.Data(function(data){
					setTabla(data);
					$(progress).attr('value',2);
				});
			}
			break;
		default:

	}
	//	$(progress).attr('value',1);
}
