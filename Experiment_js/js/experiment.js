var touchstone = 2;

var state = {
  NONE: 0,
  INSTRUCTIONS: 1,
  SHAPES: 2,
  PLACEHOLDERS: 3,
};

var ctx = {
  w: 800,
  h: 600,

  trials: [],
  participant: "",
  startBlock: 0,
  startTrial: 0,
  cpt: 0,
  errorCount: 0,

  participantIndex: touchstone == 1 ? "Participant" : "ParticipantID",
  practiceIndex: "Practice",
  blockIndex: touchstone == 1 ? "Block" : "Block1",
  trialIndex: touchstone == 1 ? "Trial" : "Block2",
  vvIndex: "VV",
  objectsCountIndex: "OC",

  state: state.NONE,
  targetIndex: 0,

  // TODO log measures
  // loggedTrials is a 2-dimensional array where we store our log file
  // where one line is one trial
  loggedTrials:
    touchstone == 1
      ? [
          [
            "Participant",
            "Practice",
            "Block",
            "Trial",
            "VV",
            "OC",
            "visualSearchTime",
            "ErrorCount",
          ],
        ]
      : [
          [
            "DesignName",
            "ParticipantID",
            "TrialID",
            "Block1",
            "Trial",
            "VV",
            "OC",
            "visualSearchTime",
            "ErrorCount",
          ],
        ],
};

/****************************************/
/********** LOAD CSV DESIGN FILE ********/
/****************************************/

var loadData = function (svgEl) {
  // d3.csv parses a csv file...
  d3.csv("PreattentionExperiment.csv")
    .then(function (data) {
      // ... and turns it into a 2-dimensional array where each line is an array indexed by the column headers
      // for example, data[2]["OC"] returns the value of OC in the 3rd line
      ctx.trials = data;
      // all trials for the whole experiment are stored in global variable ctx.trials

      var participant = "";
      var options = [];

      for (var i = 0; i < ctx.trials.length; i++) {
        if (!(ctx.trials[i][ctx.participantIndex] === participant)) {
          participant = ctx.trials[i][ctx.participantIndex];
          options.push(participant);
        }
      }

      var select = d3.select("#participantSel");
      select
        .selectAll("option")
        .data(options)
        .enter()
        .append("option")
        .text(function (d) {
          return d;
        });

      setParticipant(options[0]);
    })
    .catch(function (error) {
      console.log(error);
    });
};

/****************************************/
/************* RUN EXPERIMENT ***********/
/****************************************/

var startExperiment = function (event) {
  event.preventDefault();

  // set the trial counter to the first trial to run
  // ctx.participant, ctx.startBlock and ctx.startTrial contain values selected in combo boxes

  for (var i = 0; i < ctx.trials.length; i++) {
    if (ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if (
        parseInt(ctx.trials[i][ctx.blockIndex]) == ctx.startBlock &&
        (touchstone == 2 ||
          ctx.trials[i][ctx.practiceIndex].toLowerCase() === "false")
      ) {
        if (parseInt(ctx.trials[i][ctx.trialIndex]) == ctx.startTrial) {
          ctx.cpt = i - 1;

          if (touchstone == 1) {
            // include practice trials before this trial for TouchStone 1
            while (
              ctx.cpt >= 0 &&
              ctx.trials[ctx.cpt][ctx.practiceIndex].toLowerCase() === "true"
            ) {
              ctx.cpt = ctx.cpt - 1;
            }
          }

          // start first trial
          console.log("start experiment at " + ctx.cpt);
          nextTrial();
          return;
        }
      }
    }
  }
};

var nextTrial = function () {
  // SHOULD I CHECK IT HERE?

  ctx.cpt++;
  ctx.errorCount = 0;
  displayInstructions();
};

var displayInstructions = function () {
  ctx.state = state.INSTRUCTIONS;

  d3.select("#instructionsCanvas")
    .append("div")
    .attr("id", "instructions")
    .classed("instr", true);

  d3.select("#instructions")
    .append("p")
    .html(
      "Multiple shapes will get displayed.<br> Only <b>one shape</b> is different from all other shapes."
    );

  d3.select("#instructions")
    .append("p")
    .html("1. Spot it as fast as possible and press <code>Space</code> bar;");

  d3.select("#instructions")
    .append("p")
    .html("2. Click on the placeholder over that shape.");

  d3.select("#instructions")
    .append("p")
    .html("Press <code>Enter</code> key when ready to start.");
};

var displayShapes = function () {
  ctx.state = state.SHAPES;

  var visualVariable = ctx.trials[ctx.cpt]["VV"];
  var oc = ctx.trials[ctx.cpt]["OC"];
  if (oc === "Low") {
    objectCount = 9;
  } else if (oc === "Medium") {
    objectCount = 25;
  } else {
    objectCount = 49;
  }
  console.log("display shapes for condition " + oc + "," + visualVariable);

  var svgElement = d3.select("svg");
  var group = svgElement
    .append("g")
    .attr("id", "shapes")
    .attr("transform", "translate(100,100)");

  // 1. Decide on the visual appearance of the target
  // In my example, it means deciding on its Orientation (large or small) and its Color (light or dark)
  var randomNumber1 = Math.random();
  var randomNumber2 = Math.random();
  var targetColor, targetOrientation;
  if (randomNumber1 > 0.5) {
    targetOrientation = 45; // target is rotated
  } else {
    targetOrientation = 0; // target is not rotated
  }
  if (randomNumber2 > 0.5) {
    targetColor = "DarkGray"; // target is dark gray
  } else {
    targetColor = "LightGray"; // target is light gray
  }
  console.log(
    "Target color: " +
      targetColor +
      "\n Target orientation: " +
      targetOrientation
  );

  // 2. Set the visual appearance of all other objects now that the target appearance is decided
  var objectsAppearance = [];
  if (visualVariable != "Orientation_Color") {
    for (var i = 0; i < objectCount - 1; i++) {
      if (visualVariable == "Orientation" && targetOrientation == 45) {
        objectsAppearance.push({
          orientation: 0,
          size: 25,
          color: targetColor,
        });
      } else if (visualVariable == "Orientation" && targetOrientation == 0) {
        objectsAppearance.push({
          orientation: 45,
          size: 25,
          color: targetColor,
        });
      }
      if (visualVariable == "Color" && targetColor == "LightGray") {
        objectsAppearance.push({
          orientation: targetOrientation,
          size: 25,
          color: "DarkGray",
        });
      } else if (visualVariable == "Color" && targetColor == "DarkGray") {
        objectsAppearance.push({
          orientation: targetOrientation,
          size: 25,
          color: "LightGray",
        });
      }
    }
  } else {
    if (targetColor == "DarkGray" && targetOrientation == 0) {
      for (var i = 0; i < objectCount / 3; i++) {
        objectsAppearance.push({
          orientation: targetOrientation,
          size: 25,
          color: "LightGrey",
        });
      }
      for (var i = 0; i < objectCount / 3; i++) {
        objectsAppearance.push({
          orientation: 45,
          size: 25,
          color: "DarkGrey",
        });
      }
      for (var i = 0; i < objectCount / 3 + (objectCount % 3); i++) {
        objectsAppearance.push({
          orientation: 45,
          size: 25,
          color: "LightGrey",
        });
      }
    } else if (targetColor == "DarkGray" && targetOrientation == 45) {
      for (var i = 0; i < objectCount / 3; i++) {
        objectsAppearance.push({
          orientation: targetOrientation,
          size: 25,
          color: "LightGrey",
        });
      }
      for (var i = 0; i < objectCount / 3; i++) {
        objectsAppearance.push({
          orientation: 0,
          size: 25,
          color: "DarkGrey",
        });
      }
      for (var i = 0; i < objectCount / 3 + (objectCount % 3); i++) {
        objectsAppearance.push({
          orientation: 0,
          size: 25,
          color: "LightGrey",
        });
      }
    } else if (targetColor == "LightGray" && targetOrientation == 45) {
      for (var i = 0; i < objectCount / 3; i++) {
        objectsAppearance.push({
          orientation: targetOrientation,
          size: 25,
          color: "DarkGrey",
        });
      }
      for (var i = 0; i < objectCount / 3; i++) {
        objectsAppearance.push({
          orientation: 0,
          size: 25,
          color: "LightGrey",
        });
      }
      for (var i = 0; i < objectCount / 3 + (objectCount % 3); i++) {
        objectsAppearance.push({
          orientation: 0,
          size: 25,
          color: "DarkGrey",
        });
      }
    } else {
      for (var i = 0; i < objectCount / 3; i++) {
        objectsAppearance.push({
          orientation: targetOrientation,
          size: 25,
          color: "DarkGrey",
        });
      }
      for (var i = 0; i < objectCount / 3; i++) {
        objectsAppearance.push({
          orientation: 45,
          size: 25,
          color: "LightGrey",
        });
      }
      for (var i = 0; i < objectCount / 3 + (objectCount % 3); i++) {
        objectsAppearance.push({
          orientation: 45,
          size: 25,
          color: "DarkGrey",
        });
      }
    }
  }

  // 3. Shuffle the list of objects (useful when there are variations regarding both visual variable) and add the target at a specific index
  shuffle(objectsAppearance);
  // draw a random index for the target
  ctx.targetIndex = Math.floor(Math.random() * objectCount);
  // and insert it at this specific index
  objectsAppearance.splice(ctx.targetIndex, 0, {
    orientation: targetOrientation,
    color: targetColor,
    size: 25,
  });

  // 4. We create actual SVG shapes and lay them out as a grid
  // compute coordinates for laying out objects as a grid
  var gridCoords = gridCoordinates(objectCount, 60);
  // display all objects by adding actual SVG shapes
  for (var i = 0; i < objectCount; i++) {
    group
      .append("rect")
      .attr("x", gridCoords[i].x)
      .attr("y", gridCoords[i].y)
      .attr("width", objectsAppearance[i].size)
      .attr("height", objectsAppearance[i].size)
      .attr("fill", objectsAppearance[i].color)
      .attr(
        "transform",
        "rotate( " +
          objectsAppearance[i].orientation +
          " " +
          (gridCoords[i].x + 25 / 2) +
          " " +
          (gridCoords[i].y + 25 / 2) +
          " )"
      );
  }
};

var displayPlaceholders = function () {
  ctx.state = state.PLACEHOLDERS;

  var oc = ctx.trials[ctx.cpt]["OC"];
  var objectCount = 0;

  if (oc === "Low") {
    objectCount = 9;
  } else if (oc === "Medium") {
    objectCount = 25;
  } else {
    objectCount = 49;
  }

  var svgElement = d3.select("svg");
  var group = svgElement
    .append("g")
    .attr("id", "placeholders")
    .attr("transform", "translate(100,100)");
  var gridCoords = gridCoordinates(objectCount, 60);
  for (var i = 0; i < objectCount; i++) {
    var placeholder = group
      .append("rect")
      .attr("x", gridCoords[i].x - 28)
      .attr("y", gridCoords[i].y - 28)
      .attr("width", 56)
      .attr("height", 56)
      .attr("fill", "Gray")
      .attr("index", i);

    placeholder.on("click", function () {
      //if correct push a new log, otherwise reset the timer and reset the experiment
      if (ctx.targetIndex == this.getAttribute("index")) {
        console.log("Correct!");
        ctx.loggedTrials.push([
          "Preattention-experiment",
          ctx.trials[ctx.cpt]["PartecipantID"],
          "WHAT?",
          ctx.trials[ctx.cpt]["Block1"],
          ctx.trials[ctx.cpt]["TrialID"],
          ctx.trials[ctx.cpt]["VV"],
          ctx.trials[ctx.cpt]["OC"],
          Date.now(),
          ctx.errorCount,
        ]);
        d3.select("#placeholders").remove();
        nextTrial();
      } else {
        console.log("Wrong!");
        console.log(ctx.trials[ctx.cpt]);
        console.log(
          "Index was " +
            ctx.targetIndex +
            " and you clicked " +
            this.getAttribute("index")
        );
        ctx.errorCount++;
        d3.select("#placeholders").remove();
        displayShapes();
      }
    });
  }
};

var keyListener = function (event) {
  event.preventDefault();

  if (ctx.state == state.INSTRUCTIONS && event.code == "Enter") {
    d3.select("#instructions").remove();
    displayShapes();
  }

  if (ctx.state == state.SHAPES && event.code == "Space") {
    d3.select("#shapes").remove();
    displayPlaceholders();
  }
};

var downloadLogs = function (event) {
  event.preventDefault();
  var csvContent = "data:text/csv;charset=utf-8,";
  console.log("logged lines count: " + ctx.loggedTrials.length);
  ctx.loggedTrials.forEach(function (rowArray) {
    var row = rowArray.join(",");
    csvContent += row + "\r\n";
    console.log(rowArray);
  });
  var encodedUri = encodeURI(csvContent);
  var downloadLink = d3
    .select("form")
    .append("a")
    .attr("href", encodedUri)
    .attr(
      "download",
      "logs_" +
        ctx.trials[ctx.cpt][ctx.participantIndex] +
        "_" +
        Date.now() +
        ".csv"
    )
    .text(
      "logs_" +
        ctx.trials[ctx.cpt][ctx.participantIndex] +
        "_" +
        Date.now() +
        ".csv"
    );
};

// returns an array of coordinates for laying out objectCount objects as a grid with an equal number of lines and columns
function gridCoordinates(objectCount, cellSize) {
  var gridSide = Math.sqrt(objectCount);
  var coords = [];
  for (var i = 0; i < objectCount; i++) {
    coords.push({
      x: (i % gridSide) * cellSize,
      y: Math.floor(i / gridSide) * cellSize,
    });
  }
  return coords;
}

// shuffle the elements in the array
// copied from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function shuffle(array) {
  var j, x, i;
  for (i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = array[i];
    array[i] = array[j];
    array[j] = x;
  }
  return array;
}

/*********************************************/

var createScene = function () {
  var svgEl = d3.select("#sceneCanvas").append("svg");
  svgEl.attr("width", ctx.w);
  svgEl.attr("height", ctx.h).classed("centered", true);

  loadData(svgEl);
};

/****************************************/
/******** STARTING PARAMETERS ***********/
/****************************************/

var setTrial = function (trialID) {
  ctx.startTrial = parseInt(trialID);
};

var setBlock = function (blockID) {
  ctx.startBlock = parseInt(blockID);

  var trial = "";
  var options = [];

  for (var i = 0; i < ctx.trials.length; i++) {
    if (ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if (parseInt(ctx.trials[i][ctx.blockIndex]) == ctx.startBlock) {
        if (!(ctx.trials[i][ctx.trialIndex] === trial)) {
          trial = ctx.trials[i][ctx.trialIndex];
          options.push(trial);
        }
      }
    }
  }

  var select = d3.select("#trialSel");

  select
    .selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function (d) {
      return d;
    });

  setTrial(options[0]);
};

var setParticipant = function (participantID) {
  ctx.participant = participantID;

  var block = "";
  var options = [];

  for (var i = 0; i < ctx.trials.length; i++) {
    if (ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if (
        !(ctx.trials[i][ctx.blockIndex] === block) &&
        (touchstone == 2 ||
          ctx.trials[i][ctx.practiceIndex].toLowerCase() === "false")
      ) {
        block = ctx.trials[i][ctx.blockIndex];
        options.push(block);
      }
    }
  }

  var select = d3.select("#blockSel");
  select
    .selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function (d) {
      return d;
    });

  setBlock(options[0]);
};

function onchangeParticipant() {
  selectValue = d3.select("#participantSel").property("value");
  setParticipant(selectValue);
}

function onchangeBlock() {
  selectValue = d3.select("#blockSel").property("value");
  setBlock(selectValue);
}

function onchangeTrial() {
  selectValue = d3.select("#trialSel").property("value");
  setTrial(selectValue);
}
