// set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;


// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

//var url = "https://raw.githubusercontent.com/stellazhangyue/redditWSB/main/data/tmp/indices.csv"
var url = "https://raw.githubusercontent.com/stellazhangyue/redditWSB/main/data/tmp/top_10_stocks_prices.csv"
d3.csv(url, function(d){
    return { 
        symbol: d.Symbol,
        date: d3.timeParse("%Y-%m-%d")(d.Date), 
        close : d.Close
    }
  }).then(
    function(data) {
        var f = "close";

        // split data according to stocks
        var stocks = [...new Set(data.map(item => item.symbol))];
        var data_stock = {};
        stocks.forEach(function (stock) {
            var obj = data.filter(function(d) { return d.symbol == stock});
            data_stock[stock] = obj;
        });

        var palette = ["steelBlue", "sienna", "seaGreen", "teal", "violet", 
                       "orange", "darkSlateGray", "darkOrchid", "darkRed", "coral", "crimson"];
        const color_map = {};
        for (let index = 0; index < stocks.length; ++index) {
            color_map[stocks[index]] = palette[index];
        }

        // data_ = data.filter(function(d) { return d.symbol == "AAPL" });

        // construct x axis
        const x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return d.date; }))
            .range([ 0, width ]);
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // TODO: fix the y axis or make it changeable
        const scales = []
        stocks.forEach(function(stock) {
            scale = d3.max(data_stock[stock], function(d) { return +d[f]; }) 
                    / d3.min(data_stock[stock], function(d) { return +d[f]; });
            scales.push(scale);
        })

        // const scale = d3.max(data, function(d) { return +d[f]; }) 
        //             / d3.min(data, function(d) { return +d[f]; });
        const y = d3.scaleLog()
            .domain([0.01, d3.max(scales)])
            .range([ height, 0 ]);
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(function(d){ return d3.format(".2f")(d) }));

        // make one plot for each stock
        var plots = {};
        stocks.forEach(function (stock) {
            var plot = svg
                .append("path")
                .datum(data_stock[stock])
                .attr("fill", "none")
                .attr("stroke", color_map[stock])
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function(d) { return x(d.date) })
                    .y(function(d) { return y(d[f] / data[0][f]) })
                );
            plots[stock] = plot
        });

        var focus = svg
            .append('g')
            .append('circle')
            .style("fill", "none")
            .attr("stroke", "black")
            .attr('r', 5)
            .style("opacity", 0)

        var ruler = svg
            .append("line")
            .attr("x1", width / 2)
            .attr("y1", 0)
            .attr("x2", width / 2)
            .attr("y2", height - margin.top - margin.bottom)
            .style("stroke-width", 1)
            .style("stroke", "black")
            .style("fill", "none")


        var indicator = svg
            .append('g')
            .append('text')
            .style("opacity", 0)
            .attr("text-anchor", "left")
            .attr("alignment-baseline", "middle")

        svg
            .append('rect')
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

        var bisect = d3.bisector(function(d) { return d.date; }).left;

        function mouseover(event) {
            focus.style("opacity", 1)
            indicator.style("opacity",1)
        }

        function mousemove(event) {
        // recover coordinate we need
            var x_val = event.x - 8;
            var x0 = x.invert(x_val - margin.left);

            focus
                .attr("cx", x_val - margin.left)
                .attr("cy", y(1))
            ruler
                .transition()
                .duration(0)
                .attr("x1", x_val - margin.left)
                .attr("x2", x_val - margin.left)

            stocks.forEach(function (stock) {
                var id = bisect(data_stock[stock], x0);
                selectedData = data_stock[stock][id];
                plots[stock]
                    .transition()
                    .duration(0)
                    .attr("d", d3.line()
                        .x(function(d) { return x(d.date) })
                        .y(function(d) { return y(d[f] / selectedData[f]) })
                    )
            })
            // plot
            //     .transition()
            //     .duration(100)
            //     .attr("d", d3.line()
            //         .x(function(d) { return x(d.date) })
            //         .y(function(d) { return y(d[f] / selectedData[f]) }))
        }

        function mouseout(event) {
            focus.style("opacity", 0)
            indicator.style("opacity", 0)
        }

  })



  //document.write