//global data;
var homeworkWindow;
var wifiWindow;
var moodleWindow;
var levnetWindow;
var usefulSites;
var currentOpen;


$(document).ready(function () {
    DataAccess.Data(onStart);
})


function onStart(result) {


    /* Check if the username and password is defined */
    var status = false;
    if (result != null)
        status = (result["username"] != undefined) && (result["password"] != undefined);


    //var status = true;
    //if the username OR the password are not defined then the extension will open the option page
    if (!status) {
        chrome.runtime.openOptionsPage();
        setTimeout(function () {
            window.close();
        }, 1);
        return;
    }

    if (result.Config != null && result.Config.style == "classic")
        classicTheme(result);
    else
        themeWithEvents(result);

    $("a[target='_blank']").click(function () {
        //	window.close();
    })

    if (result.Config != null)
    // In case the user want to updated when the button is touched
        if ((result.username && result.password) && result.Config.updateOnPopup != false)
            setTimeout(function () {
                chrome.runtime.sendMessage({updatedata: true});
            }, 20);

    chrome.runtime.sendMessage({setBadge: true});
}

function classicTheme(data) {
    $("#classic").show();
    $("#styleWithHW").remove();
    $("#loading").hide();
    // check if the extension is active
    if (data["enable"])
        $("#on").show();
    else
        $("#off").show();

    $("#disable").click(function () {
        change(false);
        setTimeout(function () {
            window.close();
        }, 1);
    });

    $("#enable").click(function () {
        change(true);
    });

    $("#settings").click(function () {
        //window.open("options.html", "nuevo", "directories=no, menubar=no, scrollbars=yes, statusbar=no, tittlebar=no, width=1100, height=900");
        chrome.runtime.openOptionsPage();
        setTimeout(function () {
            window.close();
        }, 1);
    });


}

function themeWithEvents(data) {
    $("#styleWithHW").show();
    $("#classic").remove();

    if (!data.enable) {
        $("#enable").show();
        $("#disable").hide();
    }
    else {
        $("#enable").hide();
        $("#disable").show();
    }

    $("#disable").click(function () {
        $("#enable").show();
        $(this).hide();
        change(false);
    });

    $("#enable").click(function () {
        $("#disable").show();
        $(this).hide();
        change(true);
    });

    $("#settings").click(function () {
        //	window.open("options.html", "nuevo", "directories=no, menubar=no, scrollbars=yes, statusbar=no, tittlebar=no, width=1100, height=900");
        chrome.runtime.openOptionsPage();

        setTimeout(function () {
            window.close();
        }, 1);
    });

    setGloblaVar();

    $("#version").text(chrome.runtime.getManifest().version_name);

    $("#wifiLogin").click(function () {
        DataAccess.Data(function () {
            if (data.anonymous != true)
                autoWifiLogin();
            else
                openInNewTab("http://captiveportal-login.jct.ac.il/auth/index.html/u");
        });
    });

    $("#moodleButton").click(function () {
        DataAccess.Data(showCourses);
    });

    $("#levnetButton").click(function () {
        chrome.runtime.sendMessage({levnetLogin: true});
        openWindow("L");
    });

    $(levnetWindow).find('div').each(function () {
        var that = this;
        $(this).find('a').each(function () {
            $(this).click(function () {
                var label = $(this).attr("label-target");
                if (label == null || label == "")
                    return true;
                console.log("div[label='" + label + "']");
                $(that).hide();
                $(levnetWindow).find("div[label='" + label + "']").show(500);
            });
        })
    });

    $("#usefulSitesButton").click(function () {
        openWindow('U');
    });
    insertEvents(data);

    // $("#version-paraph").click(function () {
    //     var emailUrl = "mailto:abenatha@jct.ac.il";
    //     chrome.tabs.create({url: emailUrl}, function (tab) {
    //         setTimeout(function () {
    //             chrome.tabs.remove(tab.id);
    //         }, 500);
    //     });
    // })


}

function setGloblaVar() {

    var content = $("#Content");

    homeworkWindow = $(content).find("#Homeworks");
    wifiWindow = $(content).find("#WifiConnect");
    moodleWindow = $(content).find("#MoodleCourse");
    levnetWindow = $(content).find("#levnetPages");
    usefulSites = $(content).find("#usefulSitesContent");
    currentOpen = 'H';

}

function change(flag) {
    DataAccess.setData("enable", flag);
    chrome.runtime.sendMessage({changeIcon: flag});

}

function insertEvents(data) {
    $(".event").remove();
    var events = data.tasks;
    if (events == undefined)
        return;
    var event;
    var deadLine = new Date();
    var checked;
    var duplicate = {};
    for (var i = 0; i <= events.length; i++) {

        // Check if the event already finish
        if (events[i] == null || Date.parse(events[i].deadLine) < Date.now())
            continue;

        // Check if the user want to show user events
        if (data.Config != undefined) {

            if (data.Config.hiddeUE && events[i].type == "userEvent")
                continue;

            if (data.Config.hwDays != null && Date.parse(events[i].deadLine) > (Date.now() + data.Config.hwDays * 24 * 60 * 60 * 1000))
                continue;

            if (events[i].type == "homework") {

                if (data.Config.hiddeNoSelectedCourseInWindows == true && data.moodleCoursesTable[events[i].courseId] != true)
                    continue;


                /*
                 * In this part the program will check if the user limited the total of homeworks
                 * Is important to remember that the homework are sorted by deadline
                 * in this case the program will save the last homework deadline to check with the next.
                 */

                if (duplicate[events[i].courseId] == null) {
                    duplicate[events[i].courseId] = {};
                    duplicate[events[i].courseId].lastDeadLine = events[i].deadLine;
                    duplicate[events[i].courseId].counter = 1;
                } else {

                    if (data.Config.hiddeSameDay && Date.parse(events[i].deadLine) == Date.parse(duplicate[events[i].courseId].lastDeadLine))
                        continue;

                    if (data.Config.limitedHw && duplicate[events[i].courseId].counter >= data.Config.limitedHwAmount)
                        continue;


                    duplicate[events[i].courseId].lastDeadLine = events[i].deadLine;
                    duplicate[events[i].courseId].counter++;
                }

            }


        }

        // Check if the user already did the homework
        if (data.eventDone != undefined && data.eventDone[events[i].id] != null) {
            //Check if the user want to hide tasks done
            if (data.Config != null && data.Config.hiddeTasksDone != false && data.eventDone[events[i].id].checked)
                continue;

            checked = ((data.eventDone[events[i].id].checked || data.eventDone[events[i].id].done) ? "checked" : " ") + ((data.eventDone[events[i].id].done) ? " disabled" : " ");
        }
        else
            checked = "";

        // Create a new object
        event = "<span class='event'>";

        if (events[i].type == "homework")
            event += "<input type='checkbox' class='done' courseId='" + events[i].id + "' + " + checked + " />";
        else
            event += "<input type='checkbox' style='visibility: hidden;' />";


        if (events[i].type == "homework")
            event += "<a href='https://moodle.jct.ac.il/mod/assign/view.php?id=" + events[i].id + "' target='_blank'><span class='eventDetails'>" + "<p class='name'>" + events[i].name + "</p>";
        else
            event += "<span class='eventDetails'>" + "<p class='name'>" + events[i].name + "</p>";


        if (events[i].type == "homework")
            event += "<p class='courseName'>" + data.courses[events[i].courseId].name + "</p>";

        event += "<p class='deadLine'>" + getDate(new Date(Date.parse(events[i].deadLine))) + "</p>" +
            "</span>";

        if (events[i].type == "homework")
            event += "</a>";

        if (data.eventDone != undefined && data.eventDone[events[i].id] != null && data.eventDone[events[i].id].notifications == false)
            event += "<img src='image/popup/timbreOff.png' class='notifi'  courseId='" + events[i].id + "'>";
        else
            event += "<img src='image/popup/timbre.png' class='notifi'  courseId='" + events[i].id + "'>";


        event += "</span>";
        $("#homeworksContent").append(event);
    } 		//notifications

    $("#eventsTotal").text($(".event").length);
    $(".notifi").click(function () {
        var currentUrl = $(this).attr("src");
        if (currentUrl == "image/popup/timbre.png") {
            $(this).attr("src", "image/popup/timbreOff.png");
            DataAccess.setObjectInObject("eventDone", $(this).attr("courseId"), "notifications", false);
        }
        else {
            $(this).attr("src", "image/popup/timbre.png");
            DataAccess.setObjectInObject("eventDone", $(this).attr("courseId"), "notifications", true);
        }
        setTimeout(function () {
            chrome.runtime.sendMessage({setBadge: true});
        }, 20);
    });
    $(".done").change(function () {
        //in case flag is true then set as c (checked) otherwise set as u (unchecked)
        DataAccess.setObjectInObject("eventDone", $(this).attr("courseId"), "checked", this.checked);
        setTimeout(function () {
            chrome.runtime.sendMessage({setBadge: true});
        }, 20);
    });
}

function onBackgroundEvent(eventType) {

    if (typeof eventType != "object")
        return;

    console.log("onBackgroundEvent:");
    console.log(eventType);

    switch (eventType.type) {
        case "updateData":
            DataAccess.Data(function (data) {
                insertEvents(data);
            });
            break;
        case "wifiLogin":
            autoWifiLogin(eventType.operationCompleted, eventType.error)
            break;
        default:

    }

}
function autoWifiLogin(status, error) {


    if (status == null) {
        openWindow("W");
        $(wifiWindow).find(".wificonected").hide();
        $(wifiWindow).find(".wifiNotConected").hide();
        $(wifiWindow).find(".wifiloader").show();
        $(wifiWindow).find("#wifimsg").show();

        chrome.runtime.sendMessage({wifiLogin: true});
    }
    else {
        if (status) {
            $(wifiWindow).find(".wifiloader").hide();
            $(wifiWindow).find(".wificonected").show();
            $(wifiWindow).find("#wifimsg").text("מחובר");
        }
        else {
            $(wifiWindow).find(".wifiloader").hide();
            $(wifiWindow).find(".wifiNotConected").show();
            $(wifiWindow).find("#wifimsg").text(error);
        }

        setTimeout(function () {

            $(wifiWindow).find(".wifiloader").hide();
            $(wifiWindow).find(".wifiNotConected").hide();
            $(wifiWindow).find("#wifimsg").hide();
            if (currentOpen == "W")
                openWindow("H");


        }, 5000);

    }

}


function showCourses(data) {

    openWindow("M");


    //Set var to courses div
    var MoodleCourseDiv = $("#MoodleCourse");

    //reset div
    $(MoodleCourseDiv).find(".options").remove();

    //Add a button to open moodle
    $(MoodleCourseDiv).append("<a href='https://moodle.jct.ac.il/' target='_blank' style='text-align: center'><span class='options main' >מודל</span></a>");

    //TODO: Check if the user didnt select any course


    //Get my courses in order
    var courses = orderCourses(data.moodleCoursesTable, data.coursesIndex);

    //Temp var
    var course = {};
    var courseSpan = "";

    //remove all the courses the user chose (the options to be hide are save in the local storage)
    for (var i = 0; i < courses.length; i++) {

        //Get course details
        course = data.courses[courses[i]];
        //Set span
        courseSpan = "<a href='https://moodle.jct.ac.il/course/view.php?id=" + course.moodleId + "' target='_blank'><span class='options navigator' >" + course.id + " - " + course.name + "</span></a>";
        //Add to the div
        $(MoodleCourseDiv).append(courseSpan);
    }

}

function orderCourses(courses, index) {

    if (courses == null || index == null)
        return [];

    var orderCourses = [];
    var j = 0;
    for (var i = 0; i < index.length; i++) {
        if (courses[index[i]] == true) {
            orderCourses[j++] = index[i];
        }
    }
    return orderCourses;
}


function openWindow(type) {


    switch (currentOpen) {
        case 'H':
            $(homeworkWindow).hide();
            break;
        case 'W':
            $(wifiWindow).hide();
            break;
        case 'M':
            $(moodleWindow).hide();
            break;
        case 'L':
            $(levnetWindow).hide();
            $(levnetWindow).find('div').hide();
            $(levnetWindow).find('div[label="main"]').show();
            break;
        case 'U':
            $(usefulSites).hide();
    }


    switch (type) {
        case currentOpen:
            $(homeworkWindow).show();
            currentOpen = "H";
            break;
        case "H":
            $(homeworkWindow).show();
            currentOpen = "H";
            break;
        case "W":
            $(wifiWindow).show();
            currentOpen = "W";
            break;
        case "M":
            $(moodleWindow).show();
            currentOpen = "M";
            break;
        case "L":
            $(levnetWindow).show();
            currentOpen = "L";
            break;
        case 'U':
            $(usefulSites).show();
            currentOpen = "U";
            break;
    }
}

function openInNewTab(url) {
    var win = window.open(url, '_blank');
    win.focus();
}