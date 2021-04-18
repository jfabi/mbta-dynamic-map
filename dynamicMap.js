/*
Written by Joshua Fabian
jfabi@alum.mit.edu, joshuajfabian@gmail.com
*/

var refreshCommand = null;

function parseTimestamp(timestamp) {
    // example of format: '2017-06-12T11:05:03-04:00'
    var year = parseInt(timestamp.substring(0,4));
    var month = parseInt(timestamp.substring(5,7)) - 1;
    var day = parseInt(timestamp.substring(8,10));
    var hour = parseInt(timestamp.substring(11,13));
    var minute = parseInt(timestamp.substring(14,16));
    var second = parseInt(timestamp.substring(17,19));
    var dateObject = new Date(year, month, day, hour, minute, second);
    return dateObject.getTime()/1000;
}

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
    if (allStops[i][13] != '' && allStops[i][13] != 'parent_station') {
        try {
            parentStationComplexes[allStops[i][13]].push(allStops[i][0])
        } catch (err) {
            parentStationComplexes[allStops[i][13]] = []
            parentStationComplexes[allStops[i][13]].push(allStops[i][0])
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

var preStationLocations_new;
$.ajax({
    url: 'station_locations_new.csv',
    async: false,
    success: function (csvd) {
        preStationLocations_new = $.csv.toArrays(csvd);
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
        '',
        ''
    ]
    nodeLocations.push(newNode);
    if (preStationLocations[i][8] != '1') {
        stationLocations.push(newNode);
    }
}

var lineSegments = [];
for (i = 0; i < preStationLocations_new.length; i++) {
    if (preStationLocations_new[i][2] != '0' && preStationLocations_new[i][2] != 0) {
        var listOfPoints = [];
        listOfPoints.push({x: preStationLocations_new[i][13], y: preStationLocations_new[i][14]});
        if (preStationLocations_new[i][15] != null && preStationLocations_new[i][15] != '') {
            listOfPoints.push({x: preStationLocations_new[i][15], y: preStationLocations_new[i][16]});
            if (preStationLocations_new[i][17] != null && preStationLocations_new[i][17] != '') {
                listOfPoints.push({x: preStationLocations_new[i][17], y: preStationLocations_new[i][18]});
                if (preStationLocations_new[i][19] != null && preStationLocations_new[i][19] != '') {
                    listOfPoints.push({x: preStationLocations_new[i][19], y: preStationLocations_new[i][20]});
                }
            }
        }
        listOfPoints.push({x: preStationLocations_new[i][5], y: preStationLocations_new[i][6]});

        newSegment = [
            preStationLocations_new[i][10],     // NEED TO BREAK UP IN ARRAY/LIST
            preStationLocations_new[i][1],
            preStationLocations_new[i][2],
            preStationLocations_new[i][7],
            preStationLocations_new[i][12],
            preStationLocations_new[i][13],
            preStationLocations_new[i][14],
            preStationLocations_new[i][4],
            preStationLocations_new[i][5],
            preStationLocations_new[i][6],
            preStationLocations_new[i][11],
            preStationLocations_new[i][3],
            preStationLocations_new[i][7],
            'open',
            '',
            '',
            listOfPoints
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
// 13 status
// 14 associated alert severity
// 15 associated alert text
// 16 [{x: from_x, y: from_y}, {x: to_x, y: to_y}]

window.onload = function () {
    refreshCommand = setInterval(refreshDiagram, 60000, 'current_status');
    refreshDiagram("current_status");
}
        
var refreshDiagram = function refreshDiagram (refreshMode) {

    console.log("ready to go");
    document.getElementById("statusText").innerHTML = 'Please wait. Your diagram is currently baking...<br>&nbsp;';

    // Reset lineSegments colors and stationLocations open status
    for (i = 0; i < lineSegments.length; i++) {
        lineSegments[i][3] = lineSegments[i][12];
        lineSegments[i][13] = 'open';
        lineSegments[i][14] = '';
        lineSegments[i][15] = '';
    }
    for (i = 0; i < stationLocations.length; i++) {
        stationLocations[i][8] = 'open';
        stationLocations[i][9] = '';
        stationLocations[i][10] = '';
        stationLocations[i][11] = '';
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
        var timeDayText = '';
        if (timeInput.value == 'midday') {
            startTime = '10:00:00';
            endTime = '10:00:00';
            timeDayText = 'Daytime service';
        }
        if (timeInput.value == 'night') {
            startTime = '22:00:00';
            endTime = '22:00:00';
            timeDayText = 'Nighttime service';
        }

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

        var midnight = dateMidnight.getTime() / 1000;
        var timeFrom = dateFrom.getTime() / 1000;

        if (refreshMode == 'current_status') {
            console.log('WAIT WE WANT CURRENT STATUS!');
            timeFrom = (new Date).getTime() / 1000;
            console.log(timeFrom);
        }
        console.log(" -------------- We are now going to print locating time ------------ ");
        console.log(dateFrom);

        console.log(timeFrom);

        // define route, which here is eastbound C-branch on MBTA Green Line

        var allSegments = [];

        var routeInputText = 'C-EB';

        var direction, branchText, tableOfStops, branchTextToCheck;

        if (timeInput == 'midday') {
            timeDayText = 'Daytime service';
        }
        if (timeInput == 'night') {
            timeDayText = 'Nighttime service';
        }

        // set up d3 box to later plot points

        var MARGINS = {top: 20, right: 20, bottom: 20, left: 20};
        var WIDTH = 1900;
        var HEIGHT = 1900;

        // take a look at alerts and edit segments and stations as necessary

        jQuery(document).ready(function($) {
            $.ajax({
                url : "https://api-v3.mbta.com/alerts?filter[activity]=BOARD,EXIT,RIDE,USING_WHEELCHAIR",
                dataType : "json",
                success : function(parsed_json) {
                    var all_alerts = parsed_json['data'];
                    var display = '';
                    var display1 = '';
                    var counterAlert = 0;
                    var alertTypes = [];
                    var alertType = '';
                    var weHaveSevere = false;

                    for(i = 0; i < all_alerts.length; i++) {
                        var alertRelevant = false;
                        for(h = 0; h < all_alerts[i]['attributes']['active_period'].length; h++) {
                            if (all_alerts[i]['attributes']['active_period'][h]['end'] == null && timeFrom >= parseTimestamp(all_alerts[i]['attributes']['active_period'][h]['start'])) {
                                alertRelevant = true;
                                break;
                            } else {
                                try {
                                    if (timeFrom <= parseTimestamp(all_alerts[i]['attributes']['active_period'][h]['end']) && timeFrom >= parseTimestamp(all_alerts[i]['attributes']['active_period'][h]['start'])) {
                                        alertRelevant = true;
                                        break;
                                    }
                                } catch (err) {
                                    // No end timestamp associated with this alert
                                }
                            }
                        }

                        if (alertRelevant == true && (all_alerts[i]['attributes']['effect'] == 'DETOUR' || all_alerts[i]['attributes']['effect'] == 'SHUTTLE' || all_alerts[i]['attributes']['effect'] == 'SUSPENSION' || all_alerts[i]['attributes']['effect'] == 'NO_SERVICE' || all_alerts[i]['attributes']['effect'] == 'STATION_CLOSURE' || all_alerts[i]['attributes']['effect'] == 'DELAY' || all_alerts[i]['attributes']['effect'] == 'ESCALATOR_CLOSURE' || all_alerts[i]['attributes']['effect'] == 'ELEVATOR_CLOSURE')) {
                            // Relevant alert in terms of valid period and effect type; now determine impacted locations

                            affectedStations = [];
                            affectedRoutes = [];
                            wholeRouteAlert = false;
                            for (g = 0; g < all_alerts[i]['attributes']['informed_entity'].length; g++) {
                                // Filter out non-Red/Orange Line services for purpose of this demo
                                var singleInformedEntity = all_alerts[i]['attributes']['informed_entity'][g];
                                var singleAlertEffect = all_alerts[i]['attributes']['effect'];
                                try {
                                    if (singleInformedEntity['route'] == 'Red' || singleInformedEntity['route'] == 'Orange' || singleInformedEntity['route'] == 'Mattapan' || singleInformedEntity['route'] == 'Blue' || singleInformedEntity['route'] == 'Green-B' || singleInformedEntity['route'] == 'Green-C' || singleInformedEntity['route'] == 'Green-D' || singleInformedEntity['route'] == 'Green-E' || singleAlertEffect == 'ESCALATOR_CLOSURE' || singleAlertEffect == 'ELEVATOR_CLOSURE') {
                                        affectedRoutes.push(singleInformedEntity['route']);

                                        try {
                                            // Add affected parent stations to affectedStops
                                            for (f = 0; f < allStops.length; f++) {
                                                if (allStops[f][0] == singleInformedEntity['stop']) {
                                                    if (allStops[f][13] == '') {
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
                                                            if (affectedStations[a] == allStops[f][13]) {
                                                                foundAffected = true;
                                                                break;
                                                            }
                                                        }
                                                        if (foundAffected == false) {
                                                            affectedStations.push(allStops[f][13]);
                                                        }
                                                    }
                                                    break;
                                                }
                                            }

                                            if (affectedStations.length == 0) {
                                                wholeRouteAlert = true;
                                                for (a = 0; a < preStationLocations.length; a++) {
                                                    if (preStationLocations[a][0] == singleInformedEntity['route']) {
                                                        affectedStations.push(preStationLocations[a][4]);
                                                        console.log("adding hopefully mattapan stop: ")
                                                        console.log(preStationLocations[a])
                                                    }
                                                }
                                                console.log('1 - NO STOPS SPECIFIED, ASSUME ENTIRE ROUTE AFFECTED:');
                                                console.log(all_alerts[i]);
                                                console.log(singleInformedEntity);
                                            }
                                        } catch (err) {
                                            console.log('1 - NO STOPS SPECIFIED, ASSUME ENTIRE ROUTE AFFECTED:');
                                            console.log(all_alerts[i]);
                                            console.log(singleInformedEntity);

                                            wholeRouteAlert = true;
                                            for (a = 0; a < preStationLocations.length; a++) {
                                                if (preStationLocations[a][0] == singleInformedEntity['route']) {
                                                    affectedStations.push(preStationLocations[a][4]);
                                                    console.log("adding hopefully mattapan stop: ")
                                                    console.log(preStationLocations[a])
                                                }
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.log('ALERT WITHOUT INFORMED SERVICE IGNORED:');
                                    console.log(all_alerts[i]);
                                    console.log(singleInformedEntity);
                                }
                            }
                            var alertHeader = ''
                            var severity = ''
                            try {
                                alertHeader = all_alerts[i]['attributes']['header']
                                var preSeverity = all_alerts[i]['attributes']['severity']
                                if (preSeverity == 'Severe' || preSeverity == '7' || preSeverity == '8' || preSeverity == '9' || preSeverity == '10') {
                                    severity = 'Severe'
                                } else if (preSeverity == 'Moderate' || preSeverity == '5' || preSeverity == '6') {
                                    severity = 'Moderate'
                                } else if (preSeverity == 'Minor' || preSeverity == '1' || preSeverity == '2' || preSeverity == '3' || preSeverity == '4') {
                                    severity = 'Minor'
                                }
                            } catch (err) {
                                alertHeader = 'An alert has been issued'
                                severity = 'Informational'
                            }
                            if (affectedStations.length > 0) {
                                if (all_alerts[i]['attributes']['effect'] == 'DETOUR' || all_alerts[i]['attributes']['effect'] == 'SHUTTLE' || all_alerts[i]['attributes']['effect'] == 'SUSPENSION') {
                                    // Search for lineSegments
                                    var possibleMatches = [];
                                    for (a = 0; a < affectedStations.length; a++) {
                                        for (b = 0; b < affectedStations.length; b++) {
                                            if (affectedStations[a] != affectedStations[b]) {
                                                for (c = 0; c < lineSegments.length; c++) {
                                                    if (lineSegments[c][4] == affectedStations[a] && lineSegments[c][7] == affectedStations[b]) {
                                                        // This means we found an impacted line segment which needs modification
                                                        for (d = 0; d < affectedRoutes.length; d++) {
                                                            // First check that the line segment is on an affected route
                                                            if (lineSegments[c][0].includes(affectedRoutes[d])) {
                                                                lineSegments[c][13] = 'shuttled';
                                                                lineSegments[c][14] = severity;
                                                                lineSegments[c][15] = alertHeader;
                                                            }
                                                        }
                                                    } else if (lineSegments[c][4] == affectedStations[a] && lineSegments[c][7] == affectedStations[a]) {
                                                        // This means we found an impacted line segment which needs modification
                                                        for (d = 0; d < affectedRoutes.length; d++) {
                                                            // First check that the line segment is on an affected route
                                                            if (lineSegments[c][0].includes(affectedRoutes[d])) {
                                                                lineSegments[c][13] = 'shuttled';
                                                                lineSegments[c][14] = severity;
                                                                lineSegments[c][15] = alertHeader;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        for (d = 0; d < stationLocations.length; d++) {
                                            if (affectedStations[a] == stationLocations[d][4]) {
                                                stationLocations[d][8] = 'shuttled';
                                                stationLocations[d][9] = severity;
                                                stationLocations[d][10] = alertHeader;
                                                if (wholeRouteAlert == true) {
                                                    stationLocations[d][11] = 'allRoute';
                                                }
                                            }
                                        }
                                    }
                                } else if (all_alerts[i]['attributes']['effect'] == 'NO_SERVICE' || all_alerts[i]['attributes']['effect'] == 'STATION_CLOSURE') {
                                    // Search for stationLocations
                                    for (a = 0; a < stationLocations.length; a++) {
                                        for (k = 0; k < affectedStations.length; k++) {
                                            if (affectedStations[k] == stationLocations[a][4]) {
                                                stationLocations[a][8] = 'closed';
                                                stationLocations[a][9] = severity;
                                                stationLocations[a][10] = alertHeader;
                                                if (wholeRouteAlert == true) {
                                                    stationLocations[a][11] = 'allRoute';
                                                }
                                            }
                                        }
                                    }
                                } else if (all_alerts[i]['attributes']['effect'] == 'ESCALATOR_CLOSURE' || all_alerts[i]['attributes']['effect'] == 'ELEVATOR_CLOSURE') {
                                    // Search for stationLocations
                                    for (a = 0; a < stationLocations.length; a++) {
                                        for (k = 0; k < affectedStations.length; k++) {
                                            if (affectedStations[k] == stationLocations[a][4]) {
                                                stationLocations[a][8] = 'issue';
                                                stationLocations[a][9] = severity;
                                                stationLocations[a][10] = alertHeader;
                                                stationLocations[a][11] = '';
                                            }
                                        }
                                    }
                                } else if (all_alerts[i]['attributes']['effect'] == 'DELAY') {
                                    // Search for stationLocations
                                    var possibleMatches = [];
                                    for (a = 0; a < affectedStations.length; a++) {
                                        for (b = 0; b < affectedStations.length; b++) {
                                            if (affectedStations[a] != affectedStations[b]) {
                                                for (c = 0; c < lineSegments.length; c++) {
                                                    if ((lineSegments[c][4] == affectedStations[a] && lineSegments[c][7] == affectedStations[b]) || (lineSegments[c][4] == affectedStations[a] && lineSegments[c][7] == affectedStations[a])) {
                                                        // This means we found an impacted line segment which needs modification
                                                        for (d = 0; d < affectedRoutes.length; d++) {
                                                            // First check that the line segment is on an affected route
                                                            if (lineSegments[c][0].includes(affectedRoutes[d]) && lineSegments[c][13] != 'shuttled') {
                                                                lineSegments[c][13] = 'delayed';
                                                                lineSegments[c][14] = severity;
                                                                lineSegments[c][15] = alertHeader;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        for (d = 0; d < stationLocations.length; d++) {
                                            if (affectedStations[a] == stationLocations[d][4] && stationLocations[d][8] == '') {
                                                stationLocations[d][8] = 'delayed';
                                                stationLocations[d][9] = severity;
                                                stationLocations[d][10] = alertHeader;
                                                if (wholeRouteAlert == true) {
                                                    stationLocations[d][11] = 'allRoute';
                                                }
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
            // set up d3 box to plot points

            d3.selectAll("svg > *").remove();

            var div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            var vis = d3.select("#visualisation").append("svg")
                .attr("width", WIDTH + MARGINS.left + MARGINS.right)
                .attr("height", HEIGHT + MARGINS.top + MARGINS.bottom)
                .append("g")
                    .attr("transform", "translate(" + MARGINS.left + "," + MARGINS.top + ")");

            var xScale = d3.scale.linear().range([0,1900]).domain([0,1900]);
            var yScale = d3.scale.linear().range([0,1900]).domain([0,1900]);

            var lineFunction = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })
                .interpolate('basis');

            vis.selectAll('line.segments')
                .data(lineSegments) // used to contain ( points )
                .enter()
                .append('path')
                    .attr('d', function(d) { return lineFunction(d[16]); })
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
                        if (d[8] == 'closed' || d[8] == 'issue') {
                            return 0.6
                        } else {
                            return 1
                        }
                    })
                    .attr('class', function(d) {
                        if (d[8] == 'closed') {
                            return 'shuttled'
                        } else if (d[8] == 'issue') {
                            return 'issue'
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
                        if ((d[8] == 'closed' || d[8] == 'shuttled' || d[8] == 'delayed' || d[8] == 'issue') && d[11] != 'allRoute') {
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
                        if (d[8] == 'closed' || d[8] == 'issue') {
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
                var dateNow = new Date();
                var timeFromHour = dateNow.getHours();
                var timeFromMinute = dateNow.getMinutes();
                if (timeFromHour < 10) {
                    timeFromHour = '0' + timeFromHour
                }
                if (timeFromMinute < 10) {
                    timeFromMinute = '0' + timeFromMinute
                }
                document.getElementById("statusText").innerHTML = '<b>Live MBTA rapid transit service diagram</b><br>Last updated at ' + timeFromHour + ':' + timeFromMinute;
                if (refreshCommand == null) {
                    refreshCommand = setInterval(refreshDiagram, 60000, 'current_status');
                }
            } else {
                document.getElementById("statusText").innerHTML = '<b>Rapid transit diagram for ' + dayNames[dayIndex] + ' ' + timeFromAsDate.getDate() + ' ' + monthNames[monthIndex] + ' ' + timeFromAsDate.getFullYear() + '</b><br>' + timeDayText;
                if (refreshCommand != null) {
                    clearInterval(refreshCommand);
                    refreshCommand = null;
                }
            }
        }, 1000);
    }, 1000);
};
