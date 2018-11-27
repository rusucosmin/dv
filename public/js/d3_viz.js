$(document).ready(function() {
  var db,
    data,
    dataMap,
    treatmentClasses;

  function loadData() {
    experimentalCatchments = db.exec("SELECT * FROM experimentalCatchments")
    if (experimentalCatchments.length <= 0) {
      return;
    }
    data = [];
    dataMap = {};
    treatmentClasses = {};
    outcomeClasses = {};
    for(j = 0; j < experimentalCatchments[0].columns.length; ++ j) {
      if (experimentalCatchments[0].columns[j].startsWith("change_")) {
        var outcome = experimentalCatchments[0].columns[j];
        if (!outcomeClasses[outcome]) {
          outcomeClasses[outcome] = true;
        }
      }
    }
    outcomeClasses = _.keys(outcomeClasses);
    function customizer(objValue, srcValue) {
      if (_.isNumber(objValue) && _.isNumber(srcValue)) {
        return objValue + srcValue;
      }
    }
    sigChanges = {
      change_annual_streamflow_mm: 'sig_change_annual_streamflow',
      change_low_flow: 'sig_change_low_flow',
      change_peak_flow: 'sig_change_peak_flow',
      change_groundwater_recharge: 'sig_change_groundwater_rechrg',
    }
    for(i = 0; i < experimentalCatchments[0].values.length; ++ i) {
      obj = {}
      for(j = 0; j < experimentalCatchments[0].columns.length; ++ j) {
        obj[experimentalCatchments[0].columns[j]] = experimentalCatchments[0].values[i][j];
      }
      if (!treatmentClasses[obj.treatment_class]) {
        treatmentClasses[obj.treatment_class] = true;
      }
      data.push(obj);
      if (!dataMap[obj.treatment_class]) {
        dataMap[obj.treatment_class] = {}
      }
      outcomeClasses.forEach(function(outcome) {
        if (!dataMap[obj.treatment_class][outcome]) {
          dataMap[obj.treatment_class][outcome] = {
            Decrease: 0,
            Neutral: 0,
            Increase: 0,
            SigDecrease: 0,
            SigNeutral: 0,
            SigIncrease: 0,
          }
        } 
        if (obj[outcome] < 0) {
          dataMap[obj.treatment_class][outcome].Decrease ++;
          if(obj[sigChanges[outcome]]) {
            dataMap[obj.treatment_class][outcome].SigDecrease ++;
          }
        } else if (obj[outcome] == 0) {
          dataMap[obj.treatment_class][outcome].Neutral ++;
          if(obj[sigChanges[outcome]]) {
            dataMap[obj.treatment_class][outcome].SigNeutral ++;
          }
        } else if (obj[outcome] > 0) {
          dataMap[obj.treatment_class][outcome].Increase ++;
          if(obj[sigChanges[outcome]]) {
            dataMap[obj.treatment_class][outcome].SigIncrease ++;
          }
        }
      });
    }
    /*
    treatmentClasses = _.keys(treatmentClasses)
    
    treatmentClasses.forEach(function(treatment) {
      $(".treatment").append(
        $("<option></option>")
          .attr("value", treatment)
          .html(_.startCase(treatment)))
    })
    $(".treatment").parent().removeClass("is-loading");
    */
    outcomeClasses.forEach(function(outcome) {
      $(".outcome").append(
        $("<option></option>")
          .attr("value", outcome)
          .html(_.startCase(outcome)))
    })
    $(".outcome").parent().removeClass("is-loading");
    $(".lds-dual-ring").remove();
  }

  /*
  $(".treatment").change(function() {
    plot($(".treatment").val(), $(".outcome").val());
  })
  */
  $(".outcome").change(function() {
    plot(/*$(".treatment").val(),*/ $(".outcome").val());
  })

  function plot(/*treatment, */outcome) {
    if (/*treatment == 0 || */outcome == 0) {
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
    y.domain([0, d3.max(treatmentClasses, function(treatmentClass) {
      return d3.max(outcomeClasses, function(outcome) {
        return d3.max(keys, function(key) {
          return dataMap[treatmentClass][outcome][key] + 2;
        });
      });
    })]);

    g.append("g")
      .selectAll("g")
      .data(treatmentClasses)
      .enter().append("g")
        .attr("transform", function(d) { return "translate(" + x0(d) + ",0)"; })
      .selectAll("rect")
      .data(function(treatmentClass) {
        return keys.map(function(key) {
          return {
            key: key,
            value: dataMap[treatmentClass][outcome][key],
            significance: dataMap[treatmentClass][outcome]["Sig" + key],
          };
        });
      })
      .enter()
      .append("rect")
        .attr("x", function(d) { return x1(d.key); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x1.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .attr("fill", function(d) { return z(d.key); })
        .attr("opacity", 0.5)
        .on("mouseover", function(d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", 1);
          var htm = "Treatment: Deforestation" + "<br>"
            + "Type: " + d.key + "<br>"
            + "Size: " + d.value + "<br>"
            + "Significance: " + d.significance;
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
      .selectAll("g")
      .data(treatmentClasses)
      .enter().append("g")
        .attr("transform", function(d) { return "translate(" + x0(d) + ",0)"; })
      .selectAll("rect")
      .data(function(treatmentClass) {
        return keys.map(function(key) {
          return {
            key: key,
            value: dataMap[treatmentClass][outcome][key],
            significance: dataMap[treatmentClass][outcome]["Sig" + key],
          };
        });
      })
      .enter()
      .append("rect")
        .attr("x", function(d) { return x1(d.key); })
        .attr("y", function(d) { return y(d.significance); })
        .attr("width", x1.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .attr("fill", function(d) { return z(d.key); })
        .attr("opacity", 1)
        .on("mouseover", function(d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", 1);
          var htm = "Treatment: Deforestation" + "<br>"
            + "Type: " + d.key + "<br>"
            + "Size: " + d.value + "<br>"
            + "Significance: " + d.significance;
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
    .data(keys.reverse())
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
  xhr.open('GET', 'data/catchmentExperiments2', true);
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
