$(document).ready(function() {
  // This file just does a GET request to figure out which user is logged in
  // and updates the HTML on the page
  $.get("/api/user_data").then(function(data) {
    $(".member-name").text(data.name);
  });

  $.get("/api/allHoroscopes/", function(results) {
    console.log(results);
    console.log(results.yesterday.description);
    console.log(results.today.description);
    console.log(results.tomorrow.description);

    $("#yesterdays-description").text(results.yesterday.description);
    $("#todays-description").text(results.today.description);
    $("#tomorrows-description").text(results.tomorrow.description);
  });
});
