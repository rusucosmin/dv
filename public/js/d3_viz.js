$(document).ready(function() {
  var db,
    data,
    dataMap,
    treatmentClasses;

  var currentView;

  var outcomeClasses = [];

  var sigChangeNames = {
    change_annual_streamflow_mm: 'sig_change_annual_streamflow',
    change_low_flow: 'sig_change_low_flow',
    change_peak_flow: 'sig_change_peak_flow',
    change_groundwater_recharge: 'sig_change_groundwater_rechrg',
  }

  var swarmPlotAreaId = "#swarmplot-area";

  // Define the div for the tooltip
  // var tooltip = d3.select("body").append("div")
  //   .attr("class", "tooltip")
  //   .style("opacity", 0);
  var tooltip = d3.select("#details-area");

  function loadData() {
    experimentalCatchments = db.exec("SELECT * FROM experimentalCatchments")
    if (experimentalCatchments.length <= 0) {
      return;
    }
    data = [];
    dataMap = {};

    var treatmentClassesSet = new Set(),
        outcomeClassesSet = new Set();
    for(j = 0; j < experimentalCatchments[0].columns.length; ++ j) {
      if (experimentalCatchments[0].columns[j].startsWith("change_")) {
        var outcome = experimentalCatchments[0].columns[j];
        if (!outcomeClassesSet.has(outcome)) {
          outcomeClassesSet.add(outcome);
        }
      }
    }
    outcomeClasses = [...outcomeClassesSet];
    function customizer(objValue, srcValue) {
      if (_.isNumber(objValue) && _.isNumber(srcValue)) {
        return objValue + srcValue;
      }
    }
    for(i = 0; i < experimentalCatchments[0].values.length; ++ i) {
      obj = {}
      for(j = 0; j < experimentalCatchments[0].columns.length; ++ j) {
        obj[experimentalCatchments[0].columns[j]] = experimentalCatchments[0].values[i][j];
      }
      if (!treatmentClassesSet.has(obj.treatment_class)) {
        treatmentClassesSet.add(obj.treatment_class);
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
          if(obj[sigChangeNames[outcome]]) {
            dataMap[obj.treatment_class][outcome].SigDecrease ++;
          }
        } else if (obj[outcome] == 0) {
          dataMap[obj.treatment_class][outcome].Neutral ++;
          if(obj[sigChangeNames[outcome]]) {
            dataMap[obj.treatment_class][outcome].SigNeutral ++;
          }
        } else if (obj[outcome] > 0) {
          dataMap[obj.treatment_class][outcome].Increase ++;
          if(obj[sigChangeNames[outcome]]) {
            dataMap[obj.treatment_class][outcome].SigIncrease ++;
          }
        }
      });
    }
    console.log(data)
    /*
    treatmentClasses = [...treatmentClassesSet]

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
    });
    $(".outcome").val("0");
    $(".is-loading").removeClass("is-loading");
    $(".lds-dual-ring").remove();
    $(".controls [disabled]").removeAttr("disabled");
  }

  $(".outcome").change(function() {
    // plot(/*$(".treatment").val(),*/ $(".outcome").val());
    plotSwarmPlot(/*$(".treatment").val(),*/ $(".outcome").val());
  })

  // function plot(/*treatment, */outcome) {
  //   if (/*treatment == 0 || */outcome == 0) {
  //     return;
  //   }
  //   $("svg").remove();

  //   var width = 960;
  //   var height = 500;
  //   var svg = d3
  //       .select("#viz_area")
  //       .append("svg")
  //         .attr("width", width)
  //         .attr("height", height),
  //   margin = {top: 20, right: 20, bottom: 30, left: 40},
  //   width = +svg.attr("width") - margin.left - margin.right,
  //   height = +svg.attr("height") - margin.top - margin.bottom,
  //   g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  //   var x0 = d3.scaleBand()
  //       .rangeRound([0, width])
  //       .paddingInner(0.1);
  //   var x1 = d3.scaleBand()
  //       .padding(0.05);
  //   var y = d3.scaleLinear()
  //       .rangeRound([height, 0]);
  //   var z = d3.scaleOrdinal()
  //       .range(['#ef4836', 'grey', '#1e90ff']);
  //      // .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
  //   var keys = ['Decrease', 'Neutral', 'Increase'];

  //   x0.domain(treatmentClasses);
  //   x1.domain(keys).rangeRound([0, x0.bandwidth()]);
  //   y.domain([0, d3.max(treatmentClasses, function(treatmentClass) {
  //     return d3.max(outcomeClasses, function(outcome) {
  //       return d3.max(keys, function(key) {
  //         return dataMap[treatmentClass][outcome][key] + 2;
  //       });
  //     });
  //   })]);

  //   g.append("g")
  //     .selectAll("g")
  //     .data(treatmentClasses)
  //     .enter().append("g")
  //       .attr("transform", function(d) { return "translate(" + x0(d) + ",0)"; })
  //     .selectAll("rect")
  //     .data(function(treatmentClass) {
  //       return keys.map(function(key) {
  //         return {
  //           key: key,
  //           value: dataMap[treatmentClass][outcome][key],
  //           significance: dataMap[treatmentClass][outcome][key + " (Significance)"],
  //           treatmentClass: treatmentClass,
  //         };
  //       });
  //     })
  //     .enter()
  //     .append("rect")
  //       .attr("x", function(d) { return x1(d.key); })
  //       .attr("y", function(d) { return y(d.value); })
  //       .attr("width", x1.bandwidth())
  //       .attr("height", function(d) { return height - y(d.value); })
  //       .attr("fill", function(d) { return z(d.key); })
  //       .attr("opacity", 0.5)
  //       .on("mouseover", function(d) {
  //         tooltip.transition()
  //           .duration(200)
  //           .style("opacity", 1);
  //         var htm = "<b>Treatment:</b> " + d.treatmentClass + "<br>"
  //           + "<b>Type:</b> " + d.key + "<br>"
  //           + "<b>Size:</b> " + d.value + "<br>"
  //           + "<b>Significance:</b> " + d.significance;
  //        tooltip.html(htm)
  //          .style("left", (d3.event.pageX) + "px")
  //          .style("top", (d3.event.pageY - 28) + "px");
  //      })
  //      .on("mousemove", function(d) {
  //        tooltip.style("left", (d3.event.pageX) + "px")
  //          .style("top", (d3.event.pageY - 28) + "px");
  //      })
  //       .on("mouseout", function(d) {
  //         tooltip.transition()
  //           .duration(500)
  //           .style("opacity", 0);
  //       });

  //   g.append("g")
  //     .selectAll("g")
  //     .data(treatmentClasses)
  //     .enter().append("g")
  //       .attr("transform", function(d) { return "translate(" + x0(d) + ",0)"; })
  //     .selectAll("rect")
  //     .data(function(treatmentClass) {
  //       return keys.map(function(key) {
  //         return {
  //           key: key,
  //           value: dataMap[treatmentClass][outcome][key],
  //           significance: dataMap[treatmentClass][outcome][key + " (Significance)"],
  //           treatmentClass: treatmentClass,
  //         };
  //       });
  //     })
  //     .enter()
  //     .append("rect")
  //       .attr("x", function(d) { return x1(d.key); })
  //       .attr("y", function(d) { return y(d.significance); })
  //       .attr("width", x1.bandwidth())
  //       .attr("height", function(d) { return height - y(d.significance); })
  //       .attr("fill", function(d) { return z(d.key); })
  //       .attr("opacity", 1)
  //       .on("mouseover", function(d) {
  //         tooltip.transition()
  //           .duration(200)
  //           .style("opacity", 1);
  //         var htm = "<b>Treatment:</b> " + d.treatmentClass + "<br>"
  //           + "<b>Type:</b> " + d.key + "<br>"
  //           + "<b>Size:</b> " + d.value + "<br>"
  //           + "<b>Significance:</b> " + d.significance;
  //         tooltip.html(htm)
  //           .style("left", (d3.event.pageX) + "px")
  //           .style("top", (d3.event.pageY - 28) + "px");
  //       })
  //       .on("mousemove", function(d) {
  //         tooltip.style("left", (d3.event.pageX) + "px")
  //           .style("top", (d3.event.pageY - 28) + "px");
  //       })
  //       .on("mouseout", function(d) {
  //         tooltip.transition()
  //           .duration(500)
  //           .style("opacity", 0);
  //       });

  //   g.append("g")
  //     .attr("class", "axis")
  //     .attr("transform", "translate(0," + height + ")")
  //     .call(d3.axisBottom(x0))
  //     .append("text")
  //       .attr("x", width / 2)
  //       .attr("y", y(y.ticks().pop()) + 0.5)
  //       .attr("dy", "0.32em")
  //       .attr("fill", "#000")
  //       .attr("font-weight", "bold")
  //       .attr("text-anchor", "middle")
  //       .text("Treatment type");

  //   g.append("g")
  //     .attr("class", "axis")
  //     .call(d3.axisLeft(y).ticks(null, "s"))
  //     .append("text")
  //       .attr("x", 2)
  //       .attr("y", y(y.ticks().pop()) + 0.5)
  //       .attr("dy", "0.32em")
  //       .attr("fill", "#000")
  //       .attr("font-weight", "bold")
  //       .attr("text-anchor", "start")
  //       .text("Number of experiments");

  //   var legend = g.append("g")
  //     .attr("font-family", "sans-serif")
  //     .attr("font-size", 10)
  //     .attr("text-anchor", "end")
  //     .selectAll("g")
  //     .data(keys.reverse())
  //     .enter().append("g")
  //       .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  //   legend.append("rect")
  //     .attr("x", width - 19)
  //     .attr("width", 19)
  //     .attr("height", 19)
  //     .attr("fill", z);

  //   legend.append("text")
  //     .attr("x", width - 24)
  //     .attr("y", 9.5)
  //     .attr("dy", "0.32em")
  //     .text(function(d) { return d; });
  // }

  function highlightByValue(cutVarValue) {
    d3.selectAll('circle:not([data-cut-value="' + cutVarValue+ '"])').classed('dimmed', true).transition()
      .duration(300)
      .attr('opacity', 0.1);
  }

  function cancelHighlight() {
    d3.selectAll('.dimmed').classed('dimmed', false).transition()
      .duration(500)
      .attr('opacity', 1);
  }

  function plotSwarmPlot(outcome) {
    currentView = outcome;
    $(".outcome").val(outcome);
    $(swarmPlotAreaId).empty();
    var radius = 12,
        strokeWidth = 2;

    var margin = {top: radius * 2.5 + 10, left: 90, bottom: radius, right: 30},
      width = $(swarmPlotAreaId).width() - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      svg = d3.select(swarmPlotAreaId)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

    var outcomeData = data.filter((x) => x[outcome]);
    var x = d3.scaleLinear()
        .range([2.5 * radius + 20, width - 2.5 * radius - 20])
        .domain([d3.min(outcomeData, function(d) {
          return d[outcome];
        }), d3.max(outcomeData, function(d) {
          return d[outcome];
        })]);

    var y = d3.scaleBand()
        .rangeRound([0, height]);

    var y_axis_left = d3.axisLeft(y)
        .tickSize(0)

    var y_axis_right = d3.axisRight(y)
        .tickSizeOuter(0)
        .tickSizeInner(-width);

    var x_axis = d3.axisBottom(x)
        .ticks(10);

    var cutVariable = 'site_name';
    var cutValues = [...new Set(outcomeData.map((d) => d[cutVariable]))];

    var scaleIncreaseDecrease = d3.scaleOrdinal()
      .range(['#ef4836', 'grey', '#1e90ff'])
      .domain(['Decrease', 'Neutral', 'Increase']);

    var scaleLinearVals = d3.scaleBand()
      .range([0, 1])
      .domain(cutValues);

    var scaleCategoricalVals = d3.scaleOrdinal()
      .range(d3.range(10))
      .domain(cutValues);

    function getCutColor(cutVarValue) {
      if (cutVariable === 'site_name') {
        return d3.interpolateRainbow(scaleLinearVals(cutVarValue));
      }
    }

    function getTooltipText(d) {
      var text = `<div><b>Treatment:</b> ${d.treatment_class}<br>` +
          `<b>Treatment detail:</b> ${d.treatment_detail}<br>`;

      if (cutVariable === "site_name") {
        text += `<b style="color: ` + getCutColor(d[cutVariable]) + `">Site name:</b> ${d.site_name}<br>`;
      } else {
        text += `<b>Site name:</b> ${d.site_name}<br>`;
      }

      text += `<b>${_.startCase(outcome)}:</b> ${d[outcome]}<br>` +
          `<b>${_.startCase(sigChangeNames[outcome])}:</b> ${d[sigChangeNames[outcome]]}<br>` +
          `<b>Catchment name:</b> ${d.catchment_name}<br>` +
          (d.control_catchment1 ? `<b>Control catchment</b>: ${d.control_catchment1}<br>` : "") +
          `</div>`;
      return text
    }

    // append the tip
    var tip = d3.select(swarmPlotAreaId).append("div")
      .attr("class", "tip");

    var treatmentClasses = Object.keys(dataMap);

    y.domain(treatmentClasses);

    svg.append("g")
      .attr("class", "axis y left")
      .call(y_axis_left)
      .selectAll(".tick text")
        .attr("dx", 0);

    svg.append("g")
      .attr("class", "axis y right")
      .attr("transform", "translate(" + width + ", 0)")
      .call(y_axis_right.tickFormat(function(d){ return outcomeData.filter(function(c){ return c.treatment_class == d }).length; }))
      .selectAll(".tick text")
        .attr("dx", radius);

    svg.append("g")
      .attr("class", "axis x bottom")
      .attr("transform", "translate(0, "+ (height - 3 * margin.bottom) + ")")
      .call(x_axis)
      .append("text")
        .text(_.startCase(outcome))
        .attr("text-anchor", "center")
        .attr("x", width / 2)
        .attr("y", 3 * margin.bottom)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text(_.startCase(outcome));

    var simulation = d3.forceSimulation(outcomeData)
      .force("y", d3.forceY(function(d){ return y(d.treatment_class) + y.bandwidth() / 2; }).strength(1))
      .force("x", d3.forceX(function(d){ return x(d[outcome]); }).strength(1))
      .force("collide", d3.forceCollide(radius + strokeWidth))
      .stop();

    for (var i = 0; i < 200; ++i) simulation.tick();

    // circle
    var circle = svg.selectAll(".circle")
      .data(outcomeData, function(d, i){ return i; });

    function getType(d) {
      if(d[outcome] > 0) {
        return 'Increase';
      }
      else if(d[outcome] < 0) {
        return 'Decrease';
      }
      else {
        return 'Neutral'
      }
    }

    circle.enter().append("circle")
      .attr("class", "circle")
      .attr("data-cut-value", function(d) {
        return d[cutVariable];
      })
      .attr("r", radius)
      .attr("fill", function(d) {
        return getCutColor(d[cutVariable]);
      })
      .attr("stroke", function(d) {
        return getCutColor(d[cutVariable]);
      })
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", strokeWidth)
      .attr("fill-opacity", function(d) {
        if (d[sigChangeNames[outcome]]) {
          return 1
        } else {
          return 0.1
        }
      })
      .attr("stroke-alignment", "inner")
      .merge(circle)
        .attr("cx", function(d) { return d ? d.x : null; })
        .attr("cy", function(d) { return d ? d.y : null; });

    svg.selectAll(".circle")
      .on("mouseover", function(d) {
        if (!$(swarmPlotAreaId).hasClass("non-interactive")) {
          tooltip
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px")
            .html(getTooltipText(d));

          tooltip.transition()
            .duration(200)
            .style("opacity", 1);

          highlightByValue(d[cutVariable]);
        }
      })
      // .on("mousemove", function(d) {
      //   tooltip.style("left", (d3.event.pageX + 50) + "px")
      //     .style("top", (d3.event.pageY - 28) + "px");
      // })
      .on("mouseout", function(d) {
        if (!$(swarmPlotAreaId).hasClass("non-interactive")) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);

          cancelHighlight();
        }
      });
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

  $("#explore-button").click(function() {
    $("#measurement-selector select").focus();
  });

  // Tour.
  function runTour() {
    if (currentView !== "change_annual_streamflow_mm") {
      plotSwarmPlot("change_annual_streamflow_mm");
    } else {
      cancelHighlight();
    }
    $("#measurement-selector select").attr("disabled", "disabled");
    $("#explore-button").attr("disabled", "disabled");
    $("#tour-button").removeClass("is-primary").text("Stop the tour");

    var tourSteps = [];

    $("#tour-button").unbind("click").click(stopTour);

    function stopTour() {
      $(swarmPlotAreaId).removeClass("non-interactive");
      $('.controls [disabled]').removeAttr("disabled");
      $("#details-area").html("");
      $("#tour-button").addClass("is-primary")
        .text("Take a tour")
        .unbind("click")
        .click(runTour);
    }

    function makeTourStep(i) {
      var lastStep = (i >= tourSteps.length - 1);

      $(swarmPlotAreaId).addClass("non-interactive");
      d3.select("#details-area").transition()
        .duration(150)
        .style("opacity", 0)
        .on("end", function() {
          tourSteps[i]();

          d3.select("#details-area").html(
            `<div class="control has-text-right">` +
            `<div class='button' id='tour-next-button'>Next &rarr;</div><br>` +
            `</div>` +
            d3.select("#details-area").html()
          )

          $('#tour-next-button').click(function() {
            if (!lastStep) {
              makeTourStep(i + 1);
            } else {
              stopTour();
            }
          })

          d3.select("#details-area").transition().duration(500).style("opacity", 1);
        });
    }

    function intro() {
      d3.select("#details-area").html(
        `Each circle on the left represents a scientific study, conducted ` +
        `at some point in the past. We are looking at the change in annual` +
        `streamflow, caused by an intervention.`
      );
    }

    function beaverCreek0() {
      d3.select("#details-area").html(
        `Let's take a look at the Beaver Creek watershed in Arizona, USA.` +
        `There have been several experiments applying deforestation to this watershed.`
      );

      highlightByValue("Beaver Creek, Arizona, USA");
    }

    function beaverCreek1() {
      d3.select("#details-area").html(
        `Most of them discovered that deforestation leads to an increase in streamflow. ` +
        `Two of them, however, are <em>not significant</em> (hollow circles). It is important` +
        `to see which experiments are not significant.`
      );
    }

    function beaverCreek2() {
      d3.select("#details-area").html(
        `One can be rather sure that deforestation in similar conditions will lead to` +
        `annual increase in annual flow...`
      );
    }

    function beaverCreek3() {
      cancelHighlight();
      plotSwarmPlot("change_peak_flow");

      d3.select("#details-area").html(
        `Lets take a look at the yearly peak water flow measurements.`
      );
    }

    function beaverCreek4() {
      d3.select("#details-area").html(
        `In all experiments, deforestation increased the maximum flow in Beaver creek, ` +
        `increasing the risk of flooding.`
      );

      highlightByValue("Beaver Creek, Arizona, USA");
    }

    function australia0() {
      plotSwarmPlot("change_annual_streamflow_mm");

      d3.select("#details-area").html(
        `Not all watersheds boast this level of certainty about them.`
      );
    }

    function australia1() {
      d3.select("#details-area").html(
        `All experiments in this one in Southwest Australia detected increase in annual ` +
        `streamflow, but all experiments are not significant. It is not clear without expert ` +
        `help if the results are conclusive.`
      );

      highlightByValue("Southwest Western Australia");
    }

    function outro() {
      cancelHighlight()

      d3.select("#details-area").html(
        `Explore the data on your own!`
      );
    }

    tourSteps = [
      intro,
      beaverCreek0,
      beaverCreek1,
      beaverCreek2,
      beaverCreek3,
      beaverCreek4,
      australia0,
      australia1,
      outro
    ]

    makeTourStep(0);
  }

  $("#tour-button").click(runTour);
});
