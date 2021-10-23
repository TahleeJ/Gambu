(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleIntervalJob = exports.Job = exports.Task = exports.AsyncTask = exports.ToadScheduler = void 0;
var toadScheduler_1 = require("./lib/toadScheduler");
Object.defineProperty(exports, "ToadScheduler", { enumerable: true, get: function () { return toadScheduler_1.ToadScheduler; } });
var AsyncTask_1 = require("./lib/common/AsyncTask");
Object.defineProperty(exports, "AsyncTask", { enumerable: true, get: function () { return AsyncTask_1.AsyncTask; } });
var Task_1 = require("./lib/common/Task");
Object.defineProperty(exports, "Task", { enumerable: true, get: function () { return Task_1.Task; } });
var Job_1 = require("./lib/common/Job");
Object.defineProperty(exports, "Job", { enumerable: true, get: function () { return Job_1.Job; } });
var SimpleIntervalJob_1 = require("./lib/engines/simple-interval/SimpleIntervalJob");
Object.defineProperty(exports, "SimpleIntervalJob", { enumerable: true, get: function () { return SimpleIntervalJob_1.SimpleIntervalJob; } });

},{"./lib/common/AsyncTask":2,"./lib/common/Job":3,"./lib/common/Task":5,"./lib/engines/simple-interval/SimpleIntervalJob":7,"./lib/toadScheduler":9}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncTask = void 0;
function defaultErrorHandler(id) {
    return (err) => {
        console.error(`Error while handling task ${id}: ${err.message}`);
    };
}
class AsyncTask {
    constructor(id, handler, errorHandler) {
        this.id = id;
        this.handler = handler;
        this.errorHandler = errorHandler || defaultErrorHandler(this.id);
    }
    execute() {
        this.handler().catch(this.errorHandler);
    }
}
exports.AsyncTask = AsyncTask;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = exports.JobStatus = void 0;
var JobStatus;
(function (JobStatus) {
    JobStatus["RUNNING"] = "running";
    JobStatus["STOPPED"] = "stopped";
})(JobStatus = exports.JobStatus || (exports.JobStatus = {}));
class Job {
    constructor(id) {
        this.id = id;
    }
}
exports.Job = Job;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerEngine = void 0;
class SchedulerEngine {
}
exports.SchedulerEngine = SchedulerEngine;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
function defaultErrorHandler(id) {
    return (err) => {
        console.error(`Error while handling task ${id}: ${err.message}`);
    };
}
class Task {
    constructor(id, handler, errorHandler) {
        this.id = id;
        this.handler = handler;
        this.errorHandler = errorHandler || defaultErrorHandler(this.id);
    }
    execute() {
        try {
            this.handler();
        }
        catch (err) {
            this.errorHandler(err);
        }
    }
}
exports.Task = Task;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleIntervalEngine = void 0;
const SchedulerEngine_1 = require("../../common/SchedulerEngine");
class SimpleIntervalEngine extends SchedulerEngine_1.SchedulerEngine {
    constructor() {
        super();
        this.jobs = [];
    }
    add(job) {
        this.jobs.push(job);
        job.start();
    }
    stop() {
        for (const job of this.jobs) {
            job.stop();
        }
    }
}
exports.SimpleIntervalEngine = SimpleIntervalEngine;

},{"../../common/SchedulerEngine":4}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleIntervalJob = void 0;
const Job_1 = require("../../common/Job");
const SimpleIntervalSchedule_1 = require("./SimpleIntervalSchedule");
class SimpleIntervalJob extends Job_1.Job {
    constructor(schedule, task, id) {
        super(id);
        this.schedule = schedule;
        this.task = task;
    }
    start() {
        const time = SimpleIntervalSchedule_1.toMsecs(this.schedule);
        // See https://github.com/kibertoad/toad-scheduler/issues/24
        if (time >= 2147483647) {
            throw new Error('Due to setInterval limitations, no intervals longer than 24.85 days can be scheduled correctly. toad-scheduler will eventually include a workaround for this, but for now your schedule is likely to break.');
        }
        // Avoid starting duplicates and leaking previous timers
        if (this.timer) {
            this.stop();
        }
        if (this.schedule.runImmediately) {
            this.task.execute();
        }
        this.timer = setInterval(() => {
            this.task.execute();
        }, time);
    }
    stop() {
        if (!this.timer) {
            return;
        }
        clearInterval(this.timer);
        this.timer = undefined;
    }
    getStatus() {
        if (this.timer) {
            return Job_1.JobStatus.RUNNING;
        }
        return Job_1.JobStatus.STOPPED;
    }
}
exports.SimpleIntervalJob = SimpleIntervalJob;

},{"../../common/Job":3,"./SimpleIntervalSchedule":8}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMsecs = void 0;
function toMsecs(schedule) {
    var _a, _b, _c, _d, _e;
    const days = (_a = schedule.days) !== null && _a !== void 0 ? _a : 0;
    const hours = (_b = schedule.hours) !== null && _b !== void 0 ? _b : 0;
    const minutes = (_c = schedule.minutes) !== null && _c !== void 0 ? _c : 0;
    const seconds = (_d = schedule.seconds) !== null && _d !== void 0 ? _d : 0;
    const milliseconds = (_e = schedule.milliseconds) !== null && _e !== void 0 ? _e : 0;
    return (milliseconds +
        seconds * 1000 +
        minutes * 60 * 1000 +
        hours * 60 * 60 * 1000 +
        days * 24 * 60 * 60 * 1000);
}
exports.toMsecs = toMsecs;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToadScheduler = void 0;
const SimpleIntervalEngine_1 = require("./engines/simple-interval/SimpleIntervalEngine");
class ToadScheduler {
    constructor() {
        this.engines = {};
        this.jobRegistry = {};
    }
    addSimpleIntervalJob(job) {
        if (!this.engines.simpleIntervalEngine) {
            this.engines.simpleIntervalEngine = new SimpleIntervalEngine_1.SimpleIntervalEngine();
        }
        if (job.id) {
            if (this.jobRegistry[job.id]) {
                throw new Error(`Job with an id ${job.id} is already registered.`);
            }
            this.jobRegistry[job.id] = job;
        }
        this.engines.simpleIntervalEngine.add(job);
    }
    stop() {
        for (const engine of Object.values(this.engines)) {
            engine === null || engine === void 0 ? void 0 : engine.stop();
        }
    }
    getById(id) {
        const job = this.jobRegistry[id];
        if (!job) {
            throw new Error(`Job with an id ${id} is not registered.`);
        }
        return job;
    }
    removeById(id) {
        const job = this.jobRegistry[id];
        if (!job) {
            return;
        }
        job.stop();
        delete this.jobRegistry[id];
        return job;
    }
    stopById(id) {
        const job = this.getById(id);
        job.stop();
    }
    startById(id) {
        const job = this.getById(id);
        job.start();
    }
}
exports.ToadScheduler = ToadScheduler;

},{"./engines/simple-interval/SimpleIntervalEngine":6}],10:[function(require,module,exports){
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
          '</div>' +
        '</div>';

        // Create the DOM element from the HTML.
        var div = document.createElement('div');
        div.innerHTML = html;
        var ambulanceElement = div.firstChild;

        // Set the values of the new ambulance element
        ambulanceElement.getElementsByClassName('location-' + elementId)[0].innerText = "lat: " + location.lat + ", lng: " + location.lng;
        ambulanceElement.getElementsByClassName('status-' + elementId)[0].innerText = status;
        ambulanceElement.getElementsByClassName('vehicle-id-' + elementId)[0].innerText = "#" + vehicle_id + ": " + name;
        ambulanceElement.getElementsByClassName('agency-name-' + elementId)[0].innerText = agency;

        // Listen for updates to the ambulance's location
        var locationRef = database.ref('user-ambulances/' + creatorid + '/' + elementId + '/location');
        locationRef.on('value', function(snapshot) {
            console.log(snapshot.val());
          updateLocation(ambulanceElement, snapshot.val(), elementId);
        });

        var statusRef = database.ref('user-ambulances/' + creatorid + '/' + elementId + '/status');
        statusRef.on('value', function(snapshot) {
            updateStatus(ambulanceElement, snapshot.val(), elementId);
        });

        // Keep track of all Firebase reference on which we are listening.
        listeningFirebaseRefs.push(locationRef);
        listeningFirebaseRefs.push(statusRef);

        const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');

        const scheduler = new ToadScheduler();

        const task = new Task('simple task', () => {
            console.log("Location update");
            getCurrentLocation(elementId);
        });
        const job = new SimpleIntervalJob({ seconds: 5, }, task);

        scheduler.addSimpleIntervalJob(job)

        // when stopping your app
        // scheduler.stop()

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
    ambulanceElement.getElementsByClassName('status-' + elementId)[0].innerText = status;
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
          ambulanceElement.getElementById('vehicle')[0].innerText = "#" + data.val().vehicle_id + ": " + data.val().name;
          ambulanceElement.getElementById('agency-name')[0].innerText = data.val().agency;
      });

      userAmbulancesRef.on('child_removed', function(data) {
          var containerElement = ambulancesSection.getElementsByClassName('posts-container')[0];
          var ambulanceElement = containerElement.getElementsByClassName('vehicle-' + data.key)[0];
          ambulanceElement.parentElement.removeChild(ambulanceElement);
      });
  };

  fetchAmbulances(allAmbulancesRef, userAmbulancesSection);
  fetchAmbulances(userAmbulancesRef, userAmbulancesSection);

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(userAmbulancesRef);
  listeningFirebaseRefs.push(allAmbulancesRef);
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

},{"toad-scheduler":1}]},{},[10]);
