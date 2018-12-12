function runTour() {
  // Prepare the tour.
  $("#switch").prop("checked", false);
  $(".outcome").val("change_annual_streamflow_mm");
  cancelHighlight();
  redrawPlot();
  $("#measurement-selector select").attr("disabled", "disabled");
  $("#explore-button").attr("disabled", "disabled");
  $("#tour-button").removeClass("is-primary").text("Stop the tour");
  $("#switch").attr("disabled", "disabled");
  $("#tour-button").unbind("click").click(stopTour);

  var tourSteps = [];

  function stopTour() {
    $(plotAreaId).removeClass("non-interactive");
    $('.controls :not(.perma-disabled)[disabled]').removeAttr("disabled");
    $("#details-area").html("");
    $("#tour-button").addClass("is-primary")
      .text("Take a tour")
      .unbind("click")
      .click(runTour);
  }

  function makeTourStep(i) {
    var lastStep = (i >= tourSteps.length - 1);

    $(plotAreaId).addClass("non-interactive");
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
    $(".outcome").val("change_peak_flow");
    redrawPlot();

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
    $(".outcome").val("change_annual_streamflow_mm");
    redrawPlot();

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
