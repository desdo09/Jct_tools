var username;

$(document).ready(function()
{
	DataAccess.Data(onStart);

});


function onStart(data)
{
	console.log("JCT Tools->Auto login: " + (data.enable&&data["wf"]));
	// Check if the username and password is not empty
	username =  data["username"];

	console.log("JCT Tools->Username: " + username);
	// Decrypting the password
	var password = "";
	if(data["password"] != null)
		password = window.atob(data["password"]);
	console.log("JCT Tools->Current host: " + location.host)		
	// Check current host
	switch(location.host)
	{
    	case "moodle.jct.ac.il":
     	  moodle(password,data);
        break;
  		case "mazak.jct.ac.il":
        case "levnet.jct.ac.il":
  			if(data["mz"] && data.enable)
        		mazakConnect(password);
        break;
        case "1.1.1.1":
        case "10.1.1.1":
        case "wireless-login.jct.ac.il":
		case "captiveportal-login.jct.ac.il":
        	if(data["wf"] && data.enable)
        		wifiConnect(password);
        break;
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
	
	var submitButton = $("#frmLogin #btnSubmit_6");
			
	if($(submitButton).length >0)
	{
		
		//New wifi login (01/02/2017)
		$(submitButton).click();
	}else{
		//old wifi login		
		var actualCode = "submitAction();";
		var script = document.createElement('script');
		script.textContent = actualCode;
		(document.head||document.documentElement).appendChild(script);
		script.parentNode.removeChild(script);
	}

}

function mazakConnect(pass)
{
	if(location.pathname.includes("Student/Grades.aspx")) {
        gradesButton();
        //customGrades();
        return;
    }


	if($("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_LoginControl_UserName").length ==0) {
        if (location.pathname.includes("Login")) {
            console.log("JCT Tools-> User name field not found")

        }
        return;
    }
	$("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_LoginControl_UserName").attr("value",username);
	if($("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_LoginControl_Password").length ==0) {
        if (location.pathname.includes("Login")) {
            console.log("JCT Tools-> password field not found");

        }
        return;
    }
	$("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_LoginControl_Password").attr("value",pass);
//	$("#aspnetForm input[type='submit']").click();
}

function gradesButton() {

	var examples = $("#dvGrades").find(".courseColorReader");

    $(examples[0]).find(".notPassed").remove();
    $(examples[0]).find(".droppedOutPurple").remove();
    $(examples[0]).find(".notConfirmed").remove();
    $(examples[0]).find(".lineThrough").remove();

    var select = '<div id="gradeTableOptions" class="courseColorReader bold">'+
        	'<span class="notPassed"><input id="courseNotPassed" type="checkbox" checked>&nbsp;ציון נכשל</span>&nbsp;|&nbsp;'+
			'<span class="droppedOutPurple"><input id="courseDroppedOutPurple" type="checkbox" >&nbsp; קורס שלא נחשב לממוצע</span>&nbsp;|&nbsp;'+
			'<span class="notConfirmed"><input id="courseNotConfirmed" type="checkbox" checked>&nbsp; קורס לא מאושר </span>&nbsp;|&nbsp;'+
			//'<span class="lineThrough"><input id="couseLineThrough" type="checkbox" >&nbsp;לא נחשב לממוצע</span>&nbsp;|&nbsp;'+
    	    '<span><input id="couseWithoutPoints" type="checkbox" >&nbsp;קורס ללא נקודות זכות</span>&nbsp;|&nbsp;'+
        	'<span><input id="couseWithoutGrade" type="checkbox" >&nbsp;קורס ללא ציון</span>&nbsp;|&nbsp;'+
       	//	'<span><input id="couseWithoutGrade" type="checkbox" >&nbsp; קורס ללא ציון - סמסטר הנוכחי</span>'+

        '</div>';

    var customTotal = '<tr id="customTotal">' +
							'<td></td>'  +
							'<td> סכ"ה קורסים  </td> ' +
							'<td id="TCourses">10</td>' +
						    '<td colspan="2">סכ"ה נ"ז:</td> ' +
							'<td id="TNZ">10</td> ' +
							'<td>ממוצעה:</td> ' +
							'<td id="TG">10</td> ' +
							'<td colspan="2"></td>' +
					'</tr>' ;

     $("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_grdGrades_itemPlaceholderContainer").append(customTotal);


    var temp = $(examples[0]).find("span");
    $(examples[0]).empty();
    $(examples[0]).append(temp);

	$("#content").find(".filterBox").append(select);

	$("#gradeTableOptions").find("input[type=checkbox]").on( "click", customGrades );

    customGrades();
}

function customGrades() {


    var i=0;
    var gradeTd = 0;
    var NZ=0;
    var grade=0;

    var sumNZ =0;
    var sumGrade =0;
    console.log("JCT Tools-> customGrades function called ");
    var customGradeDiv = $("#gradeTableOptions");

    $("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_grdGrades_itemPlaceholderContainer").find("tbody").find("tr").each(function () {
    	if(i==0) {
    		i++;
            return;
        }

        if($(this).attr("id") == "customTotal")
        	return;

        if($(this).hasClass("alternateOdd"))
       		$(this).removeClass("alternateOdd");

    	if($(this).hasClass("alternateEven"))
    		$(this).removeClass("alternateEven");



        //Find the course total points
        gradeTd = $(this).find("td");

        grade = $(gradeTd[6]).text().trim();

        NZ = $(gradeTd[4]).text().trim();

        if(gradeTd.length == 0) {
            console.log("JCT Tools-> gradeTd empty ");
            return;
        }



        if(
        	 //For courses that the user didn't pass
        	($(this).hasClass("notPassed") && !$(customGradeDiv).find("#courseNotPassed").is(":checked")) 				||
            //For courses that are exclude
            ($(this).hasClass("droppedOutPurple") && !$(customGradeDiv).find("#courseDroppedOutPurple").is(":checked")) ||
            //For courses that is not confirmed
            ($(this).hasClass("notConfirmed") && !$(customGradeDiv).find("#courseNotConfirmed").is(":checked")) 		||
            //For courses that are not in the system
            ($(gradeTd[6]).hasClass("lineThrough") && !$(customGradeDiv).find("#couseLineThrough").is(":checked")) 		||
        	// Check  if the total points are 0
            (NZ==0 && ! $(customGradeDiv).find("#couseWithoutPoints").is(":checked")) 									||
			//
            (isNaN(parseFloat(grade)) &&  ! $(customGradeDiv).find("#couseWithoutGrade").is(":checked") && (grade == "חסר" || grade == "עבר"))
        )
        {
			$(this).hide();
			return ;

        }else
            $(this).show();


        if(!isNaN(parseFloat(grade)) && !isNaN(parseFloat(NZ))) {
            sumNZ += parseFloat(NZ);
            sumGrade += NZ*grade;
            console.log("JCT Tools-> Grade: " + grade + " |  NZ: " + NZ + " |  Sum of NZ: " + sumNZ );
        }



        (i%2 != 0)?$(this).addClass("alternateOdd"):$(this).addClass("alternateEven");

        i++;
    });
    var average = (sumGrade/sumNZ).toFixed(3);

    console.log("JCT Tools-> Total courses: "+ (i-1) + " Total NZ: " +sumNZ + " average: " + average );
    $("#TCourses").text((i-1));
    $("#TNZ").text(sumNZ);
    $("#TG").text(average);


}

//Not in used
function customGradesTable()
{
    var table = $("#dvGrades").find("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_grdGrades_itemPlaceholderContainer");


	if($(table).length==0) {
        console.log("JCT Tools-> table is empty");
        return;
    }
    var tr = $(table).find("tr");
	if($(tr).length==0){
        console.log("JCT Tools-> tr is empty");
        return;
    }



	var customTr = "<table>";
    console.log("JCT Tools-> Fetching data");

	$(tr).each(function()
	{

		var i=0;
		var customTd="";
		$(this).find("td").each(function()
		{
			switch(i)
			{
				case 1:
                    customTd = "<td>" + $(this).text().trim() + "</td>";
					break;

                case 2:
                    customTd += "<td>" + $(this).text().trim() + "</td>";
                    break;

                case 4:
                    customTd += "<td>" + $(this).text().trim() + "</td>";
                    break;
                case 6:
                    customTd += "<td>" + $(this).text().trim() + "</td>";
                    break;
			}

			i++;
		});
        customTr +="<tr>"+customTd+"</tr>";

    });
    console.log(customTr);

    customTr+="</table>";

    return customTr;

    //allTests
}



function moodle(pass,data)
{
	if(location.pathname.includes("assign") )
	{
		checkHW();
		return;
	}

    if(location.pathname.includes("course/view.php") )
    {
    	if(data.Config != null && data.Config["testInCoursePage"] != false)
			addTestDate(data);

        return;
    }

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


		if (undefined == data )
			data = {};

		if(data.Config == undefined)
			data.Config = {};

		hideCourses(data.moodleCoursesTable,data.Config.hiddeModdelHelp);

		if(!data["mo"] || !data.enable)
			return;
		

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

			//var to save all courses in "mycourses"
			var mycourses = Object.keys(data.moodleCoursesTable);
			//var to save the current course
            var courseTest;
            //save the course test in html format
			var courseHtml;
			// Save the place where the extension will save insert the data
			var li;

			for (var i = 0; i < mycourses.length; i++) {

				courseTest = data.courses[mycourses[i]];

				if(courseTest == undefined  || courseTest.id == undefined)
					continue;

				console.log("JCT Tools-> Course id: " + courseTest.id);

				courseTest = data.testsDate[courseTest.id.split('.')[0]];
				if(courseTest == undefined)
					continue;


                courseHtml = getCourseSpan(courseTest);

                if(courseHtml == null)
                	continue;

                li = $("[data-courseid="+mycourses[i]+"]").find(".moreinfo");
				$(li).append(courseHtml);
                $(li).css({ "text-align": "center", "color" : "#0070a8", "font-weight": "bold", "margin-left": "15px"});
			}

		}

	}
}

function getCourseSpan(courseTest) {

    var testDateHtml = "";

    if(courseTest["moed1day"] == undefined || courseTest["moed1time"] == undefined)
    {
        return null;
    }


    var moed = stringDateToDateObject(courseTest["moed1day"],courseTest["moed1time"]);
    if(courseTest["registerToMoed3"] != true && Date.parse(moed)> Date.now())
    {
        testDateHtml = "מועד א";
        testDateHtml += "<br/>";
        testDateHtml += courseTest["moed1day"] + " - " + courseTest["moed1time"];
    }
    else
    {

        if( courseTest["moed2day"] == undefined || courseTest["moed2time"] == undefined)
        {
            return null;
        }



        if(courseTest["registerToMoed3"] != true &&  courseTest["registerToMoedBet"] == true)
        {
            moed = stringDateToDateObject(courseTest["moed2day"],courseTest["moed2time"]);
            console.log("JCT Tools-> Moed 2: " + moed);
            if(Date.parse(moed)> Date.now() )
            {
                testDateHtml = "מועד ב";
                testDateHtml += "<br/>";
                testDateHtml += courseTest["moed2day"] + " - " + courseTest["moed2time"];
            }

        }
        else

        if(courseTest["registerToMoed3"] == true)
        {
            moed = stringDateToDateObject(courseTest["moed3day"],courseTest["moed3time"]);
            console.log("JCT Tools-> Moed 3: " + courseTest["moed3day"]);

            if(Date.parse(moed)> Date.now())
            {
                testDateHtml = "מועד ג";
                testDateHtml += "<br/>";
                testDateHtml += courseTest["moed3day"] + " - " + courseTest["moed3time"];
            }
        }else
            return null;

        return testDateHtml;
    }
}
function checkHW()
{	
	console.log("JCT Tools->" + " Cheking homework status");
	
	var urlParam = location.search.replace('?', '').replace('&','=').split('=');
	var urlCourseId = null;
	for(var i=0;i<urlParam.length;i++)
	{
		if(urlParam[i] == "id")
		{
			urlCourseId = urlParam[i+1];
			console.log("JCT Tools->" + " Homework id = " +urlCourseId );			
			break;
		}
	}
	if(urlCourseId == null)
		return;
	
	if($(".submissionstatussubmitted").length > 0 || $(".latesubmission").length > 0 || $(".earlysubmission").length > 0)
	{
		//setObjectInObject:function(objName,hash1, hash2, value = null,callBackFunction = null)
		DataAccess.setObjectInObject("eventDone",urlCourseId,"checked",true);
		console.log("JCT Tools->" + " Homework is done");			
		
	}
	
}

function addTestDate(data) {

    console.log("JCT Tools->" + " Checking for tests");

    if(data==null)
		return;

    var urlParam = location.search.replace('?', '').replace('&','=').split('=');
    var urlCourseId = null;
    for(var i=0;i<urlParam.length;i++)
    {
        if(urlParam[i] == "id")
        {
            urlCourseId = urlParam[i+1];
            console.log("JCT Tools->" + " Homework id = " +urlCourseId );
            break;
        }
    }

   var courseTest = data.courses[urlCourseId];
    if(courseTest == null)
	{
        console.log("JCT Tools->" + " The course isn't in the database" +urlCourseId );
        return;

	}

    var courseHtml = getCourseSpan(data.testsDate[courseTest.id.split('.')[0]]);

    if(courseHtml == null)
        return;

    var div ='<span style=" background-color: lightgoldenrodyellow;'+
		' display: block; text-align: center; color: rgb(0, 112, 168);  font-weight: bold; ">'+
        	courseHtml+
		'</span>'
    $("#user-notifications").append(div);
}


