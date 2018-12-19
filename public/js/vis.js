// Global plot state.
window.appGlobals = {
  plotState: {
    hoverable: null,
    controlsEnabled: null,
    measurementSelectVisible: null,
    aggregateSwitchVisible: null,
    measurement: null,
    highlightVarVal: null,
    aggregate: null,
  },
  parsedData: null,
};

// Constants.
var sigChangeNames = {
  change_annual_streamflow_mm: 'sig_change_annual_streamflow',
  change_low_flow: 'sig_change_low_flow',
  change_peak_flow: 'sig_change_peak_flow',
  change_groundwater_recharge: 'sig_change_groundwater_rechrg',
}

var plotAreaId = "#plot-area";
var aggSwitchId = "#aggregate-switch";
var measurementSelectId = "#measurement-select"
var aggCtrlId = "#aggregate-controls";
var measurementCtrlId = "#measurement-controls"

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

// Shortcuts.
function getState() {
  return window.appGlobals.plotState;
}

function getParsedData() {
  return window.appGlobals.parsedData;
}

// Poor man's React.
function setPlotState(newState) {
  var diff = {};
  for (var key in newState) {
    if (window.appGlobals.plotState.hasOwnProperty(key)) {
      if (newState[key] !== getState()[key]) {
        diff[key] = newState[key];
      }
      window.appGlobals.plotState[key] = newState[key];
    } else {
      console.log('Unknown state key', key);
    }
  }

  console.log("State change:", diff);
  redraw(window.appGlobals.plotState, diff);
};

function _transitionPlot(func, param) {
  d3.select(plotAreaId).transition()
    .duration(150)
    .style("opacity", 0)
    .on("end", function() {
      $(plotAreaId).empty();
      d3.select(plotAreaId).transition()
        .duration(150)
        .style("opacity", 1);
      func(param);
    });
}

function redraw(state, diff) {
  // Change the measurement or plot type (redraw the full plot).
  if (diff.measurement === null) {
    _transitionPlot(clearPlot, null);
  }

  if (diff.aggregate != null || diff.measurement != null) {
    if (state.aggregate) {
      _transitionPlot(plotBarPlot, state.measurement);
    } else {
      _transitionPlot(plotSwarmPlot, state.measurement);
    }
  }

  // Change the "permanent" highlight.
  if (diff.highlightVarVal != null) {
    d3.selectAll('circle:not([data-cut-value="' + diff.highlightVarVal + '"])')
      .classed('perma-dimmed', true)
      .transition()
      .duration(300)
      .style('opacity', 0.1);
  } else if (diff.hasOwnProperty("highlightVarVal")) {
    d3.selectAll('.perma-dimmed').classed('perma-dimmed', false).transition()
      .duration(500)
      .style('opacity', 1);
  }

  // Bi-directional binding for controls.
  if (diff.aggregate != null) {
    $(aggSwitchId).prop("checked", diff.aggregate);
  }
  if (diff.measurement != null) {
    $(measurementSelectId).val(diff.measurement);
  }

  if (diff.measurementSelectVisible === true) {
    d3.select(measurementCtrlId).transition()
      .duration(150)
      .style("opacity", 1);
  } else if (diff.measurementSelectVisible === false) {
    d3.select(measurementCtrlId).transition()
      .duration(150)
      .style("opacity", 0);
  }

  if (diff.aggregateSwitchVisible === true) {
    d3.select(aggCtrlId).transition()
      .duration(150)
      .style("opacity", 1);
  } else if (diff.aggregateSwitchVisible === false) {
    d3.select(aggCtrlId).transition()
      .duration(150)
      .style("opacity", 0);
  }

  if (diff.controlsEnabled === false) {
    $(aggSwitchId).attr("disabled", "disabled");
    $(measurementSelectId).attr("disabled", "disabled");
  } else if (diff.controlsEnabled === true) {
    $(aggSwitchId).removeAttr("disabled");
    $(measurementSelectId).removeAttr("disabled");
  }
}

function highlightByValue(varVal) {
  if (getState().hoverable && !getState().highlightVarVal) {
    d3.selectAll('circle:not([data-cut-value="' + varVal + '"])')
      .classed('dimmed', true)
      .transition()
      .duration(150)
      .style("opacity", 0.1);
  }
}

function cancelHighlight() {
  if (getState().hoverable && !getState().highlightVarVal) {
    d3.selectAll('.dimmed').classed('dimmed', false)
      .transition()
      .duration(300)
      .style("opacity", 1);
  }
}

function initPlot(parsedData) {
  window.appGlobals.parsedData = parsedData;

  parsedData.outcomeClasses.forEach(function(outcome) {
    $(measurementSelectId).append(
      $("<option></option>")
        .attr("value", outcome)
        .html(_.startCase(outcome)))
  });

  $(".is-loading").removeClass("is-loading");
  $(".lds-dual-ring").remove();

  // Set up the aggregate switch.
  $(aggSwitchId).change(function() {
    setPlotState({"aggregate": $(this).prop('checked')});
  });

  // Set up the treatment class switch.
  $(measurementSelectId).change(function() {
    setPlotState({"measurement": $(this).val()});
  });

  runTour();
};

function clearPlot() {
  $(plotAreaId).html();
}

function plotBarPlot(outcome) {
  if (outcome == 0) {
    return;
  }

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
  var parsedData = getParsedData();

  x0.domain(parsedData.treatmentClasses);
  x1.domain(keys).rangeRound([0, x0.bandwidth()]);
  y.domain([0, d3.max(parsedData.treatmentClasses, function(treatmentClass) {
    return d3.max(parsedData.outcomeClasses, function(outcome) {
      return d3.max(keys, function(key) {
        return parsedData.rowByTreatment[treatmentClass][outcome][key] + 2;
      });
    });
  })]);

  var treatmentGroup = g
    .selectAll("g")
    .data([0])
    .enter()
    .append("g")
    .selectAll("g")
    .data(parsedData.treatmentClasses);

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
          value: parsedData.rowByTreatment[treatmentClass][outcome][key],
          significance: parsedData.rowByTreatment[treatmentClass][outcome]["Sig" + key],
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
        if (getState().hoverable) {
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
        if (getState().hoverable) {
          tooltip.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        }
     })
      .on("mouseout", function(d) {
        if (getState().hoverable) {
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
    .data(parsedData.treatmentClasses)
    .enter().append("g")
      .attr("transform", function(d) { return "translate(" + x0(d) + ",0)"; })
    .selectAll("rect")
    .data(function(treatmentClass) {
      return keys.map(function(key) {
        return {
          key: key,
          value: parsedData.rowByTreatment[treatmentClass][outcome][key],
          significance: parsedData.rowByTreatment[treatmentClass][outcome]["Sig" + key],
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
        if (getState().hoverable) {
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
        if (getState().hoverable) {
          tooltip.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        }
      })
      .on("mouseout", function(d) {
        if (getState().hoverable) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        }
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

function plotSwarmPlot(outcome) {
  var radius = 12,
      strokeWidth = 3,
      height = 500;

  var tooltip = d3.select("#details-area");
  var margin = {top: -radius * 5, left: 100, bottom: radius, right: 50},
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

  var parsedData = getParsedData();
  var outcomeData = parsedData.rowsAll.filter((x) => x[outcome]);

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
        var n = outcomeData.filter(function(c){
                  return c.treatment_class == d;
                }).length
        if (n > 0) {
          return n;
        }
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

  function _getCitations(d) {
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
        _getCitations(d) +
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

  y.domain(parsedData.treatmentClasses);

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
      if (getState().hoverable) {
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
      if (getState().hoverable) {
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
    loadData(db, initPlot);
    // contents is now [{columns:['col1','col2',...], values:[[first row], [second row], ...]}]
  };
  xhr.send();
});
