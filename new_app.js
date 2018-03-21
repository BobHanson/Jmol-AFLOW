
var displayPTable = "False";
var Classification = "none";
var elementList = ["H","He","Li","Be","B","C","N","O","F","Ne","Na","Mg","Al","Si","P","S","Cl","Ar","K","Ca","Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr","Rb","Sr","Y","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","I","Xe","Cs","Ba","La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu","Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn","Fr","Ra","Ac","Th","Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr","Rf","Db","Sg","Bh","Hs","Mt","Ds","Rg","Cn","Nh","Fl","Mc","Lv","Ts","Og"];
var tableOn = "False";
var allCompounds=[];
var searchResults=[];
var tbl = "";
var greyedElements = [];
var notOKCompounds = [];
var ICSDWEB = "http://aflowlib.mems.duke.edu/";
var kpoints = "/KPOINTS.bands";
var chemappsWeb = "https://chemapps.stolaf.edu/jmol/jsmol/php/jsmol.php?call=getRawDataFromDatabase&database=_&query=";
var searchQuery1 = "http://aflowlib.duke.edu/search/API/?$Bravais_lattice_relax(";
var searchQuery2 = "),catalog(icsd),lattice_variation_relax,lattice_variation_orig,$paging(0)";
var searchCAT = "http://aflowlib.duke.edu/search/API/?catalog(CAT),lattice_variation_relax,lattice_variation_orig,$paging(0)";
//fileReturn: searchQuery1 + Classification + searchQuery2
var dataPath = "http://aflowlib.mems.duke.edu/users/jmolers/jmol/get.php?file="
var entryPage = "http://aflowlib.mems.duke.edu/users/jmolers/jmol/entry.php?id="
var bzPage = "http://aflowlib.mems.duke.edu/users/jmolers/jmol/BZ.html?"
var boxList = [[false,"NOT",[],""],[false,"MidnightBlue",[],""],[false,"DarkSlateGrey",[],""],[false,"CornflowerBlue",[],""]]; 
var only = false;
var testFlag = false;
var showRed = false;
var showOrange = false;
var dropClicked = false;
var fileContents = "";
var boxContents = "";
var textinput = "";

//this function retrieves a text file
function getFile(goUrl, doSuccess){
	if (document.location.href.indexOf("duke") <0) {
		goUrl = chemappsWeb + encodeURIComponent(goUrl);
	}
  var info = {
    type: "GET",
    dataType: "text",
    url: goUrl,
    async: true,
    success: doSuccess,
    error: function() {alert('There was an error getting ' + goUrl)}
  }
	$.ajax(info);
}

//this function retrieves an AFLUX file
function getAfluxFile(goURL, doSuccess) {
	if (document.location.href.indexOf("duke") <0) {
		goURL = chemappsWeb + encodeURIComponent(goURL);
	}
	var info = {
    type: "GET",
    dataType: "JSON",
    url: goURL,
    async: true,
    success: doSuccess,
    error: function(a) {
			alert('There was an error getting ' + goURL);
		}
  }
	$.ajax(info);
}

//this function tells the page what to do when a lattice type is clicked
function button_clicked(clickedBtn) {
	textinput = "";
  var btns = document.getElementsByClassName('database');
	document.getElementById("status_bar").innerHTML = "<br />Loading...";
	document.getElementById("initialHelp").style.display = "none";
	notOKCompounds = [];
	for (var i = 0; i < btns.length; i++) { //set all the buttons to black text on white background
    document.getElementById(btns[i].id).style.color = "black";
    document.getElementById(btns[i].id).style.backgroundColor = "white";
  }
  clickedBtn.style.color = "white"; //find the clicked button and format it as white text on blue background
  clickedBtn.style.backgroundColor = "#41A7FA";
  if (displayPTable === "False") {
    displayPTable = "True"; //display periodic table
    var periodicTable = document.getElementById('periodic-table-wrap');
    periodicTable.style.display = "inline-block";
		document.getElementById('status_bar').style.display = "inline-block"; //display status bar
		//var boxBlock = document.getElementById('chooseBox');
		chooseBox.style.display = "block"; //display colored buttons
		document.getElementById('search-options-wrap').style.display = "block"; //display search options
		var down = 0;
    function frame() {
      down+=150;
      periodicTable.style.maxHeight = down + "px"; //make the periodic table tall
      if (down >= 450){
        clearInterval(id);
      }
    }
    var id = setInterval(frame, 5);
		document.getElementById('export-wrap').style.display = "inline-block"; //display download button
  }
	getClassData(clickedBtn.id); //go get the list of compounds
}

function getClassData(classID) {
  Classification = classID;
  if(classID.indexOf("CAT.")==0){
  	var url = searchCAT.replace(/CAT/,classID.substring(4))
  } else {
  	var url =searchQuery1 + classID + searchQuery2;
  }

  getAfluxFile(url, createClassList);
}

function createClassList(classData) {
	allCompounds = classData; //we've got a list of compounds with data attached to them
  for(var i=allCompounds.length; --i>=0;) {
		var currentCompound = allCompounds[i];
		var structure = currentCompound.aurl.substring(currentCompound.aurl.lastIndexOf("/")+1); //looks like "H12C4Fe2_ICSD_2374892"
    var a = structure.split("_ICSD_");
		currentCompound.name = a[0];
		currentCompound.ICSD = a[1];
		currentCompound.elements = getElementNumbers(currentCompound.compound); //what elements are in the compound?
		currentCompound.structure = structure;
		currentCompound.isOK = (currentCompound.lattice_variation_orig == currentCompound.lattice_variation_relax); //check to see if the original and relaxed lattice variations are the same
		if (currentCompound.aurl.indexOf("/" + Classification + "/") < 0) { //if the aurl does not contain the lattice type that we're looking for, take that compound out of the list - it doesn't belong there
			allCompounds.splice(i,1);
		}
	}
	boxClicked(document.getElementById("MidnightBlue")); //set the first box to clicked so the user can go right to selecting elements
	if (dropClicked) { //if the search options are displayed, keep them displayed
		document.getElementById('selectOptions').style.display = "inline-block";
	}
	searchCompounds();
}


function getElementNumbers(compound) {
	var nums = [];
	for (var i = 0; i < elementList.length; i++) { //go through the list of elements
		var index = compound.indexOf(elementList[i]); //find where the element is in the name of the compound
		if (index >= 0 && !isNaN(compound.charAt(index+elementList[i].length))) { //if it is there and the character right after the element name is a number (e.g. H12 vs He3)
			var elementNum = i+1; //the atomic number is 1+the index of the element in elementList
			nums.push(elementNum); //add that number to the list of elements
		}
	}
	return nums;
}

//this function opens the help page
function openHelp() {
	window.open("help.html");
}

//this function is for the advanced search bar, so hitting return makes it do the search thing
//this is necessary because if you just have "onsubmit" it reloads the page and we don't want that
function checkKey(e) {
	e || (e = window.event);
	if (e.keyCode == 13) { //that's the code for the enter key
		advSearch();
	}
}

function advSearch() {
	var searchBox = document.getElementById("afluxBox");
	textinput = searchBox.value; //whatever's been typed into the search bar gets assigned to a string variable
	if (textinput) {
		var arrinput = textinput.split(" ");
		textinput = arrinput.join(""); //take the spaces out so it's actually a valid query
		var url = searchQuery1 + Classification + "),catalog(icsd)," + textinput + ",lattice_variation_relax,lattice_variation_orig,$paging(0)";
		getAfluxFile(url, createClassList);
	}
}

//this is what happens when you click on one of the colored boxes
function boxClicked(clickedBox) {
	var boxID = clickedBox.id;
	var boxes = document.getElementsByClassName('selector');
	for (var i = 0; i<boxes.length-1; i++) { //go through the list of boxes and make their borders transparent
		document.getElementById(boxes[i].id).style.borderColor = "transparent";
	}
	document.getElementById(boxes[4].id).style.borderColor = (only ? "#cc00ff" : "black"); //make sure the ONLY box has the correct border color
	for (var i=0; i < boxList.length; i++) { //go through the list of boxes
		if (boxList[i][1] == boxID) {  //if it is in fact the box we clicked on
			boxList[i][0] = true; //flip it to selected
			clickedBox.style.borderColor = "#cc00ff"; //make the border pink
		}
		else {
			boxList[i][0] = false; //otherwise, flip it to not-selected
		}
	}
}

//this is what happens when you click on the button labeled ONLY
function onlyClicked(onlyBtn) {
	var boxes = document.getElementsByClassName('selector');
	for (var i = 0; i<boxes.length; i++) {
		document.getElementById(boxes[i].id).style.borderColor = "transparent"; //make all the other box borders transparent
	}
	for (var i = 0; i < boxList.length; i++) {
		boxList[i][0] = false; //make all the boxes not-selected
	}
	if (only) { //if the button has already been clicked on, un-click it
		only = false;
		onlyBtn.style.borderColor = "black";
	}
	else { //if it hasn't, click it
		only = true;
		onlyBtn.style.borderColor = "#cc00ff";
	}
	searchCompounds();
}

//this is what happens when you click on an element in the periodic table
function elementClicked(clickedElement) {
	var thisColor,yesIndex;
	for (var i = 0; i < boxList.length; i++) {
		if (boxList[i][0]) { //if that box is selected
			yesIndex = i;
			//pick what color the element is going to be highlighted
			if (i==0) { //'not' box
				thisColor = "black";
				break;
			}
			else {
				thisColor = boxList[i][1];
				break;
			}
			break;
		}
	}
	var atomicNumber = parseInt(clickedElement.dataset.pos); //the atomic number of the element
	var theseElements = boxList[yesIndex][2]; //what elements are already in the box
	var thisIndex = hasElement(theseElements,atomicNumber); //where the element is in the box we're talking about
	if (thisIndex >= 0) { 
		//if the element is already in the box we're talking about, remove it and change its color back to normal
		boxList[yesIndex][2].splice(thisIndex,1);
		clickedElement.style.color = "#555";
		clickedElement.style.backgroundColor = "transparent";
	}
	else {
	//if the element is not in the box we're talking about, run through the other boxes
	//if it's in one of the other boxes, remove it from the other box
		for (var i = 0; i < boxList.length; i++) {
			var otherBoxIndex = hasElement(boxList[i][2],atomicNumber);
			if (otherBoxIndex >= 0) { 
				boxList[i][2].splice(otherBoxIndex,1);
			}
		}
		boxList[yesIndex][2].push(atomicNumber); //put it in the correct box
		clickedElement.style.color = "white"; //make the text white
		clickedElement.style.backgroundColor = thisColor; //and the background the color of the box
	}
	searchCompounds();
}

//an indexOf function for arrays of numbers
function hasElement(a,n) {
	for (var i = a.length; --i>=0;) {
		if (a[i] == n) {
			return i;
		}
	}
	return -1;
}


//the search function
function searchCompounds() {
	document.getElementById("status_bar").innerHTML = "<br />Loading...";
	notOKCompounds = [];
	searchResults = []; //clear the previous search results
	var isOK;
	var selectedCompounds = [];
	var notBox = boxList[0][2].slice(); //make a clean copy of the NOT box so the ONLY functionality works
	if (only) {
		//if the ONLY box is selected
		for (var i = 0; i < elementList.length; i++) {
			isOK = false;
			for (var j = 1; j < boxList.length; j++) {
				if (hasElement(boxList[j][2],i+1) >= 0) {
					isOK = true; //if the element is in one of the colored boxes, it's ok
					break;
				}
			}
			if (!isOK) {
				notBox.push(i+1); //add element to the copy of the NOT box
			}
		}
	}
	//checking for "NOT"
	for (var i = 0; i < allCompounds.length; i++) {
		isOK = true;
		for (var j = 0; j < notBox.length; j++) {
			if (hasElement(allCompounds[i].elements,notBox[j]) >= 0) { //if the compound has an element in the NOT box
				isOK = false;
				break;
			}
		}
		selectedCompounds[i] = isOK;
	}
	//goes through each box
	var boxCompounds = new Int16Array(selectedCompounds.length); //boxCompounds is a pointer array
	var nBoxes = 0;
	var maxN = 0;
	for (var i = 1; i < boxList.length; i++) { //go through the boxes
		var nArray = boxList[i][2]; //the elements in each box
		if (nArray.length == 0) { //if there is nothing in the box, ignore it and move on
			continue;
		}
		isOK = false;
		//goes through the list of compounds
		for (var j = selectedCompounds.length; --j >= 0;) {
			if (!selectedCompounds[j]) { //if the given compound is already out, ignore it and move on
				continue;
			}
		  //goes through the element list in each box
			var currentElements = allCompounds[j].elements; //these are the elements in each compound
			for (var k = 0; k < nArray.length; k++) {
				if (hasElement(currentElements,nArray[k]) >= 0) { //if the compound has an element in the box
					boxCompounds[j]++; //add 1 to the pointer corresponding to the compound
					if (boxCompounds[j] > maxN) {
						maxN = boxCompounds[j]; //keep track of the maximum number of boxes anything is in
					}
					isOK = true;
					break;
				}
			}
		}
		if (isOK) {
			nBoxes++;
		}
	}
	if (nBoxes == maxN) {
		for (var i = 0; i < selectedCompounds.length; i++) {
			if (selectedCompounds[i] && boxCompounds[i] == nBoxes) {
				searchResults.push(allCompounds[i]);
			}
		}
	}
	if (showRed) {
		doubleFlag(searchResults,-1);
	}
	if (showOrange) {
		for (var i = searchResults.length; --i>=0;) {
			if (searchResults[i].isOK) { //if it's not orange, take it out
				searchResults.splice(i,1);
			}
		}
	}
	updateDisplay();
}

//this function marks out which compounds use the incorrect KPOINTS.bands file
//this function only runs if "showRed" is true, which it never is unless it's manually set as such in the JS file
//it's meant for testing purposes
function doubleFlag(results,index,data) {
	//document.getElementById("status_bar").innerHTML = "<br />Loading...";
	if (index >= 0) {
		//if the first word of the kpoints.bands file is not the same as the relaxed lattice variation,
		//turn font red and flag as Definitely Bad
		if (data != results[index].lattice_variation_relax) {
			 //alert(data + " " + JSON.stringify(results[index]))
			results[index].reallyNotOK = true;
			setCellColor(false,index,"out");
			//add the compound to a list of compounds that are not okay
			notOKCompounds.push([results[index].structure,results[index].auid]);
			//display the number of not-okay compounds in the status bar
			changeStatusBar();
		}
	}
	while(++index<results.length && results[index].isOK) {} //breaking out of this loop means either you've gotten to the end of the list or a particular compound is orange
	if (index == results.length) { //if you've gotten to the end of the list
		if (testFlag) {
			displayNotOK();
		}
		if (showRed == 2) {
			for (var i = searchResults.length; --i>=0;) {
				if (!searchResults[i].reallyNotOK) {
					searchResults.splice(i,1);
				}
			}
		}
		updateDisplay();
		//return;
	}
	else {
		var url = ICSDWEB + results[index].aurl.split(":")[1] + kpoints;
		//alert(url);
		getFile(url,function(data) {/*alert (data)*/; var kpointsVariation = data.split(" ")[0]; doubleFlag(results,index,kpointsVariation);}); //this line may be iffy - the header is not always the same on the KPOINTS.bands file
	}
}

function updateDisplay() {
	greyOutElements();
	changeStatusBar();
	updateTitles();
	tableCreate();
	if (testFlag) {
		displayNotOK();
	}
}

//update the hovertext of the boxes so each one lists the elements it contains
function updateTitles() {
	for (var i = 1; i < boxList.length; i++) {
		boxList[i][3] = "Set " + i + (boxList[i][2].length > 0 ? ": " : "");
		for (var j = 0; j < boxList[i][2].length; j++) {
			boxList[i][3] = boxList[i][3] + elementList[boxList[i][2][j]-1] + ", ";
		}
	document.getElementById(boxList[i][1]).title = boxList[i][3];
	}
}

function changeStatusBar() {
	boxContents = "";
	fileContents = "";
	document.getElementById('status_bar').style.width = (showOrange ? "70%" : "45%");
	//document.getElementById('status_bar').style.height = (showRed || showOrange ? "55px" : "40px");
	for (var i = 1; i < boxList.length; i++) { //go through the list of boxes, except the not box
		if (boxList[i][2].length > 0) { //if there's stuff in that box
			if (boxContents) { //if it's not the first box
				boxContents += " and ";
				fileContents += "and";
			}
			boxContents += "(";
			fileContents += "(";
			for (var j = 0; j < boxList[i][2].length; j++) {
				if (j != 0) { //if it's not the first element in that box
					boxContents += " or ";
					fileContents += "-or-";
				}
				boxContents += elementList[boxList[i][2][j]-1]; //boxList[i][2][j] is the element number; that number -1 is the index in elementList
				fileContents += elementList[boxList[i][2][j]-1];
			}
			boxContents += ")";
			fileContents += ")";
		}
	}
	if (boxList[0][2].length > 0) { //not box
		boxContents += ", but not (";
		fileContents += "not(";
		for (var i = 0; i < boxList[0][2].length; i++) {
			if (i != 0) {
				boxContents += " or ";
				fileContents += "-or-";
			}
			boxContents += elementList[boxList[0][2][i]-1];
			fileContents += elementList[boxList[0][2][i]-1];
		}
		boxContents += ")";
		fileContents += ")";
	}
	if (!boxContents) {
		
	}
	else if (only) {
		boxContents = "ONLY " + boxContents;
		fileContents += "ONLY";
	}
	if (textinput) { //if some advanced search has been run
		if (boxContents) {
			boxContents += ", ";
			fileContents += ",";
		}
		boxContents += textinput;
		fileContents += textinput;
	}
	if (boxContents) {
		boxContents += ". ";
	}
	if (showOrange) {
		fileContents += ",showing-orange";
		boxContents += "Showing only compounds which have different symmetries for original and relaxed structures. ";
	}
	/*if (showRed) {
		fileContents += ",showing-red";
		boxContents += "Showing which compounds incorrectly determine locations of K-points.";
	}*/
	var str = "Showing " + searchResults.length + " of " + allCompounds.length + " structures.";
	/*if (showRed) {
		str += "; " + notOKCompounds.length;
		if (notOKCompounds.length == 1) {
			str += " structure ";
			if (searchResults.length == allCompounds.length) {
				
			}
			else {
				str += "in search results ";
			}
			str+= "incorrectly determines locations of K-points.";
		}
		else {
			str += " structures ";
			if (searchResults.length == allCompounds.length) {
				
			}
			else {
				str += "in search results ";
			}
			str += "incorrectly determine locations of K-points.";
		}
	}
	else { 
		str += ".";
	}*/
	str+= "<br />";
	if (searchResults.length == allCompounds.length && !showOrange && !textinput) { //if no search parameters exist yet
		str+= "The colored buttons below group together sets of elements to search for. ";
	}
	else {
		str += "Search parameters: ";
	}
	str += boxContents;
  document.getElementById("status_bar").innerHTML = str;
}

function greyOutElements() {
	greyedElements = []; //reset list of greyed elements
	for (var i = 0; i < elementList.length; i++) { //go through the list of elements
		var OK = false; //assume that it's not in any compounds
		var atomicNumber=i+1
		for (var j = 0; j < searchResults.length; j++) {
			var index=hasElement(searchResults[j].elements,atomicNumber); //if that element is in a compound in search results,
			if (index >= 0) {
				OK = true; //it is actually okay
				break;
			}
		}
		if (!OK) { //if it's not in any compounds,
			greyedElements.push(atomicNumber); //add it to the list of greyed elements,
			document.getElementById(elementList[i]).style.color = "#E0E0E0" //and grey it out
		}
	}
	for (var i = 0; i < elementList.length; i++) { //this is to format elements back to normal if they're not grey
		if (hasElement(greyedElements,i+1) < 0) { //if it's not in the list of greyed elements
			var inBox = false;
			for (var j = 0; j < boxList.length; j++) {
				if (hasElement(boxList[j][2],i+1) >= 0) { //check if it's in any of the boxes
					inBox = true;
					break;
				}
			}
			if (inBox) {
				document.getElementById(elementList[i]).style.color = "white"; //if so, white text
			}
			else {
				document.getElementById(elementList[i]).style.color = "#555"; //if not, dark grey text
			}
		}
	}
}

function tableCreate(){
  if(tableOn === "True") { //if the table is already there, take it away so a new one can be made
    tbl.style.display = 'none';
    tbl.parentNode.removeChild(tbl);
  }
  tbl = document.createElement('table');
  tbl.id = "tbl";
  tableOn = "True";
  tbl.style.width  = 75 + '%';
  tbl.align = "center";
  tbl.style.position = "relative";
	tbl.style.top = 50 + "px";
  //tbl.style.display = "inline-block";
  //tbl.style.maxHeight = "194px";
  tbl.style.borderRadius = "8px";
  tbl.style.backgroundColor = "rgba(242, 242, 242, .6)";
  tbl.style.boxShadow = "inset 0 1px 5px rgba(0, 0, 0, 0.16)";
  tbl.style.borderCollapse = "collapse";
  tbl.style.cursor = "pointer";
  tbl.cellPadding = 5;
  //tbl.style.tableLayout = "fixed";
  tbl.style.textAlign = "left";
  //tbl.style.whiteSpace = "nowrap";
  var nEntries = 4; //4 entries per row
  for(var i = 0,tr; i < searchResults.length; i++) {
    var newRow = (i%nEntries == 0);
    if(newRow) {
      tr = tbl.insertRow();
      //tr.style.width= 200 + "%";
      //tr.style.border = "solid";
    }
		var textColor = colorText(i); //what color is the text going to be? depends on whether or not original and relaxed lattice types match
    for(var j = 0; j < 2; j++) { //alternating back and forth - two cells per compound
      var td = tr.insertCell();
      if(j == 0){
        td.style.textAlign = "right";
      }
      td.style.width = 100/nEntries*(j==1 ? .7 : .3) + "%";
      td.style.position = "relative";
      //td.style.border = "solid"
      td.appendChild;
      td.style.color = textColor;
			
      td.style.borderRightColor = 'red'
      //td.style.width = "50px";
      td.innerHTML = searchResults[i][j == 1 ? "name" : "ICSD"]; //one cell for name, one for ICSD
      td.id = (j==0 ? 'a' : 'b') + i;
      td.index = i;
      td.clickedStatus = false;
  
      td.onmouseover = function() {
				var index = this.index;
				var isClicked = this.clickedStatus;
				setCellColor(isClicked,index,"over",this.id);
      };

      td.onmouseout = function() {
				var isClicked = this.clickedStatus;
				var index = this.index;
				setCellColor(isClicked,index,"out",this.id);
      };

      td.onclick = function() {
				var index = this.index;
				var isClicked = this.clickedStatus
				setCellColor(isClicked,index,"click",this.id);
      };
    }
  }
  document.getElementById("advanced_search").appendChild(tbl); //put the table on the page
}

//this function sets the background color of the cell
function setCellColor(isClicked,index,mouse,id) {
	var textColor = colorText(index); //color the text appropriately
  var cell1 = document.getElementById('a' + index);
  var cell2 = document.getElementById('b' + index);
  cell1.style.borderRight = "none";
  cell1.innerHTML = searchResults[index].ICSD;
  cell2.innerHTML = searchResults[index].name;
	switch (mouse) {
	case "out": //onmouseout
		if(isClicked) {
			cell1.style.color = 'white';
			cell1.style.backgroundColor = '#41A7FA';
			cell2.style.color = 'white';
			cell2.style.backgroundColor = '#41A7FA';
		}
		else {
			cell1.style.color = textColor;
			cell1.style.backgroundColor = 'transparent';
			cell2.style.color = textColor;
			cell2.style.backgroundColor = 'transparent';
		}
		break;
	case "over": //onmouseover
		if(isClicked) {
	    displayLinks(cell1,cell2,id);
	  }
	  else {
	    cell1.style.color = 'white';
	    cell1.style.backgroundColor = '#41A7FA';
	    cell2.style.color = 'white';
	    cell2.style.backgroundColor = '#41A7FA';
	  }
		break;
	case "click": //onclick
		if(isClicked) {
			var BZClicked = false;
	    if(id==document.getElementById('b' + String(id).substring(1)).id) {
	      BZClicked = true;
	    }
	    structure_clicked(index,BZClicked);
	  }
	  else {
	    formatClickedStructure(index,id);
	  }
		break;
	}
}

//this displays the "WEB" and "BZ" links once a cell has been clicked once
function displayLinks(cell1,cell2,hoverID) {
  cell1.innerHTML = "WEB";
  cell1.title = "This links to the entry page";
  cell2.innerHTML = "BZ";
  cell2.title = "This links to the Brillouin Zone page";
  cell1.style.borderRight = "1px solid white";
  cell1.style.color = 'white';
  cell1.style.backgroundColor = '#ccebff';
  cell2.style.color = 'white';
  cell2.style.backgroundColor = '#ccebff';
	var hoverCell = document.getElementById(hoverID);
	hoverCell.style.color = 'white';
  hoverCell.style.backgroundColor = '#41A7FA';
}

function formatClickedStructure(index,id) {
	for (var i = 0; i < searchResults.length; i++) {
		setCellColor(false,i,"out"); //set everything to not-clicked, not-hovered
		var cell1 = document.getElementById('a' + i);
  	var cell2 = document.getElementById('b' + i);
		cell1.clickedStatus = false;
  	cell2.clickedStatus = false;
	}
	var cell1 = document.getElementById('a' + index);
  var cell2 = document.getElementById('b' + index);
	displayLinks(cell1,cell2,id); //find the ones that are actually clicked and format them as such
  cell1.clickedStatus = true;
  cell2.clickedStatus = true;
	setCellColor(true,index,"over",id);
}

//this is what happens when you click a cell for the second time
function structure_clicked(index,BZ) {
  if(BZ){
    window.open(bzPage + Classification + "/" + searchResults[index].structure); //BZ
  } else {  
    window.open(entryPage + searchResults[index].auid); //WEB
  }
}

//this function (turned off by default) displays the list of red compounds at the bottom of the page
function displayNotOK() {
	var str = "";
	for (var i = 0; i < notOKCompounds.length; i++) {
		str = str + JSON.stringify(notOKCompounds[i]) + ",";
	}
	document.getElementById('test').innerHTML = str;
}

//colors compounds red or orange depending on whether or not the original and relaxed lattice types match
function colorText (index) {
	var str = (searchResults[index].isOK ? "#555" : "orange");
	return str;
}

//this is what happens when you click the CLEAR button - resets all the search parameters
function clearSearch(clearBtn) {
	document.getElementById("status_bar").innerHTML = "<br />Loading...";
	only = false;
	document.getElementById("orange").style.borderColor = "transparent";
	showOrange = false;
	document.getElementById("red").style.borderColor = "transparent";
	showRed = 0;
	document.getElementById('selectOptions').style.display = 'none';
	dropClicked = false;
	notOKCompounds = [];
	document.getElementById("afluxBox").value = "";
	for (var i = 0; i < boxList.length; i++) {
		boxList[i][2] = [];
	}
	var elementTable = document.getElementsByClassName('element');
	for (var i = 0; i < elementTable.length; i++) { //go through all the elements
		var thisElement = document.getElementById(elementTable[i].id);
		thisElement.style.color = "#555"; //set them all to dark grey with a transparent background
		thisElement.style.backgroundColor = "transparent";
	}
	button_clicked(document.getElementById(Classification)); //re-click on the lattice type
}

//this is the function that shows or hides the advanced search bar and the orange button
function showSearch() {
	if (dropClicked) {
		document.getElementById('selectOptions').style.display = 'none';
		dropClicked = false;
	}
	else {
		document.getElementById('selectOptions').style.display = "inline-block";
		dropClicked = true;
	}
}

//this is what happens when you click on the orange button
function orangeClicked(orangebtn) {
	if (showOrange) {
		orangebtn.style.borderColor = "transparent";
		showOrange = false;
	}
	else {
		orangebtn.style.borderColor = "black";
		showOrange = true;
	}
	searchCompounds();
}

/*
function redClicked(redbtn) {
	if (showRed == 2) {
		redbtn.style.borderColor = 'transparent';
		showRed = 0;
	}
	else if (showRed == 1) {
		redbtn.style.borderColor = "black";
		showRed = 2;
	}
	else {
		redbtn.style.borderColor = "grey";
		showRed = 1;
	}
	searchCompounds();
}
*/

//this is what happens when you click on the download button
function exportSearch(dlBtn) {
	dlBtn.href = "";
	dlBtn.download = "" + Classification + (fileContents ? "-" : "") + fileContents + ".csv";
	var csv = (searchResults ? convertCSV(searchResults) : "none");
	dlBtn.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
}

//this takes the JSON file and converts it into a very long string with lots of commas in it
function convertCSV(results) {
	var columnPick = ',';
	var linePick = '\n';
	var keys = Object.keys(results[0]);
	var out = "";
	out += keys.join(columnPick);
	out += linePick;
	for (var i = 0; i < results.length; i++) {
		for (var j = 0; j < keys.length; j++) {
			if (j > 0) {
				out += columnPick;
			}
			var key = keys[j]
			if (key == "elements") {
				out += results[i][key].join(";");
			}
			else {
				out += results[i][key];
			}
		}
		out += linePick;
	}
	return out;
}