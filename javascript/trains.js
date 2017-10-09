// Train Sheduler

//---Initialization:

// Initialize Firebase
var config = {
  apiKey: "AIzaSyArVbBdIjFt2SFTmgNw2E3xG68o7fJJm2s",
  authDomain: "train-scheduler-21ed5.firebaseapp.com",
  databaseURL: "https://train-scheduler-21ed5.firebaseio.com",
  projectId: "train-scheduler-21ed5",
  storageBucket: "train-scheduler-21ed5.appspot.com",
  messagingSenderId: "279006227123"
};
firebase.initializeApp(config);
var database = firebase.database();

// General global variables and constants
const minFrequency = 10;

//---Function definitions:

// Either returns a valid train object or false
// Train object definition:
// { name: 'name', destination: 'destination', firstTime: 'HH:mm', frequency: '...mmmm'}
function getValidTrain() {
  var result = false;
  var allInputValid = true;
  var errorMsgText = '!!! Items below in red contain errors! Correct and re-submit...'

  // Clear any previous error message
  $('#error-message').empty();
  // Clear any inputs previously marked invalid
  var invalidInputs = $('form').children().children('.invalid-input');
  if (invalidInputs.length > 0) {
    invalidInputs.removeClass('invalid-input');
  }

  // trainName and trainDestination cannot be validated
  var trainName = $("#train-name-input").val().trim();
  var trainDestination = $("#destination-input").val().trim();
  // trainFrequency is validated when the input field loses focus
  var trainFrequency = $("#frequency-input").val().trim();

  // trainFirstTime must be a valid time
  var trainFirstTime = parseInt($("#first-time-input").val().trim());
  trainFirstTime = moment(trainFirstTime, 'HHmm');
  if (trainFirstTime.isValid() != true) {
    allInputValid = false;
    $('#first-time-input').addClass('invalid-input');
  }

  if (allInputValid) {
    // Creates train object
    var result = {
      name: trainName,
      destination: trainDestination,
      firstTime: trainFirstTime.format('HH:mm'),
      frequency: trainFrequency
    };
  } else {
    $('#error-message').text(errorMsgText);
  }
  return result;
} // function getValidTrain

// Add a new train listing to the firebase database
function addTrainToDB () {
  // Checks that all inputs contain valid data
  var newTrain = getValidTrain();

  if (newTrain) {
    // Uploads train data to the database
    database.ref().push(newTrain);

    // Clears all of the text-boxes
    $("#train-name-input").val("");
    $("#destination-input").val("");
    $("#first-time-input").val("");
    $("#frequency-input").val("");
  } // if (newTrain)
} // function addTrainToDB

// Normalize the train frequency-input upon losing focus
$('#frequency-input').focusout(function(){
  var currentValue = parseInt($(this).val());

  if (currentValue < 10) {
    $(this).val(10);
  }
});

// Button-click for adding trains
$("#add-train-btn").on("click", function(event) {
  event.preventDefault();
  addTrainToDB();
});

// Calculate trainArrivalMinutes and trainNextArrival
// Receives tFirstTime as a moment object (required)
// Receives tFrequency as a string 'hh:mm' (required)
// Returns an object { arrivalMinutes: num, nextArrival: moment-object }
// Math courtesy of DU Coding Bootcamp
function calcTrainTimes(tFirstTime, tFrequency) {
  // First Time (pushed back 1 year to make sure it comes before current time)
  var firstTimeConverted = moment(tFirstTime, "hh:mm").subtract(1, "years");

  // Current Time
  var currentTime = moment();

  // Difference between the times
  var diffTime = moment().diff(moment(firstTimeConverted), "minutes");

  // Time apart (remainder)
  var tRemainder = diffTime % tFrequency;

  // Minutes Until Train
  var tMinutesTillTrain = tFrequency - tRemainder;

  // Next Train
  var nextTrain = moment().add(tMinutesTillTrain, "minutes");

  return { arrivalMinutes: tMinutesTillTrain, nextArrival: nextTrain };
}

// Add a train to the HTML table
function addRowToTable(aTrain) {
  // Store everything into a variable.
  var trainName = aTrain.name;
  var trainDestination = aTrain.destination;
  var trainFirstTime = moment(aTrain.firstTime,'HHmm');
  var trainFrequency = parseInt(aTrain.frequency);

  // train Info
  console.log(trainName);
  console.log(trainDestination);
  console.log(trainFirstTime);
  console.log(trainFrequency);

  // Get the next arrival minutes and next arrival time using calcTrainTimes
  // Should be object: { arrivalMinutes: num, nextArrival: moment-object }
  var calcValues = calcTrainTimes(trainFirstTime, trainFrequency);
  
  // Calculate the minutes until next arrival
  var trainArrivalMinutes = calcValues.arrivalMinutes + ' minutes';
  var trainNextArrival = calcValues.nextArrival.format('hh:mm A');

  // Add train's data into the table
  $("#train-table > tbody").append("<tr><td>" +
    trainName + "</td><td>" +
    trainDestination + "</td><td>" +
    trainFrequency + "</td><td>" +
    trainNextArrival + "</td><td>" +
    trainArrivalMinutes + "</td></tr>"
  );

}

// When a train is added to the database adds a row to the HTML table
// Also adds any previously stored trains
database.ref().on("child_added", function(childSnapshot, prevChildKey) {
  addRowToTable(childSnapshot.val());
});

$(document).ready(function () {
  // Change the frequency-input-label to include the minFrequency
  $('#frequency-input-label').text('Frequency (minutes, minimum='+minFrequency+')');
});