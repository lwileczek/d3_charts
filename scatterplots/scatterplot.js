"use strict;"
const margin = {top: 20, right: 95, bottom: 40, left: 50},
    width  = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

const symbol = d3.symbol();

function createChart(svgName, data, yCol, title, sizeMarkers=false,
scale="linear") {
    const svg = d3.select(svgName)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // Create Y-axis
    switch (scale) {
        case "linear": {
            var yScale = d3.scaleLinear()
                .domain([
                    d3.min(data.map(d => d[yCol])),
                    d3.max(data.map(d => d[yCol]))
                ])
                .range([height, 0]);
            break;
        }
        case "log": {
            // clamp to avoid zeros
            var yScale = d3.scaleLog().clamp(true)
                .domain([
                    1,
                    d3.max(data.map(d => d[yCol]))
                ])
                .range([height, 0]);
             break;
        }
        case "sqrt": {
            var yScale = d3.scaleSqrt()
                .domain([
                    d3.min(data.map(d => d[yCol])),
                    d3.max(data.map(d => d[yCol]))
                ])
                .range([height, 0]);
                break;
        }
    }

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format(".2s"));

    // Create X-axis
    const xScale = d3.scaleLinear()
        .domain([
            d3.min(data.map(d => d.Rating)), 
            d3.max(data.map(d => d.Rating))
          ])
        .range([0, width]);
    const xAxis = d3.axisBottom(xScale);

    // Append axes
    svg.append("g").classed("axis", true)
        .attr("transform", `translate(0, ${height})`) // push to the bottom
        .call(xAxis);
    svg.append("g")
        .classed("axis", true)
        .call(yAxis);

    // Add gridlines
    svg.append('g')
       .attr('class', 'grid')
       .attr('transform', `translate(0, ${height})`)
       .call(d3.axisBottom().scale(xScale)
         .tickSize(-height, 0, 0)
         .tickFormat('')
    );
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft().scale(yScale)
        .tickSize(-width, 0, 0)
        .tickFormat('')
    );

    // Prep marker size
    const markerScale = d3.scaleLinear()
        .domain([
            d3.min(data.map(d => d.WinsNoms)),
            d3.max(data.map(d => d.WinsNoms))
            ]
        )
        .range([35, 300]);
    const symbolTypesx = {
      "cross": d3.symbol().type(d3.symbolCross).size(function(d) {
        return sizeMarkers ? (10+2*d.WinsNoms) : 65;
      }),
      "circle": d3.symbol().type(d3.symbolCircle).size(function(d) {
        return sizeMarkers ? (10+2*d.WinsNoms) : 65;
      })
    };
    svg.selectAll(".point")
        .data(data)
      .enter().append("path")
        .attr("class", d => "path "+ (d.IsGoodRating ? "good" : "bad"))
        .attr("transform", function(d) {
            return "translate(" + xScale(d.Rating) +","+ yScale(d[yCol]) +")";
        })
        .attr("d", function(d, i) {
                if (d.IsGoodRating === 0) { // circle if bar === 0
                  return symbolTypesx.circle(d);
                } else {
                  return symbolTypesx.cross(d);
                }
              }
        );

    // Add legend
    svg.append("path")
        .attr("d", symbol.type(d3.symbolCircle))
        .attr("class", "bad")
        .attr("transform", "translate("+(width+margin.right/5)+","+5+")");
    svg.append("text")
        .attr("x", width + margin.right/3.5)
        .attr("y", 9)
        .text("Bad Rating");

    svg.append("path")
        .attr("d", symbol.type(d3.symbolCross))
        .attr("class", "good")
        .attr("transform", "translate("+(width + margin.right/5)+","+25+")");
    svg.append("text")
        .attr("x", width + margin.right/3.5)
        .attr("y", 29)
        .text("Good Rating");

    // Add Axes labels and Title
    svg.append("text")
        .attr("y", -7*margin.left/10 - 5)
        .attr("x", -(height / 2) + margin.top)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text(yCol);
    svg.append("text")
        .attr("y", height + margin.top + margin.bottom/4)
        .attr("x", width/2 + margin.left)
        .attr("text-anchor", "middle")
        .text("Rating");
    svg.append("text")
        .attr("y", -margin.top/4)
        .attr("x", width/2 + margin.left)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
        .text(title)
}

d3.csv("./movies.csv", function(d) {
    // Picking names and converting numbers
    return {
        Id:             d.Id,
        Budget:        +d.Budget,
        Country:        d.Country,
        Gross:         +d.Gross,
        IsGoodRating:  +d.IsGoodRating,
        Rating:        +d.Rating,
        Runtime:       +d.Runtime,
        Title:          d.Title,
        Votes:         +d.Votes,
        WinsNoms:      +d.WinsNoms,
        Year:          +d.Year
    };
}).then(function(dataset) {
    // Chart one scales and axis
    createChart("#first", dataset, "WinsNoms", "Wins+Nominations vs. Rating");
    createChart("#second", dataset, "Budget", "Budget vs. Rating");
    createChart("#third", dataset, "Votes", "Votes vs. Rating sized"+
    "by Wins+Nominations", true);
    createChart("#fourth", dataset, "WinsNoms", 
        "Wins+Nominations vs. Rating", false, "sqrt");
    createChart("#fifth", dataset, "WinsNoms", 
        "Wins+Nominations vs. Rating", false, "log");
})
.catch(function(error) { console.log(error);});
