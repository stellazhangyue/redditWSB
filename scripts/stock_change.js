// set the dimensions and margins of the graph
const margin = {top: 100, right: 100, bottom: 30, left: 60},
    width = 670 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;


// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


//var url = "https://raw.githubusercontent.com/stellazhangyue/redditWSB/main/data/tmp/indices.csv"
var url = "https://raw.githubusercontent.com/stellazhangyue/redditWSB/main/data/clean/stock/top_10_stocks.csv";
d3.csv(url, function(d){
    return { 
        symbol: d.Symbol,
        date: d3.timeParse("%Y-%m-%d")(d.Date), 
        close : d.Close,
        volume : d.Volume
    }
  }).then(
    function(data) {
        var f = "close";
        // split data according to stocks
        var stocks = [...new Set(data.map(item => item.symbol))];
        var selected_stocks = new Set(data.map(item => item.symbol));
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

        // construct x axis
        const x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return d.date; }))
            .range([ 0, width ]);
        var xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // construct volume axis
        const scales_v = []
        stocks.forEach(function(stock) {
            scale = d3.max(data_stock[stock], function(d) { return +d.volume; }) 
                    / d3.min(data_stock[stock], function(d) { return +d.volume; });
            scales_v.push(scale);
        }) 
        const v = d3.scaleLog()
            .domain([1 / d3.max(scales_v), d3.max(scales_v)])
            .range([ height, 0 ])
        
        // construct price axis
        const scales_c = []
        stocks.forEach(function(stock) {
            scale = d3.max(data_stock[stock], function(d) { return +d.close; }) 
                    / d3.min(data_stock[stock], function(d) { return +d.close; });
            scales_c.push(scale);
        })
        const c = d3.scaleLog()
            .domain([1 / d3.max(scales_c), d3.max(scales_c)])
            .range([ height, 0 ])

        const variable_map = {
            "close": c,
            "volume": v
        }

        var yAxis = svg.append("g")
            .call(d3.axisLeft(variable_map[f]).ticks(4).tickFormat(function(d){ return d3.format(".2f")(d) }));

        // gridlines in y axis function
        function make_y_gridlines(sc) { 
            return d3.axisLeft(variable_map[f])
                .ticks(5)
        }

        // add the Y gridlines
        var grid = svg.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.1)
            .call(make_y_gridlines(variable_map[f])
                .tickSize(-width)
                .tickFormat("")
            )

        // // var brush = d3.brushX()
        // //     .extent( [ [0,0], [width,height] ] )
        // //     .on("end", zoom);

        // var idleTimeout
        // function idled() { idleTimeout = null; }

        // function zoom() {
        //     extent = d3.event.selection
        //     if(!extent){
        //         if (!idleTimeout) return idleTimeout = setTimeout(idled, 350);
        //         x.domain([ 4,8])
        //     } else{
        //         x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
        //         //line.select(".brush").call(brush.move, null)
        //     }

        // // Update axis and line position
        //     xAxis.transition().duration(1000).call(d3.axisBottom(x))
        // // line
        // //     .select('.line')
        // //     .transition()
        // //     .duration(1000)
        // //     .attr("d", d3.line()
        // //         .x(function(d) { return x(d.date) })
        // //         .y(function(d) { return y(d.value) })
        // //     )
        // }

        // If user double click, reinitialize the chart
        // svg.on("dblclick",function(){
        //     y.domain(d3.extent(data, function(d) { return d.date; }))
        //     xAxis.transition().call(d3.axisBottom(x))
        //     line
        //         .select('.line')
        //         .transition()
        //         .attr("d", d3.line()
        //         .x(function(d) { return x(d.date) })
        //         .y(function(d) { return y(d.value) })
        //     )
        // });


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
                    .y(function(d) { return variable_map[f](d[f] / data[0][f]) })
                )
                // .append("g")
                // .attr("class", "brush")
                // .call(brush);
            plots[stock] = plot
        });

        // legends
        var legends = {};
        var size = 8;
        var counter = 0;
        stocks.forEach(function(stock) {
            var sample = svg
                .append("rect")
                .attr("x", 10 + (counter % 5) * 6 * size)
                .attr("y", - parseInt(height / 20) - parseInt(counter / 5) * 1.5 * size)
                .attr("width", size)
                .attr("height", size)
                .attr("id", stock)
                .style("fill", color_map[stock])
                .on("click", clickFilter);
            var legendLabel = svg
                .append("g")
                .append("text")
                .style("opacity", 1)
                .style("font", "10px times")
                .attr("id", stock)
                .attr("text-anchor", "left")
                .attr("alignment-baseline", "middle")
                .attr("x", 25 + (counter % 5) * 6 * size)
                .attr("y", - parseInt(height / 30) +1 - parseInt(counter / 5) * 1.5 * size)
                .html(stock)
                .on("click", clickFilter);
            legends[stock] = {
                'sample': sample,
                'label': legendLabel
            }
            counter ++;
        })

        // // filter
        // var filters = {};
        // var size = 5;
        // counter = 0;

        // var stockSel = svg
        //     .append("g")
        //     .append("text")
        //     .style("opacity", 1)
        //     .style("font", "11px times")
        //     .attr("text-anchor", "left")
        //     .attr("alignment-baseline", "middle")
        //     .attr("x", width + margin.left - 45)
        //     .attr("y", height / 3 - 15)
        //     .html("Stock Selection");

        // stocks.forEach(function(stock) {
        //     var sample = svg
        //         .append("g")
        //         .append("circle")
        //         .attr("cx", width + margin.left - 25)
        //         .attr("cy", height / 3 + counter * 15)
        //         .style("fill", "#2378ae")
        //         .attr("stroke", "black")
        //         .attr('r', size)
        //         .attr("id", stock)
        //         .on("click", clickFilter);
            
        //     var filterLabel = svg
        //         .append("g")
        //         .append("text")
        //         .style("opacity", 1)
        //         .style("font", "10px times")
        //         .attr("text-anchor", "left")
        //         .attr("alignment-baseline", "middle")
        //         .attr("x", width + margin.left - 15)
        //         .attr("y", height / 3 + counter * 15)
        //         .html(stock);

        //     filters[stock] = {
        //         'sample': sample,
        //         'label': filterLabel
        //     }
        //     counter ++;
        // })

        function clickFilter() {
            var clickStock = this.id;
            if ( selected_stocks.has(clickStock) ) {
                selected_stocks.delete(clickStock);
                // filters[clickStock].sample
                //     .transition()
                //     .style("fill", "gray");
                legends[clickStock].sample
                    .transition()
                    .style("opacity", 0.1);
                legends[clickStock].label
                    .transition()
                    .style("opacity", 0.1);
            } else {
                selected_stocks.add(clickStock);
                // filters[clickStock].sample
                //     .transition()
                //     .style("fill", "#2378ae");
                legends[clickStock].sample
                    .transition()
                    .style("opacity", 1);
                legends[clickStock].label
                    .transition()
                    .style("opacity", 1);
            }
            replotPath(x(0) + margin.left);
        }



        var title = svg
            .append('g')
            .append('text')
            .style("opacity", 1)
            .style("font", "20px times")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("x", parseInt(width/2))
            .attr("y", - parseInt(margin.top/2))
            .html("Stock Price Related to Highlighted Date");

        var xlabel = svg
            .append('g')
            .append('text')
            .style("opacity", 1)
            .style("font", "8px times")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("x", -20)
            .attr("y", -10)
            .html("\u2191 change(x)");

        var ylabel = svg
            .append('g')
            .append('text')
            .style("opacity", 1)
            .style("font", "8px times")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("x", width + 10)
            .attr("y", height + 10)
            .html("\u2192 date");

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
            .attr("y2", height - margin.bottom)
            .style("stroke-width", 1)
            .style("stroke", "black")
            .style("stroke-dasharray", "5,5")
            .style("fill", "none")

        var indicator = svg
            .append('g')
            .append('text')
            .style("opacity", 0)
            .style("font", "10px times")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("y", height - 0.5 * margin.bottom)

        var canvas = svg
            .append('rect')
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove);
            //.on('mouseout', mouseout);

        // variable selection
        // var stockSel = svg
        //     .append("g")
        //     .append("text")
        //     .style("opacity", 1)
        //     .style("font", "11px times")
        //     .attr("text-anchor", "left")
        //     .attr("alignment-baseline", "middle")
        //     .attr("x", width + margin.left - 50)
        //     .attr("y", 0)
        //     .html("Variable Selection");

        var volTab = svg.append("rect")
            .style("fill", "None")
            .style("pointer-events", "all")
            .attr('stroke', '#2378ae')
            .attr('stroke-dasharray', '5,5')
            .attr('stroke-linecap', 'butt')
            .attr('stroke-width', '1')
            .attr("width", parseInt(height / 6))
            .attr("height", parseInt(height / 15))
            .attr("x", parseInt(width * 3 / 4)  - 30 - parseInt(height / 6))
            .attr("y", -25);

        var priTab = svg.append("rect")
            .style("fill", "#2378ae")
            .style("pointer-events", "all")
            .attr('stroke', '#2378ae')
            .attr('stroke-dasharray', '5,5')
            .attr('stroke-linecap', 'butt')
            .attr('stroke-width', '1')
            .attr("width", parseInt(height / 6))
            .attr("height", parseInt(height / 15))
            .attr("x", parseInt(width * 3 / 4)  - 30)
            .attr("y", - 25);

        var volTerm = svg
            .append("g")
            .append("text")
            .style("opacity", 1)
            .style("font", "10px times")
            .attr("text-anchor", "left")
            .attr("alignment-baseline", "middle")
            .attr("y", parseInt(height / 30) - 25)
            .attr("x", parseInt(width * 3 / 4)  - 30 - parseInt(height * 2 / 15))
            .html("volume")
            .on('click', clickVol);

        var priTerm = svg
            .append("g")
            .append("text")
            .style("opacity", 1)
            .style("font", "10px times")
            .attr("text-anchor", "left")
            .attr("alignment-baseline", "middle")
            .attr("x", parseInt(width * 3 / 4)  - 30 + parseInt(height / 30) + 3)
            .attr("y", parseInt(height / 30) - 25)
            .html("price")
            .on('click', clickPri);


        function clickVol() {
            console.log('cv');
            priTab
                .transition()
                .style("fill", "None")
            volTab
                .transition()
                .style("fill", "#2378ae")
            f = "volume";
            yAxis
                .transition()
                .call(d3.axisLeft(v).ticks(4).tickFormat(function(d){ return d3.format(".2f")(d) }));
            grid
                .transition()
                .call(make_y_gridlines(variable_map[f])
                    .tickSize(-width)
                    .tickFormat("")
                )
            replotPath(x(0) + margin.left);
        }

        function clickPri() {
            console.log('cp');
            priTab
                .transition()
                .style("fill", "#2378ae")
            volTab
                .transition()
                .style("fill", "None")
            f = "close";
            yAxis
                .transition()
                .call(d3.axisLeft(c).ticks(4).tickFormat(function(d){ return d3.format(".2f")(d) }));
            grid
                .transition()
                .call(make_y_gridlines(variable_map[f])
                    .tickSize(-width)
                    .tickFormat("")
                )
            replotPath(x(0) + margin.left);
        }

        function replotPath(x_val) {
            var x0 = x.invert(x_val - margin.left);

            stocks.forEach(function (stock) {
                var id = bisect(data_stock[stock], x0);
                selectedData = data_stock[stock][id];

                if ( selected_stocks.has(stock) ) {
                    plots[stock]
                    .transition()
                    .duration(0)
                    .attr("d", d3.line()
                        .x(function(d) { return x(d.date) })
                        .y(function(d) { return variable_map[f](d[f] / selectedData[f]) })
                    )
                    .style("opacity", 1);
                } else {
                    plots[stock]
                    .transition()
                    .duration(0)
                    .attr("d", d3.line()
                        .x(function(d) { return x(d.date) })
                        .y(function(d) { return variable_map[f](d[f] / selectedData[f]) })
                    )
                    .style("opacity", 0);
                }
            })

            focus
                .attr("cx", x_val - margin.left)
                .attr("cy", c(1));

            ruler
                .transition()
                .duration(0)
                .attr("x1", x_val - margin.left)
                .attr("x2", x_val - margin.left);
            indicator
                .html(x0.toString().split(' ').slice(0, 3).join(' '))
                .attr("x", x_val - margin.left);
        }
            

        var bisect = d3.bisector(function(d) { return d.date; }).left;

        function mouseover(event) {
            focus.style("opacity", 1)
            indicator.style("opacity",1)
        }

        function mousemove(event) {
        // recover coordinate we need
            var x_val = event.x - 8;
            // var x0 = x.invert(x_val - margin.left);

            // focus
            //     .attr("cx", x_val - margin.left)
            //     .attr("cy", c(1))
            // ruler
            //     .transition()
            //     .duration(0)
            //     .attr("x1", x_val - margin.left)
            //     .attr("x2", x_val - margin.left)
            // indicator
            //     .html(x0.toString().split(' ').slice(0, 3).join(' '))
            //     .attr("x", x_val - margin.left)

            replotPath(x_val);


        }

        function mouseout(event) {
            focus.style("opacity", 0)
            indicator.style("opacity", 0)
        }

  })
