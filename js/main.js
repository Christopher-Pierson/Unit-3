/* Javascript by Christopher Pierson, 2020 */

//"use strict"; // produceds error if incorrectly attempting to create global variable

// self-executing anonymous wrapper function
(function(){

// pseudo-global variables
var attrArray = ["ADW_per1k", "MVT_per1k", "BRG_per1k", "Rob_per1k", "Hom_per1k", "SA_per1k"]; //list of attributes
var expressed = attrArray[4]; // initial attribute

// begin script when window loads
window.onload = setMap();

// set up choropleth map
function setMap(){

    // map frame dimensions
    var width = 960,
        height = 460;

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
