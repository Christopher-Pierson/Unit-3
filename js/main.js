/* Javascript by Christopher Pierson, 2020 */

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

       dc = data[0];
       states = data[1];
       console.log(dc);
       console.log(states);

       // translate TopoJSONs
       var dcSectors = topojson.feature(dc, dc.objects.DC_PopoSec_Crime19).features;
       var surroundStates = topojson.feature(states, states.objects.SurroundingStates).features;

       // examine the results
       console.log(dcSectors);
       console.log(surroundStates);

       //add states to map
       var state = map.selectAll(".state")
          .data(surroundStates)
          .enter()
          .append("path")
          .attr("class", function(d){
            return "state " + d.properties.name;
          })
          .attr("d", path);

       //add DC Sectors to map
       var sectors = map.selectAll(".sectors")
          .data(dcSectors)
          .enter()
          .append("path")
          .attr("class", function(d){
            return "sectors " + d.properties.SECTOR;
          })
          .attr("d", path);


    };
};
