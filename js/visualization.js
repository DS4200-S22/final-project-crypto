//read in data
d3.csv("data/crypto_data.csv").then((data) => {
    console.log(data)

    const xkey = 'data.symbol'
    const ykey = 'percent_of_total_marketcap'

    const market_cap = data.map(function(d) {
      return {
        currency: d[xkey],
        market_cap: d[ykey]
      }
    });

    // set the dimensions and margins of the graph
    const width = 700, height = 500, margin = 10;

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    const radius = Math.min(width, height) / 2 - margin;

    // append the svg object to the div called '#pie-and-pump'
    const svg = d3.select("#pie-and-bump")
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", `translate(${width/2}, ${height/2})`);

    // set the color scale
    const color = d3.scaleOrdinal()
      .range(d3.schemeSet2)

    // Compute the position of each group on the pie:
    const pie = d3.pie()
      .value(function(d) {return d.market_cap})

    const data_ready = pie(market_cap)

    const arc = d3.arc()
      .innerRadius(radius * 0)
      .outerRadius(radius * 0.8)

    const outerArc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg.selectAll('mySlices')
      .data(data_ready)
      .join('path')
        .attr('d', arc)
        .attr('fill', function(d) {return(color(d.data.market_cap))})
        .attr("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", 0.75)

    //svg.selectAll('mySlices')
      //.data(data_ready)
      //.join('text')
      //.text(function(d){ return d.data.currency + ": " 
      //                          + Math.round(d.data.market_cap * 100) + "%"})
      //.attr("transform", function(d) { return `translate(${arcGenerator.centroid(d)})`})
      //.style("text-anchor", "outerRadius")
      //.style("font-size", 17)

  svg.selectAll('allPolylines')
    .data(data_ready)
    .join('polyline')
      .attr("stroke", "black")
      .style("fill", "none")
      .attr("stroke-width", 1)
      .attr('points', function(d) {
        const posA = arc.centroid(d) // line insertion in the slice
        const posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
        const posC = outerArc.centroid(d); // Label position = almost the same as posB
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
        posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
        return [posA, posB, posC]
      })

  // Add the polylines between chart and labels:
  svg.selectAll('allLabels')
    .data(data_ready)
    .join('text')
      .text(function(d){ return d.data.currency + ": " 
                          + Math.round(d.data.market_cap * 100) + "%"})
      .attr('transform', function(d) {
         const pos = outerArc.centroid(d);
         const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
         pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
         return `translate(${pos})`;
        })
      .style('text-anchor', function(d) {
          const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
          return (midangle < Math.PI ? 'start' : 'end')
        })
});


