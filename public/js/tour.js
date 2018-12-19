var tourCtrlAreaId = "#tour-controls";
var tourTextAreaId = "#tour-text";
var tourStartButtonId = "#tour-button";
var tourNextButtonId = "#tour-next-button";
var tourPrevButtonId = "#tour-prev-button";

$(document).ready(function() {
  $(document).keydown(function(e) {
    if(e.which == 39) {
      if ($(tourNextButtonId)) {
        $(tourNextButtonId).click()
        e.preventDefault();
      }
    }
  });
})

function runTour() {
  // Prepare the tour.
  d3.select(tourCtrlAreaId).style("opacity", 0)
    .html(
      "<div class='control has-text-center'>" +
      // "<button class='button' id='tour-prev-button' disabled>&larr; Previous</button>&nbsp;" +
      "<span class='button is-primary' id='tour-next-button'>Next &rarr;</span>" +
      "</div>"
    )
    .transition()
    .duration(600)
    .style("opacity", 1);

  function stopTour() {
    d3.select(tourCtrlAreaId).transition().style("opacity", 0);
    d3.select(tourTextAreaId).transition().style("opacity", 0);

    setPlotState({
      controlsEnabled: true,
      measurementSelectVisible: true,
      aggregateSwitchVisible: true,
      measurement: "change_annual_streamflow_mm",
      aggregate: false
    });
  }

  function tourStep(i) {
    var lastStep = (i >= tourSteps.length - 1);

    if (i > 0) {
      $(tourPrevButtonId).removeAttr("disabled");
    }

    d3.select(tourTextAreaId).transition()
      .duration(150)
      .style("opacity", 0)
      .on("end", function() {
        tourSteps[i]();

        $(tourNextButtonId)
          .unbind("click")
          .click(function() {
            if (!lastStep) {
              tourStep(i + 1);
            } else {
              stopTour();
            }
          });

        $(tourPrevButtonId)
          .unbind("click")
          .click(function() {
            if (i > 0) {
              tourStep(i - 1);
            }
          })

        d3.select(tourTextAreaId).transition()
          .duration(500)
          .style("opacity", 1);
      });
  }

  var tourSteps = [
    function intro0() {
      d3.select(tourTextAreaId).html(
        "This visualization will guide through a number of real-world experiments with " +
        "watersheds around the world. It will show the results found in scientific articles " +
        "along with their significance, and hopefully help to find the right decision " +
        "regarding a nature-based water engineering solution"
      );

      setPlotState({
        hoverable: false,
        controlsEnabled: false,
        measurementSelectVisible: false,
        aggregateSwitchVisible: false,
        measurement: null,
        aggregate: null,
        highlightVarVal: null,
      });
    },

    function intro1() {
      setPlotState({
        hoverable: false,
        controlsEnabled: false,
        measurementSelectVisible: false,
        aggregateSwitchVisible: false,
        measurement: "",
        aggregate: false,
        highlightVarVal: null,
      });

      d3.select(tourTextAreaId).html(
        "All the experiments have either applied <em>deforestation</em> (cut down a part of a " +
        "forest around a watershed) or <em>afforestation</em> (planted one). They then measured " +
        "various properties of the watershed. For example, change in annual waterflow."
      );
    },

    function intro2() {
      setPlotState({
        hoverable: true,
        controlsEnabled: false,
        measurementSelectVisible: false,
        aggregateSwitchVisible: false,
        measurement: "change_annual_streamflow_mm",
        aggregate: false,
        highlightVarVal: null,
      });

      d3.select(tourTextAreaId).html(
        "Each circle on represents one study. The colors represent a single watershed. " +
        "Hover to see more details."
      );
    },

    function beaverCreek0() {
      d3.select(tourTextAreaId).html(
        "Let's take a look at the Beaver Creek watershed in Arizona, USA. " +
        "There have been several experiments applying deforestation to this watershed."
      );

      setPlotState({
        hoverable: false,
        controlsEnabled: false,
        measurementSelectVisible: false,
        aggregateSwitchVisible: false,
        measurement: "change_annual_streamflow_mm",
        highlightVarVal: "Beaver Creek, Arizona, USA",
        aggregate: false,
      });
    },

    function beaverCreek1() {
      d3.select(tourTextAreaId).html(
        "Most of them discovered that deforestation leads to an increase in streamflow. " +
        "Two of them, however, are <em>not significant</em> (hollow circles). It is important " +
        "to see which experiments are not significant."
      );

      setPlotState({
        hoverable: false,
        controlsEnabled: false,
        measurementSelectVisible: false,
        aggregateSwitchVisible: false,
        measurement: "change_annual_streamflow_mm",
        highlightVarVal: "Beaver Creek, Arizona, USA",
        aggregate: false,
      });
    },

    function beaverCreek2() {
      d3.select(tourTextAreaId).html(
        "One can be rather sure that deforestation in similar conditions will lead to " +
        "annual increase in annual flow."
      );

      setPlotState({
        hoverable: false,
        controlsEnabled: false,
        measurementSelectVisible: false,
        aggregateSwitchVisible: false,
        measurement: "change_annual_streamflow_mm",
        highlightVarVal: "Beaver Creek, Arizona, USA",
        aggregate: false,
      });
    },

    function beaverCreek3() {
      setPlotState({
        hoverable: true,
        controlsEnabled: true,
        measurementSelectVisible: true,
        aggregateSwitchVisible: false,
        measurement: "change_peak_flow",
        aggregate: false,
        highlightVarVal: null,
      });

      d3.select(tourTextAreaId).html(
        "These are other measurements reports in the studies. This, for example, is change " +
        "in peak water flow. You can check different kinds of measurement now."
      );
    },

    function australia0() {
      setPlotState({
        hoverable: false,
        controlsEnabled: false,
        measurementSelectVisible: true,
        aggregateSwitchVisible: false,
        measurement: "change_annual_streamflow_mm",
        aggregate: false,
        highlightVarVal: "Beaver Creek, Arizona, USA",
      });

      d3.select(tourTextAreaId).html(
        "Not all watersheds boast the level of certainty like Beaver Creek."
      );
    },

    function australia1() {
      setPlotState({
        hoverable: false,
        controlsEnabled: false,
        measurementSelectVisible: true,
        aggregateSwitchVisible: false,
        measurement: "change_annual_streamflow_mm",
        aggregate: false,
        highlightVarVal: "Southwest Western Australia",
      });

      d3.select(tourTextAreaId).html(
        "All experiments in this one in Southwest Australia detected increase in annual " +
        "streamflow, but all experiments are not significant. It is not clear without expert " +
        "help if the results are conclusive."
      );
    },

    function australia2() {
      setPlotState({
        hoverable: false,
        controlsEnabled: false,
        measurementSelectVisible: true,
        aggregateSwitchVisible: true,
        measurement: "change_annual_streamflow_mm",
        aggregate: true,
        highlightVarVal: null,
      });

      d3.select(tourTextAreaId).html(
        "To check the big picture, you can take a look at the aggregate plot. It does not show " +
        "particular studies, but only the general trend—whether the treatment increases the " +
        "measurement or not."
      );

    },

    function outro() {
      setPlotState({
        hoverable: true,
        controlsEnabled: false,
        measurementSelectVisible: true,
        aggregateSwitchVisible: true,
        measurement: "change_annual_streamflow_mm",
        aggregate: false,
        highlightVarVal: null,
      });

      d3.select(tourTextAreaId).html(
        "Explore the data on your own!"
      );
    }
  ]

  tourStep(0);
}
