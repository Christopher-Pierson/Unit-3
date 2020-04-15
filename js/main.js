/* Javascript by Christopher Pierson, 2020 */

//"use strict"; // produceds error if incorrectly attempting to create global variable

// self-executing anonymous wrapper function
(function(){

// pseudo-global variables
var attrArray = ["ADW_per1k", "MVT_per1k", "BRG_per1k", "Rob_per1k", "Hom_per1k", "SA_per1k"]; //list of attributes
var fieldNum = 4 // set index of interest from arrays
var expressed = attrArray[fieldNum]; // initial attribute
var fieldNameArray = ["Assaults w/ Deadly Weapon", "Motor Vehicle Thefts", "Burglaries", "Robberies", "Homicides", "Sexual Assaults"]; //list of attributes
var alias = fieldNameArray[fieldNum]; // initial attribute

// begin script when window loads
window.onload = setMap();

// set up choropleth map
function setMap(){

    // map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 463;

    // create new svg container for the map
    var map = d3.select("body")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

    // create Albers equal area conic projection centered on Washington, DC
    var projection = d3.geoAlbers()
      .center([0, 38.91]) //latitude of center
      .rotate([77.02, 0, 0]) //longitude of center * -1
      .parallels([38.88, 39.94]) //adjusted to minimize distortion
      .scale(100000)
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

      createDropdown()
    };
}; // end of setMap

function setEnumerationUnits(dcSectors, map, path, colorScale){
    // add DC police sectors to map
    var sectors = map.selectAll(".sectors")
      .data(dcSectors)
      .enter()
      .append("path")
      .attr("class", function(d){
        return "sectors " + d.properties.SECTOR;
      })
      .attr("d", path)
      .style("fill", function(d){
            var value = d.properties[expressed];
            if(value) {
            	return colorScale(d.properties[expressed]);
            } else {
            	return "#ccc";
            }
      });
}; // end of setEnumerationUnits

// function to create a dropdown menu for attribute selection
function createDropdown(){
    // add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown");

    // add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    // add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(fieldNameArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

// function to create coordinated bar chart
function setChart(dcSectors, colorScale){
    // chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    // create a second svg element to hold the bar chart
    var chart = d3.select("body")
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

    //create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 10]);

    // set bars for each province
    var bars = chart.selectAll(".bar")
        .data(dcSectors)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a.properties[expressed]-b.properties[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.properties;
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
        });

    // create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of " + alias + " (per 1,000 people) in 2019");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
}; // end of setChart

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
