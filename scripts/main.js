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
var listeningFirebaseRefs = [];

/**
 * Saves a new ambulance to the Firebase DB.
 */
function writeNewAmbulance(uid, name, vehicle_id, agency, location) {
    var ambulanceData = {
        uid: uid,
        name: name,
        vehicle_id: vehicle_id,
        agency: agency,
        location: location
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
function createAmbulanceElement(elementId, vehicle_id, name, agency, location, creatorid) {
    var uid = firebase.auth().currentUser.uid;

    // Template html for the card element the ambulance will show up in
    var html =
        '<div class="post vehicle-' + elementId + ' mdl-cell mdl-cell--12-col ' +
                    'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +
          '<div class="mdl-card mdl-shadow--2dp">' +
            '<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' +
              '<h4 class="mdl-card__title-text"></h4>' +
            '</div>' +
            '<div class="header">' +
              '<div>' +
                '<div class="username mdl-color-text--black"></div>' +
              '</div>' +
            '</div>' +
            '<div class="text"></div>' +
          '</div>' +
        '</div>';

        // Create the DOM element from the HTML.
        var div = document.createElement('div');
        div.innerHTML = html;
        var ambulanceElement = div.firstChild;

        // Set the values of the new ambulance element
        ambulanceElement.getElementsByClassName('text')[0].innerText = location || "N/A";
        ambulanceElement.getElementsByClassName('mdl-card__title-text')[0].innerText = "#" + vehicle_id + ": " + name;
        ambulanceElement.getElementsByClassName('username')[0].innerText = agency;

        // Listen for updates to the ambulance's location
        var locationRef = database.ref('user-ambulances/' + elementId + '/location');
        locationRef.on('value', function(snapshot) {
          updateLocation(ambulanceElement, snapshot.val());
        });

        // Keep track of all Firebase reference on which we are listening.
        listeningFirebaseRefs.push(locationRef);

        return ambulanceElement;
}

/**
 * Updates the location of an ambulance
 */
function updateLocation(ambulanceElement, location) {
    ambulanceElement.getElementsByClassName('text')[0].innerText = location;
}

/**
 * Starts listening for new ambulances and populates ambulances lists.
 */
function startDatabaseQueries() {
    console.log("start database queries");
  var myUserId = firebase.auth().currentUser.uid;

  var userAmbulancesRef = database.ref('user-ambulances/' + myUserId);
  var fetchAmbulances = function(ambulancesRef, ambulancesSection) {
      userAmbulancesRef.on('child_added', function(data) {
          var containerElement = ambulancesSection.getElementsByClassName('posts-container')[0];
          containerElement.insertBefore(
              createAmbulanceElement(data.key, data.val().vehicle_id, data.val().name, data.val().agency, data.val().location, data.val().uid),
              containerElement.firstChild);
      }); // A new ambulance element will be added to the ambulance elements' container when a new ambulance is added to the user's list of ambulances

      userAmbulancesRef.on('child_changed', function(data) {
          var containerElement = ambulancesSection.getElementsByClassName('posts-container')[0];
          var ambulanceElement = containerElement.getElementsByClassName('vehicle-' + data.key)[0];
          ambulanceElement.getElementsByClassName('mdl-card__title-text')[0].innerText = "#" + data.val().vehicle_id + ": " + data.val().name;
          ambulanceElement.getElementsByClassName('username')[0].innerText = data.val().agency;
      });

      userAmbulancesRef.on('child_removed', function(data) {
          var containerElement = ambulancesSection.getElementsByClassName('posts-container')[0];
          var ambulanceElement = containerElement.getElementsByClassName('vehicle-' + data.key)[0];
          ambulanceElement.parentElement.removeChild(ambulanceElement);
      });
  };

  fetchAmbulances(userAmbulancesRef, userAmbulancesSection);

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(userAmbulancesRef);
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
function newAmbulance(name, id, agency) {
    return writeNewAmbulance(firebase.auth().currentUser.uid, name, id, agency, null);
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

    if (name && vehicle_id && agency && agency_password) {
        // check agency password is correct

      newAmbulance(name, vehicle_id, agency).then(function() {
          myAmbulancesButton.click();
      })

      nameInput.value = '';
      idInput.value = '';
      agencyNameInput.value = '';
      agencyPassInput.value = '';
    }
  };

  myAmbulancesButton.onclick = function() {
      showSection(userAmbulancesSection);
  };

  addButton.onclick = function() {
    showSection(addAmbulance);
    nameInput.value = '';
    idInput.value = '';
    agencyNameInput.value = '';
    agencyPassInput.value = '';
  };
}, false);
