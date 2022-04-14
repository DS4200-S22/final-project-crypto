//read in data
d3.csv("data/crypto_data.csv").then((data) => {

    // ------------------------------------- Pie Chart
    const xkey = 'data.symbol'
    const ykey = 'percent_of_total_marketcap'

    const market_cap = data.map(function(d) {
      return {
        currency: d[xkey],
        market_cap: d[ykey]
      }
    });

    // set the dimensions and margins of the graph
    const width = 700, height = 500, margin = 0;

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    const radius = Math.min(width, height) / 2 - margin;

    // append the svg object to the div called '#pie-and-pump'
    const svg = d3.select("#pie")
      .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "margin: 0 auto; display: block")
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
      .outerRadius(radius * 0.70)

    const outerArc = d3.arc()
      .innerRadius(radius * 0.75)
      .outerRadius(radius * 0.75)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg.selectAll('mySlices')
      .data(data_ready)
      .join('path')
        .attr('d', arc)
        .attr('fill', function(d) {return(color(d.data.market_cap))})
        .attr("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", 0.75)

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
                            + (Math.round(d.data.market_cap * 1000)/10) + "%"})
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

  //----------------------------------------------------  Info Table 

  /*
  Code by Shawn Allen (@shawnbot) repro'd in d3noob's book,
  http://www.d3noob.org/2013/02/add-html-table-to-your-d3js-graph.html,
  but with minor modification by Lynn.
  */

  // functtion to help round the numbers
  function roundHelper(value) {
      let rounded = Math.round(value * 100) / 10;
      if (isNaN(rounded)) {
        return value;
      } else {
        return rounded;
      }
  }

  // The table generation function
  function tabulate(data, columns, columns_names) {
      //add table to #info-table div
      let table = d3.select("#info-table").append("table")
              .attr("style", "margin-left: 0"),
          thead = table.append("thead"),
          tbody = table.append("tbody");

      // append the header row
      thead.append("tr")
          .selectAll("th")
          .data(columns_names)
          .enter()
          .append("th")
              .text(function(column) { return column; })
              .attr("style", "font-weight: bold");

      // create a row for each object in the data
      let rows = tbody.selectAll("tr")
          .data(data)
          .enter()
          .append("tr");

      // create a cell in each row for each column
      let cells = rows.selectAll("td")
          .data(function(row) {
              return columns.map(function(column) {
                  return {column: column, value: roundHelper(row[column])};
              });
          })
          .enter()
          .append("td")
          .attr("style", "font-family: Courier") // sets the font style
              .html(function(d) { 
                  return d.value; 
              });
      
      return table;
    }

  let keyMetrics = tabulate(data, 
      ['data.name', 'data.symbol', 'data.quote.USD.price', 'data.quote.USD.percent_change_24h', 
      'data.quote.USD.market_cap','data.quote.USD.volume_24h', 'data.circulating_supply'], 
      ['Currency', 'Ticker', 'Price', 'Price % Change 24h', 'Market_cap', 'Volume 24h', 'Value Locked' ])

});

 //----------------------------------------------------  Bump

d3.csv("data/price_q.csv").then((data) => {
  //Data set up _________________________________________

  data.sort(function(a, b) {
    if( new Date(b['date']) != new Date(a['date'])) {
      return new Date(b['date']) - new Date(a['date']);
    }
    if(b['close'] != a['close']) {
      return b['close'] - a['close'];
    }
  });

  let pos  = 1;
  data[0].position = pos;
  for(let i=1; i < data.length; i++) {
    if(data[i-1].date != data[i].date) {
      pos = 1;
    } else {
      pos++;
    }
    data[i].position = pos;
  }

  data.forEach(function(d) {
    d['class'] = d['ticker'].toLowerCase().replace(/ /g, '-').replace(/\./g, '');
  })

  // Chart Size Setup _____________________________________
  let margin = { top: 35, right: 0, bottom: 30, left: 70 };

  let width = 960 - margin.left - margin.right;
  let height = 500 - margin.top - margin.bottom;

  let chart = d3.select(".chart")
      .attr("width", 960)
      .attr("height", 600)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Scales _____________________________________
  let x = d3.scaleBand()
      .domain(data.map(function(d) { return new Date(d['date']); }).reverse())
      .rangeRound([25, width - margin.right]);

  let y = d3.scaleLinear()
      .domain([d3.min(data, function(d) { return d['position'] }), d3.max(data, function(d) { return d['position']; })])
      .range([20, height - 30]);

  let size = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d['close']; }))
      .range([3, 10]);

  // Axis _____________________________________
  let xAxis = d3.axisBottom(x);

  let yAxis = d3.axisLeft(y);

  chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(-"+ x.bandwidth()/2.0 +"," + height + ")")
      .call(xAxis)
      .selectAll("text")
        .attr("x", 9)
        .attr("y", -1)
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start")

  chart.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  // Title _____________________________________
  chart.append("text")
    .text('Price Rankings Vs Quarter')
    .attr("text-anchor", "middle")
    .attr("class", "graph-title")
    .attr("y", -10)
    .attr("x", width / 2.0);

  chart.append("text")
    .text('Rank')
    .attr("text-anchor", "middle")
    .attr("class", "graph-title")
    .attr("y", -35)
    .attr("x", width / -4.0)
    .attr("transform", "rotate(-90)");

  // Lines  _____________________________________
  let tickers = data.map(d => d.ticker);

  tickers.forEach(function(ticker) {
    let currData = data.filter(function(d) {
      if(d.ticker == ticker) {
        return d;
      }
    });

    let line = d3.line()
        .x(function(d) { return x(new Date(d.date)); })
        .y(function(d) { return y(d.position); });

    chart.append("path")
        .datum(currData)
        .attr("class", ticker.toLowerCase())
        .attr("style", "fill:none !important")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.1)
        .attr("d", line);
  });
  // Nodes _____________________________________
  let node = chart.append("g")
    .selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return x(new Date(d.date)); })
    .attr("cy", function(d) { return y(d.position); })
    .attr('fill', 'blue')
    // replace spaces with - and remove '.' (from d.c. united)
    .attr("class", function(d) { return d.ticker.toLowerCase() })
    .attr("r", 6)
    //.attr("r", function(d) { return size(d['goals_for']) })
    .attr("stroke-width", 1.5)
    .attr('opacity', '0.6');

  // Tooltips _____________________________________
  let tooltip = d3.select("body").append("div")
      .attr("class", "tooltip");

  chart.selectAll("circle")
      .on("mouseover", function(event, d) {
        chart.selectAll('.' + d['class'])
            .classed('active', true);

        let tooltip_str = "Symbol: " + d.ticker +
                "<br/>" + "Monthly Ave Price: " + d.close + 
                "<br/>" + "Quarter: " + d.date;

        tooltip.html(tooltip_str)
            .style("visibility", "visible");
      })
      .on("mousemove", function(event, d) {
        tooltip.style("top", event.pageY - (tooltip.node().clientHeight + 5) + "px")
            .style("left", event.pageX - (tooltip.node().clientWidth / 2.0) + "px");
      })
      .on("mouseout", function(event, d) {
        chart.selectAll('.'+d['class'])
            .classed('active', false);

        tooltip.style("visibility", "hidden");
      })
      .on('click', function(event, d) {
        chart.selectAll('.' + d['class'])
            .classed('click-active', function(d) {
              // toggle state
              return !d3.select(this).classed('click-active');
            });
      })

})

 //----------------------------------------------------  Candlestick
