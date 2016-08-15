$(document).ready(	function (){
	DataAccess.Data(onStart);

})


function onStart(result)
{


	/* Check if the username and password is defined */
	var status = false;
	if (result != null)
		 status = (result["username"] != undefined) && (result["password"] != undefined);


	//var status = true;
	//if the username OR the password are not defined then the extension will open the option page
	if(!status)
	{
		//window.open("options.html", "nuevo", "directories=no, location=no, menubar=no, scrollbars=yes, statusbar=no, tittlebar=no, width=1100, height=900");
		chrome.runtime.openOptionsPage();
		setTimeout(function () { window.close(); }, 1);
		return;
	}

	if(result.Config != null && result.Config.style == "classic")
		classicTheme(result);
	else
		themeWithEvents(result);

	if(result.Config != null)
		// In case the user want to updated when the button is touched
		if((result.username && result.password) && result.Config.updateOnPopup != false)
	 		setTimeout(function(){chrome.runtime.sendMessage({updatedata:true,async:true});},20);

}

function classicTheme(data)
{
	$("#classic").show();
	$("#styleWithHW").remove();
	$("#loading").hide();
	// check if the extension is active
	if(data["enable"])
	 	$("#on").show();
	else
		$("#off").show();

	$( "#disable" ).click(function() {
	  	change(false);
	  	setTimeout(function () { window.close(); }, 1);
	});

	$( "#enable" ).click(function() {
		change(true);
	});

	$( "#settings" ).click(function() {
		//window.open("options.html", "nuevo", "directories=no, menubar=no, scrollbars=yes, statusbar=no, tittlebar=no, width=1100, height=900");
		chrome.runtime.openOptionsPage();
		setTimeout(function () { window.close(); }, 1);
	});



}

function themeWithEvents(data)
{
	$("#styleWithHW").show();
	$("#classic").remove();

	if(!data.enable)
	{
		$( "#enable" ).show();
		$( "#disable" ).hide();
	}
	else
	{
		$( "#enable" ).hide();
		$( "#disable" ).show();
	}

	$( "#disable" ).click(function() {
		$( "#enable" ).show();
		$(this).hide();
	  	change(false);
	});

	$( "#enable" ).click(function() {
		$( "#disable" ).show();
		$(this).hide();
		change(true);
	});

	$( "#settings" ).click(function() {
	//	window.open("options.html", "nuevo", "directories=no, menubar=no, scrollbars=yes, statusbar=no, tittlebar=no, width=1100, height=900");
		chrome.runtime.openOptionsPage();

		setTimeout(function () { window.close(); }, 1);
	});
	$("#version").text(chrome.runtime.getManifest().version_name);
	insertEvents(data);

}

function change(flag)
{
	DataAccess.setData("enable",flag);
	chrome.runtime.sendMessage({changeIcon:flag});

}

function insertEvents(data)
{
	$(".event").remove();
	var events = data.tasks;
	if(events == undefined)
		return;
	var event;
	var deadLine = new Date();
	var checked;
	for (var i = events.length - 1; i >= 0; i--) {

		// Check if the event already finish
		if(events[i] == null || Date.parse(events[i].deadLine)< Date.now())
			continue;

		// Check if the user want to show user events
		if(data.Config != undefined)
		{
			if(data.Config.hiddeUE && events[i].type == "userEvent")
			   continue;

			if(data.Config.hwDays != null && Date.parse(events[i].deadLine) > (Date.now()+data.Config.hwDays*24*60*60*1000))
				continue;
		}

		// Check if the user already did the homework
		if(data.eventDone != undefined && data.eventDone[events[i].id] != null )
			checked = ((data.eventDone[events[i].id].checked || data.eventDone[events[i].id].done)?"checked":" ") + ((data.eventDone[events[i].id].done)?" disabled":" ");
		else
			checked = "";

		// Create a new object
		event ="<span class='event'>";

		if(events[i].type =="homework")
			event +="<input type='checkbox' class='done' courseId='"+events[i].id+"' + "+checked+" />";
		else
			event +="<input type='checkbox' style='visibility: hidden;' />";


		if(events[i].type =="homework")
			event +="<a href='http://moodle.jct.ac.il/mod/assign/view.php?id="+events[i].id+"' target='_blank'><span class='eventDetails'>"+"<p class='name'>"+events[i].name+"</p>";
		else
			event +="<span class='eventDetails'>"+"<p class='name'>"+events[i].name+"</p>";


	 	if(events[i].type =="homework")
	 		event +="<p class='courseName'>"+data.courses[events[i].courseId].name+"</p>";

	 	event +="<p class='deadLine'>"+getDate(new Date(Date.parse(events[i].deadLine)))+"</p>"+
		"</span>";

		if(events[i].type =="homework")
			event +="</a>";

		if(data.eventDone != undefined && data.eventDone[events[i].id] != null && !data.eventDone[events[i].id].notifications)
			event +="<img src='image/popup/timbreOff.png' class='notifi'  courseId='"+events[i].id+"'>";
		else
			event +="<img src='image/popup/timbre.png' class='notifi'  courseId='"+events[i].id+"'>";



		event +="</span>";

		$("#Homeworks").prepend(event);
	} 		//notifications
	$("#eventsTotal").text($(".event").length);
	$(".notifi").click(function()
	{
		var currentUrl = $(this).attr("src");
		if(currentUrl == "image/popup/timbre.png")
		{
			$(this).attr("src","image/popup/timbreOff.png");
			DataAccess.setObjectInObject("eventDone",$(this).attr("courseId"),"notifications",false);
	    }
		else
		{
			$(this).attr("src","image/popup/timbre.png");
			DataAccess.setObjectInObject("eventDone",$(this).attr("courseId"),"notifications",true);
		}

	});
	$(".done").change(function(){
		//in case flag is true then set as c (checked) otherwise set as u (unchecked)
		DataAccess.setObjectInObject("eventDone",$(this).attr("courseId"),"checked",this.checked);
	});
}

function onBackgroundEvent(eventType)
{

	if(typeof eventType != "object")
		return;

		console.log("onBackgroundEvent:");
		console.log(eventType);

	switch (eventType.type) {
		case "updateData":
			DataAccess.Data(function(data){
				insertEvents(data);
		 });
			break;
		default:

	}

}
