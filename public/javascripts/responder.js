var map = null;
var csvFile = null;

/**
 * Distance between to points
 * 
 * @param {Float} lat1 
 * @param {Float} lon1 
 * @param {Float} lat2 
 * @param {Float} lon2 
 */
function distance(lat1, lon1, lat2, lon2) {
	var radlat1 = Math.PI * lat1/180;
	var radlat2 = Math.PI * lat2/180;
	var theta = lon1-lon2;
	var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) +
               Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	if (dist > 1) {
		dist = 1;
	}
    dist = Math.acos(dist)
    
	dist = dist * 180/Math.PI;
	dist = dist * 60 * 1.1515;
    return dist * 1.609344;
    
}

function rad2degr(rad) { 
    return rad * 180 / Math.PI; 
}

function degr2rad(degr) { 
    return degr * Math.PI / 180; 
}

/**
 * @param latLngInDeg array of arrays with latitude and longtitude
 *   pairs in degrees. e.g. [[latitude1, longtitude1], [latitude2
 *   [longtitude2] ...]
 *
 * @return array with the center latitude longtitude pairs in 
 *   degrees.
 */
function getLatLngCenter(latLngInDegr) {
    var LATIDX = 0;
    var LNGIDX = 1;
    var sumX = 0;
    var sumY = 0;
    var sumZ = 0;

    for (var i=0; i<latLngInDegr.length; i++) {
        var lat = degr2rad(latLngInDegr[i][LATIDX]);
        var lng = degr2rad(latLngInDegr[i][LNGIDX]);
        // sum of cartesian coordinates
        sumX += Math.cos(lat) * Math.cos(lng);
        sumY += Math.cos(lat) * Math.sin(lng);
        sumZ += Math.sin(lat);
    }

    var avgX = sumX / latLngInDegr.length;
    var avgY = sumY / latLngInDegr.length;
    var avgZ = sumZ / latLngInDegr.length;

    // convert average x, y, z coordinate to latitude and longtitude
    var lng = Math.atan2(avgY, avgX);
    var hyp = Math.sqrt(avgX * avgX + avgY * avgY);
    var lat = Math.atan2(avgZ, hyp);

    return ([rad2degr(lat), rad2degr(lng)]);
}

 /**
  * Inactivate Tabs
  * 
  */
 function inactivateTabs() {
    var iTab, tabcontent, tabbuttons, tablinks;
     
     // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (iTab = 0; iTab < tabcontent.length; iTab++) {
        tabcontent[iTab].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (iTab = 0; iTab < tablinks.length; iTab++) {
        tablinks[iTab].className = tablinks[iTab].className.replace(" active", "");
        tablinks[iTab].style.textDecoration = "none";
    }

 }

 /**
 * Show the Active Tab
 * 
 * @param {*} evt the Tab to Show
 * @param {*} tab the name of the Tab
 * @param {*} button the Tab's button
 */
function showTab(evt, tab, button) {

    inactivateTabs();

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tab).style.display = "block";
    document.getElementById(button).style.textDecoration = "underline";
 
    evt.currentTarget.className += " active";

}

function showMap(columns, rows) {
    
    $('#map').css('display', 'none');  

    if (map != null) {

        map.off();
        map.remove();
    }

    var coordinates = [];
    var startLatLng = null;
    var stopLatLng = null;
  
    for (row in rows) {
        if (rows[row][6] && rows[row][7]) {
            var latlng = [rows[row][6], rows[row][7]];

            if (startLatLng == null) {
                startLatLng = latlng;
            }

            stopLatLng = latlng;
            coordinates.push(latlng);

        }

    }
    
    var midLatLng = getLatLngCenter(coordinates);

    map = L.map('map').setView([midLatLng[0], midLatLng[1]], 15);

    var startIcon = L.icon({
        iconUrl: 'icons/start-marker.png',
        iconSize: [24, 24],
        iconAnchor: [10, 10],
        popupAnchor: [-3, -76]
    });    
    
    var stopIcon = L.icon({
        iconUrl: 'icons/stop-marker.png',
        iconSize: [24, 24],
        iconAnchor: [20, 20],
        popupAnchor: [-3, -76]
    });

    L.marker(startLatLng, {icon: startIcon}).addTo(map);
    L.marker(stopLatLng, {icon: stopIcon}).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 30,
    minZoom: 9,
    noWrap:true
    }).addTo(map);

    var options = {}

    L.polyline(
        coordinates,
        {
            color: 'blue',
            weight: 2,
            opacity: .7,
            lineJoin: 'round'
        }
    ).addTo(map);

    setTimeout(function() {
        map.invalidateSize();
        $('#map').css('display', 'inline-block');

        setTimeout(function() {
            map.invalidateSize();
        }, 500);
    }, 100);

    window.addEventListener("resize", function() {
       map.invalidateSize();      
    });

    $('.leaflet-control-attribution').hide();
    
}

function showCharts(columns, rows) {
    var dataSpeed = [];
    var dataHeight = [];
    var labels = [];

    var length = rows.length;
    var modulus = length >= 100000 ? 1000 : length >= 10000 ? 100 : 1;
    var totalSpeed = 0.0;

    var distanceKms = 0;
    var latlng = null;
    var topSpeed = 0.0;

    for (row in rows) {

        if (rows[row][11] && rows[row][12]) {

            if (latlng) {
                distanceKms += distance(latlng[0], latlng[1], 
                                        parseFloat(rows[row][6]), parseFloat(rows[row][7]));
            }

            latlng = [parseFloat(rows[row][6]), parseFloat(rows[row][7])];
            totalSpeed += parseFloat(rows[row][11]);
            topSpeed = Math.max(parseFloat(rows[row][11]), topSpeed);
    
            if (row % modulus == 0) {
               dataSpeed.push(rows[row][11]);
               dataHeight.push(rows[row][4]);
               labels.push(Math.trunc(rows[row][12]));
            }
        }

    }

    new Chart(document.getElementById('speedChart'), {
        type: 'line',
        data: {
            labels: labels,
         datasets: [{ 
            data: dataSpeed,
            label: "Speed",
            borderColor: "#3e95cd",
            fill: false
      }],
      options: {
        title: {    
          display: true,
          text: 'Speed of Vehicle'
        }
      }
    }
    
    });  

    new Chart(document.getElementById('heightChart'), {
        type: 'line',
        data: {
            labels: labels,
         datasets: [{ 
            data: dataHeight,
            label: "Height",
            borderColor: "#3e95cd",
            fill: false
      }],
      options: {
        title: {
          display: true,
          text: 'Terrain Height above Sea Level'
        }
      }
    }
    
    });  

    $('#details').html('<b>Start Time: </b><p/>' + (new Date(Math.trunc(rows[0][12]) * 1000)) +
    '<p/><b>Finish Time: </b><p/>' + (new Date(Math.trunc(labels[labels.length - 1]) * 1000)) +
    '<p/><b>Average Speed: </b><p/>' + ((totalSpeed/rows.length).toFixed(2)) + "&nbsp;kph" +
    '<p/><b>Top Speed: </b><p/>' + (topSpeed.toFixed(2)) + "&nbsp;kph" +
    '<p/><b>Distance Travelled: </b><p/>' + (distanceKms.toFixed(2)) + "&nbsp;kms");
    $('#details').css('display', 'inline-block');

}

function display(columns, rows) {

    showMap(columns, rows);

    window.setTimeout(() => {

        inactivateTabs();

        $('#rendering').css('display', 'inline-block');
        $('#structureFrame').css('display', 'inline-block');
        $('#uploadWait').css('display', 'none');
        $('#tab1').css('text-decoration', 'underline');
        $('#tab1').addClass('active');

        showCharts(columns, rows);
    
        console.log('completed conversion');

    }, 100);

}

$(document).ready(function() {
    var header = $('#caption').html();
    var dropzone = $('#droparea');
     
    dropzone.on('dragover', function() {
        //add hover class when drag over
        dropzone.addClass('hover');
        return false;
    });
     
    dropzone.on('dragleave', function() {
        //remove hover class when drag out
        dropzone.removeClass('hover');
        return false;
    });
     
    dropzone.on('drop', function(e) {
        //prevent browser from open the file when drop off
        e.stopPropagation();
        e.preventDefault();
        dropzone.removeClass('hover');
     
        //retrieve uploaded files data
        var files = e.originalEvent.dataTransfer.files;
        processFiles(files);
     
        return false;
    });

    var uploadBtn = $('#uploadbtn');
    var defaultUploadBtn = $('#upload');
     
    uploadBtn.on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        defaultUploadBtn.click();
    });
     
    defaultUploadBtn.on('change', function() {

        var files = $(this)[0].files;

        processFiles(files);   

        return false;

    });

	var processFiles = function(files) {
        $('#details').css('display', 'none');

 		if (files && typeof FileReader !== "undefined") {
			for(var iFile = 0; iFile<files.length; iFile++) {
			    readFile(files[iFile]);
			}
        } 
        
    }
    
    var readFile = function(file) {
      
        if (file.size == 0) {
            alert("File: '" + file.name + "' is empty!");
        } else if( (/csv/i).test(file.name) ) {  
            $('#uploadWait').css('display', 'inline-block');
            $('#rendering').css('display', 'none');

            csvFile = file;      
            var reader = new FileReader();
            
			reader.onload = function(e) {
                csvFile = file;
                
                 $('#caption').html(header.replace(/$.*/, '&nbsp;-&nbsp;\'' + file.name + '\''));
                
                 var progress = "100";

                 var results = Papa.parse(reader.result);

                 var lines = results.data;
                 var rows = [];
                 var columns = null;
     
                 for (var line in lines) {
     
                   if (!columns) {
                        columns = lines[line];
                   } else {
                        rows.push(lines[line]);
                   }
     
                 }

                 display(columns, rows);
                
			};
            
            reader.onprogress = function(data) {
                
                if (data.lengthComputable) {                                            
                    var progress = parseInt( ((data.loaded / data.total) * 100), 10 );
                    document.getElementById("uploadProgress").className = "c100 p" + 
                    progress + 
                    " big blue";
                    $('#percentage').html(progress + "%");

                }

            }

            reader.readAsText(file);	
          
        } else {
            alert(file.type + " - is not supported");
        }
    
     }

});     