/*

Homework #2 - D3
ITCS-4121-001

Jason Pollman & Hunain Vhora

*/

// <--------------------------------------------------- Global Variables ----------------------------------------------------> //

// Holds the active ("checked") genres.
// An array that contains the names of each movie genre enabled.
var genres = Array();

// D3 Globals...
// So we can use these without passing variables around.
var format, data, pack, titles, circles, vis, svg;

// Set this and run updateVis() to set the awards filter.
var awardsGlobal = 'all';

// Set these and run updateVis() to set year filter.
var yearBeginGlobal = 1900;
var yearEndGlobal = new Date().getFullYear();

// Set this and run updateVis() to specify how the d3.pack.sort()
// function should work.
var sortbyGlobal = 'popularity';

// Stores movies that have been filtered (removed) from the dataset.
// This array is checked on filter changes, to see if a movie that was
// once removed needs to be re-added to the dataset.
// ...A better variable name would have been "stash."
var exit  = Array();

// Set the width of the visualization to the size of the window
// minus the controls, padding, margin. etc.
// The visualization must be at least 500 or at most 950 pixles wide,
// if it get's too big, it's slow... too small... and it's useless.
var diameter = window.innerWidth - 553;
(diameter < 500) ? diameter = 500 : (diameter > 950) ? diameter = 950 : null;

// Set the window.onresize() function to handle resizing the visualization
// if the user resizes the browser window.
window.onresize = function(event) {
    diameter = window.innerWidth - 553;
    (diameter < 500) ? diameter = 500 : (diameter > 950) ? diameter = 950 : null;
    pack.size([diameter - 4, diameter - 4]);

    svg.attr("width", diameter)
    svg.attr("height", diameter);

    updateVis();
};

/**
 * Returns a new array with all the elements in the array, that aren't in the compared (parameter) array.
 */
Array.prototype.notIn = function(a) {
    return this.filter(function (e) { return !(a.indexOf(e) > -1); }) || Array();
};


// <------------------------------------------------- Begin Visualization ---------------------------------------------------> //

/**
 * This function is run when the body.onload() event is fired.
 * it sets up the visualization, and rendered the inital SVG state.
 */
function init() {

  // Put textfield labels inside textfields for cleanliness
  d3.selectAll("input[type='text']").each(function(e) {

    labelForThis = d3.select("label[for='" + this.id + "']");

    this.value = labelForThis.html();

    d3.select(this).classed("grayed-light", true);
    labelForThis.style('display', 'none');

  });

  // Make "default" text dissapear when clicked
  d3.selectAll("input[type='text']").on("focus", function() {
    labelForThis = d3.select("label[for='" + this.id + "']");

    if(this.value == labelForThis.html()) {
      this.value = "";
    }

  });

  // Make "default" text reappear if field is left empty
  d3.selectAll("input[type='text']").on("blur", function() {
    labelForThis = d3.select("label[for='" + this.id + "']");

    if(this.value == "") {
      this.value = labelForThis.html();
    }

  });

  // Remove the "grayed" class if the field contains non-"default" text
  d3.selectAll("input[type='text']").on("keyup", function() {

    labelForThis = d3.select("label[for='" + this.id + "']");

    if(String(this.value) == labelForThis.html()) {
      d3.select(this).classed("grayed", true);
    }
    else {
      d3.select(this).classed("grayed", false);
    }

  });


  // <---------------------------------------------- JSON Parsing & Vis Setup -----------------------------------------------> //

  d3.json("data.json", function (error, json) {
    
    // Set the data global, so we can use the data variable
    // when we need it.
    data = json;


    // Remove Duplicate Movies
    var clean = Array();
    data.children.forEach(function (e) {
      if(clean.indexOf(e.title) <= -1) {
        clean.push(e.title);
      }
      else {
        data.children.splice(data.children.indexOf(e), 1);
      }
    });

    format = d3.format(",d"),

    // Specify the D3 pack layout
    pack = d3.layout.pack()
      .size([diameter - 4, diameter - 4])
      // Circle diameter = A movie's popularity
      .value(function(d) { return d.popularity + 5; });

    // Sort the pack based on the value of sortbyGlobal
    pack.sort(function(a, b) {
      if(sortbyGlobal == "genre") {
        return a.subject < b.subject ? -1 : a.subject > b.subject ? 1 : 0;
      }
      else if(sortbyGlobal == "year") {
        return b.year - a.year;
      }
      else if(sortbyGlobal == "popularity") {
        return b.popularity - a.popularity;
      }
      else {
        return a.awards < b.awards ? -1 : a.awards > b.awards ? 1 : 0;
      }
    });

    // Append the SVG Element
    svg = d3.select("#page-visualization").append("svg:svg")
      .attr("width", diameter)
      .attr("height", diameter);

    // When the user changes the "Color Movies By" radio button
    // this event handler is fired.
    d3.selectAll(".colorby").on("change", function (d) {

      // Here we add and remove classes, based on the value of
      // the radio buttons.
      if(this.checked && this.value == 'genre') {
        d3.selectAll("circle").classed("genre", true);
        d3.selectAll("circle").classed("year", false);
        d3.selectAll("circle").classed("awards", false);
        d3.selectAll("circle").classed("popularity", false);
      }
      else if(this.checked && this.value == 'year') {
        d3.selectAll("circle").classed("genre", false);
        d3.selectAll("circle").classed("year", true);
        d3.selectAll("circle").classed("awards", false);
        d3.selectAll("circle").classed("popularity", false);
      }
      else if(this.checked && this.value == 'awards') {
        d3.selectAll("circle").classed("genre", false);
        d3.selectAll("circle").classed("year", false);
        d3.selectAll("circle").classed("awards", true);
        d3.selectAll("circle").classed("popularity", false);
      }
      else {
        d3.selectAll("circle").classed("genre", false);
        d3.selectAll("circle").classed("year", false);
        d3.selectAll("circle").classed("awards", false);
        d3.selectAll("circle").classed("popularity", true);
      }

      // Must update the visualization to show results...
      updateVis();

    });
    

    // When the sortby radio group is changed, this handler is fired.
    // It sets the sortbyGlobal variable and updates the visualization.
    d3.selectAll(".sortby").on("change", function (d) {
      sortbyGlobal = this.value;
      updateVis();
    });


    /* Filtering Functions */


    // Fired when a genre checkbox is clicked.
    d3.selectAll("input[type='checkbox']").on("click", function (d) {
      toggleGenre(this.value);
    })

    // Fired when an awards radio button is clicked.
    d3.selectAll(".awards-filter").on("click", function (d) {
      toggleAwards(this.value);
    })

    // Fired when the movie title textfield is "changed."
    d3.selectAll("#movie-title").on("change", function (d) {
      titleChange();
    })

    // Fired when the year begin textfield is changed.
    d3.selectAll("#year-begin").on("change", function (d) {

      if(this.value < 1900) {
        this.value = 1900;
      }
      else if(this.value > yearEndGlobal) {
        this.value = yearEndGlobal;
      }

      setYearRange(this.value, yearEndGlobal);

    })

    // Fired when the year end textfield is changed.
    d3.selectAll("#year-end").on("change", function (d) {

      if(this.value > new Date().getFullYear()) {
        this.value = new Date().getFullYear();
      }
      else if(this.value < yearBeginGlobal) {
        this.value = yearBeginGlobal;
      }

      setYearRange(yearBeginGlobal, this.value);

    })

    // Set the available genres, based on the HTML
    // Checkbox group elements.
    setGenres();

    // Run inital visualization update.
    updateVis();

    // Append an SVG Defs Element for Gradient & Shadow Definitons
    var defs = svg.append("defs");

    // <--------------------------------------------- Drop Shadow (Gaussian Blur) ---------------------------------------------> //

    var filter = defs.append("filter").attr("id", "drop-shadow")

    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 2)
        .attr("result", "blur");

    filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 2)
        .attr("dy", 2)
        .attr("result", "offsetBlur");

    var feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode").attr("in", "offsetBlur")
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    d3.select("#misc-total").html(format(getNodeCount()));

    
  
  }); // End of d3.json() function

}  // End of init() function

/**
 * Turns a genre "on"/"off" when the checkbox is clicked,
 * by appending/removing the genre name from the genres array.
 */
function toggleGenre(genreName)  { (genreEnabled(genreName)) ? genres.splice(genres.indexOf(genreName), 1) : genres.push(genreName); updateVis(); }

/**
 * Sets the awardsGlobal value, then updates the visualization.
 */
function toggleAwards(awardsValue)  { awardsGlobal = awardsValue; updateVis(); }

/**
 * Check to see if a genre is enabled.
 * @ return true if the genre is enbled, false otherwise.
 */
function genreEnabled(genreName) { return (genres.indexOf(genreName.toLowerCase()) <= -1) ? false : true;
}

/**
 * Check to see if an award is "enabled.""
 * @ return true if the data value is equal to the awardsGlobal, or if all is selected; false otherwise.
 */
function awardsEnabled(awardsValue) { return awardsGlobal == 'all' || awardsValue.toLowerCase() == awardsGlobal; }

/**
 * Set the year globals.
 */
function setYearRange(yearBegin, yearEnd) { yearBeginGlobal = yearBegin; yearEndGlobal = yearEnd; updateVis(); }

/**
 * Check to see if a movie was created within the user specified year range.
 * @ return true if the movie falls between yearBeginGlobal and yearEndGlobal, inclusive.
 */
function inYearRange(movieCreated) { return movieCreated >= yearBeginGlobal && movieCreated <= yearEndGlobal; }

/**
 * Updates the visualization when the movie title textfield is changed.
 */
function titleChange() { updateVis(); }

/**
 * Compare the user entered movie title textfield to the data's movie title.
 */
function titleRegex(movieTitle) {

  titleField = document.getElementById("movie-title");
  movieTitle = movieTitle.toLowerCase();

  if(movieTitle == titleField.value.toLowerCase() || titleField.value == "Movie Title" || titleField.value == '') {
    return true;
  }

  return false;
}


/**
 * Updates the visualization with an animated transition based on the user selected
 * filters. 
 */
function updateVis() {
  
  // This array will hold the modified data set, and replace it once
  // the data has been filtered.
  var enter = new Array();

  // data.children = The movies in the JSON Object
  moviesArr = data.children;

  if(moviesArr !== undefined) {
    moviesArr.forEach(function (movie) {

      // Check for filter values
      if(genreEnabled(movie.subject) && awardsEnabled(movie.awards) && inYearRange(movie.year) && titleRegex(movie.title)) {
        // If we pass all filters, push the movie into the moviesArr.
        enter.push(movie);
      }
      else {
        // If not, we push it into the exit array to stash the movie so we don't loose the data.
        exit.push(movie);
      }
    });
  }

  // Now, we must check the exit array to see if any movies need to be put back since filter values have changed.
  exit.forEach(function (movie) {
    if(genreEnabled(movie.subject) && awardsEnabled(movie.awards) && inYearRange(movie.year) && titleRegex(movie.title)) {
      // If we pass all filters, push the movie into the moviesArr, and remove it from the exit array.
      enter.push(movie);
    }
  });

  exit = exit.notIn(enter);

  // Set the data.children array to the enter array (our movies that passed all tests).
  data.children = enter;

  // Reset the pack value.
  pack.value(function(d) {
    return d.popularity + 10;
  })

  // Re-sort the pack based on the current value of sortbyGlobal (which may have
  // changed since our last update).
  pack.sort(function(a, b) {
    if(sortbyGlobal == "genre") {
      return a.subject < b.subject ? -1 : a.subject > b.subject ? 1 : 0;
    }
    else if(sortbyGlobal == "year") {
      return b.year - a.year;
    }
    else if(sortbyGlobal == "popularity") {
      return b.popularity - a.popularity;
    }
    else {
      return a.awards < b.awards ? -1 : a.awards > b.awards ? 1 : 0;
    }
  });

  // Repack the nodes.
  var newData = pack.nodes(data);

  // Set the bound circle data, with key (anon-function)
  var add = svg.selectAll("circle").data(newData, function (d) {
    return d.title ? d.title.toLowerCase().replace(/\W+/g,"-") : "root";
  });

  // Specify transition update.
  add.transition().duration(1000).delay(200)
    .attr("cx", function(d) { return isNaN(d.x) ? 0 : d.x ; })
    .attr("cy", function(d) { return isNaN(d.y) ? 0 : d.y ; })
    .attr("r", function(d) { return isNaN(d.r) ? 0 : d.r ; })

  // Specify what happends with newly added data.
  add.enter()
    .append("g")
    .append("circle")
      .attr("cx", function(d) { return isNaN(d.x) ? 0 : d.x ; })
      .attr("cy", function(d) { return isNaN(d.y) ? 0 : d.y ; })
      .attr("r", function(d) { return isNaN(d.r) ? 0 : d.r ; })
      .attr("class", function(d) { 
        var classes = "node ";

        (d.children) ? classes += "root " : classes += "leaf ";

        if(d.name)            classes += "name-"        + d.name.toLowerCase().replace(/\W+/g,"-")     + " ";
        if(d.title)           classes += "title-"       + d.title.toLowerCase().replace(/\W+/g,"-")    + " ";
        if(d.popularity > 0)  classes += "p"            + parseInt(d.popularity/10)                    + " ";
        if(d.popularity <= 0) classes += "p"            + "0"                                          + " ";
        if(d.subject)         classes +=                  d.subject.toLowerCase().replace(/\W+/g,"-")  + " ";
        if(d.year)            classes += "year-"        + d.year                                       + " ";
        if(d.year)            classes += "y"            + parseInt((d.year % 1900) / 10)               + " ";
        if(d.awards)          classes += "a"            + d.awards.toLowerCase()                       + " ";


        classes += colorScheme();
        return classes;
   });

  // Specify what to do with data this is "exiting"
  // (no longer part of the dataset).
  add.exit().transition().duration(1000).attr("fill-opacity", 0).attr("r", 0).remove();

  // Show/Hide the "No Data" DIV if the dataset returns empty.
  // That is, no movies passed the filtering.
  if(data.children === undefined || data.children.length <= 0) {
    d3.select("svg").style('display', 'none');
    console.log(d3.select("svg").attr("width"));
    d3.select("div.nodata").style('display', 'block')
      .style("width", d3.select("svg").attr("width") + "px")
      .style("height", d3.select("svg").attr("height") + "px");
  }
  else {
    d3.select("div.nodata").style('display', 'none');
    d3.select("svg").style('display', 'block');
  }

  // Set the Modal Popup menus for each circle element.
  addContextMenus();

  d3.select("#misc-count").html(format(getNodeCount()));

  d3.selectAll("circle.root").attr("filter", "url(#drop-shadow)");

}

/**
 * Initialize the genres array based on the checked value.
 * Important in Firefox, as if you refresh the boxes stay unchecked.
 */
function setGenres() {
  d3.selectAll("input[type='checkbox']").each(function (e) {
    if(this.checked) {
      genres.push(this.value);
    }
  });
}


/**
 * @return The current "colorby" colorscheme.
 */
function colorScheme() {
  var selected = '';

  d3.selectAll(".colorby").each(function (e) {
    if(this.checked) { selected = this.value; }
  });

  return selected;
}

/**
 * @return The number of currrently unfiltered nodes shown.
 */
function getNodeCount() {
  return (data.children === undefined || data.children.length <= 0) ? 0 : data.children.length;
}


/**
 * Create the DIV and Children elements for each circle's modal "hoverover" menu.
 */
function addContextMenus() {

  /* Popup Modal */

  // Modal Popup on Mouseover
  svg.selectAll("circle").on("mouseover", function(d) {

    // Get the cursor's current position
    var position = d3.mouse(this.parentNode.parentNode.parentNode.parentNode);

    // If a context menu is already displayed, remove it.
    d3.select('#context-menu').remove();
    
    contextMenu = d3.select("body").append('div')
      .attr("id", "context-menu")
      .style('position', 'absolute')

      // Move the menu to the cursor location... but not exactly,
      // because right on top is somewhat annoying... so + 10px.
      .style('left' , position[0] + 50 + "px")
      .style('top'  , position[1] + 50 + "px")
      .style('opacity', 0)
      .style('display', 'block');

      // Add the node's title.
      // If it's a movie, add the title, if it's a popularity circle, then add d.desc, else add d.name
      contextMenu.append("h3").text((d.title) ? d.title : (d.desc) ? d.desc : d.name);

      // If we have a movie node, then we have more information to add.
      if(d.title) {

        // Add a simple <hr> element
        contextMenu.append("hr");

        var attrContainer = contextMenu.append("div")

        attrContainer.attr("id", "movie-attributes");

        var attribute;

        // Add Div, Header, and Text elements for the Year Column Data
        attribute = attrContainer.append("div").attr("class", "attribute year odd");
        attribute.append("h4").attr("class", "attribute-header").text("Year");
        attribute.append("div").text(d.year);

        // Add Div, Header, and Text elements for the Genre Column Data
        attribute = attrContainer.append("div").attr("class", "attribute genre even");
        attribute.append("h4").attr("class", "attribute-header").text("Genre");
        attribute.append("div").attr("class", "genre-" + d.subject.toLowerCase().replace(/\W+/g,"-")).text(d.subject);

        // Add Div, Header, and Text elements for the Length Column Data
        attribute = attrContainer.append("div").attr("class", "attribute length odd");
        attribute.append("h4").attr("class", "attribute-header").text("Length");
        attribute.append("div").text(d.length);

        // Add Div, Header, and Text elements for the Actor Column Data
        attribute = attrContainer.append("div").attr("class", "attribute actor even");
        attribute.append("h4").attr("class", "attribute-header").text("Actor");
        attribute.append("div").text(d.actor);

        // Add Div, Header, and Text elements for the Actress Column Data
        attribute = attrContainer.append("div").attr("class", "attribute actress odd");
        attribute.append("h4").attr("class", "attribute-header").text("Actress");
        attribute.append("div").text(d.actress);

        // Add Div, Header, and Text elements for the Director Column Data
        attribute = attrContainer.append("div").attr("class", "attribute director even");
        attribute.append("h4").attr("class", "attribute-header").text("Director");
        attribute.append("div").text(d.director);

        // Add Div, Header, and Text elements for the Awards Column Data
        attribute = attrContainer.append("div").attr("class", "attribute awards odd");
        attribute.append("h4").attr("class", "attribute-header").text("Awards");
        attribute.append("div").text(d.awards);

        // Add Div, Header, and Text elements for the Populatiry Column Data
        attribute = attrContainer.append("div").attr("class", "attribute popularity even last");
        attribute.append("h4").attr("class", "attribute-header").text("Popularity");
        attribute.append("div").attr("class", "popularity-score score-" + parseInt(d.popularity / 10)).text(d.popularity);
      }

      // Fade In...
      contextMenu.transition().duration(1000).style("opacity", 100);

  }) // End of .on method
  .on("mouseout", function(d) {
    contextMenu.transition().duration(1000).style("opacity", 0).remove();
  }); // End of .on method
}