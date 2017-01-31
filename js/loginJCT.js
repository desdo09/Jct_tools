var username;

$(document).ready(function()
{
	DataAccess.Data(onStart);

});


function onStart(data)
{
	console.log("JCT Tools->Auto login: " + data.enable)
	// Check if the username and password is not empty
	username =  data["username"];

	console.log("JCT Tools->Username: " + username);
	// Decrypting the password
	var password = "";
	if(data["password"] != null)
		password = window.atob(data["password"]);
	// Check current host
	switch(location.host)
	{
    	case "moodle.jct.ac.il":
     	  moodleConnect(password,data);
        break;
  		case "mazak.jct.ac.il":
        case "levnet.jct.ac.il":
  			if(data["mz"] && data.enable)
        		mazakConnect(password);
        break;
        case "1.1.1.1":
        case "10.1.1.1":
        case "wireless-login.jct.ac.il":
        	if(data["wf"] && data.enable)
        		wifiConnect(password);
        break;
        /*case "lev.jct.ac.il":
        	if(data["re"] && data.enable)
        		remoteConnect(password);
        break;*/
	}
}

function wifiConnect(pass)
{


	if(document.title == "Web Authentication Failure")
	{
   		alert("Web Authentication Failure!\nare you already online?\nWrong username or password?")
   		window.close();
    	return;
  	}
  	var err = $("input[name='err_flag']");
  	if(err != null && $(err).attr("value") == "1")
  		return;
	$("input[name='username']").attr("value",username);
    $("input[name='password']").attr("value",pass);
	//document.forms[0].err_flag.value = 1;
    var actualCode = "submitAction();";
    var script = document.createElement('script');
    script.textContent = actualCode;
    (document.head||document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);
}

function mazakConnect(pass)
{
	if($("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_LoginControl_UserName").length ==0)
		return;
	$("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_LoginControl_UserName").attr("value",username);
	$("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_LoginControl_Password").attr("value",pass);
	$("#aspnetForm input[type='submit']").click();
}

function remoteConnect(pass)
{
//	if($("#username").length ==0)
//		return;
//	console.log("hi");
//	$("#username").attr("value",username);
//	$("#password").attr("value",pass);
	return;
//	$("button[type='submit']").click();
}

function moodleConnect(pass,data)
{
	console.log("JCT Tools->" + "Moodle automatic login:" + data["mo"]);
	if($("#login_username").length != 0 && $("#login_password").length != 0)
	{
		if(data["mo"] && data.enable)
		{
			$("#login_username").val(data.username);
			$("#login_password").val(pass);
			$("#login input[value='התחברות'][type='submit']").click();
		}
	}
	else
	{
		console.log("JCT Tools->" + "Moodle hide user events: " + data.Config["MoodleHiddeUE"]);
		//var coursesTable = $("#frontpage-course-list").html();


		if (undefined == data )
			data = {}

		if(data.Config == undefined)
			data.Config = {}

		hideCourses(data.moodleCoursesTable,data.Config.hiddeModdelHelp);
		if(!data["mo"] || !data.enable)
			return;
		

		var homeworkId = {};
		var courseId;
		$(".event").each(function(){
			
			if($(this).find("img").attr("alt") == "אירוע משתמש")
			{	
				if(data.Config["MoodleHiddeUE"])
					$(this).remove();
			}else{

				/********** Delete homeworks done***************
					homeworkId = ($(this).find("a"))[0];
					homeworkId = $(homeworkId).attr('href');
					homeworkId = homeworkId.substring(homeworkId.lastIndexOf("id")+3);
					if(data.eventDone[homeworkId] != null && data.eventDone[homeworkId].checked)
						$(this).remove();
				************************************************/

				if(data.Config.hiddeNoSelectedCourseInMoodle)
				{
					/**************************************
					* Search the homework course id
					***************************************/
					//data.Config.hiddeNoSelectedCourseInWindows == true &&
					courseId = $(this).find('.course').find('a');
					if(courseId == undefined || courseId.length == 0)
						return undefined;
					courseId = $(courseId).attr('href');
					// Get id from href (ex: http://moodle.jct.ac.il/course/view.php?id=28513)
					courseId = courseId.substring(courseId.lastIndexOf("id")+3);
					if(data.moodleCoursesTable[courseId] != true)
					{
						console.log("JCT Tools->Homework with course id: "+courseId+" deleted");
						$( this ).next( "hr" ).remove();
						$(this).remove();
					}	
				}
				
			}
		
		});

		if(data.Config["moodleTopic"])
			$(".sitetopic").remove();

		if(data.Config["eventsOnTop"] && data["mo"] && data.enable)
		{
			$("#inst121811").find(".block_action").remove();
			var eventsDiv = $("#inst121811");
			$("#inst121811").remove();
			$("#block-region-side-post").prepend(eventsDiv);
		}


		if(data.testsDate != undefined && data.Config.showTestDay != false)
		{
			var mycourses = Object.keys(data.moodleCoursesTable);
			for (var i = 0; i < mycourses.length; i++) {
				var courseTest = data.courses[mycourses[i]];
				if(courseTest == undefined  || courseTest.id == undefined)
					continue;
				console.log(courseTest.id);								
				courseTest = data.testsDate[courseTest.id.split('.')[0]];
				console.log(courseTest);			
				if(courseTest == undefined)
					continue;

				var testDateHtml = "";
					//console.log("course "+ courseTest +": moed1 date: " + courseTest["moed1day"] + " moed1 time:" + courseTest["moed1time"])
					if(courseTest["moed1day"] == undefined || courseTest["moed1time"] == undefined)
					{
						continue;
					}

				var moed = stringDateToDateObject(courseTest["moed1day"],courseTest["moed1time"]);
				if(Date.parse(moed)> Date.now())
				{	
					testDateHtml = "מועד א";
					testDateHtml += "<br/>";
					testDateHtml += courseTest["moed1day"] + " - " + courseTest["moed1time"];
				}
				else
				{
					//console.log("course "+ courseTest +": moed2 date: " + courseTest["moed2day"] + " moed2 time:" + courseTest["moed2day"])
					if(courseTest["moed2day"] == undefined || courseTest["moed2time"] == undefined)
					{
						continue;
					}
					var moed = stringDateToDateObject(courseTest["moed2day"],courseTest["moed2time"]);					
					if(Date.parse(moed)> Date.now() && courseTest[registerToMoedBet] == true)
					{
							testDateHtml = "מועד ב";
							testDateHtml += "<br/>";
							testDateHtml += courseTest["moed2day"] + " - " + courseTest["moed2time"];
							
					}
					else
						continue;	
				}
			
				$("[data-courseid="+mycourses[i]+"]").find(".moreinfo").append(testDateHtml);
				$("[data-courseid="+mycourses[i]+"]").find(".moreinfo").css({ "text-align": "center", "color" : "#0070a8", "font-weight": "bold", "margin-left": "15px"});
			}

		}

	
	


		
	}


}
