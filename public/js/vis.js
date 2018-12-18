window.appGlobals = {
  plotState: null
};

var db,
  data,
  dataMap,
  treatmentClasses;

var outcomeClasses = [];

var sigChangeNames = {
  change_annual_streamflow_mm: 'sig_change_annual_streamflow',
  change_low_flow: 'sig_change_low_flow',
  change_peak_flow: 'sig_change_peak_flow',
  change_groundwater_recharge: 'sig_change_groundwater_rechrg',
}

function sigChangeNamesTooltip(outcome) {
  if(outcome == 'change_annual_streamflow_mm') {
    return 'significant_change_annual_streamflow'
  } else if(outcome == 'change_low_flow') {
    return 'significant_change_low_flow'
  } else if (outcome == 'change_peak_flow') {
    return 'significant_change_peak_flow';
  } else if(outcome == 'change_groundwater_recharge') {
    return 'significant_change_groundwater_rechrg';
  }
}

var plotAreaId = "#plot-area";

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
  treatmentClasses = Object.keys(dataMap);

  outcomeClasses = outcomeClasses.filter((x) => x != "change_groundwater_recharge");
  outcomeClasses.forEach(function(outcome) {
    $("#treatment-select").append(
      $("<option></option>")
        .attr("value", outcome)
        .html(_.startCase(outcome)))
  });

  $("#treatment-select").val(outcomeClasses[0]);
  $(".is-loading").removeClass("is-loading");
  $(".lds-dual-ring").remove();
  $(".instruction").remove();
  $(".controls :not(.perma-disabled)[disabled]").removeAttr("disabled");
  $("#switch").prop("checked", false);
  redrawPlot();
}

function setPlotState(type, aggregate) {

}

function getNewPlotState() {
  return {
    treatmentClass: $("#treatment-select").val(),
    isAggregate: $("#switch").is(":checked"),
  };
}

function transitionPlot(func, param) {
  d3.select(plotAreaId).transition()
    .duration(200)
    .style("opacity", 0)
    .on("end", function() {
      $(plotAreaId).empty();
      d3.select(plotAreaId).transition()
        .duration(200)
        .style("opacity", 1);
      func(param);
    });
}

function redrawPlot() {
  var newPlotState = getNewPlotState();
  if (newPlotState !== window.appGlobals.plotState) {
    if (newPlotState.isAggregate) {
      transitionPlot(plotBarPlot, newPlotState.treatmentClass);
    } else {
      transitionPlot(plotSwarmPlot, newPlotState.treatmentClass);
    }
  }
}


function plotBarPlot(outcome) {
  if (outcome == 0) {
    return;
  }
  $("#switch").prop("checked", true);

  var width = 750;
  var height = 500;
  var tooltip = d3.select("#details-area");
  var svg = d3
      .select(plotAreaId)
      .attr("width", width)
      .attr("height", height),
  margin = {top: 50, left: 40, bottom: 60, right: 50},
  width = +$(plotAreaId).width() - margin.left - margin.right,
  height = +height - margin.top - margin.bottom,
  g = svg
    .selectAll("g")
    .data([0])
    .enter()
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var x0 = d3.scaleBand()
      .rangeRound([0, width])
      .paddingInner(0.1);
  var x1 = d3.scaleBand()
      .padding(0.05);
  var y = d3.scaleLinear()
      .rangeRound([height, 0]);
  var z = d3.scaleOrdinal()
      .range(['#ef4836', /*'grey',*/ '#1e90ff']);
     // .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
  var keys = ['Decrease', /*'Neutral',*/ 'Increase'];

  x0.domain(treatmentClasses);
  x1.domain(keys).rangeRound([0, x0.bandwidth()]);
  y.domain([0, d3.max(treatmentClasses, function(treatmentClass) {
    return d3.max(outcomeClasses, function(outcome) {
      return d3.max(keys, function(key) {
        return dataMap[treatmentClass][outcome][key] + 2;
      });
    });
  })]);

  var treatmentGroup = g
    .selectAll("g")
    .data([0])
    .enter()
    .append("g")
    .selectAll("g")
    .data(treatmentClasses);

  treatmentGroup
    .enter()
    .append("g")
    .attr("transform", function(d) { return "translate(" + x0(d) + ",0)"; })
    .merge(treatmentGroup)
    .selectAll("rect")
    .data(function(treatmentClass) {
      return keys.map(function(key) {
        return {
          key: key,
          value: dataMap[treatmentClass][outcome][key],
          significance: dataMap[treatmentClass][outcome]["Sig" + key],
          treatmentClass: treatmentClass,
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
        if (!$(plotAreaId).hasClass("non-interactive")) {
          tooltip.transition()
            .duration(200)
            .style("opacity", 1);
          var htm = "<b>Treatment:</b> " + d.treatmentClass + "<br>"
            + "<b>Type:</b> " + d.key + "<br>"
            + "<b>Size:</b> " + d.value + "<br>"
            + "<b>Significance:</b> " + d.significance;
        tooltip.html(htm)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        }
     })
     .on("mousemove", function(d) {
        if (!$(plotAreaId).hasClass("non-interactive")) {
          tooltip.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        }
     })
      .on("mouseout", function(d) {
        if (!$(plotAreaId).hasClass("non-interactive")) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        }
      });

  // Remove previous data.
  treatmentGroup
    .exit()
    .remove();

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
          treatmentClass: treatmentClass,
        };
      });
    })
    .enter()
    .append("rect")
      .attr("x", function(d) { return x1(d.key); })
      .attr("y", function(d) { return y(d.significance); })
      .attr("width", x1.bandwidth())
      .attr("height", function(d) { return height - y(d.significance); })
      .attr("fill", function(d) { return z(d.key); })
      .attr("opacity", 1)
      .on("mouseover", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", 1);
        var htm = "<b>Treatment:</b> " + d.treatmentClass + "<br>"
          + "<b>Type:</b> " + d.key + "<br>"
          + "<b>Size:</b> " + d.value + "<br>"
          + "<b>Significance:</b> " + d.significance;
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
    .call(d3.axisBottom(x0))
    .append("text")
      .attr("x", width / 2)
      .attr("y", y(y.ticks().pop()) + 25)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("Treatment type");

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
    .attr("font-size", ".9em")
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.reverse().flatMap((x) => [x, "Significant " + x]))
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", function(d) {
      if (d.includes("Significant")) {
        return z(d.split(" ")[1]);
      } else {
        return z(d);
      }
    })
    .attr("opacity", function(d) {
      if (d.includes("Significant")) {
        return 1;
      } else {
        return 0.5;
      }
    })
  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(function(d) { return d; });
}

function highlightByValue(cutVarValue) {
  d3.selectAll('circle:not([data-cut-value="' + cutVarValue+ '"])').classed('dimmed', true).transition()
    .duration(300)
    .style('opacity', 0.1);
}

function cancelHighlight() {
  d3.selectAll('.dimmed').classed('dimmed', false).transition()
    .duration(500)
    .style('opacity', 1);
}

function plotSwarmPlot(outcome) {
  $("#treatment-select").val(outcome);

  var radius = 12,
      strokeWidth = 3,
      height = 500;

  var tooltip = d3.select("#details-area");
  var margin = {top: radius * 2.5 + 50, left: 100, bottom: radius, right: 50},
    width = $(plotAreaId).width() - margin.left - margin.right,
    height = height - margin.top - margin.bottom,
    svg = d3.select(plotAreaId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .selectAll("g")
        .data([0])
        .enter()
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
      .tickSizeInner(-width)
      .tickFormat(function(d) {
        return outcomeData.filter(function(c){
          return c.treatment_class == d;
        }).length;
      });

  var x_axis = d3.axisBottom(x)
      .ticks(10);

  var cutVariable = 'site_name';
  var cutValues = [...new Set(outcomeData.map((d) => d[cutVariable]))];

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

  function getCitations(d) {
    var str = "<b>Citations: </b>"
    return str + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        .map(x => d["citation" + x])
        .filter(x => x)
        .join(", ")
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
        `<b>${_.startCase(sigChangeNamesTooltip(outcome))}:</b> ${d[sigChangeNames[outcome]]}<br>` +
        `<b>Catchment name:</b> ${d.catchment_name}<br>` +
        (d.control_catchment1 ? `<b>Control catchment</b>: ${d.control_catchment1}<br>` : "") +
        getCitations(d) +
        `</div>`;
    return text
  }

  // Append the tip
  var tip = d3
    .select(plotAreaId)
    .data([0])
    .enter()
    .append("div")
    .attr("class", "tip");

  y.domain(treatmentClasses);

  d3.select(plotAreaId + " g").append("g")
    .attr("class", "axis y left")
    .call(y_axis_left)
    .selectAll(".tick text")
      .attr("dx", 0);

  d3.select(plotAreaId + " g").append("g")
    .attr("class", "axis y right")
    .attr("transform", "translate(" + width + ", 0)")
    .call(y_axis_right)
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

  //   var t = d3.transition()
  //     .duration(500)
  //   d3.select(".axis.y.left")
  //       .transition(t)
  //       .call(y_axis_left)
  //   d3.select(".axis.y.right")
  //       .transition(t)
  //       .call(y_axis_right)
  //   d3.select(".axis.x.bottom")
  //       .transition(t)
  //       .call(x_axis)

  var simulation = d3.forceSimulation(outcomeData)
    .force("y", d3.forceY(function(d){ return y(d.treatment_class) + y.bandwidth() / 2; }).strength(1))
    .force("x", d3.forceX(function(d){ return x(d[outcome]); }).strength(1))
    .force("collide", d3.forceCollide(radius + strokeWidth))
    .stop();

  for (var i = 0; i < 200; ++i) simulation.tick();

  // Show single circle
  var circle = d3.select(plotAreaId + " g").selectAll("circle")
    .data(outcomeData);

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
    .style("opacity", 0)
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
    .attr("stroke-opacity", function(d) {
      if (d[sigChangeNames[outcome]]) {
        return 1;
      } else {
        return 0.5;
      }
    })
    .attr("stroke-width", strokeWidth)
    .attr("fill-opacity", function(d) {
      if (d[sigChangeNames[outcome]]) {
        return 1;
      } else {
        return 0.1;
      }
    })
    .attr("stroke-alignment", "inner")
    .on("mouseover", function(d) {
      if (!$(plotAreaId).hasClass("non-interactive")) {
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
    .on("mouseout", function(d) {
      if (!$(plotAreaId).hasClass("non-interactive")) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);

        cancelHighlight();
      }
    })
    .merge(circle)
      .attr("cx", function(d) { return d ? d.x : null; })
      .attr("cy", function(d) { return d ? d.y : null; })
    .transition()
      .style("opacity", 1);

  // Remove the old circle.
  circle
    .exit()
    .transition()
      .style("opacity", 0)
    .remove();
}

$(function() {
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

  // Aggregate switch.
  $("#switch").change(redrawPlot);

  // Treatment class switch.
  $("#treatment-select").change(redrawPlot)

  $("#explore-button").click(function() {
    $("#measurement-selector select").focus();
  });

  $("#tour-button").click(runTour);
});
