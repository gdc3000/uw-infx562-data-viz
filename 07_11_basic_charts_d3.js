// Scatterplot
var width = 800, height = 400, pad=50, percent_of_data=0.1;

var svg = d3.select("#scatterplot").append("svg").attr("width", width).attr("height", height).attr("class", "chart");

var xScale = d3.scaleLinear().domain([0.2, 5]).range([pad, width-pad]),
    yScale = d3.scaleLinear().domain([0.2, 3]).range([height-pad, pad]);

var xAxis = d3.axisBottom(xScale),
    yAxis = d3.axisLeft(yScale);

svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0, "+(height-pad)+")")
    .call(xAxis);

svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate("+pad+", 0)")
    .call(yAxis);

var all_data = [];

$("body").ready(function() {
    d3.csv('data/ampfactors.csv', function(d) {
        return {
            primer_species : d.primer_species,
            well_dir : d.well_dir,
            ds_rate : d.ds_rate,
            tcrb_amp_factor : +d.tcrb_amp_factor,
            tcrg_amp_factor: +d.tcrg_amp_factor
        };
    }, function(row) {
        if (Math.random() < percent_of_data) {
            all_data.push(row);
        }
    }).then(function() {
        var tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .text("a simple tooltip");

        var tipMouseover = function (d) {
            var html = d.well_dir + "<br/>" +
                d.primer_species;

            tooltip.html(html)
                .style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .transition()
                .duration(200) // ms
                .style("opacity", .9) // started as 0!
        };
        var tipMouseout = function (d) {
            tooltip.transition()
                .duration(300) // ms
                .style("opacity", 0); // don't care about position!
        };

        svg.append('g').selectAll("scatter-dots")
            .data(all_data)
            .enter().append("circle")
            .attr("cx", function (d, i) {
                return xScale(d.tcrb_amp_factor);
            })
            .attr("cy", function (d) {
                return yScale(d.tcrg_amp_factor);
            })
            .attr("r", 4)
            .attr("fill", "#5590FF")
            .attr("fill-opacity", 0.2)
            .attr("stroke", "black").attr("stroke-opacity", 0.15)
            .attr("stroke-width", 1)
            .on("mouseover", tipMouseover)
            .on("mouseout", tipMouseout);

    }).then(function(){
        var bar_data = d3.nest().key(function(d){return d.primer_species}).rollup(function(v){
            return {
                tcrb: d3.mean(v, function(d){ return d.tcrb_amp_factor }),
                tcrg: d3.mean(v, function(d){ return d.tcrg_amp_factor })
            };
        }).entries(all_data).map(function(d){
            return {
                family: d.key,
                tcrb: d.value.tcrb,
                tcrg: d.value.tcrg
            }
        });


        var svg = d3.select("#stacked_bar").append("svg").attr("width", width).attr("height", height).attr("class", "chart");

        var xScale = d3.scaleBand().rangeRound([pad, width - pad]).padding(0.1).domain(bar_data.map(function(d) { return(d.family); })),
            yScale = d3.scaleLinear().domain(
                [0, d3.max(bar_data, function(d){ return(d.tcrb + d.tcrg) })]
            ).range([height - pad, pad]);

        var xAxis = d3.axisBottom(xScale),
            yAxis = d3.axisLeft(yScale);

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0, " + (height - pad) + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-90),translate(-5, -13)")
            .style("text-anchor", "end");

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + pad + ", 0)")
            .call(yAxis);

        svg.append('g').selectAll("bars")
            .data(bar_data)
            .enter().append("rect")
            .attr("id", function(d){return d.family + "tcrb";})
            .attr("x", function(d) { return xScale(d.family); })
            .attr("width", xScale.bandwidth())
            .attr("height", function(d) { return height-pad-yScale(d.tcrb); })
            .attr("y", function(d) { return yScale(d.tcrb); })
            .attr("fill", "#5590FF")
            .attr("fill-opacity", 1)
            .attr("stroke", "black").attr("stroke-opacity", 0.15)
            .attr("stroke-width", 1);

        svg.append('g').selectAll("bars")
            .data(bar_data)
            .enter().append("rect")
            .attr("id", function(d){return d.family + "tcrg";})
            .attr("x", function(d) { return xScale(d.family); })
            .attr("width", xScale.bandwidth())
            .attr("y", function(d) { return yScale(d.tcrb+d.tcrg); }) // down from top
            .attr("height", function(d) { return height-pad-yScale(d.tcrg); }) //height pushes down from y
            .attr("fill", "#ffbd20")
            .attr("fill-opacity", 1)
            .attr("stroke", "black").attr("stroke-opacity", 0.15)
            .attr("stroke-width", 1);
    }).then(function(){  // line
        var line_data = d3.nest().key(function(d){return d.ds_rate}).rollup(function(v){
            return {
                tcrb: d3.mean(v, function(d){ return d.tcrb_amp_factor }),
                tcrg: d3.mean(v, function(d){ return d.tcrg_amp_factor })
            };
        }).entries(all_data).map(function(d){
            return {
                ds_rate: parseInt(d.key),
                tcrb: d.value.tcrb,
                tcrg: d.value.tcrg
            }
        }).sort(function(x,y) { return x.ds_rate > y.ds_rate });


        var svg = d3.select("#line").append("svg").attr("width", width).attr("height", height).attr("class", "chart");

        var xScale = d3.scaleLinear().domain([0, 102]).range([pad, width-pad]),
            yScale = d3.scaleLinear().domain(
                [d3.min(line_data, function(d){ return(d.tcrb) })-0.05, d3.max(line_data, function(d){ return(d.tcrb) })+0.05]
            ).range([height - pad, pad]);

        var xAxis = d3.axisBottom(xScale),
            yAxis = d3.axisLeft(yScale);

        var line = d3.line().x(function(d) { return xScale((d.ds_rate)); }).y(function(d){ return yScale(d.tcrb); });

        svg.append("path")
            .data([line_data])
            .attr("stroke", "steelblue")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 2)
            .attr("fill", 'none')
            .attr("d", line);

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0, " + (height - pad) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + pad + ", 0)")
            .call(yAxis);
    });
});