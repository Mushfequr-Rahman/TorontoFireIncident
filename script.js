// Load TopoJSON file
d3.json("data/toronto_topo.json", function(error, toronto) {
if (error) throw error;
    // Load Toronto Fire Dataset here
    d3.json("data/Fire_Incidents_Data.json", function(error, fire) {
    // Load Toronto Fire Station Dataset
        d3.json("data/toronto_fire_stations.json", function(error, station) {
            // console.log("Stations: ", station)
            fire = fire.filter((d, i) => i % 10 == 0);
            og_data = fire
            var margin = {
                    top: 10,
                    right: 10,
                    bottom: 100,
                    left: 15
                },
                margin2 = {
                    top: 10,
                    right: 10,
                    bottom: 20,
                    left: 15
                }

            var picker_width = 500 - margin.left - margin.right
            var picker_height = 100 - margin2.top - margin2.bottom;
            var x = d3.time.scale().range([0, picker_width])
            var y = d3.scale.linear().range([picker_height, 0])


            var fire_by_time = d3.nest()
                .key(function(d) {
                    format = d3.time.format("%b %Y")
                    var c_date = format(new Date(d.TFS_Arrival_Time))
                        //console.log("Current date:", c_date);
                    return c_date;
                })
                .entries(fire)

            // Sort the data by date:
            fire_by_time = fire_by_time.sort(function(a, b) {

                return new Date(a.key) - new Date(b.key);
            });
            console.log("Length of new data: ", fire_by_time)


            x.domain(d3.extent(fire_by_time, function(d) {
                //console.log(new Date(d.key))
                return new Date(d.key);
            }))
            y.domain([0, d3.max(fire_by_time.map(function(d) {
                //console.log(d.values.length)
                return d.values.length;
            }))])

            var xAxis = d3.svg.axis().scale(x).orient("bottom")
            var yAxis = d3.svg.axis().scale(y).orient("left")
            var brush = d3.svg.brush()
                              .x(x)
                              .on("brush", brushed)
                              .on("brushend", brushended);;


            var btns = d3.select("#btnDiv").selectAll("button").data([2011, 2012, 2013, 2014, 2015, 2016, 2017])

            btns = btns.enter().append("button").style("display", "inline-block")

            // fill the buttons with the year from the data assigned to them
            btns.each(function(d) {
                this.innerText = d;
            })

            btns.on("click", drawBrush);

            function drawBrush() {
                // our year will this.innerText
                console.log(this.innerText)

                // define our brush extent to be begin and end of the year
                brush.extent([new Date(this.innerText + '-01-01'), new Date(this.innerText + '-12-31')])

                // now draw the brush to match our extent
                // use transition to slow it down so we can see what is happening
                // remove transition so just d3.select(".brush") to just draw
                brush(d3.select(".brush").transition());

                // now fire the brushstart, brushmove, and brushend events
                // remove transition so just d3.select(".brush") to just draw
                brush.event(d3.select(".brush").transition().delay(1000))
            }

            var area = d3.svg.area()
                .interpolate("monotone")
                .x(function(d) {
                    //console.log("X coordinate", x(new Date(d.key)))
                    return x(new Date(d.key));
                })
                .y0(picker_height)
                .y1(function(d) {
                    //console.log("Inside Area:", y(d.values.length))
                    return y(d.values.length);
                });

            console.log("Area: ", area)
            var svg = d3.select("#picker").append("svg")
                .attr("width", picker_width + margin.left + margin.right)
                .attr("height", picker_height + margin.top + margin.bottom)
                .attr("id", "pick_date");
            svg.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", picker_width)
                .attr("height", picker_height);

            var focus = svg.append("g")
                .attr("class", "focus")
                .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

            focus.append("path")
                .datum(fire_by_time)
                .attr("class", "area")
                .attr("d", area)
                .attr("fill", 'salmon');

            focus.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + picker_height + ")")
                .attr("fill", "white")
                .call(xAxis);

            focus.append("g")
                .attr("class", "x brush")
                .call(brush)
                .selectAll("rect")
                .attr("y", -6)
                .attr("height", picker_height + 7)
                .attr("fill", "rgba(0,0,0,0.5)");

            function brushed() {
                brush.event(d3.select(".brush").transition().delay(1000).duration(500))
                var extent = (brush.empty()? undefined : brush.extent());
                start = extent[0]
                end = extent[1]
                console.log(extent)
                fire = og_data.filter(function(d, i) {
                    date = new Date(d.TFS_Arrival_Time)

                    //console.log(start <= date && date <= end)
                    return (start <= date && date <= end);
                });

                d3.select("#map").remove()
                d3.select("#color_key").remove()
                drawMap(toronto, fire, station)
            }

            function brushended() {
                brush.clear().event(d3.select(".brush"));
                //const selection = d3.event.selection;
                //if (!d3.event.sourceEvent || !selection) return;
            }


            /*
            Fire Dataset attributes: 
            Smoke_Alarm_at_Fire_Orgin_Alaram Failure: Mostly null 
            Count_of_Persons_Rescued: 0
            TFS_Arrival_Time: "2015-08-29T11:52:19"
            Incident_Station_Area: 412
            Building_Status: null
            Smoke_Alarm_at_Fire_Origin_Alarm_Type: null
            Level_Of_Origin: null
            Latitude: 43.72274
            Exposures: null
            Ignition_Source: "81 - Vehicle - Electrical"
            Property_Use: "850 - Parking Lot Kiosk"
            Status_of_Fire_On_Arrival: "3 - Fire with smoke showing only - including vehicle, outdoor fires"
            Civilian_Casualties: 0
            Sprinkler_System_Presence: null
            Smoke_Alarm_Impact_on_Persons_Evacuating_Impact_on_Evacuation: null
            Method_Of_Fire_Control: "1 - Extinguished by fire department"
            Incident_Ward: 2
            Business_Impact: null
            Number_of_responding_apparatus: 1
            Intersection: "Highway 27 S / Queen's Plate Dr"
            Fire_Alarm_System_Operation: null
            Sprinkler_System_Operation: null
            Fire_Alarm_System_Impact_on_Evacuation: null
            Fire_Under_Control_Time: "2015-08-29T12:13:53"
            Estimated_Dollar_Loss: 1000
            Estimated_Number_Of_Persons_Displaced: null
            Final_Incident_Type: "01 - Fire"
            Area_of_Origin: "81 - Engine Area"
            Longitude: -79.59822
            TFS_Firefighter_Casualties: 0
            Smoke_Alarm_at_Fire_Origin: null
            Material_First_Ignited: "16 - Insulation"
            Fire_Alarm_System_Presence: null
            _id: 441424
            Extent_Of_Fire: null
            Number_of_responding_personnel: 4
            Possible_Cause: "51 - Mechanical Failure"
            Last_TFS_Unit_Clear_Time: "2015-08-29T12:40:36"
            Initial_CAD_Event_Type: "VEF"
            Smoke_Spread: null
            TFS_Alarm_Time: "2015-08-29T11:52:04"
            Incident_Number: "F15080769"
            Ext_agent_app_or_defer_time: "2015-08-29T11:52:31"
            */

            var choices = []
            d3.selectAll("input[name='cause']").on("change", function() {
                var choices = [];
                console.log("Fire incidents check box clicked")
                d3.selectAll("input[name='cause']:checked").each(function(d) {
                    var cb = d3.select(this);
                    if (cb.property("checked")) {
                        choices.push(cb.property("value"));
                    }
                });

                var new_data = fire.filter(function(d, i) {
                    if (choices.length > 0) {
                        my_choices = ""
                            //console.log("Choices: ", choices)
                        my_choices = choices.join(' ')
                        temp = d.Possible_Cause
                        temp = temp.split("-")
                        temp = temp[1].toString()

                        //console.log(my_choices)
                        //console.log("Sanity check: ", my_choices.includes(temp))
                        return my_choices.includes(temp);
                        choices = []
                    } else return null;
                })
                d3.select("#map").remove()
                d3.select("#color_key").remove()
                drawMap(toronto, new_data, station)


            });

            drawMap(toronto, fire, station)

        });
    });

});


function drawMap(toronto, fire, station) {
    var mapWidth = 1050,
        mapHeight = 1050;

    var c10 = d3.scale.category10();
    var projection = d3.geo.albers();
    var path = d3.geo.path().projection(projection);

    var svg = d3.select("#vis")
        .append("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .attr("id", "map")
        .call(d3.behavior.zoom().on("zoom", function() {
            svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
        }));

    var mapLabel = svg.append("text")
        .attr("y", 20)
        .attr("x", 0)
        .attr("class", "map_neighbourhood_name")


    var neighbourhoods = topojson.feature(toronto, toronto.objects.toronto);

    console.log("Inside draw map with fire data length:", fire.length)

    // set default projection values 
    projection
        .scale(1)
        .translate([0, 0]);

    // creates bounding box and helps with projection and scaling
    var b = path.bounds(neighbourhoods),
        s = .95 / Math.max((b[1][0] - b[0][0]) / mapWidth, (b[1][1] - b[0][1]) / mapHeight),
        t = [(mapWidth - s * (b[1][0] + b[0][0])) / 2, (mapHeight - s * (b[1][1] + b[0][1])) / 2];

    // set project with bounding box data
    projection
        .scale(s)
        .translate(t);

    //Section for color scale:
    var colorScale = d3.scaleThreshold()
        .domain([0, 5, 10, 15, 20, 30, 40, 50])
        .range(d3.schemeReds[9]);

    var list = [];
    // Mushy TODO: Normalize the count of the incidents with area 
    neighbourhoods.features.forEach(function(d) {
        var dict = {}
        //var area = d3.geoArea(d) * 10000000

        dict[d] = 0;
        for (var i in fire) {
            if (d3.geoContains(d, [fire[i].Longitude, fire[i].Latitude])) {
                dict[d] += 1
            }
        }
        //console.log("Normalized Score: ", dict[d] / area)
        //list.push(dict[d] / area)
        list.push(dict[d])
    });

    // get individual neighbourhoods
    svg.selectAll("path")
        .data(neighbourhoods.features)
        .enter().append("path")
        .attr("class", "map_neighbourhood")
        .attr("d", path)
        .attr("fill", function(d, i) {
            //console.log("Data", list[i])
            //console.log('color: ', colorScale(list[i]))
            return colorScale(list[i]);
        })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("click", clicked)

    // add the mesh/path between neighbourhoods
    svg.append("path")
        .datum(topojson.mesh(toronto, toronto.objects.toronto, function(a, b) {
            return a !== b;
        }))
        .attr("class", "map_mesh")
        .attr("d", path);

    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function mouseover(d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);

        //Aggregate data here: 
        total_incidents = 0;
        var total_time = 0;
        for (var i in fire) {
            if (d3.geoContains(d, [fire[i].Longitude, fire[i].Latitude])) {
                total_incidents += 1
                arr_t = new Date(fire[i].TFS_Arrival_Time)
                alarm_t = new Date(fire[i].TFS_Alarm_Time)
                total_time += (arr_t - alarm_t) / (3600 * 24)
            }

        }
        var avg_wait_time = total_time / total_incidents

        tooltip.html("Area Name: " + d.properties.name.slice(0, -5) +
                "<br> Total Incidents: " + total_incidents + "<br> Average Waiting Time: " + avg_wait_time.toFixed(2) + ' minutes')
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }

    /*
        Section to add circles to the Map 
    */

    svg.selectAll('image')
        .data(station)
        .enter()
        .append("image")
        .attr("xlink:href", 'images/fire_extinguisher.png')
        .attr("width", 12)
        // .attr("fill", "red")
        // .attr("r", 5)
        .attr("transform", function(d) {
            //console.log(projection([d.lon, d.lat]));
            return `translate(${projection([d.lon, d.lat + 0.005])})`;
        })


    function mouseout(d) {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    function clicked(d) {
        // console.log(d.properties.id, d.properties.name) // verify everything looks good
        // Add code here
    }

    /* LEGEND */
    // TO DO: Needs to fix the range of incident label
    var legendRectSize = 18;
    var legendSpacing = 4;
    var legend = d3.select('#legends')
        .append("svg")
        .attr('width', 100)
        .attr('height', 200)
        .attr("id", "color_key");

    legend.selectAll("g")
        .data(colorScale.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
            var height = legendRectSize + legendSpacing;
            var offset = height * colorScale.domain().length / 2;
            var horz = -2 * legendRectSize + 40;
            var vert = i * height - offset + 100;
            return 'translate(' + horz + ',' + vert + ')';
        });

    legend.selectAll("g")
        .append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', colorScale)
        .style('stroke', colorScale);

    legend.selectAll("text")
        .data(colorScale.domain())
        .enter()
        .append('text')
        .attr('x', 30)
        .attr("font-size", "10px")
        .attr('y', function(d, i) {
            return (i + 1) * 22;
        })
        .style('fill', 'white')
        .text(function(d) {
            text = d;
            // Customized legend text
            if(d == 0) text = "< 5";
            else if(d == 5)  text = "5 - 9";
            else if(d == 10) text = "10 -14";
            else if(d == 15) text = "15 - 20";
            else if(d == 20) text = "20 -29";
            else if(d == 30) text = "30 -39";
            else if(d == 40) text = "40 - 49";
            else if(d == 50) text = ">= 50"
            return text;
        });

    var y = d3.scaleLinear()
        .range([300, 0])
        .domain([68, 12]);


    var yAxis = d3.svg.axis().scale(y).orient("bottom").ticks(5);

    console.log("Finished Drawing map")

}