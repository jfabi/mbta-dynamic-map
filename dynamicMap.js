/*
Written by Joshua Fabian
December 2017
jfabian@mbta.com

Last updated 24 December 2017
*/

apiKey = config.V2_API_KEY

var time = document.getElementsByClassName('timeField'); //Get all elements with class "time"
for (var i = 0; i < time.length; i++) { //Loop trough elements
    time[i].addEventListener('keyup', function (e) {; //Add event listener to every element
        var reg = /[0-9]/;
        if (this.value.length == 2 && reg.test(this.value)) this.value = this.value + ":"; //Add colon if string length > 2 and string is a number 
        if (this.value.length > 5) this.value = this.value.substr(0, this.value.length - 1); //Delete the last digit if string length > 5
    });
};

var allStops;
$.ajax({
    url: 'stops.csv',
    async: false,
    success: function (csvd) {
        allStops = $.csv.toArrays(csvd);
    },
    dataType: 'text',
    complete: function () {
        // call a function on complete 
    }
});

var parentStationComplexes = [];
for (i = 0; i < allStops.length; i++) {
    if (allStops[i][9] != '' && allStops[i][9] != 'parent_station') {
        try {
            parentStationComplexes[allStops[i][9]].push(allStops[i][0])
        } catch (err) {
            parentStationComplexes[allStops[i][9]] = []
            parentStationComplexes[allStops[i][9]].push(allStops[i][0])
        }
        // 0  stop_id
        // 9  parent_station
    }
}

var preStationLocations;
$.ajax({
    url: 'station_locations.csv',
    async: false,
    success: function (csvd) {
        preStationLocations = $.csv.toArrays(csvd);
    },
    dataType: 'text',
    complete: function () {
        // call a function on complete 
    }
});

var stationLocations = [];
var nodeLocations = [];
for (i = 0; i < preStationLocations.length; i++) {
    newNode = [
        preStationLocations[i][0],
        preStationLocations[i][1],
        preStationLocations[i][2],
        preStationLocations[i][3],
        preStationLocations[i][4],
        preStationLocations[i][5],
        preStationLocations[i][6],
        preStationLocations[i][7],
        'open',
        '',
        ''
    ]
    nodeLocations.push(newNode);
    if (preStationLocations[i][8] != '1') {
        console.log(preStationLocations[i][8])
        stationLocations.push(newNode);
    } else {
        console.log('!!!!')
        console.log(preStationLocations[i])
    }
}

var lineSegments = [];
for (i = 0; i < nodeLocations.length; i++) {
    if (nodeLocations[i][2] != '0' && nodeLocations[i][2] != 0) {
        newSegment = [
            nodeLocations[i][0],
            nodeLocations[i][1],
            nodeLocations[i-1][2],
            nodeLocations[i-1][7],
            nodeLocations[i-1][4],
            nodeLocations[i-1][5],
            nodeLocations[i-1][6],
            nodeLocations[i][4],
            nodeLocations[i][5],
            nodeLocations[i][6],
            nodeLocations[i-1][3],
            nodeLocations[i][3],
            nodeLocations[i-1][7],
            'open',
            '',
            ''
        ]
        lineSegments.push(newSegment);
    }
}

// 0  route_id
// 1  variant
// 2  segment_seq
// 3  segment_color
// 4  from_parent
// 5  from_x
// 6  from_y
// 7  to_parent
// 8  to_x
// 9  to_y
// 12 original color for segment_color

window.onload = function () {
      refreshDiagram("current_status");
}
        
function refreshDiagram (refreshMode) {

    console.log("ready to go");
    document.getElementById("dwellsT").innerHTML = 'Please wait. Your diagram is currently baking...<br>&nbsp;';

    // Reset lineSegments colors and stationLocations open status
    for (i = 0; i < lineSegments.length; i++) {
        lineSegments[i][3] = lineSegments[i][12];
    }
    for (i = 0; i < stationLocations.length; i++) {
        stationLocations[i][8] = 'open';
    }

    setTimeout(function() {

        // parse input date into epoch time, set beginning and ending time to search
        // by default, we search from 04:00 of chosen day until 03:00 next morning

        // also obtain a reference midnight time so that epoch times can be later converted
        // into generic seconds from midnight

        var day = document.getElementById("dy");
        var month = document.getElementById("mo");
        var year = document.getElementById("yr");
        var timeInput = document.getElementById("timeDay");
        var startTime = '';
        var endTime = '';
        if (timeInput.value == 'midday') {
            console.log('This is midday');
            startTime = '12:00:00';
            endTime = '12:00:00';
        }
        if (timeInput.value == 'night') {
            console.log('This is nighttime');
            startTime = '22:00:00';
            endTime = '22:00:00';
        }

        console.log(day.value);
        console.log(month.value);
        console.log(year.value);
        console.log(startTime);
        console.log(endTime);
        console.log(timeInput);

        var dateMidnight = new Date(year.value, month.value-1, day.value, 0, 0, 0, 0);
        var timeFromAsDate;
        var timeToAsDate;

        if (startTime == '') {
            var dateFrom = new Date(year.value, month.value-1, day.value, 4, 0, 0, 0);
        } else {
            var startHour = startTime.substring(0,2).valueOf();
            var startMin = startTime.substring(3,5).valueOf();
            var dateFrom = new Date(year.value, month.value-1, day.value, startHour, startMin, 0, 0);
        }

        timeFromAsDate = dateFrom;
        var timeTo;
        if (endTime == '') {
            var dateToTemp = new Date(year.value, month.value-1, day.value, 3, 0, 0, 0);
            var dateTo = dateToTemp.setDate(dateToTemp.getDate() + 1);
            timeTo = dateTo / 1000;
            timeToAsDate = new Date(dateTo);
        } else {
            var endHour = endTime.substring(0,2).valueOf();
            var endMin = endTime.substring(3,5).valueOf();

            if (endHour < 24) {
                var dateTo = new Date(year.value, month.value-1, day.value, endHour, endMin, 0, 0);
                timeTo = dateTo.getTime() / 1000;
                timeToAsDate = dateTo;
            } else {
                var dateToTemp = new Date(year.value, month.value-1, day.value, endHour-24, endMin, 0, 0);
                var dateTo = dateToTemp.setDate(dateToTemp.getDate() + 1);
                timeTo = dateTo / 1000;
                timeToAsDate = new Date(dateTo);
            }
        }

        console.log(dateFrom);
        console.log(dateTo);

        var midnight = dateMidnight.getTime() / 1000;
        var timeFrom = dateFrom.getTime() / 1000;

        if (refreshMode == 'current_status') {
            console.log('WAIT WE WANT CURRENT STATUS!');
            timeFrom = (new Date).getTime() / 1000;
            console.log(timeFrom);
        }
        console.log(timeFrom);

        // define route, which here is eastbound C-branch on MBTA Green Line

        var allSegments = [];

        var routeInputText = 'C-EB';

        var direction, branchText, tableOfStops, branchTextToCheck;

        var timeDayText = '';
        if (timeInput == 'midday') {
            timeDayText = 'Daytime service';
        }
        if (timeInput == 'night') {
            timeDayText = 'Nighttime service';
        }

        if (routeInputText == 'C-EB') {

            direction = 'Eastbound';
            branchText = 'Green Line Beacon St - ' + direction;
            branchTextToCheck = 'Green-C'; // IMPORTANT: this variable should == '' when doing subway

            // format: [thisStopIndex,thisStopID,thisStopName]
            tableOfStops = [
                [0,70238,'Cleveland Circle'],
                [1,70236,'Englewood Av'],
                [2,70234,'Dean Rd'],
                [3,70232,'Tappan St'],
                [4,70230,'Washington Sq'],
                [5,70228,'Fairbanks St'],
                [6,70226,'Brandon Hall'],
                [7,70224,'Summit Av'],
                [8,70220,'Coolidge Corner'],
                [9,70218,'St Paul St'],
                [10,70216,'Kent St'],
                [11,70214,'Hawes St'],
                [12,70212,'St Mary St'],
                [13,70150,'Kenmore'],
                [14,70152,'Hynes'],
                [15,70154,'Copley'],
                [16,70156,'Arlington'],
                [17,70158,'Boylston'],
                [18,70200,'Park St'],
                [19,70201,'Government Ctr'],
                [20,70203,'Haymarket'],
                [21,70205,'North Station'],
                [22,70207,'Science Park'],
                [23,70209,'Lechmere']
            ];
        }

        var maxIndex = 1900;
        var stationNames = []
        var lastStation = ''
        for (i = 0; i < tableOfStops.length; i++) {
            if (tableOfStops[i][2] != lastStation) {
                // check to make sure we do not save duplicate station names
                stationNames.push(tableOfStops[i][2]);
                lastStation = tableOfStops[i][2]
            }
        }

        // set up d3 box to later plot points

        var MARGINS = {top: 20, right: 20, bottom: 20, left: 20};
        var WIDTH = 1900;
        var HEIGHT = 1900;

        d3.selectAll("svg > *").remove();

        var div = d3.select("body").append("div")	
            .attr("class", "tooltip")
            .style("opacity", 0);

        //var vis = d3.select("#visualisation");

        var vis = d3.select("#visualisation").append("svg")
            .attr("width", WIDTH + MARGINS.left + MARGINS.right)
            .attr("height", HEIGHT + MARGINS.top + MARGINS.bottom)
            .append("g")
                .attr("transform", "translate(" + MARGINS.left + "," + MARGINS.top + ")");

        var xScale = d3.scale.linear().range([0,1900]).domain([0,1900]);
        var yScale = d3.scale.linear().range([0,1900]).domain([0,1900]);

        // take a look at alerts and edit segments and stations as necessary

        jQuery(document).ready(function($) {
            $.ajax({
                url : "https://realtime.mbta.com/developer/api/v2/alerts?api_key=" + apiKey + "&include_access_alerts=false&include_service_alerts=true&format=json",
                dataType : "json",
                success : function(parsed_json) {

                    var all_alerts = parsed_json['alerts'];
                    var display = '';
                    var display1 = '';
                    var counterAlert = 0;
                    var alertTypes = [];
                    var alertType = '';
                    var weHaveSevere = false;

                    for(i = 0; i < all_alerts.length; i++) {

                        // if (all_alerts[i]['cause'] == 'WEATHER') {
                        //     console.log(all_alerts[i]);
                        // }

                        var alertRelevant = false;
                        for(h = 0; h < all_alerts[i]['effect_periods'].length; h++) {

                            if (all_alerts[i]['effect_periods'][h]['effect_end'] == '' && timeFrom >= parseInt(all_alerts[i]['effect_periods'][h]['effect_start'])) {
                                alertRelevant = true;
                                break;
                            } else if (timeFrom <= parseInt(all_alerts[i]['effect_periods'][h]['effect_end']) && timeFrom >= parseInt(all_alerts[i]['effect_periods'][h]['effect_start'])) {
                                alertRelevant = true;
                                break;
                            }
                        }

                        if (alertRelevant == true && (all_alerts[i]['effect'] == 'DETOUR' || all_alerts[i]['effect'] == 'NO_SERVICE' || all_alerts[i]['effect'] == 'DELAY')) {
                            // Relevant alert in terms of valid period and effect type; now determine impacted locations

                            affectedStations = [];
                            for (g = 0; g < all_alerts[i]['affected_services']['services'].length; g++) {
                                // Filter out non-Red/Orange Line services for purpose of this demo
                                if (all_alerts[i]['affected_services']['services'][g]['route_id'] == 'Red' || all_alerts[i]['affected_services']['services'][g]['route_id'] == 'Orange' || all_alerts[i]['affected_services']['services'][g]['route_id'] == 'Mattapan' || all_alerts[i]['affected_services']['services'][g]['route_id'] == 'Blue' || all_alerts[i]['affected_services']['services'][g]['route_id'] == 'Green-B' || all_alerts[i]['affected_services']['services'][g]['route_id'] == 'Green-C' || all_alerts[i]['affected_services']['services'][g]['route_id'] == 'Green-D' || all_alerts[i]['affected_services']['services'][g]['route_id'] == 'Green-E') {

                                    console.log('FOUND RED/ORANGE ALERT:');
                                    console.log(all_alerts[i]);
                                    console.log(all_alerts[i]['affected_services']['services'][g])

                                    if (all_alerts[i]['affected_services']['services'][g]['stop_id'] == null) {
                                        console.log('PROBLEM WITH!!!')
                                        for (a = 0; a < preStationLocations.length; a++) {
                                            console.log('a:')
                                            console.log(a)
                                            if (preStationLocations[a][0] == all_alerts[i]['affected_services']['services'][g]['route_id']) {
                                                affectedStations.push(preStationLocations[a][4]);
                                                console.log("adding hopefully mattapan stop: ")
                                                console.log(preStationLocations[a])
                                            }
                                        }
                                    } else {

                                        // Add affected parent stations to affectedStops
                                        for (f = 0; f < allStops.length; f++) {
                                            if (all_alerts[i]['affected_services']['services'][g]['stop_id'] != null) {
                                                if (allStops[f][0] == all_alerts[i]['affected_services']['services'][g]['stop_id']) {
                                                    if (allStops[f][9] == '') {
                                                        // We found our parent station, so add to affectedStations
                                                        var foundAffected = false;
                                                        for (a = 0; a < affectedStations.length; a++) {
                                                            if (affectedStations[a] == allStops[f][0]) {
                                                                foundAffected = true;
                                                                break;
                                                            }
                                                        }
                                                        if (foundAffected == false) {
                                                            affectedStations.push(allStops[f][0]);
                                                        }
                                                    } else {
                                                        var foundAffected = false;
                                                        for (a = 0; a < affectedStations.length; a++) {
                                                            if (affectedStations[a] == allStops[f][9]) {
                                                                foundAffected = true;
                                                                break;
                                                            }
                                                        }
                                                        if (foundAffected == false) {
                                                            affectedStations.push(allStops[f][9]);
                                                        }
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            var alertHeader = ''
                            var severity = ''
                            try {
                                alertHeader = all_alerts[i]['header_text']
                                var preSeverity = all_alerts[i]['severity']
                                if (preSeverity == 'Severe' || preSeverity == '7' || preSeverity == '8' || preSeverity == '9') {
                                    severity = 'Severe'
                                } else if (preSeverity == 'Moderate' || preSeverity == '5' || preSeverity == '6') {
                                    severity = 'Moderate'
                                } else if (preSeverity == 'Minor' || preSeverity == '3' || preSeverity == '4') {
                                    severity = 'Minor'
                                }
                            } catch (err) {
                                alertHeader = 'An alert has been issued'
                                severity = 'Informational'
                            }
                            if (affectedStations.length > 0) {
                                console.log(affectedStations);
                                if (all_alerts[i]['effect'] == 'DETOUR') {
                                    // Search for lineSegments
                                    console.log(' - - - - - - - - - - - - -');
                                    var possibleMatches = [];
                                    for (a = 0; a < affectedStations.length; a++) {
                                        for (b = 0; b < affectedStations.length; b++) {
                                            if (affectedStations[a] != affectedStations[b]) {
                                                for (c = 0; c < lineSegments.length; c++) {
                                                    if (lineSegments[c][4] == affectedStations[a] && lineSegments[c][7] == affectedStations[b]) {
                                                        // This means we found an impacted line segment which needs modification
                                                        lineSegments[c][13] = 'shuttled';
                                                        lineSegments[c][14] = severity;
                                                        lineSegments[c][15] = alertHeader;
                                                    } else if (lineSegments[c][4] == affectedStations[a] && lineSegments[c][7] == affectedStations[a]) {
                                                        // This means we found an impacted line segment which needs modification
                                                        lineSegments[c][13] = 'shuttled';
                                                        lineSegments[c][14] = severity;
                                                        lineSegments[c][15] = alertHeader;
                                                    }
                                                }
                                            }
                                        }
                                        for (d = 0; d < stationLocations.length; d++) {
                                            if (affectedStations[a] == stationLocations[d][4]) {
                                                console.log('NEWLY SHUTTLED:');
                                                console.log(stationLocations[d]);
                                                stationLocations[d][8] = 'shuttled';
                                                stationLocations[a][9] = severity;
                                                stationLocations[a][10] = alertHeader;
                                            }
                                        }
                                    }
                                } else if (all_alerts[i]['effect'] == 'NO_SERVICE') {
                                    // Seach for stationLocations
                                    console.log(' = = = = = = = = = = = = =');
                                    for (a = 0; a < stationLocations.length; a++) {
                                        for (k = 0; k < affectedStations.length; k++) {
                                            if (affectedStations[k] == stationLocations[a][4]) {
                                                console.log('NEWLY CLOSED:');
                                                console.log(stationLocations[a]);
                                                stationLocations[a][8] = 'closed';
                                                stationLocations[a][9] = severity;
                                                stationLocations[a][10] = alertHeader;
                                            }
                                        }
                                    }
                                } else if (all_alerts[i]['effect'] == 'DELAY') {
                                    // Seach for stationLocations
                                    console.log(' / / / / / / / / / / / / /');
                                    var possibleMatches = [];
                                    for (a = 0; a < affectedStations.length; a++) {
                                        for (b = 0; b < affectedStations.length; b++) {
                                            if (affectedStations[a] != affectedStations[b]) {
                                                for (c = 0; c < lineSegments.length; c++) {
                                                    if (lineSegments[c][4] == affectedStations[a] && lineSegments[c][7] == affectedStations[b]) {
                                                        // This means we found an impacted line segment which needs modification
                                                        lineSegments[c][13] = 'delayed';
                                                        lineSegments[c][14] = severity;
                                                        lineSegments[c][15] = alertHeader;
                                                    } else if (lineSegments[c][4] == affectedStations[a] && lineSegments[c][7] == affectedStations[a]) {
                                                        // This means we found an impacted line segment which needs modification
                                                        lineSegments[c][13] = 'delayed';
                                                        lineSegments[c][14] = severity;
                                                        lineSegments[c][15] = alertHeader;
                                                    }
                                                }
                                            }
                                        }
                                        for (d = 0; d < stationLocations.length; d++) {
                                            if (affectedStations[a] == stationLocations[d][4]) {
                                                console.log('NEWLY DELAYED:');
                                                console.log(stationLocations[d]);
                                                stationLocations[d][8] = 'delayed';
                                                stationLocations[a][9] = severity;
                                                stationLocations[a][10] = alertHeader;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });

        // iterate over each stop

        setTimeout(function(){
            console.log("Total of " + lineSegments.length + " segement!");
            for (i = 0; i < lineSegments.length - 1; i++) {
                var segment = lineSegments[i];

                // add the contents of this segment to the d3 chart

            } // NEW TEMP END OF FOR LOOP

            vis.selectAll('line.segments')
                .data(lineSegments) // used to contain ( points )
                .enter()
                .append('line')
                    .attr('x1', function(d) { return xScale(d[5]) })
                    .attr('y1', function(d) { return yScale(d[6]) })
                    .attr('x2', function(d) { return xScale(d[8]) })
                    .attr('y2', function(d) { return yScale(d[9]) })
                    .attr('stroke', function(d){
                        if (d[13] == 'shuttled') {
                            return '#000000'
                        } else if (d[13] == 'delayed' && d[14] == 'Severe') {
                            return '#000000'
                        } else {
                            return '#' + d[3]
                        } 
                    })
                    .attr('stroke-width', 12)
                    .attr('fill', 'none')
                    .attr('class', function(d) {
                        if (d[13] == 'shuttled') {
                            return 'shuttled'
                        } else if (d[13] == 'delayed' && d[14] == 'Severe') {
                            return 'severeDelayed'
                        } else if (d[13] == 'delayed' && d[14] == 'Moderate') {
                            return 'moderateDelayed'
                        } else if (d[13] == 'delayed' && d[14] == 'Minor') {
                            return 'minorDelayed'
                        } else {
                            return 'solid'
                        }
                    })
                    .on('mouseover', function(d) {
                        if (d[15] != '') {
                            div.transition()
                                .duration(200)      
                                .style('opacity', 1);       
                            div.html('<large><b>' + d[14] + ' alert</b></large><br>' +
                                     d[15]
                                    )
                                .style('left', (d3.event.pageX - 150) + 'px')       
                                .style('top', (d3.event.pageY - 70) + 'px')
                                .style('width', '250px');
                        }
                    })
                    .on('mouseout', function(d) { 
                        if (d[15] != '') {
                            div.transition()        
                                .duration(500)      
                                .style('opacity', 0); 
                        }  
                    });

            vis.selectAll('circle.points')
                .data(stationLocations) // used to contain ( points )
                .enter()
                .append('circle')
                    .attr('cx', function(d) { return xScale(d[5]) })
                    .attr('cy', function(d) { return yScale(d[6]) })
                    .attr('r', function(d) { return '4' })
                    .attr('y2', function(d) { return yScale(d[9]) })
                    .attr('fill', function(d){ return '#ffffff' })
                    .style('opacity', function(d) {
                        if (d[8] == 'closed') {
                            return 0.6
                        } else {
                            return 1
                        }
                    })
                    .attr('class', function(d) {
                        if (d[8] == 'closed') {
                            return 'shuttled'
                        } else {
                            return 'solid'
                        }
                    })
                    .on('mouseover', function(d) {
                        if (d[10] != '') {
                            div.transition()
                                .duration(200)
                                .style('opacity', 1);
                            div.html('<large><b>' + d[9] + ' alert</b></large><br>' +
                                     d[10]
                                    )
                                .style('left', (d3.event.pageX - 150) + 'px')
                                .style('top', (d3.event.pageY - 70) + 'px')
                                .style('width', '250px');
                        }
                    })
                    .on('mouseout', function(d) { 
                        if (d[10] != '') {
                            div.transition()
                                .duration(500)
                                .style('opacity', 0); 
                        }  
                    });

            vis.selectAll('text')
                .data(stationLocations) // used to contain ( points )
                .enter()
                .append('text')
                    .attr('x', function(d) { return parseInt(xScale(d[5])) + 25 })
                    .attr('y', function(d) { return parseInt(yScale(d[6])) + 6})
                    .text(function(d) { 
                        if (d[8] == 'closed' || d[8] == 'shuttled' || d[8] == 'delayed') {
                            return d[3]
                        } else {
                            return ''
                        }
                    })
                    .attr('font-family', 'sans-serif')
                    .attr('font-size', '14px')
                    .attr('text-decoration', function(d) {
                        if (d[8] == 'closed') {
                            return 'line-through'
                        } else {
                            return 'none'
                        }
                    })
                    .attr('fill', function(d) {
                        if (d[8] == 'closed') {
                            return 'gray'
                        } else {
                            return '#000000'
                        }
                    })
                    .on('mouseover', function(d) {
                        if (d[10] != '') {
                            div.transition()
                                .duration(200)      
                                .style('opacity', 1);       
                            div.html('<large><b>' + d[9] + ' alert</b></large><br>' +
                                     d[10]
                                    )
                                .style('left', (d3.event.pageX - 150) + 'px')       
                                .style('top', (d3.event.pageY - 70) + 'px')
                                .style('width', '250px');
                        }
                    })
                    .on('mouseout', function(d) { 
                        if (d[10] != '') {
                            div.transition()        
                                .duration(500)      
                                .style('opacity', 0); 
                        }  
                    });

            var monthNames = [
              "January", "February", "March",
              "April", "May", "June", "July",
              "August", "September", "October",
              "November", "December"
            ];

            var dayNames = [
              "Sunday", "Monday", "Tuesday",
              "Wednesday", "Thursday", "Friday", "Saturday"
            ];

            var monthIndex = timeFromAsDate.getMonth();
            var dayIndex = timeFromAsDate.getDay();

            if (refreshMode == 'current_status') {
                document.getElementById("dwellsT").innerHTML = 'Live MBTA rapid transit service diagram';
            } else {
                document.getElementById("dwellsT").innerHTML = 'Rapid transit diagram for ' + dayNames[dayIndex] + ' ' + timeFromAsDate.getDate() + ' ' + monthNames[monthIndex] + ' ' + timeFromAsDate.getFullYear() + '<br><b>' + timeDayText + '</b>';
            }
        }, 1000);
    }, 100);
};
