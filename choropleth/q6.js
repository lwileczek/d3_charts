"use strict";
/*
 * Select container fit to the screen
 * This selection using css will make sure it fits the screen on load but will
 * not resize with the screen. If we want our map to resize we'll have to add a
 * listener but this should be good enough to make sure no matter who views it
 * looks good. 
 */
const myWindow = d3.select("#container");
const margin = 60,  // map is going to be centered so even margins
    width = myWindow.node().getBoundingClientRect().width - 2 * margin,
    height = myWindow.node().getBoundingClientRect().height - 2 * margin;
const svg = myWindow.append("svg")
        .attr("width", width + 2*margin)
        .attr("height", height + 2*margin)
    .append("g")
        .attr("transform", `translate(${margin}, ${margin})`);

const unemployment = d3.map(),
    path = d3.geoPath();

// create color based on poverty
const color = d3.scaleThreshold()
    .domain(d3.range(2, 20, 2))
    .range(d3.schemeBlues[9]);

// number formatters
const comma = d3.format(",~");
const money = d3.format("$,~");
const percent = d3.format(".2~%");

const createMap = function createMap([us, poverty, detail]) {
    // create the tool tip
    const tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-15,0])
        .html(function(d) {
            const det = detail.filter(r => r.CensusId == d.id)[0];
            const pov = poverty.filter(r => r.CensusId == d.id)[0];
            // state, county, pov rate, population, income
            let str = "State: " + pov.state + "<br>County: " + pov.county +
                "<br>Poverty Rate: " + percent(pov.poverty/100) + 
                "<br>Total Population: " + comma(det.pop) + 
                "<br>Income Per Capita: " + money(det.income);
            return str;
        });
    svg.call(tip);

    // Create the map
    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
          .attr("fill", function(d) {
              let tmpPov = poverty.filter(row => row.CensusId == d.id)
              let val = tmpPov[0].poverty
              return color(val);
          })
          .attr("d", path)
          .on('mouseenter', tip.show)
          .on('mouseout', tip.hide);

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { 
            return a !== b;
        }))
        .attr("class", "states")
        .attr("d", path);

    /*
     * Create the vertical legend
     */

    // Find where the map ends and then move over slightly
    const legendX = d3.select(".counties").node().getBBox().width; 

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX}, 0)`);

    legend.append("text")
        .attr("y", -5)
        .text("Poverty Rate");

    legend.selectAll("rect")
        .data(color.range())
        .enter().append("rect")
            .attr("height", 20)
            .attr("x", 10)
            .attr("y", function(d, i) {
                return i*20
            })
            .attr("width", 40)
            .attr("fill", d => d);

    legend.selectAll(".legendText")
        .data(color.domain())
        .enter().append("text")
        .attr("class", "legendText")
        .attr("x", 51)
        .attr("y", (d, i) => i*20+11)
        .text(function(d, i) {
            var sign;
            switch (i) {
                case 0:
                    sign = "≤";
                    break;
                case 8:
                    sign = "≥";
                    break;
                default:
                    sign = "";
                    break;
            }
            return sign + percent(d/100);
        });
          
}

// group all of our promises together.
const promises =[
    d3.json("./us.json"),
    d3.csv("./county_poverty.csv", function(row) {
        return {
            CensusId: +row.CensusId,
            county: row.County,
            poverty: +row.Poverty,
            state: row.State
        }
    }),
    d3.csv("./county_detail.csv", function(row) {
        return {
            CensusId: +row.CensusId,
            income: +row.IncomePerCap,
            pop: +row.TotalPop
        }
    })
    ];
Promise.all(promises).then(createMap);
