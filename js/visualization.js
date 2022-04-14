//read in data
d3.csv("data/crypto_data.csv").then((data) => {

    // ------------------------------------- Pie Chart
    const xkey = 'data.symbol'
    const ykey = 'percent_of_total_marketcap'

    let market_cap_map = data.map(function(d) {
      return {
        currency: d[xkey],
        market_cap: d[ykey]
      }
    }); 

    let market_cap = market_cap_map.slice(0, 15)

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
      
    let data_ready = pie(market_cap)

    const arc = d3.arc()
      .innerRadius(radius * 0)
      .outerRadius(radius * 0.60)

    const outerArc = d3.arc()
      .innerRadius(radius * 0.75)
      .outerRadius(radius * 0.75)

    const arcHighlight = d3.arc()
      .innerRadius(radius * 0)
      .outerRadius(radius * 0.70)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg.selectAll('mySlices')
      .data(data_ready)
      .join('path')
        .attr('d', arc)
        .attr('fill', function(d) {return(color(d.data.market_cap))})
        .attr("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", 0.75)
        .on("mouseover", sliceHovered)
        .on("mouseout", sliceUnhovered)

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
        .style("opacity", 0.5);

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
        .style("opacity", 0.5);



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

  let data_slice = data.slice(0, 15)

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
          .append("tr")
          .on("mouseover", function() {
            rows.classed("highlight", false);
            d3.select(this).classed("highlight", true);
          })
          .on("mouseout", function() {
            rows.classed("highlight", false)
          })


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

  let keyMetrics = tabulate(data_slice, 
      ['data.name', 'data.symbol', 'data.quote.USD.price', 'data.quote.USD.percent_change_24h', 
      'data.quote.USD.market_cap','data.quote.USD.volume_24h', 'data.circulating_supply'], 
      ['Currency', 'Ticker', 'Price', 'Price % Change 24h', 'Market_cap', 'Volume 24h', 'Value Locked' ])

  function sliceHovered(event, object) {
    //selct slice
    d3.select(this)
      .transition()
      .attr('d', arcHighlight(object))

    keyMetrics.selectAll("tr").selectAll("td")
      .filter((d, i) =>
        d.column == "data.symbol" & d.value == object.data.currency)
      .classed('highlight', true)
  }

  function sliceUnhovered(event, object) {
    //console.log(object.data.currency)
    //selct slice
    d3.select(this)
      .transition()
      .attr('d', arc(object))

    keyMetrics.selectAll("tr").selectAll("td")
      .filter((d, i) => 
          //console.log(d))
          d.column == "data.symbol" & d.value == object.data.currency)
      .classed('highlight', false);
  }
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

  const qPares = d3.utc

  chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(-"+ x.bandwidth()/2.0 +"," + height + ")")
      .call(xAxis.tickFormat(d3.timeFormat("Q%q-%Y")))
      .selectAll("text")
        .attr("x", 9)
        .attr("y", -1)
        .attr("transform", "rotate(45)")
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
                "<br/>" + "Quarterly Average Price: " + d.close + 
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

window.onload = function () {

var dataPoints = [];

var chart = new CanvasJS.Chart("chartContainer", {
	animationEnabled: true,
	theme: "light2", // "light1", "light2", "dark1", "dark2"
	exportEnabled: true,
	title: {
		text: "Bitcoin Price Chart"
	},
	subtitles: [{
		text: "Weekly Averages"
	}],
	axisX: {
		interval: 1,
		valueFormatString: "MMM"
	},
	axisY: {
		prefix: "$",
		title: "Price"
	},
	toolTip: {
		content: "Date: {x}<br /><strong>Price:</strong><br />Open: {y[0]}, Close: {y[3]}<br />High: {y[1]}, Low: {y[2]}"
	},
	data: [{
		type: "candlestick",
		yValueFormatString: "$##0.00",
		dataPoints: dataPoints
	}]
});

$.get("/data/btcdata.csv", getDataPointsFromCSV);

function getDataPointsFromCSV(csv) {
	var csvLines = points = [];
	csvLines = csv.split(/[\r?\n|\r|\n]+/);
	for (var i = 0; i < csvLines.length; i++) {
		if (csvLines[i].length > 0) {
			points = csvLines[i].split(",");
			dataPoints.push({
				x: new Date(
					parseInt(points[0].split("-")[0]),
					parseInt(points[0].split("-")[1]),
					parseInt(points[0].split("-")[2])
				),
				y: [
					parseFloat(points[1]),
					parseFloat(points[2]),
					parseFloat(points[3]),
					parseFloat(points[4])
				]
			});
		}
	}
	chart.render();
}

}


 //----------------------------------------------------  Candlestick 2 



var trace1 = {
  
  x: ['2020-01-01','2020-01-08','2020-01-15','2020-01-22','2020-01-29','2020-02-05','2020-02-12','2020-02-19','2020-02-26','2020-03-04','2020-03-11','2020-03-18','2020-03-25','2020-04-01','2020-04-08','2020-04-15','2020-04-22','2020-04-29','2020-05-06','2020-05-13','2020-05-20','2020-05-27','2020-06-03','2020-06-10','2020-06-17','2020-06-24','2020-07-01','2020-07-08','2020-07-15','2020-07-22','2020-07-29','2020-08-05','2020-08-12','2020-08-19','2020-08-26','2020-09-02','2020-09-09','2020-09-16','2020-09-23','2020-09-30','2020-10-07','2020-10-14','2020-10-21','2020-10-28','2020-11-04','2020-11-11','2020-11-18','2020-11-25','2020-12-02','2020-12-09','2020-12-16','2020-12-23','2020-12-30'], 
  
  close: [7,469.34,8189.639826,8787.489354,8680.844785,9341.125312,9883.687325,10072.64958,9643.983003,8728.127262,8543.999757,5611.245034,6113.549941,6414.289357,6891.520095,7050.472584,7003.796429,7431.937243,8704.305218,9288.305921,9415.816061,9203.278401,9472.812512,9690.958923,9540.169565,9428.975286,9250.118139,9165.562662,9285.406628,9175.53701,9798.767117,11215.36105,11663.15117,11794.48183,11763.09241,11517.0839,10708.72939,10369.24028,10880.04411,10639.01077,10690.97291,11069.91778,11465.19672,12835.99132,13568.3576,14982.19625,16046.60457,18180.59613,18231.33486,19120.03385,18627.37707,22403.00068,25031.3219,28401.70327], 
  
  decreasing: {line: {color: '#7F7F7F'}}, 
  
  high: [7,544.60,8305.901458,8910.365418,8770.368505,9465.860337,9963.234084,10238.50153,9828.289401,8929.066173,8792.202791,6276.642123,6353.80301,6594.498718,7023.732865,7205.865721,7139.946288,7469.136811,8900.975863,9572.314929,9587.158674,9424.418712,9559.887677,9849.469161,9672.053044,9499.237711,9377.788079,9246.550251,9349.880064,9228.912413,9885.421808,11482.27764,11803.37633,11983.6655,11910.6815,11642.07671,11067.64283,10522.88822,11047.05041,10739.56851,10768.16696,11156.56963,11552.52188,13008.79832,13794.21418,15281.87766,16198.83892,18486.66594,18705.33971,19456.3828,18905.38729,22888.66768,25526.97936,28517.77893], 
  
  increasing: {line: {color: '#17BECF'}}, 
  
  line: {color: 'rgba(31,119,180,1)'}, 
  
  low: [7,273.25,7969.326807,8642.715209,8480.671241,9231.950002,9638.960868,9882.988338,9544.207363,8583.2715,8428.946262,5208.823864,5732.099327,6272.844427,6686.235063,6934.406791,6874.980697,7282.928489,8429.319528,9011.300529,9153.151981,9070.060457,9195.596093,9549.420244,9382.244486,9310.73688,9148.308925,9053.471487,9203.64941,9122.530235,9502.932967,10948.78707,11432.74449,11522.88919,11649.83986,11363.74319,10457.48317,10160.57986,10724.28362,10483.5845,10555.42629,10869.5871,11313.84084,12524.33417,13205.48779,14323.95486,15623.6177,17597.47732,17462.19336,18673.12097,18225.02484,21449.45718,24018.23152,27183.12659], 
  
  open: [7,330.98,8092.671033,8799.330877,8592.113117,9365.072042,9736.522382,10081.24661,9758.403907,8807.390779,8670.033677,6000.498433,5903.468679,6457.471423,6786.300991,7112.262018,6997.991119,7302.107595,8546.078802,9329.420316,9257.89404,9319.845945,9294.69904,9747.25356,9586.224844,9400.387687,9315.380227,9138.674747,9299.900581,9185.829008,9539.312858,11180.79496,11568.98964,11739.76426,11830.16714,11530.63755,10891.77718,10329.4017,10909.3053,10603.44211,10681.52386,10963.54387,11440.04874,12643.29637,13500.45559,14727.66176,15848.932,17940.77043,18052.00985,19183.44293,18618.88888,21892.8532,24420.9997,27761.15773], 
  
  type: 'candlestick', 
  xaxis: 'x', 
  yaxis: 'y'
};

var data = [trace1];

var layout = {
  dragmode: 'zoom', 
  margin: {
    r: 10, 
    t: 25, 
    b: 40, 
    l: 60
  }, 
  showlegend: false, 
  xaxis: {
    autorange: true, 
    rangeslider: {range: ['2020-01-01 12:00', '2020-12-30 12:00']}, 
    title: 'Date', 
    type: 'date'
  }, 
  yaxis: {
    autorange: true, 
    type: 'linear'
  },
  
  annotations: [
    {
      x: '2020-01-01',
      y: 0.9,
      xref: 'x',
      yref: 'paper',
      text: '',
      font: {color: 'magenta'},
      showarrow: true,
      xanchor: 'right',
      ax: -20,
      ay: 0
    }
  ],
  
  shapes: [
      {
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: '2020-01-01',
          y0: 0,
          x1: '2020-01-01',
          y1: 1,
          fillcolor: '#d3d3d3',
          opacity: 0.2,
          line: {
              width: 0
          }
      }
    ]
};

Plotly.newPlot('myDiv', data, layout);