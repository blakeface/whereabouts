$(function () {
  var socket = io();
  var map;
  var miles = $('#radius').val();
  var pos;
  var located = false;
  var markerLocal = [];

  function initAutocomplete() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.315, lng: -105.270},
      zoom: 1
    });
    function clearMarker () {
      markerLocal.forEach(function(marker) {
        marker.setMap(null);
      });
      markerLocal.length = 0;
    }
    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);


    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
      searchBox.setBounds(map.getBounds());
    });

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();
      located = true;

      if (places.length == 0) {
        return;
      }

      // Clear out the old markers.
      clearMarker();

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function(place) {
        var icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };
        pos = place.geometry.location;
        // Create a marker for each place.
        var marker = new google.maps.Marker({
          position: pos,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            strokeColor: 'red',
          },
        });

        markerLocal.push(marker)

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);
      distanceFromCenter(miles)
    });

    function distanceFromCenter (miles) {
      var radius = new google.maps.Circle({
        strokeColor: 'none',
        strokeOpacity: 0.0,
        fillOpacity: .0,
        map: map,
        center: pos,
        radius: 1609.344 * miles
      });
      socket.emit('located', {bounds: radius.getBounds(), parce: parce})
      map.fitBounds(radius.getBounds());
    }

    $('#geo').on('click', function () {
      parce = 0;
      if (navigator.geolocation) {
        located = true;
        navigator.geolocation.getCurrentPosition(function(position) {
          pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          map.setCenter(pos);
          clearMarker()
          var marker = new google.maps.Marker({
            position: pos,
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 5,
              strokeColor: 'red',
            },
          });
          markerLocal.push(marker)
          distanceFromCenter(miles)
          markeEventHandler(marker, 'you!')
        }, function() {
          handleLocationError(true, infoWindow, map.getCenter());
        });
      } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
      }
      function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
          'Error: The Geolocation service failed.' :
          'Error: Your browser doesn\'t support geolocation.');
        }
      })
      $('#sup').on('click', enterNewMapCenter)
      function enterNewMapCenter () {
        pos = {lat: +$('#x').val(), lng: +$('#y').val()};
        map.setCenter(pos);
        distanceFromCenter(miles)
      }
      var markers = [];
      socket.on('self', function (data) {
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(null);
        }
        $('.posts').empty();
        markers.length = 0;
        for (var i = 0; i < data.length; i++) {
          var info = data[i];
          var marker = new google.maps.Marker({
            position: {lat: +info.lat, lng: +info.lng},
            map: map,
          });
          markers.push(marker);
          markeEventHandler(marker, info.title, info.id);
          $('.posts')
          .append("<div class='media data' id='"+info.id+"' title='"+info.title+"'></div>");
          $('#'+ info.id )
          .append("<div class='media-left'><a href='/posts/"+info.id+"'><img class='media-object' src='"+info.img_link+"'></a></div>")
          .append("<div class='media-body'><a href='/posts/"+info.id+"'><h4 class='media-heading'>"+info.title+"</h4></a>"
          +"<h5 class='list-group-item-text'><a href='/users/"+info.user_id+"'>Author:"+info.username+"</a></h5><br></div>")
          .append("<div class='media-right'>"
          +"<input class='votearrow' type='image' src='/images/uparrow.png'>"
          +"<h5>"+info.rating+"</h5>"
          +"<input class='votearrow' type='image' src='/images/downarrow.png'></div>");
        }
      });

      function markeEventHandler(marker, message, id) {
        var infowindow = new google.maps.InfoWindow({
          class: id,
          content: message
        });
        marker.addListener('click', function() {
          window.location = "/posts/" + infowindow.class;
        })
        marker.addListener('mouseover', function() {
          $('#' + infowindow.class).css('background', 'rgba(111, 106, 102, 0.31)')
          infowindow.open(marker.get('map'), marker);
        });
        marker.addListener('mouseout', function(){
          $('#' + infowindow.class).css('background', 'none')
          infowindow.close()
        })
        $(document).on('mouseover', '#' + infowindow.class, function () {
          $('#' + infowindow.class).css('background', 'rgba(111, 106, 102, 0.31)')
          infowindow.open(marker.get('map'), marker);
        })
        $(document).on('mouseout', '#' + infowindow.class, function () {
          $('#' + infowindow.class).css('background', 'none')
          infowindow.close()
        })
      }

      $('#radius').on('change', function () {
        miles = +$('#radius').val();
        if (located) {
          distanceFromCenter(miles)
        };
      });
      var parce = 0;
      $('.nextarrow').on('click', function () {

        if ($(this).attr('id') === 'next') {
          parce++
        }else{
          parce--
          parce = parce < 0 ? 0 : parce;
        }
        if (located) {
          distanceFromCenter(miles)
        }else{
          socket.emit('world', parce);
        }
      })
    };


    window.initAutocomplete = initAutocomplete;
  });
