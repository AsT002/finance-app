// Function to toggle password visibility
function togglePassword() {
    // Enables users to see their password by changing the input type from 'password' to 'text'
    // Toggled by the checkbox

    var passInput = document.getElementById("password"); // Get the password input field
    var toggler = document.getElementById("toggle"); // Get the checkbox element used to toggle visibility

    // Check if the toggler checkbox is checked
    if (toggler.checked) {
        // Show the password by setting input type to 'text'
        passInput.type = "text";
    } else {
        // Hide the password by setting input type to 'password'
        passInput.type = "password";
    }
}

// Function to handle user login
async function login() {
    // Retrieve username and password values from input fields
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById('error-message'); // Get the error message display element

    // Clear any previous error messages
    errorMessage.innerHTML = "";

    try {
        // Send login request to the server
        const res = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // Indicate that the request body contains JSON
            },
            body: JSON.stringify({
                username: username, // Send the username
                password: password  // Send the password
            })
        });

        if (res.ok) {
            // Check if the response status indicates success
            const data = await res.json(); // Parse the JSON response

            if (data.status == 1) {
                // If the status indicates an error, display the error message
                errorMessage.innerHTML = data.message;
            } else if (data.status == 0) {
                // If the status indicates success, store the access token and redirect to the dashboard
                window.location = "../dashboard"; // Redirect to the dashboard page
            }
        }
    } catch (err) {
        // Handle any errors that occur during the fetch operation
        errorMessage.innerHTML = "Unknown Error Occurred."; // Display a generic error message
    }
}