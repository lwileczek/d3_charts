const selection = d3.select("#containerBoi");
const globalWidth  = selection.node().getBoundingClientRect().width;
const globalHeight = selection.node().getBoundingClientRect().height;

// Create the sizing for the chart
const margin = {left: 81, top: 30, right: 20, bottom: 35},
    width = (globalWidth * 0.7) - margin.left - margin.right,
    height = (globalHeight*0.7) - margin.top - margin.bottom;

// Create the chart we will append everything to
const svg = d3.select("#containerBoi").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Sort the myData in ascending order before we create the band
myData.sort((a,b) => d3.ascending(a.population, b.population));
// Create the scales to map myData to chart
const yScale = d3.scaleBand()
    .domain(myData.map(d => d.country))
    .range([height, 0])
    .padding(0.2);  // so the bars don't touch
const xScale = d3.scaleLinear()
    .domain([0, d3.max(myData.map(d => d.population))])
    .range([0, width]);

// Create the axes from the scales
svg.append("g")
    .call(d3.axisLeft(yScale).tickSize(0))
    .select('.domain').remove();

// Create the bars, This is where the magic happens
const bar = svg.selectAll(".bar")
    .data(myData)
    .enter().append("g").attr("class", "bar")
    .append("rect")
    .attr("y", d => yScale(d.country))
    .attr("x", 0) // always start on the axis
    .attr("width", d => xScale(d.population))
    .attr("height", d => yScale.bandwidth())
    .attr("fill", "#AAAAAA")
    .on('mouseenter', function(row) {
        d3.select(this).attr("fill", "#3ABDFE");
        lineChart(row.country);
    })
    .on('mouseleave', function(row) { 
        d3.select(".hoverGuy").remove();
        d3.select(this).attr("fill", "#AAAAAA");
    });

d3.selectAll(".bar").append("text")
    .attr("class", "barValue")
    .attr("x", 45)  // not on the axis but near
    .attr("y", d => yScale(d.country) + yScale.bandwidth()/2 + 3.5)
    .attr("text-anchor", "middle")
    .text( d => d3.format(",")(d.population));


//const createLineChart = function lineChart (countryName) {
function lineChart (countryName) {
    const selectedCountry = data.filter(d => d.country == countryName);
    const years = [2013, 2014, 2015, 2016, 2017];
    const m = 60,  // even margin around
        h = (globalHeight *0.5) - 2*m,  // margin on left and right
        w = (globalWidth * .3) - 2*m;

    const lineChart = d3.select("#containerBoi").append("svg")
            .attr("class", "hoverGuy")
            .attr("width", w + 2*m)
            .attr("height", h + 2*m)
            .style("vertical-align", "top")
        .append("g")
            .attr("transform", `translate(${m}, ${m})`);

    // create scales and axes
    const xScale = d3.scaleLinear()
        .domain([2013, 2017])
        .range([0, w]);

    let pop = selectedCountry[0].population_2012;
    const growthValues = Object.values(selectedCountry[0].growth);
    const growthPercents = [ ];

    growthValues.forEach(function(val) {
        growthPercents.push(val/pop);
        pop += val;
    });

    const yScale = d3.scaleLinear()
        .domain([
            d3.min(growthPercents),
            d3.max(growthPercents)
            ]
        )
        .range([h, 0]);

    lineChart.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale)
            .tickFormat(d3.format(".4~%")));
    lineChart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${h})`)
        .call(d3.axisBottom(xScale)
            .ticks(5, ".4~r"));

    const line = d3.line()
        .x(function(d, i) { return xScale(years[i]); })
        .y(d => yScale(d))
        .curve(d3.curveMonotoneX);

    lineChart.append("path")
        .datum(growthPercents)
        .attr("class", "line")
        .attr("stroke-width", 2.5)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("d", line);

   lineChart.append("text")
       .attr("x", -m)
       .attr("y", -m/6)
       .text("Percent (%)");

   lineChart.append("text")
       .attr("x", w - m/4)
       .attr("y", h + m/1.8)
       .text("Year");

   lineChart.append("text")
       .attr("x", w / 2)
       .attr("y", -m / 2)
       .attr("text-anchor", "middle")
       .attr("font-size", "18px")
       .style("fill", "#444")
       .attr("font-family", "sans-serif")
       .text("Population Growth from 2012-2017 for: "+countryName);
}

