// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAS6kAkoJozCcihzNcxSQ0FeE0C7Xzsu4",
  authDomain: "gambu-acadd.firebaseapp.com",
  databaseURL: "https://gambu-acadd-default-rtdb.firebaseio.com",
  projectId: "gambu-acadd",
  storageBucket: "gambu-acadd.appspot.com",
  messagingSenderId: "853136894288",
  appId: "1:853136894288:web:92cae9e32d77e13ff82455",
  measurementId: "G-GQTLQZE267",
  databaseUrl: "https://gambu-acadd-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
// Firebase will use the default realtime database without a name specified (this is okay)
const database = firebase.database();

 'use strict';

// Shortcuts to DOM Elements.
var ambulanceForm = document.getElementById('ambulance-form');
var nameInput = document.getElementById('new-ambulance-name');
var idInput = document.getElementById('new-ambulance-id');
var agencyNameInput = document.getElementById('new-ambulance-agency');
var agencyPassInput = document.getElementById('agency-password');
var signInButton = document.getElementById('sign-in-button');
var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');
var addAmbulance = document.getElementById('add-post');
var addButton = document.getElementById('add');
var userAmbulancesSection = document.getElementById('user-ambulances-list');
var myAmbulancesButton = document.getElementById('menu-my-ambulances');
var availableRadio = document.getElementById('available');
var notAvailableRadio = document.getElementById('not-available');
var inactiveRadio = document.getElementById('inactive');
var listeningFirebaseRefs = [];

/**
 * Saves a new ambulance to the Firebase DB.
 */
function writeNewAmbulance(uid, name, vehicle_id, agency, location, status) {
    var ambulanceData = {
        uid: uid,
        name: name,
        vehicle_id: vehicle_id,
        agency: agency,
        location: location,
        status: status
    };

    // Creates a new key to identify this ambulance
    var newAmbulanceKey = database.ref().child('ambulances').push().key;

    // Adds this ambulance into the list of all ambulances and the list of the logged in user's ambulances
    var updates = {};
    updates['/ambulances/' + newAmbulanceKey] = ambulanceData;
    updates['/user-ambulances/' + uid + '/' + newAmbulanceKey] = ambulanceData;

    return database.ref().update(updates);
}

/**
 * Creates an ambulance element.
 */
function createAmbulanceElement(elementId, vehicle_id, name, agency, location, status, creatorid) {
    var uid = firebase.auth().currentUser.uid;

    // Template html for the card element the ambulance will show up in
    var html =
        '<div class="post vehicle-' + elementId + ' mdl-cell mdl-cell--12-col ' +
                    'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +
          '<div class="mdl-card mdl-shadow--2dp">' +
            '<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' +
              '<h4 class="mdl-card__title-text vehicle-id-'  + elementId + '"></h4>' +
            '</div>' +
            '<div class="header">' +
              '<div>' +
                '<div class="agency-name-' + elementId + ' mdl-color-text--black"></div>' +
              '</div>' +
            '</div>' +
            '<div class="text location-' + elementId + '"></div>' +
            '<div class="text status-' + elementId + '"></div>' +
            '<div class="text ambulance-editor-' + elementId + '">' +
                '<label for="available">Available</label>' +
                '<input class="available-' + elementId + ' mdl-textfield__input" type="radio" name="status" id="available" value="available">' +
                '<label for="not-available">Not Available</label>' +
                '<input class="not-available-' + elementId + ' mdl-textfield__input" type="radio" name="status" id="not-available" value="not available" selected="true">' +
                '<label for="inactive">Inactive</label>' +
                '<input class="inactive-' + elementId + ' mdl-textfield__input" type="radio" name="status" id="inactive" value="inactive">' +
            '</div>'
          '</div>' +
        '</div>';

        // Create the DOM element from the HTML.
        var div = document.createElement('div');
        div.innerHTML = html;
        var ambulanceElement = div.firstChild;

        // Set the values of the new ambulance element
        ambulanceElement.getElementsByClassName('location-' + elementId)[0].innerText = "lat: " + location.lat + ", lng: " + location.lng;
        ambulanceElement.getElementsByClassName('vehicle-id-' + elementId)[0].innerText = "#" + vehicle_id + ": " + name;
        ambulanceElement.getElementsByClassName('agency-name-' + elementId)[0].innerText = agency;

        var statusNonEditor = ambulanceElement.getElementsByClassName('status-' + elementId)[0];
        statusNonEditor.innerText = status;
        statusNonEditor.style.display = "none";

        var statusEditor = ambulanceElement.getElementsByClassName('ambulance-editor-' + elementId)[0];
        statusEditor.style.display = "none";

        // Decide whether the user has the ability to alter the ambulance's availability status or not
        if (uid != creatorid) {
            statusNonEditor.style.display = '';
        } else {
            var availableRadio = ambulanceElement.getElementsByClassName('available-' + elementId)[0];
            var notAvailableRadio = ambulanceElement.getElementsByClassName('not-available-' + elementId)[0];
            var inactiveRadio = ambulanceElement.getElementsByClassName('inactive-' + elementId)[0];

            database.ref('ambulances/' + elementId).get().then((snapshot) => {
                var savedStatus = snapshot.val().status.toLowerCase();
                const radioList = [availableRadio, notAvailableRadio, inactiveRadio];

                radioList.forEach((radio) => {

                if (savedStatus == radio.value) {
                    radio.checked = true;
                }

                radio.onclick = function() {
                    var updatedStatusData = {
                        uid: snapshot.val().uid,
                        name: snapshot.val().name,
                        vehicle_id: snapshot.val().vehicle_id,
                        agency: snapshot.val().agency,
                        location: snapshot.val().location,
                        status: radio.value
                }

                var updates = {};
                updates['/ambulances/' + elementId] = updatedStatusData;
                updates['/user-ambulances/' + creatorid + '/' + elementId] = updatedStatusData;

                database.ref().update(updates);
            };
        });
    });
}

        // Update the vehicle's location every 3 seconds
        setInterval(function() {
            database.ref('ambulances/' + elementId).get().then((snapshot) => {
                getCurrentLocation(elementId, creatorid, snapshot.val());
            });
        }, 10000);

        // Listen for updates to the ambulance's location
        // var locationRef = database.ref('user-ambulances/' + creatorid + '/' + elementId + '/location');
        // locationRef.on('value', function(snapshot) {
        //     console.log(snapshot.val());
        //    updateLocation(ambulanceElement, snapshot.val(), elementId);
        // });
        //
        // var statusRef = database.ref('user-ambulances/' + creatorid + '/' + elementId + '/status');
        // statusRef.on('value', function(snapshot) {
        //     updateStatus(ambulanceElement, snapshot.val(), elementId);
        // });

        // Keep track of all Firebase reference on which we are listening.
        // listeningFirebaseRefs.push(locationRef);
        // listeningFirebaseRefs.push(statusRef);

        return ambulanceElement;
}

/**
 * Updates the location of an ambulance
 */
function updateLocation(ambulanceElement, location, elementId) {
    console.log(location);
    ambulanceElement.getElementsByClassName('location-' + elementId)[0].innerText = "lat: " + location.lat + ", lng: " + location.lng;
}

/**
 * Updates the availability status of an ambulance
 */
function updateStatus(ambulanceElement, status, elementId) {
    // ambulanceElement.getElementsByClassName('status-' + elementId)[0].innerText = status;
}

/**
 * Starts listening for new ambulances and populates ambulances lists.
 */
function startDatabaseQueries() {
  var myUserId = firebase.auth().currentUser.uid;

  var userAmbulancesRef = database.ref('user-ambulances/' + myUserId);
  var allAmbulancesRef = database.ref('ambulances/');
  var fetchAmbulances = function(ambulancesRef, ambulancesSection) {
      userAmbulancesRef.on('child_added', function(data) {
          var containerElement = ambulancesSection.getElementsByClassName('posts-container')[0];
          containerElement.insertBefore(
              createAmbulanceElement(data.key, data.val().vehicle_id, data.val().name, data.val().agency, data.val().location, data.val().status, data.val().uid),
              containerElement.firstChild);
      }); // A new ambulance element will be added to the ambulance elements' container when a new ambulance is added to the user's list of ambulances

      userAmbulancesRef.on('child_changed', function(data) {
          var containerElement = ambulancesSection.getElementsByClassName('posts-container')[0];
          var ambulanceElement = containerElement.getElementsByClassName('vehicle-' + data.key)[0];
          ambulanceElement.getElementsByClassName('location-' + data.key)[0].innerText = "lat: " + data.val().location.lat + ", lng: " + data.val().location.lng;
          ambulanceElement.getElementsByClassName('vehicle-id-' + data.key)[0].innerText = "#" + data.val().vehicle_id + ": " + data.val().name;
          ambulanceElement.getElementsByClassName('agency-name-' + data.key)[0].innerText = data.val().agency;

          var statusNonEditor = ambulanceElement.getElementsByClassName('status-' + data.key)[0];
          statusNonEditor.innerText = data.val().status;
          statusNonEditor.style.display = "none";

          // Decide whether the user has the ability to alter the ambulance's availability status or not
          if (myUserId != data.key) {
              statusNonEditor.style.display = '';
          }
      });

      userAmbulancesRef.on('child_removed', function(data) {
          var containerElement = ambulancesSection.getElementsByClassName('posts-container')[0];
          var ambulanceElement = containerElement.getElementsByClassName('vehicle-' + data.key)[0];
          ambulanceElement.parentElement.removeChild(ambulanceElement);
      });
  };

  // fetchAmbulances(allAmbulancesRef, userAmbulancesSection);
  fetchAmbulances(userAmbulancesRef, userAmbulancesSection);

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(userAmbulancesRef);
  // listeningFirebaseRefs.push(allAmbulancesRef);
}

/**
 * Writes the user's data to the database.
 */
function writeUserData(userId, name, email, imageUrl) {
  database.ref('users/' + userId).set({
    username: name,
    email: email
  });
}

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
  userAmbulancesSection.getElementsByClassName('posts-container')[0].innerHTML = '';

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function(ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;

/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */
function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }

  cleanupUi();
  if (user) {
    currentUID = user.uid;
    splashPage.style.display = 'none';
    writeUserData(user.uid, user.displayName, user.email);
    startDatabaseQueries();
  } else {
    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}

/**
 * Creates a new ambulance for the current user.
 */
function newAmbulance(name, id, agency, status, location) {
    return writeNewAmbulance(firebase.auth().currentUser.uid, name, id, agency, location, status);
}

/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
  userAmbulancesSection.style.display = 'none';
  addAmbulance.style.display = 'none';
  myAmbulancesButton.classList.remove('is-active');
  addAmbulance.classList.remove('is-active');

  if (sectionElement) {
    sectionElement.style.display = 'block';
  }
  if (buttonElement) {
    buttonElement.classList.add('is-active');
  }
}

// Bindings on load.
window.addEventListener('load', function() {
  // Bind Sign in button.
  signInButton.addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  });

  // Bind Sign out button.
  signOutButton.addEventListener('click', function() {
    firebase.auth().signOut();
  });

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  ambulanceForm.onsubmit = function(e) {
    e.preventDefault();
    var name = nameInput.value;
    var vehicle_id = idInput.value;
    var agency = agencyNameInput.value;
    var agency_password = agencyPassInput.value;
    var checkedRadio = null;
    var userPos = null;

    if (name && vehicle_id && agency && agency_password) {
        var agencyData = {
            key: agency_password
        };

        // Adds this agency to the list of overall agencies
        var updates = {};
        updates['agencies/' + agency] = agencyData;

        database.ref().update(updates).then(function() {
            // Check agency password is correct (will automatically be set to the user's input for dev purposes)
            var agencyPassRef = database.ref('agencies/' + agency + '/key');
            agencyPassRef.get().then((snapshot) => {
                if (snapshot.val() == agency_password) {
                    if (availableRadio.checked) {
                        checkedRadio = availableRadio;
                    } else if (inactiveRadio.checked) {
                        checkedRadio = inactiveRadio;
                    } else {
                        checkedRadio = notAvailableRadio;
                    }

                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                          };

                          userPos = pos;

                          newAmbulance(name, vehicle_id, agency, checkedRadio.value, userPos).then(function() {
                              myAmbulancesButton.click();
                          });

                          nameInput.value = '';
                          idInput.value = '';
                          agencyNameInput.value = '';
                          agencyPassInput.value = '';

                          availableRadio.checked = false;
                          inactiveRadio.checked = false;
                          notAvailableRadio.checked = true;

                          console.log(userPos);
                        },
                        () => {
                          console.log("Cannot track your location: Geolocation error");
                        }
                      );
                    } else {
                      // Browser doesn't support Geolocation
                      console.log("Cannot track your location: browser does not support geolocation");
                    }

                    // https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyBAS6kAkoJozCcihzNcxSQ0FeE0C7Xzsu4
              } else {
                  console.log(snapshot.val());
                  console.log("Incorrect password");
              }
            });
      });
    }
  };

  function getCurrentLocation(ambulanceKey) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          var locationData = {
              key: pos
          };

          updates['/ambulances/' + ambulanceKey] = pos;
          updates['/user-ambulances/' + uid + '/' + ambulanceKey] = pos;

          database.ref().update(updates);
          console.log(pos);
        },
        () => {
          console.log("Cannot track your location: Geolocation error");
        });
  }

  myAmbulancesButton.onclick = function() {
      showSection(userAmbulancesSection);
  };

  addButton.onclick = function() {
    showSection(addAmbulance);
    nameInput.value = '';
    idInput.value = '';
    agencyNameInput.value = '';
    agencyPassInput.value = '';

    availableRadio.checked = false;
    inactiveRadio.checked = false;
    notAvailableRadio.checked = true;
  };
}, false);

function getCurrentLocation(ambulanceKey, uid, ambulanceSnapshot) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        var updatedLocData = {
            uid: ambulanceSnapshot.uid,
            name: ambulanceSnapshot.name,
            vehicle_id: ambulanceSnapshot.vehicle_id,
            agency: ambulanceSnapshot.agency,
            location: pos,
            status: ambulanceSnapshot.status
        }

        var updates = {};
        updates['/ambulances/' + ambulanceKey] = updatedLocData;
        updates['/user-ambulances/' + uid + '/' + ambulanceKey] = updatedLocData;

        database.ref().update(updates);
        console.log(pos);
      },
      () => {
        console.log("Cannot track your location: Geolocation error");
      });
}
