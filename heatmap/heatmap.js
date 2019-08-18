var margin = {left: 70, top: 40, bottom: 80, right: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom

var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate("+margin.left+","+margin.right+")");

// All things colors
let colors = [
    "#f0f1f2",
    "#e0ecf4",
    "#bfd3e6",
    "#9ebcda", 
    "#8c96c6",
    "#8c6bb1",
    "#88419d",
    "#810f7c",
    "#4d004b"
];


d3.csv("./heatmap.csv", function(d) {
    return {
        Bronx: +d.Bronx,
        Brooklyn: +d.Brooklyn,
        Manhattan: +d.Manhattan,
        Queens: +d.Queens,
        "Staten Island": +d["Staten Island"],
        "Crime Type": d["Crime Type"],
        Year: +d.Year
    };
}).then(function(data) {
    var borough = ["Bronx", "Brooklyn", "Manhattan", 
        "Queens", "Staten Island"];
    borough.sort().reverse();
    // restructure the data
    var meltedData = [ ];
    borough.forEach(function(b) {
        let newData = data.map(function(d) { 
            return {
                borough: [b],
                year: d.Year,
                crime_type: d["Crime Type"],
                value: d[b]
            }; 
        });
       meltedData = meltedData.concat(newData);
    });
    var ncrimeType = data.map(d => d["Crime Type"]); // tmp
    var crimeType = [... new Set(ncrimeType)];
    crimeType.sort();
    const select = d3.select('#container')
      .append('select')
      .on('change', onchange);
    // selector and the onchange function
    const years = [... new Set(data.map(d => d.Year))];
    const options = select
      .selectAll('option')
        .data(years).enter()
        .append('option')
            .text(function (d) { return d; });
    var yScale = d3.scaleBand()
        .domain(borough)
        .range([height, 0]);
    var xScale = d3.scaleBand()
        .domain(crimeType)
        .range([0, width]);

    svg.append("g")
        .call(d3.axisLeft(yScale).tickSize(0))
        .select(".domain").remove();
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .select(".domain").remove();

    let filteredData = meltedData.filter(d => (d.year == years[0]));
    // recompute the color quantiles
    const myColor = d3.scaleQuantile()
          .domain([ 
              d3.min(filteredData, function (d) { return d.value; }),
              d3.max(filteredData, function (d) { return d.value; })
              ]
           )
          .range(colors);

    // Create the heatmapnow by tiling rectangles
    svg.selectAll("rect")
        .data(filteredData)
        .enter()
        .append("rect")
            .attr("x", d => xScale(d.crime_type))
            .attr("y", d => yScale(d.borough))
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("width", xScale.bandwidth() )
            .attr("height", yScale.bandwidth() )
            .style("fill", function(d) { 
                return myColor(d.value);
            })
            .style("stroke-width", 80)
            .style("stroke", "none");

    // create a new legend with the new quantiles
    const legend = svg.selectAll(".legend")
          .data([0].concat(myColor.quantiles()))
        .enter().append("g")
            .attr("class", "legend")
        .append("rect")
            .attr("x", function(d, i) { return 50 * i; })
            .attr("y", height + 25)
            .attr("width", 50)
            .attr("height", 30)
            .style("fill", function(d, i) { return colors[i]; });

    svg.selectAll(".legend").append("text")
        .attr("class", "mono")
        .attr("transform", "translate(5, 35)")
        .attr("x", function(d, i) { return 50 * i; })
        .attr("y", height + 35)
        .text(function(d) { return "≥ " + Math.round(d); });
    legend.exit().remove();

    const t = d3.transition()
        .duration(600);

    // Function to be called later.
    function onchange() {

        const selectValue = d3.select('select').property('value');
        let filteredData = meltedData.filter(d => (d.year == selectValue));
        const newColors= d3.scaleQuantile()
              .domain([ 
                  d3.min(filteredData, function (d) { return d.value; }),
                  d3.max(filteredData, function (d) { return d.value; })
                  ]
               )
              .range(colors);
    
        svg.selectAll(".legend text")
          .data([0].concat(newColors.quantiles()))
            .transition(t)
            .text(function(d) { return "≥ " + Math.round(d); });

        // update the colors of the heatmap
        svg.selectAll("rect")
            .data(filteredData)
            .transition(t)
            .style("fill", function(d) { 
                 console.log(d.CensusId);
                 return newColors(d.value);
            });
    };


});
