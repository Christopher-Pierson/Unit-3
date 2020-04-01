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
      .center([-77.5, 38.75])
      .rotate([0, 0, 0])
      .parallels([38.37, 39.13])
      .scale(50000)
      .translate([width / 2, height / 2]);

    var path = d3.geoPath()
      .projection(projection);

    // use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.json("data/DC_PopoSec_Crime19.topojson")); //load background spatial data
    Promise.all(promises).then(callback);

    function callback(data){

       dc = data[0];
       console.log(dc);

       // translate europe TopoJSON
       var dcSectors = topojson.feature(dc, dc.objects.DC_PopoSec_Crime19);

       // examine the results
       console.log(dcSectors);

       //add Europe countries to map
       var countries = map.append("path")
          .datum(dcSectors)
          .attr("class", "SECTOR")
          .attr("d", path);

        // //add Europe countries to map
        // var sectors = map.selectAll(".sectors")
        //   .datum(dcSectors)
        //   .data()
        //   .enter()
        //   .append("path")
        //   .attr()
        //   .attr("d", path);


    };
};
