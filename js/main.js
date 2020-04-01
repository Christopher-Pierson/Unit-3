/* Javascript by Christopher Pierson, 2020 */

// begin script when window loads
window.onload = setMap();

// set up choropleth map
function setMap(){
    // use Promise.all to parallelize asynchronous data loading
    var promises = [d3.json("data/DC_PopoSec_Crime19.topojson")
                   ];
    Promise.all(promises).then(callback);

    function callback(data){
	     dc = data[0];
       console.log(dc);

    };
};
