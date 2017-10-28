var username;
var startCounter = 0;
$(document).ready(function () {
    DataAccess.Data(onStart);

});


function onStart(data) {

    // Check if the username and password is not empty
    username = data["username"];
    console.log("JCT Tools->Username: " + username);
    // Decrypting the password
    var password = "";
    if (data["password"] != null)
        password = window.atob(data["password"]);

    // Check current host
    switch (location.host) {
        case "moodle.jct.ac.il":
            moodle(password, data);
            break;
        case "mazak.jct.ac.il":
        case "levnet.jct.ac.il":
                mazakConnect(data);
            break;
        case "1.1.1.1":
        case "10.1.1.1":
        case "wireless-login.jct.ac.il":
        case "captiveportal-login.jct.ac.il":
        case "securelogin.jct.ac.il":
            if (data["wf"] && data.enable && data.anonymous != true)
                wifiConnect(password);
            break;
    }
}

function wifiConnect(pass) {



    if (document.title == "Web Authentication Failure") {
        alert("Web Authentication Failure!\nare you already online?\nWrong username or password?")
        window.close();
        return;
    }
    var err = $("input[name='err_flag']");
    if (err != null && $(err).attr("value") == "1")
        return;
    $("input[name='username']").attr("value", username);
    $("input[name='password']").attr("value", pass);

    var submitButton = $("#frmLogin #btnSubmit_6");

    if ($(submitButton).length > 0) {

        //New wifi login (01/02/2017)
        $(submitButton).click();
    } else {
        //old wifi login
        var actualCode = "submitAction();";
        var script = document.createElement('script');
        script.textContent = actualCode;
        (document.head || document.documentElement).appendChild(script);
        script.parentNode.removeChild(script);
    }

}

function mazakConnect(data) {

    //Courses time as list page
    if (location.pathname.includes("/Student/ScheduleList.aspx")) {


        //In case that the user want to, remove the class 'right' from the table in order to fix the table
        if (data.Config.coursesOrder != undefined && data.Config.coursesOrder != false)
            $("td").removeClass('right');

      /*  var myCalendar = createCalendar({
            options: {
                class: 'my-class',

                // You can pass an ID. If you don't, one will be generated for you
                id: 'my-id'
            },
            data: {
                // Event title
                title: 'Get on the front page of HN',

                // Event start date
                start: new Date('June 15, 2013 19:00'),

                // Event duration (IN MINUTES)
                duration: 120,

                // You can also choose to set an end time
                // If an end time is set, this will take precedence over duration
                end: new Date('June 15, 2013 23:00'),

                // Event Address
                address: 'The internet',

                // Event Description
                description: 'Get on the front page of HN, then prepare for world domination.'
            }
        });

        document.querySelector('.courseMultiView').appendChild(myCalendar);*/

        return;
    }

    //Grades page
    if (location.pathname.includes("Student/Grades.aspx")) {

        if(data.Config == null)
            data.Config ={};
        gradesButton(data);
        //customGrades();
        return;
    }

    if (!location.pathname.includes("Login.aspx") && (data.anonymous == true)) {
        chrome.runtime.sendMessage({levnetLoginAndUpdate:true});
        return;
    }

    //Fix bug in mazak (09.07.2017)
    //The error show the menubar but its not redirect the student to the main page.
    if (location.pathname.includes("Login.aspx") && $("ul[role=menubar]").length > 0) {// Check if the menubar, exist in the login page
        window.location.href = '/Student/Default.aspx';
        return;
    }
    //LOGIN PAGE
    if(data.anonymous == true)
        return;

    //Check if the user active the auto login
    if (data["mz"] != true || data.enable != true)
        return;

    //check if the username input exist (in order to prevent a bug)
    if ($("#username").length == 0) {
        if (location.pathname.includes("Login")) {
            console.log("JCT Tools-> User name field not found")

        }
        return;
    }

    //check if the password input exist (in order to prevent a bug)
    if ($("#password").length == 0) {
        if (location.pathname.includes("Login")) {
            console.log("JCT Tools-> password field not found");

        }
        return;
    }

    //This function is a little hack to replace the chrome autofill.
    $(":input").each(function () {
        if (this.name == "username")
            this.value = username;
        if (this.name == "password")
            this.value = window.atob(data["password"]);
    });

    $("#username").val(username);
    $("#password").val( window.atob(data["password"]));

    console.log("JCT Tools-> Starting levnet autologin ");
    //This 2 lines is not requiered, but they are in order to prevent a bug
    $("#username").attr("value", username);
    $("#password").attr("value", window.atob(data["password"]));

    //Submit the form - Angular functions
    location.href="javascript:console.log('JCT Tools-> trying mazak login');"
        + "var $scope = angular.element('#username').scope();"
        + "$scope.login = {username:'"+username+"', password: '"+window.atob(data["password"]) +"'};"
        + "$scope.loginForm.$valid = true;"
        + "$scope.tryLogin();";

    // $("#mainForm").submit();
}


/**
 * This function will manager the grades page.
 */
function gradesButton(data) {

    console.log("JCT Tools-> gradesButton() and customGrade are disabled for now")
    // $("header").append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">');
    // $("td").removeClass('right');
    // $("th").css( "text-align", "center" );

    //First we check if the user wants this option then
    if (data.Config.customGrades != undefined && data.Config.customGrades != false) {

        if(data.Config.gradesOptions == undefined)
            data.Config.gradesOptions = {};


        return;
        //Backup the line
        var dvGrades = $($("div[data-course-legend]")[0]);
        //Check if the document is loaded
        // if($(dvGrades).find("label").length ==0)
        //     return setTimeout(function(){gradesButton(data)},300);

        //New content
        //Additional options
        $($(dvGrades).find('.text-warning')[0]).after('&nbsp;|<label><input id="couseWithoutPoints" type="checkbox" ' + ((data.Config.gradesOptions["couseWithoutPoints"] == true)?"checked":"") +'>&nbsp;קורס ללא נקודות זכות</label>&nbsp;|' +
            '<label><input id="couseWithoutGrade" type="checkbox" ' + ((data.Config.gradesOptions["couseWithoutGrade"] == true)?"checked":"") +'>&nbsp;קורס ללא ציון</label>');
        //After insert additional options, the program insert the checkbox
        var examples = $(dvGrades).find("label");
        $(examples[0]).prepend('<input id="courseNotPassed" type="checkbox" ' + ((data.Config.gradesOptions["courseNotPassed"] != false )?"checked":"" )+'>&nbsp;');
        $(examples[1]).prepend('<input id="courseDroppedOutPurple" type="checkbox" ' + ((data.Config.gradesOptions["courseDroppedOutPurple"] == true)?"checked":"") +'>&nbsp;');
        $(examples[2]).prepend('<input id="courseNotConfirmed" type="checkbox" ' + ((data.Config.gradesOptions["courseNotConfirmed"] != false)?"checked":"") +'>&nbsp;');
        //Set the checkbox on click to run the function customGrades
        $(examples).find("input[type=checkbox]").on("click", customGrades);
        setTimeout(function(){setGradeTableDBClick(data)},1500);
        //TODO : check if the user change the page and then invoke setGradeTableDBClick function
        if($(".ui-paging").find("li").length == 0)
            console.log("ui-paging is empty")
        else
            console.log("ui-paging total:" + $(".ui-paging").find("li").length)

        $(".ui-paging").find("li").click(function () {
            console.log("Table updated");
            setTimeout(function(){
                DataAccess.Data(setGradeTableDBClick);
            },1500);
        });
        //Add option to show all grades
        $($(".table-responsive").find(".ng-binding")[0]).prepend("<button id='showAllGrades' class='btn btn-default'>הראה כל הציונים</button>&nbsp;");
        $("#showAllGrades").click(function (e) {
            e.preventDefault();
            location.href="javascript:var $scope = angular.element('.table-responsive').scope();"
            +"$scope.$$childHead.pageSize = 9999;"
            +"$scope.$$childHead.setPage(0)";
            $(this).remove();
            setTimeout(function() {
                customGrades();
                setGradeTableDBClick(data);
            },1000);

        });
        //Run the function customGrades in order to refresh the table
        customGrades();
    }


    //In case the user wants to
    if (data.Config.showGrades != undefined && data.Config.showGrades != false) {

        //Create the last table line with the average
        var customTotal = '<tr id="customTotal" style="background-color:#004184;color:#fff;font-weight: bolder;">' +
            '<th></th>' +
            '<th> סה"כ קורסים:  </th> ' +
            '<th id="TCourses">0</td>' +
            '<th colspan="2">סכ"ה נ"ז:</th> ' +
            '<th id="TNZ">0</th> ' +
            '<th>ממוצע:</th> ' +
            '<th id="TG">-</th> ' +
            '<th colspan="2"></th>' +
            '</tr>';

        //append to the tabla
        $(".table-responsive").find("table").append(customTotal);

        //Run the function customGrades in order to set the average
        customGrades();

    }


}

function setGradeTableDBClick(data) {
    if(data.Config != null && data.Config.customAverage == true) {
        //Append instructions
        if($("#changeGradeWarning").length == 0) {
            $($("div[data-course-legend]")[0]).prepend("<div id='changeGradeWarning' class='filterBox' style='overflow:hidden;margin: 10px 0'><div  style='float:right;margin: 0;padding: 0;margin-left: 5px;'><span class='glyphicon glyphicon-info-sign'></span></div><div style='margin: 0;padding:0;'>ניתן לשנות את הציונים בתצוגה ( <b>בלבד  </b> ) לצורך חישוב הממוצע באמצעות לחיצה כפולה על הציון המבוקש</div></div>")
        }
        console.log($(".table-responsive").find("tr"));
        //This function will set the option of double click in a grade
        $(".table-responsive").find("tr").each(function () {
            $(this).dblclick(function () {

                var that = this;

                var td = $(this).find("td");

                var grade = $(td)[6];

                var min = $($(td)[5]).text().trim();

                if (isNaN(min)) min = 0;

                var gradeInput = $(grade).find(":input");

                if ($(gradeInput).length > 0) {
                    //Writing new grade
                    var value = $(gradeInput).val().trim();
                    $(grade).empty();
                    $(grade).append(value);
                    customGrades();


                    if (isNaN(value) || parseInt(value) >= parseInt(min)) {
                        if ($(this).hasClass("notPassed"))
                            $(this).removeClass("notPassed ");
                    } else {
                        if (!$(this).hasClass("notPassed"))
                            $(this).addClass("notPassed");
                    }


                } else {
                    var tText = $(grade).text().trim();
                    if (isNaN(tText))
                        tText = "";
                    var inputGrade = "<input type='text' value='" + tText + "' style='width: 50px;text-align: center;font-size: 15px;height: 22px;'>";
                    $(grade).empty();
                    $(grade).append(inputGrade);
                    inputGrade = $(grade).find(":input");


                    $(inputGrade).keypress(function (e) {
                        if (e.which == 13) {
                            var gradeInput = $(grade).find(":input");
                            var value = $(gradeInput).val().trim();
                            $(grade).empty();
                            $(grade).append(value);

                            customGrades();

                            //Set new class
                            if (isNaN(value) || parseInt(value) >= parseInt(min)) {
                                if ($(that).hasClass("notPassed"))
                                    $(that).removeClass("notPassed ");
                            } else {
                                if (!isNaN(value))
                                    if (!$(that).hasClass("notPassed"))
                                        $(that).addClass("notPassed");
                            }
                        }
                    });


                }


            });
        });
    }else
        console.log("JCT Tools-> Double click option is off ");
}

/**
 * This function will:
 *    + Check with checkbox (from the first line) is checked and the reload the table
 *    + Calculate the average and the update the last line
 */
function customGrades() {


    var i = 0;
    var gradeTd = 0;
    var NZ = 0;
    var grade = 0;

    var sumNZ = 0;
    var sumGrade = 0;
    console.log("JCT Tools-> customGrades function called ");
    var customGradeDiv = $($("div[data-course-legend]")[0]).find("label");


    var gradesOptions = {};
    gradesOptions["courseNotPassed"] = $(customGradeDiv).find("#courseNotPassed").is(":checked");
    gradesOptions["courseDroppedOutPurple"] = $(customGradeDiv).find("#courseDroppedOutPurple").is(":checked");
    gradesOptions["courseNotConfirmed"] = $(customGradeDiv).find("#courseNotConfirmed").is(":checked");
    gradesOptions["couseLineThrough"] = $(customGradeDiv).find("#couseLineThrough").is(":checked");
    gradesOptions["couseWithoutPoints"] = $(customGradeDiv).find("#couseWithoutPoints").is(":checked");
    gradesOptions["couseWithoutGrade"] = $(customGradeDiv).find("#couseWithoutGrade").is(":checked");
    DataAccess.setObject("Config","gradesOptions",gradesOptions);

    //For every td in the grade table
    $(".table-responsive").find("table").find("tbody").find("tr").each(function () {


        //Check if this is not the last line (with the average)
        if ($(this).attr("id") == "customTotal")
            return;

        //Reset line background color
      /*  if ($(this).hasClass("alternateOdd"))
            $(this).removeClass("alternateOdd");

        if ($(this).hasClass("alternateEven"))
            $(this).removeClass("alternateEven");*/


        //Get all columns of this line
        gradeTd = $(this).find("td");

        //Find the column where contains course gradde
        grade = $(gradeTd[6]).text().trim();

        //Find the column where contains course total points
        NZ = $(gradeTd[4]).text().trim();

        //In order to prevent a bug
        if (gradeTd.length == 0) {
            return;
        }

        //This if will check with check box (on first line) is selected and then show/hide the line
        if (
         //For courses that the user didn't pass
        ($(this).hasClass("not-passed") && !gradesOptions["courseNotPassed"]) ||
        //For courses that are exclude
        ($(this).hasClass("dropped-out") && !gradesOptions["courseDroppedOutPurple"]) ||
        //For courses that is not confirmed
        ($(this).hasClass("not-confirmed") && !gradesOptions["courseNotConfirmed"]) ||
        //For courses that are not in the system
        ($(gradeTd[6]).hasClass("lineThrough") && !gradesOptions["couseLineThrough"]) ||
        // Check  if the total points are 0
        (NZ == 0 && !gradesOptions["couseWithoutPoints"]) ||
        //
        (isNaN(parseFloat(grade)) && !gradesOptions["couseWithoutGrade"] && (grade == "חסר" || grade == "עבר" || grade == "לא השלים"))
        ) {
            $(this).hide();

            return; //To stop and not calculate the average and i

        } else
            $(this).show();


        //Check if the grade is a number (in order to calculate the average
        if (!isNaN(parseFloat(grade)) && !isNaN(parseFloat(NZ))) {
            sumNZ += parseFloat(NZ);
            sumGrade += NZ * grade;
        }

        //With the  object 'i' it possible to check if this line is in even position and insert his class
        // (i % 2 != 0) ? $(this).addClass("alternateOdd") : $(this).addClass("alternateEven");

        i++;
    });

    //Get the average
    var average = (sumGrade / sumNZ).toFixed(3);
    //In case the table is not loaded
    if(isNaN(average)) {
        //To prevent a bug
        if(startCounter++ > 10)
            return;

        setTimeout(customGrades,1000);
        return;
    }
    //Set total courses (by total of active lines)
    $("#TCourses").text((i - 1));
    //Set total of points
    $("#TNZ").text(sumNZ);
    //Set average
    $("#TG").text(average);




}

//Not in used
function customGradesTable() {
    var table = $("#dvGrades").find("#ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder1_grdGrades_itemPlaceholderContainer");


    if ($(table).length == 0) {
        console.log("JCT Tools-> table is empty");
        return;
    }
    var tr = $(table).find("tr");
    if ($(tr).length == 0) {
        console.log("JCT Tools-> tr is empty");
        return;
    }


    var customTr = "<table>";
    console.log("JCT Tools-> Fetching data");

    $(tr).each(function () {

        var i = 0;
        var customTd = "";
        $(this).find("td").each(function () {
            switch (i) {
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
        customTr += "<tr>" + customTd + "</tr>";

    });
    console.log(customTr);

    customTr += "</table>";

    return customTr;

    //allTests
}


function moodle(pass, data) {
    if (location.pathname.includes("assign")) {
        checkHW();
        return;
    }

    if (location.pathname.includes("course/view.php")) {
        if (data.Config != null && data.Config["testInCoursePage"] != false)
            addTestDate(data);

        return;
    }

    if (($("#login_username").length != 0 && $("#login_password").length != 0) && data.anonymous != true) {
        if (data["mo"] && data.enable) {
            $("#login_username").val(data.username);
            $("#login_password").val(pass);
            $("#login input[value='התחברות'][type='submit']").click();
        }
    }
    else {
        console.log("JCT Tools->" + "Moodle hide user events: " + data.Config["MoodleHiddeUE"]);


        if (undefined == data)
            data = {};

        if (data.Config == undefined)
            data.Config = {};

        hideCourses(data.moodleCoursesTable, data.Config.hiddeModdelHelp);

        if (!data["mo"] || !data.enable)
            return;


        var courseId;
        $(".event").each(function () {

            if ($(this).find("img").attr("alt") == "אירוע משתמש") {
                if (data.Config["MoodleHiddeUE"])
                    $(this).remove();
            } else {

                /********** Delete homeworks done***************
                 homeworkId = ($(this).find("a"))[0];
                 homeworkId = $(homeworkId).attr('href');
                 homeworkId = homeworkId.substring(homeworkId.lastIndexOf("id")+3);
                 if(data.eventDone[homeworkId] != null && data.eventDone[homeworkId].checked)
                 $(this).remove();
                 ************************************************/

                if (data.Config.hiddeNoSelectedCourseInMoodle) {
                    /**************************************
                     * Search the homework course id
                     ***************************************/
                    //data.Config.hiddeNoSelectedCourseInWindows == true &&
                    courseId = $(this).find('.course').find('a');
                    if (courseId == undefined || courseId.length == 0)
                        return undefined;
                    courseId = $(courseId).attr('href');
                    // Get id from href (ex: http://moodle.jct.ac.il/course/view.php?id=28513)
                    courseId = courseId.substring(courseId.lastIndexOf("id") + 3);
                    if (data.moodleCoursesTable[courseId] != true) {
                        console.log("JCT Tools->Homework with course id: " + courseId + " deleted");
                        $(this).next("hr").remove();
                        $(this).remove();
                    }
                }

            }

        });

        if (data.Config["moodleTopic"])
            $(".sitetopic").remove();

        if (data.Config["eventsOnTop"] && data["mo"] && data.enable) {
            $("#inst121811").find(".block_action").remove();
            var eventsDiv = $("#inst121811");
            $("#inst121811").remove();
            $("#block-region-side-post").prepend(eventsDiv);
        }


        if (data.testsDate != undefined && data.Config.showTestDay != false) {

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

                if (courseTest == undefined || courseTest.id == undefined)
                    continue;

                console.log("JCT Tools-> Course id: " + courseTest.id);

                courseTest = data.testsDate[courseTest.id.split('.')[0]];
                if (courseTest == undefined)
                    continue;


                courseHtml = getCourseSpan(courseTest);
                if (courseHtml == null)
                    continue;

                li = $("[data-courseid=" + mycourses[i] + "]").find(".moreinfo");
                $(li).append(courseHtml);
                $(li).css({"text-align": "center", "color": "#0070a8", "font-weight": "bold", "margin-left": "15px"});
            }

        }

    }
}

function getCourseSpan(courseTest) {

    var testDateHtml = "";

    if (courseTest["moed1day"] == undefined || courseTest["moed1time"] == undefined) {
        return null;
    }


    var moed = stringDateToDateObject(courseTest["moed1day"], courseTest["moed1time"]);
    if (courseTest["registerToMoed3"] != true && Date.parse(moed) > Date.now()) {
        testDateHtml = "מועד א";
        testDateHtml += "<br/>";
        testDateHtml += courseTest["moed1day"] + " - " + courseTest["moed1time"];
    }
    else {

        if (courseTest["moed2day"] == undefined || courseTest["moed2time"] == undefined) {
            return null;
        }


        if (courseTest["registerToMoed3"] != true && courseTest["registerToMoedBet"] == true) {
            moed = stringDateToDateObject(courseTest["moed2day"], courseTest["moed2time"]);
            console.log("JCT Tools-> Moed 2: " + moed);
            if (Date.parse(moed) > Date.now()) {
                testDateHtml = "מועד ב";
                testDateHtml += "<br/>";
                testDateHtml += courseTest["moed2day"] + " - " + courseTest["moed2time"];
            }

        }
        else if (courseTest["registerToMoed3"] == true) {
            moed = stringDateToDateObject(courseTest["moed3day"], courseTest["moed3time"]);
            console.log("JCT Tools-> Moed 3: " + courseTest["moed3day"]);

            if (Date.parse(moed) > Date.now()) {
                testDateHtml = "מועד ג";
                testDateHtml += "<br/>";
                testDateHtml += courseTest["moed3day"] + " - " + courseTest["moed3time"];
            }
        } else
            return null;
    }
    return testDateHtml;

}
function checkHW() {
    console.log("JCT Tools->" + " Cheking homework status");

    var urlParam = location.search.replace('?', '').replace('&', '=').split('=');
    var urlCourseId = null;
    for (var i = 0; i < urlParam.length; i++) {
        if (urlParam[i] == "id") {
            urlCourseId = urlParam[i + 1];
            console.log("JCT Tools->" + " Homework id = " + urlCourseId);
            break;
        }
    }
    if (urlCourseId == null)
        return;

    if ($(".submissionstatussubmitted").length > 0 || $(".latesubmission").length > 0 || $(".earlysubmission").length > 0) {
        //setObjectInObject:function(objName,hash1, hash2, value = null,callBackFunction = null)
        DataAccess.setObjectInObject("eventDone", urlCourseId, "checked", true);
        console.log("JCT Tools->" + " Homework is done");

    }

}

function addTestDate(data) {

    console.log("JCT Tools->" + " Checking for tests");

    if (data == null)
        return;

    var urlParam = location.search.replace('?', '').replace('&', '=').split('=');
    var urlCourseId = null;
    for (var i = 0; i < urlParam.length; i++) {
        if (urlParam[i] == "id") {
            urlCourseId = urlParam[i + 1];
            console.log("JCT Tools->" + " Homework id = " + urlCourseId);
            break;
        }
    }

    var courseTest = data.courses[urlCourseId];
    if (courseTest == null) {
        console.log("JCT Tools->" + " The course isn't in the database" + urlCourseId);
        return;

    }

    var courseHtml = getCourseSpan(data.testsDate[courseTest.id.split('.')[0]]);

    if (courseHtml == null)
        return;

    var div = '<span style=" background-color: lightgoldenrodyellow;' +
        ' display: block; text-align: center; color: rgb(0, 112, 168);  font-weight: bold; ">' +
        courseHtml +
        '</span>'
    $("#user-notifications").append(div);
}


