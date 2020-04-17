/* Javascript by Christopher Pierson, 2020 */

//"use strict"; // produceds error if incorrectly attempting to create global variable

// self-executing anonymous wrapper function
(function(){

// pseudo-global variables
var attrArray = ["ADW_per1k", "MVT_per1k", "BRG_per1k", "Rob_per1k", "Hom_per1k", "SA_per1k"]; //list of attributes
var fieldNum = 0 // set index of interest from arrays
var expressed = attrArray[fieldNum]; // initial attribute
var fieldNameArray = {"ADW_per1k": "Assaults w/ Deadly Weapon", "MVT_per1k": "Motor Vehicle Thefts", "BRG_per1k": "Burglaries", "Rob_per1k": "Robberies", "Hom_per1k": "Homicides", "SA_per1k": "Sexual Assaults"}; //list of attributes

// chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

// create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 10]);

// begin script when window loads
window.onload = setMap();

// set up choropleth map
function setMap(){

    // map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 463;

    // create new svg container for the map
    var map = d3.select("#mydiv")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

    // create Albers equal area conic projection centered on Washington, DC
    var projection = d3.geoAlbers()
      .center([0, 38.91]) //latitude of center
      .rotate([77.02, 0, 0]) //longitude of center * -1
      .parallels([38.88, 39.94]) //adjusted to minimize distortion
      .scale(120000)
      .translate([width / 2, height / 2]);

    var path = d3.geoPath()
      .projection(projection);

    // use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.json("data/DC_PopoSec_Crime19.topojson")); // load DC data
    promises.push(d3.json("data/SurroundingStates.topojson")); // load background states spatial data
    Promise.all(promises).then(callback);

    function callback(data){

       var dc = data[0];
       var states = data[1];
       //console.log(dc);
       //console.log(states);

       // translate TopoJSONs
       var dcSectors = topojson.feature(dc, dc.objects.DC_PopoSec_Crime19).features;
       var surroundStates = topojson.feature(states, states.objects.SurroundingStates).features;

       // add states to map
       var state = map.selectAll(".state")
          .data(surroundStates)
          .enter()
          .append("path")
          .attr("class", function(d){
            return "state " + d.properties.name;
          })
          .attr("d", path);

      // create the color scale
      var colorScale = makeColorScale(dc.objects.DC_PopoSec_Crime19.geometries);

      // add enumeration units to the map
      setEnumerationUnits(dcSectors, map, path, colorScale);

      // add coordinated visualization to the map
      setChart(dc.objects.DC_PopoSec_Crime19.geometries, colorScale);

      // add dropdown menu
      createDropdown(dcSectors)
    };
}; // end of setMap

function setEnumerationUnits(dcSectors, map, path, colorScale){
    // add DC police sectors to map
    var sectors = map.selectAll(".sectors")
      .data(dcSectors)
      .enter()
      .append("path")
      .attr("class", function(d){
        return "sectors _" + d.properties.SECTOR;
      })
      .attr("d", path)
      .style("fill", function(d){
            var value = d.properties[expressed];
            if(value) {
            	return colorScale(d.properties[expressed]);
            } else {
            	return "#ccc";
            };
      })
      .on("mouseover", function(d){
            highlight(d.properties);
      })
      .on("mouseout", function(d){
            dehighlight(d.properties);
      })
      .on("mousemove", moveLabel);

    // add style descriptor to each path
    var desc = sectors.append("desc")
      .text('{"stroke": "#000", "stroke-width": "0.5px"}');
}; // end of setEnumerationUnits

// function to create a dropdown menu for attribute selection
function createDropdown(dcSectors){
    // add select element
    var dropdown = d3.select("#mydiv")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, dcSectors)
        });

    // add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Crime Type");

    // add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return fieldNameArray[d] });
};

// function to create coordinated bar chart
function setChart(dcSectors, colorScale){
    // create a second svg element to hold the bar chart
    var chart = d3.select("#mydiv")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    // create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    // set bars for each sector
    var bars = chart.selectAll(".bar")
        .data(dcSectors)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a.properties[expressed]-b.properties[expressed]
        })
        .attr("class", function(d){
            return "bar _" + d.properties.SECTOR;
        })
        .attr("width", chartInnerWidth / dcSectors.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / dcSectors.length) + leftPadding;
        })
        .attr("height", function(d){
            return 463 - yScale(parseFloat(d.properties[expressed]));
        })
        .attr("y", function(d){
            return yScale(parseFloat(d.properties[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d.properties[expressed]);
        })
        .on("mouseover", function(d){
              highlight(d.properties);
        })
        .on("mouseout", function(d){
              dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);

    // add style descriptor to each rect
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    // create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("width", chartInnerWidth)
        .attr("height", "auto")
        .attr("class", "chartTitle")
        .text("Number of " + fieldNameArray[expressed] + " (per 1,000 people) in 2019");

    // create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    // place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    // create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    // set bar positions, heights, and colors
    updateChart(bars, dcSectors.length, colorScale);
}; // end of setChart

// dropdown change listener handler
function changeAttribute(attribute, dcSectors){
    // change the expressed attribute
    expressed = attribute;

    // recreate the color scale
    var colorScale = makeColorScale(dcSectors);

    // recolor enumeration units
    var sectors = d3.selectAll(".sectors")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            var value = d.properties[expressed];
            if(value) {
            	return colorScale(value);
            } else {
            	return "#ccc";
            }
    });

    // re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b.properties[expressed] - a.properties[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);

        updateChart(bars, dcSectors.length, colorScale);
}; //end of changeAttribute

// function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    // position bars
    bars.attr("x", function(d, i){
        return i * (chartInnerWidth / n) + leftPadding;
        })
        // size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d.properties[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d.properties[expressed])) + topBottomPadding;
        })
        // color/recolor bars
        .style("fill", function(d){
            var value = d.properties[expressed];
            if(value) {
            	return colorScale(value);
            } else {
            	return "#ccc";
            }
        });

    var chartTitle = d3.select(".chartTitle")
        .text(fieldNameArray[expressed] + " (per 1,000 people)");
}; // end of updateChart

// function to highlight enumeration units and bars
function highlight(props){
    // change stroke
    var selected = d3.selectAll("._" + props.SECTOR)
        .style("stroke", "cyan")
        .style("stroke-width", "3");
    setLabel(props);
};

// function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("._" + props.SECTOR)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    // remove info label
    d3.select(".infolabel")
        .remove();

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
};

// function to create dynamic label
function setLabel(props){
    // label content
    // var labelAttribute = "<h2>" + props[expressed] +
    //     "</h2><b>" + expressed + "</b>" + "<br>" + "Police Sector: " + props.SECTOR + "</br>";

    var labelAttribute = "<p>" + "Police Sector: <b>" + props.SECTOR +
           "</b><br>Crime: <b>" + fieldNameArray[expressed]+ "</b><br>Incident Rate: <b>" +
           props[expressed] + "</b></br>" + "</p>";

    // create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.SECTOR + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

// function to move info label with mouse
function moveLabel(){
    // get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    // use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    // horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    // vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;


    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

// function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#ffffb2",
        "#fecc5c",
        "#fd8d3c",
        "#f03b20",
        "#bd0026"
    ];

    // create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    // build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i].properties[expressed]);
        domainArray.push(val);
    };

    // cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    // reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    // remove first value from domain array to create class breakpoints
    domainArray.shift();

    // assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
}; // end of makeColorScale

})(); // end main.js
