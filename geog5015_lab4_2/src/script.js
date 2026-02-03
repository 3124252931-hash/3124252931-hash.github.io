// initial setup
const svg = d3.select("svg"),
  width = svg.attr("width"),
  height = svg.attr("height"),
  path = d3.geoPath(),
  data = d3.map();

//url to the geojson
const data_url =
  "https://raw.githubusercontent.com/meiliuwu1-ai/meiliuwu1-ai.github.io/main/lab4/glasgow.geojson";

// style of geographic projection and scaling similar to a zoom level and centre
https: var projection = d3
  .geoMercator()
  .center([-4.25, 55.86])
  .scale(130000)
  .translate([width / 2, height / 2]);

//define colors: directly copied from colorBrewer
const colors = [
  "#67001f",
  "#b2182b",
  "#d6604d",
  "#f4a582",
  "#fddbc7",
  "#d1e5f0",
  "#92c5de",
  "#4393c3",
  "#2166ac",
  "#053061"
];

// Load external data and boot
d3.queue().defer(d3.json, data_url).await(ready);

function ready(error, data) {
  // features is the data received from the d3.queue function

  // Draw the map
  glasgow = svg.append("g").attr("class", "map");
  glasgow
    .selectAll("path")
    .data(data.features)
    .enter()
    .append("path")
    // draw each country
    // d3.geoPath() is a built-in function of d3 v4 and takes care of showing the map from a properly formatted geojson file, if necessary filtering it through a predefined geographic projection
    .attr("d", d3.geoPath().projection(projection))
    // set the fill color of each country
    .attr("fill", function (d) {
      return colors[d.properties.Decilev2]; //Here we match the color with the decile
    });
}

//Code for legend
// select the svg area
var SVG = d3.select("#legend");

// create a list of keys
var keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Add one dot in the legend for each name.
var size = 20;
SVG.selectAll("mydots")
  .data(keys)
  .enter()
  .append("rect")
  .attr("x", 0)
  .attr("y", function (d, i) {
    return 100 + i * (size + 5);
  }) // 100 is where the first dot appears. 25 is the distance between dots
  .attr("width", size)
  .attr("height", size)
  .style("fill", function (d) {
    return colors[d];
  });

// Add one dot in the legend for each name.
SVG.selectAll("mylabels")
  .data(keys)
  .enter()
  .append("text")
  .attr("x", 0 + size * 1.2)
  .attr("y", function (d, i) {
    return 100 + i * (size + 5) + size / 2;
  }) // 100 is where the first dot appears. 25 is the distance between dots
  .text(function (d) {
    return d.toString();
  })
  .attr("text-anchor", "left")
  .style("alignment-baseline", "middle");
