// bob/website/BZ.js
// 6/20/2017 5:55:15 AM adds default model and removes zoom sync
// 6/8/2017 12:07:43 PM moving to jmol/...
// 6/5/2017 10:16:14 AM

var currentURL = window.location.href;
if (currentURL.indexOf('?') < 0)
  currentURL += "?ORCF/F1Tl1_ICSD_30268"
var classification = currentURL.substring(currentURL.indexOf('?')+1,currentURL.lastIndexOf('/'));
var structure = currentURL.substring(currentURL.indexOf(classification)+classification.length+1);
//alert([classification,structure])
var cif = "http://aflowlib.mems.duke.edu/AFLOWDATA/ICSD_WEB/" + classification + "/" + structure + "/" + structure + "_sprim.cif packed";
var jsonDataURL = "http://aflowlib.mems.duke.edu/users/jmolers/jmol/bandsData2JSON/?path=ICSD/LIB/" + classification + "/" + structure;
var CHEMAPPS = "https://chemapps.stolaf.edu/jmol/jsmol/php/jsmol.php?call=getRawDataFromDatabase&database=_&query=";
var AFLOW_ICSD_QUERY = "http://aflowlib.mems.duke.edu/AFLOWDATA/ICSD_WEB/CLASS/FORM_ICSD/?QUERY";
var AFLUX_QUERY = "http://aflowlib.duke.edu/search/API/?QUERY,catalog(icsd),$paging(0)";
var JMOLER_ENTRY_PAGE = "http://aflowlib.mems.duke.edu/users/jmolers/jmol/entry.php?id=";
var JMOLER_MAIN_PAGE = "http://aflowlib.mems.duke.edu/users/jmolers/jmol/";

http://aflowlib.duke.edu/AFLOWDATA/ICSD_WEB/MCLC/O8P2Rb1Ta1_ICSD_54098/?auid
// for example http://aflowlib.mems.duke.edu/search/API/?$Bravais_lattice_orig(MCLC),lattice_variation_relax,lattice_variation_orig,catalog(icsd),$paging(0)

// see http://aflowlib.mems.duke.edu/search/API and https://arxiv.org/abs/1612.05130

function getAfluxData(query, doSuccess) {
  var url = AFLUX_QUERY.replace(/QUERY/,query);
	var info = {
    type: "GET",
    dataType: "JSON",
    url: (document.location.href.indexOf("duke") < 0 ? CHEMAPPS + encodeURIComponent(url) : url),
    async: !!doSuccess,
    success: doSuccess,
    error: function() {alert('There was an error getting ' + url)}
  }
	return $.ajax(info).responseJSON;
}

function testAflux() {
  json = getAfluxData("compound(O8P2Rb1Ta1),lattice_variation_relax,lattice_variation_orig");
  alert(JSON.stringify(json, null, " "));
}

// for example http://aflowlib.mems.duke.edu/AFLOWDATA/ICSD_WEB/TRI/B1Cd1Li1O3_ICSD_200615/?lattice_variation_relax
//             http://aflowlib.mems.duke.edu/users/jmolers/jmol/bandsData2JSON/?path=ICSD/LIB/HEX/Ac1Br3_ICSD_31578

function getAflowICSDData(query, c, s, doSuccess) {
  c || (c = classification);
  s || (s = structure);
  var url = AFLOW_ICSD_QUERY.replace(/CLASS/,c).replace(/FORM_ICSD/,s).replace(/QUERY/,query);
	var info = {
    type: "GET",
    dataType: "text",
    url: url,
    async: !!doSuccess,
    success: doSuccess,
    error: function() {alert('There was an error getting ' + url)}
  }
	return $.ajax(info).responseText.trim();
}

function testAflowICSD() {
  alert(getAflowICSDData("auid"))
}


var arrData = []; // from the call to
var lineColors = ["red", "green", "blue", "black"];
var w = 0;
var h = 0;
var aspectRatio = 16/9;
var clickedElement = "All";
var clickedOrbital = "All";
var Displaying = false;
var elementList = [];
var Magnetic = false;
var magneticBand = null;
var isUp = false;
var isDown = false;
var bandDataLength = 1;


$(document).ready(function(){
	adjustWindowDimensions();
	getFile(jsonDataURL, processJsonBandData);
	loadJSmol();
  setTitleAndEntryPage();
  linkToMainPage();
});

// example: Fe1Na1O2_ICSD_33773 is a link to the Entry Page
function setTitleAndEntryPage() {
// TODO
  var id = getAflowICSDData("auid");
  $("#test").html("<a target=_blank href=" + JMOLER_ENTRY_PAGE + id + ">" + structure + "</a>");
}

//set up The Brillouin Zone as a link back to the Main Page
function linkToMainPage() {
  $('#h1').html('<a href="http://aflowlib.mems.duke.edu/users/jmolers/jmol/"> The Brillouin Zone</a>');
}

function adjustWindowDimensions() {
  w = window.innerWidth;
	h = window.innerHeight - (document.body.clientHeight + 50);
	if(w/h == aspectRatio) {

	}
	else if(w/h > aspectRatio) {
    w = aspectRatio*h;
	}
	else {
    h = w/aspectRatio;
	}
}

function getGraphDimensions(left, right, width) {
  var topMargin = Math.ceil(h*.03);
  if(topMargin < 20) {topMargin=20;}
  document.getElementById("graph2-buttons").style.top = topMargin - 21 +'px';
  var d = {margins: {top: topMargin, right: Math.ceil(w*right), bottom: Math.ceil(h*.03), left: Math.ceil(w*left)}};
    d.width = Math.ceil(w*width) - d.margins.left - d.margins.right;
    d.height = Math.ceil(h*.50) - d.margins.top - d.margins.bottom;
    return d;
}

function setAppletSizeAndPosition(id, Info) {
	var minSpacing = .05;
	if(Info.width*2+Math.ceil(3*minSpacing)>w) {
		Info.width = Math.ceil((w-3*minSpacing)/2);
		Info.height = Math.ceil((w-3*minSpacing)/2);
	}
	else {
		Info.width = Math.ceil(0.425*h);
		Info.height = Math.ceil(0.425*h);
	}

// set the position of the two apps
var left = (id == 'applet1' ? (w-0.3*Info.width)/3 : (2*w-0.3*Info.width)/3);
var top = 0.6*h;
	var applet = document.getElementById(id);
	applet.style.top = Math.ceil(top) + 'px';
	applet.style.left = Math.ceil(left) + 'px';

}

function getFile(fileName, success){
  var info = {
    type: "GET",
    dataType: "json",
    url: fileName,
    async: true,
    success: function(fileData) {success(fileData);},
    error: function(a, b, c) {
    	alert('There was an error getting ' + fileName);
    	/*
    	x=a.responseText.split("Title");//[0]+'x":0}}';
    	y=x[0].lastIndexOf("],");
    	x[0]=x[0].substring(0,y+1) + x[0].substring(y+2);
    	x=x.join("Title");
    	success(JSON.parse(x));*/
    }
  }
  $.ajax(info);
}

//this function changes normal words to Greek words (ex: G to Î“)
function escapeRegExp() {
  for(var i = 0; i<arrData.lineLabelsHTML.length; i++) {
    var str = arrData.lineLabelsHTML[i]
    var newstr = str.replace(/&Sigma;/g, '\u03A3').replace(/&Gamma;/g, '\u0393').replace(/<sub>/g, '').replace(/<\/sub>/g, '');
    arrData.lineLabelsHTML[i] = newstr;
  }
}

function processJsonBandData(Data) {
  arrData = Data;
  setMagnetic();
  fermi = arrData.Efermi;
  fixBandData()
  escapeRegExp()
  createBandPathBox()
  createBandStructureGraph()
  createDensityGraph();
  //showMagneticOption();
}

//set up data for Magnetic radio buttons
function setMagnetic() {
  Magnetic = (arrData["BandsDataMajority"] != null);
  if (Magnetic)
    document.getElementById("magnetic-wrap").style.display = "block";
  isUp = Magnetic && document.getElementById("magnetic_majority").checked
  isDown = Magnetic && document.getElementById("magnetic_minority").checked
  magneticBand = (isUp ? arrData["BandsDataMajority"]
                : isDown ? arrData["BandsDataMinority"]
                : null);
  bandDataLength = (!Magnetic || isUp || isDown ? 1 : 2)
}


//fix BANDSDATA, BandsDataMajority, BandsDataMinority for creating BandDensityGraph for each elements (line 386).
function fixBandData() {
  var d = arrData.PDOS_DATA;
  if (arrData.BANDSDATA != null) {
    d.Sum = [{s: d.Sum_s, p: d.Sum_p, d: d.Sum_d, f: d.Sum_f}];
  } else {
    d.Sum = [{s_majority: d.Sum_s_majority, p_majority: d.Sum_p_majority, d_majority: d.Sum_d_majority, f_majority: d.Sum_f_majority,
    s_minority: d.Sum_s_minority, p_minority: d.Sum_p_minority, d_minority: d.Sum_d_minority, f_minority: d.Sum_f_minority}]
  }
}

function createBandStructureGraph(bandDataArray, lineLocs, lineLabelsHTML) {
  if (!bandDataArray) {
    bandDataArray = (!Magnetic ? [arrData.BANDSDATA]
      : magneticBand == null ? [arrData.BandsDataMajority, arrData.BandsDataMinority]
      : [magneticBand]);
    lineLocs = arrData.lineLocs;
    lineLabelsHTML = arrData.lineLabelsHTML;
  }
      var d = getGraphDimensions(.04, .01, 0.75);
      var margin = d.margins;
	    var width = d.width;
	    var height = d.height;


	var x = d3.scaleLinear()
	    .range([0, width])

	var y = d3.scaleLinear()
	    .range([height, 0]);

	var xAxis = d3.axisBottom(x)
		.ticks(lineLocs.length)
		.tickValues(lineLocs)
		/*.tickFormat(arrData.lineLabelsHTML[0])*/
		.tickFormat(function(d,i){ return lineLabelsHTML[i] });

	var yAxis = d3.axisLeft(y)

	var svg = d3.select("#graph1").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append("rect")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("fill", "white");

  bandData = [];
  var len = bandDataArray.length;
	for(var j=0;j<len;j++) {
    var data = bandDataArray[j];
		var nLines = data[0].length-1;
		for(var i=0;i<nLines;i++) {
		 	bandData.push(
		 		{
		 			spin: (!Magnetic ? "both" : j==0 && !isDown ? "up":"down"),
		 			band: i+1,
		 		    values: data.map(function(d) {xxd = d; return {x: d[0],y: d[i+1]} }) // Could subtract the fermi energy from y values, however it doesn't correspond to duke's graph
		 	    });
		}
	}

	var minY = -12;
	var maxY = 12;
	var xRange = d3.extent(data, function(d) { return d[0]; });
	var minX = xRange[0];
	var maxX = xRange[1];

	x.domain(xRange);
	y.domain([minY,maxY]);

	var line = d3.line()
	.x(function(d) { return x(d.x); })
	.y(function(d) { return y(d.y); });

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	svg.append("g")
	  .attr("class", "y axis")
	  .call(yAxis)
	.append("text")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 6)
	  .attr("dy", ".71em")
	  .style("text-anchor", "end")
	  .text("Energy (Ev)");

	var band = svg.selectAll(".band")
	      .data(bandData)
	    .enter().append("g")
	      .attr("class", "band");

	band.append("path")
	  .attr("class", "line")
	  .attr("clip-path", "url(#graph-clip)")
	  .attr("d", function(d) { return line(d.values); })
	  .style('stroke-width', 1)
	  .style('stroke', function(d,i) {return (Magnetic ? (d.spin=="up" ? "#ff4d4d":"#0073e6"):"#0073e6");})

	var xAxisGrid = xAxis.ticks(lineLocs.length)
	    .tickSize(height, 0)
	    .tickFormat("")

	var yAxisGrid = yAxis.ticks(1)
	    .tickSize(-width, 0)
	    .tickFormat("")

	svg.append("g")
	    .classed('x', true)
	    .classed('grid', true)
	    .call(xAxisGrid)
	    .attr("clip-path", "url(#graph-clip)");

	svg.append("g")
	    .classed('y', true)
	    .classed('grid', true)
	    .call(yAxisGrid)
	    .attr("clip-path", "url(#graph-clip)");

	svg.append("clipPath")
	    .attr("id", "graph-clip")
	  .append("rect")
	  	.attr("x", 0)
	    .attr("y", 0)
	  	.attr("height", height)
	  	.attr("width", width);

	var borderPath = svg.append("rect")
		.attr("x", 1)
		.attr("y", 1)
		.attr("height", height-1)
		.attr("width", width-1)
		.attr("style", "outline: thin solid black;")
		.style("fill", "none");
}

function createDensityGraph() {
  var d = getGraphDimensions(.01, .03, .25);
    var margin = d.margins;
    var width = d.width;
    var height = d.height;

	var x = d3.scaleLinear()
	    .range([0, width])

	var y = d3.scaleLinear()
	    .range([height, 0]);

	var xAxis = d3.axisBottom(x)
		.tickSizeOuter(0)
		.tickSizeInner(0)
		.tickFormat("")

	var yAxis = d3.axisLeft(y)
		.tickSizeOuter(0)
		.tickSizeInner(0)
		.tickFormat("")

	var svg = d3.select("#graph2").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  	.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	    .attr("id", "graph2SVG");

	svg.append("rect")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("fill", "white");

//create Band Density Graph for each elements.
  var element = "Sum";
  var nElement = 0;
	if(clickedElement != "All") {
		element = clickedElement.substring(0,clickedElement.indexOf("("))
    nElement = clickedElement.substring(clickedElement.indexOf('(')+1,clickedElement.indexOf(')'));
	}
  var dosData = arrData.PDOS_DATA[element][nElement];
	var orbitalData = [];
  var ydata = arrData.PDOS_DATA.Energy;
  var len = bandDataLength;
	for(var k=0; k<len; k++) {
		var end = (!Magnetic ? "" : k==0 && !isDown ? "_majority" : "_minority");
		for(var i=0;i<arrData.PDOS_DATA.Orbitals.length;i++) {
      var spdf = arrData.PDOS_DATA.Orbitals[i];
		  if(clickedOrbital == "All" || clickedOrbital == spdf) {
        var xdata = dosData[spdf + end];
				orbitalData.push({
					orbital: spdf + end,
					values: ydata.map(function(d,j) {return {x: xdata[j], y: ydata[j]} })
				});
			}
		}
	}

	var minY = -12;
	var maxY = 12;
	var maxX = findMaxX(minY,maxY,dosData);
	var minX = (Magnetic ? -maxX :0);

	x.domain([minX,maxX]);
	y.domain([minY,maxY]);

	var line = d3.line()
	.x(function(d) { return x(d.x); })
	.y(function(d) { return y(d.y); });

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	svg.append("g")
	  .attr("class", "y axis")
	  .call(yAxis)
	.append("text")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 6)
	  .attr("dy", ".71em")
	  .style("text-anchor", "end")
	  .text("Energy (Ev)");

	var orbital = svg.selectAll(".orbital")
	      .data(orbitalData)
	    .enter().append("g")
	      .attr("class", "band");

	orbital.append("path")
	  .attr("class", "line")
	  .attr("clip-path", "url(#graph-clip)")
	  .attr("d", function(d) { return line(d.values); })
	  .style('stroke-width', 1)
	  .style('stroke', function(d,i) {
	  	index=i;
	  	if(clickedOrbital != "All") {
	  		for(var j = 0; j<2*arrData.PDOS_DATA.Orbitals.length; j++) {
	  			if(clickedOrbital == arrData.PDOS_DATA.Orbitals[j%arrData.PDOS_DATA.Orbitals.length]) {index = j%arrData.PDOS_DATA.Orbitals.length;}
	  		}
	  	}
	  	return lineColors[index%arrData.PDOS_DATA.Orbitals.length];
	  })
	  //.attr("id", function(d,i) {return arrData.PDOS_DATA.Orbitals[i]; })

	var xAxisGrid = xAxis.ticks(1)
	    .tickSize(height, 0)
	    .tickFormat("")

	var yAxisGrid = yAxis.ticks(1)
	    .tickSize(-width, 0)
	    .tickFormat("")

	if(Magnetic) {
		svg.append("g")
		    .classed('x', true)
		    .classed('grid', true)
		    .call(xAxisGrid)
		    .attr("clip-path", "url(#graph-clip)");
	}

	svg.append("g")
	    .classed('y', true)
	    .classed('grid', true)
	    .call(yAxisGrid)
	    .attr("clip-path", "url(#graph-clip)");

	 var borderPath = svg.append("rect")
	  .attr("x", 1)
	  .attr("y", 1)
	  .attr("height", height-1)
	  .attr("width", width-1)
	  .attr("style", "outline: thin solid black;")
	  .style("fill", "none");

	if(!Displaying) {
		Displaying = true;
		displayLegend(arrData.PDOS_DATA.Orbitals);
		displayButtons();
		loadDropdown();
	}
}

function displayButtons() {
	document.getElementById("graph2-buttons").style.display = "inline-block";
}

function loadDropdown() {
	var buttonList = ["Element","Orbital"];
	var data = [createElementList(),arrData.PDOS_DATA.Orbitals];
	for(var i=0; i<buttonList.length; i++){
		var dropdown = document.getElementById(buttonList[i] + "-dropdown");
		for(var j=0; j<=data[i].length; j++) {
			var newChild = document.createElement("a");
			newChild.innerHTML = "All";
			newChild.id = "all" + buttonList[i] + "s-filter";
			if(j!=0) {
				newChild.innerHTML = data[i][j-1];
				newChild.id = data[i][j-1] + "-filter";
			}
			newChild.className = "dropdown" + buttonList[i] + "s";
			newChild.index = j;
			newChild.btn = i;
			newChild.onmouseover = function () {
				if(this.innerHTML != eval("clicked" + buttonList[this.btn])) {
					this.style.backgroundColor = "gray";
					if(this.index!=0 && this.className == "dropdownOrbitals") {
						this.style.backgroundColor = lineColors[this.index-1];
					}
					this.style.color = "white";
					this.style.borderColor = "black";
				}
			}
			newChild.onmouseout = function() {
				if(this.innerHTML != eval("clicked" + buttonList[this.btn])) {
					this.style.backgroundColor = "#f5f7ff";
					this.style.color = "black";
				}
			}
			if(i==0) {
				newChild.onclick = function() {
					if(this.innerHTML != clickedElement) {
						clickedElement = this.innerHTML;
						styleSelects();
						refreshGraph2();
					}
				};
			}
			else {
				newChild.onclick = function() {
					if(this.innerHTML != clickedOrbital) {
						clickedOrbital = this.innerHTML;
						styleSelects();
						refreshGraph2();
					}
				};
			}
			dropdown.appendChild(newChild);
		}
	}
	styleSelects();
}

// create the element list for Density Graph
function createElementList() {
	for(var i = 0; i<arrData.species.length; i++){
		for(var j=0; j<Object.keys(arrData.PDOS_DATA[arrData.species[i]]).length; j++) {
			elementList.push(arrData.species[i] + "(" + Object.keys(arrData.PDOS_DATA[arrData.species[i]])[j] + ")");
		}
	}
	return elementList;
}

function styleSelects(){
	var orbital = "";
	for(var i = 0; i<=arrData.PDOS_DATA.Orbitals.length; i++) {
		if(i == 0) {orbital = document.getElementById("allOrbitals-filter");}
		else {orbital = document.getElementById(arrData.PDOS_DATA.Orbitals[i-1] + "-filter");}
		orbital.style.backgroundColor = "#f5f7ff";
		orbital.style.color = "black";
	}
	if(clickedOrbital != "All") {
		orbital = document.getElementById(clickedOrbital + "-filter");
		orbital.style.backgroundColor = lineColors[orbital.index-1];
	}
	else {
		orbital = document.getElementById("allOrbitals-filter");
		orbital.style.backgroundColor = "gray";
	}
	orbital.style.color = "white";
	orbital.style.borderColor = "black";

	var element = "";
	for(var i = 0; i<=elementList.length; i++) {
		if(i == 0) {element = document.getElementById("allElements-filter");}
		else {element = document.getElementById(elementList[i-1] + "-filter");}
		element.style.backgroundColor = "#f5f7ff";
		element.style.color = "black";
	}
	if(clickedElement != "All") {element = document.getElementById(clickedElement + "-filter");}
	else{element = document.getElementById("allElements-filter");}

	element.style.backgroundColor = "gray";
	element.style.color = "white";
	element.style.borderColor = "black";
}

function refreshGraph2() {
	d3.select("#graph2SVG").remove();
	var x = document.getElementById("graph2").getElementsByTagName("svg")[0];
	x.parentNode.removeChild(x);
  document.getElementById("changeElement-button-text").innerHTML = clickedElement;
  document.getElementById("changeOrbital-button-text").innerHTML = clickedOrbital;
  createDensityGraph();
}

function outlierTest(dataPoint, data) {
	var outlier = false;
	var index = data.indexOf(dataPoint);
	for(var i = 0, j = 0; i<2; i++){
		if(index != i*(data.length-1)){
			if(data[index-Math.pow(-1,i)]/data[index] < .05) {j++;}
		}
	}
	if(j >= 2) {outlier = true;}
	return outlier;
}

function findMaxX(minY,maxY,dosData) {
	var orbitals = (clickedOrbital == "All" ? arrData.PDOS_DATA.Orbitals:[clickedOrbital]);
	var maxX = 0;
	var tempMax,energyValue;
  var bandDataLength = (Magnetic ? 2:1);
	for(var i=0;i<orbitals.length;i++) {
		for(var j=0,end;j<bandDataLength;j++) {
			if(Magnetic){end=(j==0 ? "_majority":"_minority");}
			else{end="";}
			var tempData = dosData[orbitals[i] + end];
			while(true) {
				tempMax = (j==0 ? d3.max(tempData) : d3.min(tempData));
				if(tempMax==0) {break;}
				energyValue = arrData.PDOS_DATA.Energy[tempData.indexOf(tempMax)];
				if(energyValue>minY && energyValue<maxY) {break;}
				else {tempData.splice(tempData.indexOf(tempMax),1);}
			}
			tempMax = Math.abs(tempMax);
			if(tempMax>maxX) {maxX = tempMax;}
		}
	}
	return 1.05*maxX;
}

function displayLegend(orbitals) {
	for(var i = 0; i<orbitals.length; i++){
		var orbit = document.getElementById(orbitals[i] + '-orbital')
		orbit.innerHTML = orbitals[i];
		orbit.style.color = lineColors[i];
		orbit.style.top = (Math.ceil(w*.02)+i*20) + 'px';
		var orbitLine = document.getElementById(orbitals[i] + '-orbital_line')
		orbitLine.innerHTML = '__';
		orbitLine.style.color = lineColors[i];
		orbitLine.style.top = (Math.ceil(w*.02)+i*20-7) + 'px';
	}
}

//show BandStructureGraph and DensityGraph changed when magnetic buttons are clicked.
function magneticClicked(btn) {
  setMagnetic();
  resetGraph();
  createBandStructureGraph();
  createDensityGraph();
}

var segments = [];

function createBandPathBox() {
  segments = getBandPathSegments();
  showBandPathSelection(segments);
  document.getElementById("bandPathText").value = "";
}

//get data for each band path segments in var data form.
function getBandPathSegments() {
  var segments =[];
  var a = arrData.lineLabelsHTML;
  var previous = a[0];
  var index1 = 0, index2 = 0;
  var bandData = ((arrData.BANDSDATA != null) ? arrData.BANDSDATA : arrData.BandsDataMajority);
  for (var i=1; i<a.length; i++) {
    var kpoints = a[i].split("|"); //ex: kpoints P|N then label1=P, label2=N
    var x1 = arrData.lineLocs[i-1], x2 = arrData.lineLocs[i];
    while (bandData[index2][0] != x2)
      index2++;
    var data = {label1: previous, label2: kpoints[0], x1: x1, x2: x2, index1: index1, index2: index2};
    segments.push(data);
    previous = kpoints[kpoints.length-1];
    index1 = index2 + kpoints.length-1;
  }
  return segments;
}

//show selections in Custom Band Path
function showBandPathSelection(segments) {
  for(var i = -1; i < segments.length; i++) {
    var opt = (i<0 ? "Original" : segments[i].label1 + "-" + segments[i].label2);
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = i;
    document.getElementById("selectBandPath").appendChild(el);
  }
}

var customPath =[];

//update customPath when band path is selected
function pathSelected(el) {
  var index = parseInt(el.value);
  if (index == -1) {
    resetGraph();
    createBandStructureGraph();
    createDensityGraph();
    document.getElementById("bandPathText").value = "";
    return;
  }
  customPath.push(segments[index]);
  updateCustomPath();
}

function updateCustomPath() {
  var majority = [];
  var minority =[];
  var noSpin =[];
  var bandDataArray = (!Magnetic || isUp || isDown ? [noSpin] : [majority, minority]);
  var lineLocs = [];
  var lineLabelsHTML = [];
  var str = "";
  if (customPath[0]) {
    lineLabelsHTML[0] = str = customPath[0].label1;
  }
  var previous = str;
  var previousX2 = 0;
  var bands = (isUp || isDown ? magneticBands : arrData.BANDSDATA);
  for (var i=0; i<customPath.length; i++) {
    var path = customPath[i];
    var shift = path.x1 - previousX2;
    previousX2 = path.x2 - shift;
    for (var j=path.index1; j<=path.index2; j++) {
      if (Magnetic && !isUp && !isDown) {
        majority.push(fixXValue(arrData.BandsDataMajority[j], shift))
        minority.push(fixXValue(arrData.BandsDataMinority[j],shift))
      } else {
        noSpin.push(fixXValue(bands[j], shift))
      }
    }
    lineLocs[i] = path.x1 - shift;
    if (previous != path.label1) {
      str+= "|" + path.label1;
      lineLabelsHTML[i] = previous + "|" + path.label1;
    } else {
      lineLabelsHTML[i] = previous;
    }
    previous = path.label2;
    str+= "-" + previous;
  }
  lineLocs[i] = previousX2;
  lineLabelsHTML[i] = previous;
  document.getElementById("bandPathText").value = str;
  if (str) {
    resetGraph();
    createBandStructureGraph(bandDataArray, lineLocs, lineLabelsHTML)
    createDensityGraph();
  }
}

//delete full BandStructureGraph and DensityGraph
function resetGraph(){
  d3.select("#graph1SVG").remove();
  var x = document.getElementById("graph1").getElementsByTagName("svg")[0];
  x.parentNode.removeChild(x);
  d3.select("#graph2SVG").remove();
  var x = document.getElementById("graph2").getElementsByTagName("svg")[0];
  x.parentNode.removeChild(x);
}

function fixXValue(bands, shift) {
  var a = bands.slice();
  a[0] -= shift;
  return a;
}

/*
//get Custom Data for band path. If the order number of kpoints in the lineLabelsHTML is the same as its order number in lineLocs,
//then return cutomList[x-values in lineLocs]
function getCustomData() {
  var customList = [];
  for(var i=0; i<arrData.lineLocs.length; i++) {
    for (var j=0; j<arrData.lineLabelsHTML[arrData.lineLocs[i]].length; j++) {
      customList.push(arrData.lineLocs[i] + "(" + Object.keys(arrData.lineLabelsHTML[arrData.lineLocs[i]])[j] + ")");
    }
  }
  return customList;
}

//create bandDataList[array number in BANDSDATA corresponding to x-values]
function getSubPaths() {
  for(var i=0; i<customList.length; i++) {
    for(var j=0; j<arrData.BANDSDATA.length; j++) {
      var bandDataList = [];
      if (customList[i] = arrData.BANDSDATA[j].d[0]) {
        bandDataList.push(arrData.BANDSDATA[j]);
      }
    }
  }
  return bandDataList;

  var subPaths = [];
  for(j = 0; j < bandDataList.length-1; j++) {
	   subPaths.push([]);
        subPaths[j].push(bandDataList[j]);
        subPaths[j].push(bandDataList[j+1]);
  }
  return subPaths;
}

function addSubPath() {

} */

// JSmol info
var jsmolDir = "../test/jsmol";

Info = {
  width:  0,
  height: 0,
  debug: false,
  color: "black",
  addSelectionOptions: false,
  serverURL: "https://chemapps.stolaf.edu/jmol/jsmol/php/jsmol.php",
  use: "HTML5",
  j2sPath: jsmolDir + "/j2s",
  //readyFunction: function(applet) {Jmol._getElement(applet, "appletdiv").style.border="1px solid blue";},
  //script: "",
  //disableJ2SLoadMonitor: true,
  disableInitialConsole: true
}

function jmolSyncCallback(app,info) {
  return (info.indexOf("zoomBy") >= 0 ? "" : info);
}

function loadJSmol() {
  // Create JSmol apps for BZ and crystal structure

  // set the width and height
setAppletSizeAndPosition ('applet1', Info)
setAppletSizeAndPosition ('applet2', Info)

  // create header, jmol html, options, and save options, then put them all together at the end

  //var header = "<br /><br /><b>Space Group</b>: "
  //   + (AFLOW.spaceGroupNo ? AFLOW.spaceGroupName + " (#" + AFLOW.spaceGroupNo + ")" : "N/A")

  // jmol1 (#applet2) is the crystal structure
  Info.script = "set synccallback 'jmolSyncCallback';set zoomlarge false; set platformspeed 3;set antialiasDisplay; background lightgray; frank off; set showUnitCellinfo false; load " + cif
  var jmol1 = Jmol.getAppletHtml("jmolApplet1", Info)
  $("#applet2").html(jmol1);

  // jmol2 (#applet1) is the BZ
  Info.script = "set synccallback 'jmolSyncCallback';frank off; set antialiasDisplay; macro aflow; aflowCreateBZ('" + classification +"','" + structure + "');zoom * 0.8; delay 1.0; sync * on; sync * 'set syncmouse true'"
  var jmol2 = Jmol.getAppletHtml("jmolApplet2", Info)
  $("#applet1").html(jmol2);


  /*

  var options = ""

  Jmol.setButtonCss(null,"style='width:180px'");

  options += "<b>Relaxed Structure:</b><br /><br />"
     + Jmol.jmolButton(jmolApplet0, AFLOW.load(""), "As calculated")
           + "<br />"
     + Jmol.jmolButton(jmolApplet0, AFLOW.load("_sconv"), "Standard conventional")
     + "<a href=http://www.sciencedirect.com/science/article/pii/S0927025610002697>[info]</a>"
           + "<br />"
	   + Jmol.jmolButton(jmolApplet0, AFLOW.load("_sprim"), "Standard primitive")
     + "<a href=http://www.sciencedirect.com/science/article/pii/S0927025610002697>[info]</a>";

  Jmol.setButtonCss(null,"style='width:110px'");

  options += "<br /><br /><b>Supercell:</b><br /><br />"
     + Jmol.jmolButton(jmolApplet0, "key ='';load '' {2 2 2} packed", "2x2x2")
     + Jmol.jmolButton(jmolApplet0, "key ='';load '' fill 20", "20&#8491; box")
     + "<p>" + AFLOW.input("dim_1") + " X " + AFLOW.input("dim_2") + " X " + AFLOW.input("dim_3") + "</p>"
     + "<input type='button' id='build_button' value='Build' style='width:160px'>"
     + Jmol.jmolButton(jmolApplet0, AFLOW.load("_sconv") + ";reset;", "RESET");

  Jmol.setButtonCss(null,"style='width:110px'")

  options += "<br /><br /><b>Visualization:</b><br /><br />"

     + Jmol.jmolButton(jmolApplet0, "spacefill only;spacefill 23%;wireframe 0.15","Ball & Stick")
     + Jmol.jmolButton(jmolApplet0, "spacefill #alt:SETTING van der Waals Spheres", "Spacefill")
           + "<br />"
     + Jmol.jmolCheckbox(jmolApplet0, "spin on","spin off","Rotation")
     + Jmol.jmolCheckbox(jmolApplet0, "label  %a ","labels off","Labels")
     + Jmol.jmolCheckbox(jmolApplet0, "background white","background black", "Background");
     Jmol.setButtonCss(null,"style='width:30px'");

     options += "<br />axis: "
     + Jmol.jmolButton(jmolApplet0, "moveto axis a","a")
     + Jmol.jmolButton(jmolApplet0, "moveto axis b","b")
     + Jmol.jmolButton(jmolApplet0, "moveto axis c","c");
     Jmol.setButtonCss(null,"style='width:110px'");
     options += Jmol.jmolButton(jmolApplet0, "reset","RESET");

  options += "<br /><br /><b>Crystallographic Planes:</b><br />"
     + "<p> h:" + AFLOW.input("plane_1") + " k:" + AFLOW.input("plane_2") + " l:" + AFLOW.input("plane_3") + "</p>"
     + "<input type='button' id='plane_button' value='Show plane' style='width:160px'>"
     + Jmol.jmolButton(jmolApplet0, "isosurface off", "RESET");

  //BEGIN BADER ISOSURFACES
  if (AFLOW.baderUnitcell) {

	  options += "<br /><br /><b>Bader Isosurfaces:</b><br />";

	  Jmol.setButtonCss(null,"style='width:50px'");
    var cutoffs = [20, 30, 40];
    var nSpecies = AFLOW.baderVSpecies.length;
    for (i = 0; i < cutoffs.length; i++) {
      var cutoff = cutoffs[i];
 	    options += "<br />Cutoff = 0." + cutoff + "<br />";
      var unitcell = "packed UNITCELL["+ AFLOW.baderUnitcell.join(" ") + "]";
  	  for(var j = 0; j < nSpecies; j++) {
        var spec = AFLOW.baderVSpecies[j];
   	    options += Jmol.jmolButton(jmolApplet0, AFLOW.load("", unitcell)
  	         + ";isosurface delete;" + AFLOW.iso2oss(spec, cutoff, j), spec);
  	  }
  	  var s = "isosurface delete;" + AFLOW.load("", unitcell);
  	  for(var j = 0; j < nSpecies; j++)
  	    s += AFLOW.iso2oss(AFLOW.baderVSpecies[j], cutoff, j);
  	  options += Jmol.jmolButton(jmolApplet0, s, "All");
    }
    options += "<br />";
	}
  //END BADER ISOSURFACES

  Jmol.setButtonCss(null,"style='width:140px'");

  var saveoptions = "<b>Save:</b>"
     + Jmol.jmolButton(jmolApplet0, "write FILE ?","CIF FILE")
     + Jmol.jmolButton(jmolApplet0, "write STATE ?.spt","STATE")
     + Jmol.jmolButton(jmolApplet0, "write IMAGE ?.jpg","JPG")
     + Jmol.jmolButton(jmolApplet0, "write IMAGE ?.png","PNG")
     + Jmol.jmolButton(jmolApplet0, "write PNGJ ?.png","PNG+Jmol");

  var html =  header + "<table><tr><td align=center valign=top>" + jmol + "</td>"
            + "<td><form>" + options + "</form></td></tr>"
            + "<tr><td align=center>" + saveoptions + "</td></tr></table>";
 */


  // set non-Jmol button click events
  /*
  $("#build_button").click(function() {
    var scriptCommand = "key='';load '' {" +  $("#dim_1").val() + " " + $("#dim_2").val() + " " + $("#dim_3").val() + "} packed;";
    Jmol.script(jmolApplet0, scriptCommand);
  });
  $("#plane_button").click(function() {
      // BH removed: key='';load '' {444 555 -1} packed;  -- why reload?
    var scriptCommand = "isosurface ID 'hklplane' hkl {" +  $("#plane_1").val() + " " + $("#plane_2").val() + " " + $("#plane_3").val() + "} colorscheme sets translucent 0.5 green";
    Jmol.script(jmolApplet0, scriptCommand);
  });
  */
}