$(document).ready(	function (){
	DataAccess.Data(onStart);

})
		


function onStart(result)
{

	/*   Check if the username and password is defined */
	var status = false;
	if (result != null)
		 status = (result["username"] != undefined) && ( window.btoa(result["password"]) != undefined);


	//var status = true;
	//if the username OR the password are not defined then the extension will open the option page
	if(!status) 
	{ 
		window.open("options.html", "nuevo", "directories=no, location=no, menubar=no, scrollbars=yes, statusbar=no, tittlebar=no, width=1100, height=900");
		setTimeout(function () { window.close(); }, 1);
		return;
	}

	if(result.Config != null && result.Config.style == "classic")
		classicTheme(result);
	else
		themeWithEvents(result);


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
		window.open("options.html", "nuevo", "directories=no, menubar=no, scrollbars=yes, statusbar=no, tittlebar=no, width=1100, height=900");
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
		window.open("options.html", "nuevo", "directories=no, menubar=no, scrollbars=yes, statusbar=no, tittlebar=no, width=1100, height=900");
		setTimeout(function () { window.close(); }, 1);
	});

	insertEvents(data);

}
function change(flag)
{
	DataAccess.setData("enable",flag);
	chrome.runtime.sendMessage({changeIcon:flag});
		
}
function insertEvents(data)
{

	var events = data.tasks;
	var event;
	var deadLine = new Date();
	var checked;		
	for (var i = events.length - 1; i >= 0; i--) {
		
		if(data.eventDone != undefined && data.eventDone[events[i].id] != null )
			checked = ((data.eventDone[events[i].id].checked || data.eventDone[events[i].id].done)?"checked":" ") + ((data.eventDone[events[i].id].done)?" disabled":" ");
		else
			checked = "";
		
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
	$("#eventsTotal").text(events.length);
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
	tomorrow.setDate(tomorrow.getDate() - 1);

	// Check if the event will be tomorrow
	if((date.getDate() -1) == tomorrow.getDate()  && date.getMonth() == tomorrow.getMonth())
		return "מחר " + zeroIsRequiered(date.getHours()) + ":" + zeroIsRequiered(date.getMinutes());
	
	if(date.getDate() == (new Date).getDate()  && date.getMonth() == (new Date).getMonth())
		return "היום " + zeroIsRequiered(date.getHours()) + ":" + zeroIsRequiered(date.getMinutes());

	return zeroIsRequiered(date.getHours()) + ":" + zeroIsRequiered(date.getMinutes())+", " + weekday[date.getDay()] + ", " + zeroIsRequiered(date.getDate()) + " " + month[date.getMonth()] +" " + date.getFullYear();
}
function zeroIsRequiered(number)
{
	if(number<10)
		return "0" + number;
	return number;
}
