$(document).ready(function() {
  var db,
    data,
    dataMap;

  function loadData() {
    experimentalCatchments = db.exec("SELECT * FROM experimentalCatchments")
    if (experimentalCatchments.length <= 0) {
      return;
    }
    data = []
    dataMap = {}
    for(i = 0; i < experimentalCatchments[0].values.length; ++ i) {
      obj = {}
      for(j = 0; j < experimentalCatchments[0].columns.length; ++ j) {
        obj[experimentalCatchments[0].columns[j]] = experimentalCatchments[0].values[i][j];
      }
      data.push(obj);
      if (!dataMap[obj.treatment_class]) {
        dataMap[obj.treatment_class] = {
          change_annual_streamflow_mm: {
            Decrease: 0 + (obj.change_annual_streamflow_mm < 0),
            Neutral: 0 + (obj.change_annual_streamflow_mm == 0),
            Increase: 0 + (obj.change_annual_streamflow_mm > 0),
          }
        };
      } else {
        if (obj.change_annual_streamflow_mm < 0) {
          dataMap[obj.treatment_class].change_annual_streamflow_mm.Decrease ++;
        } else if (obj.change_annual_streamflow_mm == 0) {
          dataMap[obj.treatment_class].change_annual_streamflow_mm.Neutral ++;
        } else if (obj.change_annual_streamflow_mm > 0) {
          dataMap[obj.treatment_class].change_annual_streamflow_mm.Increase ++;
        }
      }
    }
  }

  $(".treatment").change(function() {
    plot($(".treatment").val(), $(".outcome").val());
  })
  $(".outcome").change(function() {
    plot($(".treatment").val(), $(".outcome").val());
  })

  function plot(treatment, outcome) {
    if (treatment == 0 || outcome == 0) {
      return;
    }
    treatmentClasses = Object.keys(dataMap);
    $("svg").remove();
    var width = 960;
    var height = 500;
    // Define the div for the tooltip
    var tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
    var svg = d3
        .select(".wrapper")
        .append("svg")
          .attr("width", width)
          .attr("height", height),
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var x0 = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1);
    var x1 = d3.scaleBand()
        .padding(0.05);
    var y = d3.scaleLinear()
        .rangeRound([height, 0]);
    var z = d3.scaleOrdinal()
        .range(['#ef4836', 'grey', '#1e90ff']);
       // .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    var keys = ['Decrease', 'Neutral', 'Increase'];

    x0.domain(treatmentClasses);
    x1.domain(keys).rangeRound([0, x0.bandwidth()]);
    y.domain([0, 18]);

    g.append("g")
      .selectAll("g")
      .data(treatmentClasses)
      .enter().append("g")
        .attr("transform", function(d) { return "translate(" + x0(d) + ",0)"; })
      .selectAll("rect")
      .data(function(treatmentClass) { return keys.map(function(key) { return {key: key, value: dataMap[treatmentClass]['change_annual_streamflow_mm'][key]}; }); })
      .enter().append("rect")
        .attr("x", function(d) { return x1(d.key); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x1.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .attr("fill", function(d) { return z(d.key); })
        .on("mouseover", function(d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", 1);
          var htm = "Treatment: Deforestation" + "<br>"
            + "Type: " + d.key
            + "<br>" + "Size: " + 14;
          tooltip.html(htm)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mousemove", function(d) {
          tooltip.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });

    g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x0));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
      .attr("x", 2)
      .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text("Number of experiments");

    var legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice().reverse())
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; });
  }
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'data/catchmentExperiments', true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function(e) {
    var uInt8Array = new Uint8Array(this.response);
    db = new SQL.Database(uInt8Array);
    loadData();
    // contents is now [{columns:['col1','col2',...], values:[[first row], [second row], ...]}]
  };
  xhr.send();
});

document.addEventListener("DOMContentLoaded", function() {
  // Get all "navbar-burger" elements
  var $navbarBurgers = Array.prototype.slice.call(
    document.querySelectorAll(".navbar-burger"),
    0
  );

  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {
    // Add a click event on each of them
    $navbarBurgers.forEach(function($el) {
      $el.addEventListener("click", function() {
        // Get the target from the "data-target" attribute
        var target = $el.dataset.target;
        var $target = document.getElementById(target);

        // Toggle the class on both the "navbar-burger" and the "navbar-menu"
        $el.classList.toggle("is-active");
        $target.classList.toggle("is-active");
      });
    });
  }
});
