// Load environment variables from a .env file into process.env
require("dotenv").config();

// Import necessary modules
const express = require("express"); // Framework for building web applications
const bodyParser = require("body-parser"); // Middleware for parsing request bodies
const cookieParser = require("cookie-parser"); // Middleware for reading cookies
const pool = require("./pool.js"); // Database connection pool instance
const jwt = require("jsonwebtoken"); // Library for handling JSON Web Tokens (JWT)
const { validateUsername, validatePassword } = require("./validation.js"); // Validation functions for username and password
const bcrypt = require("bcryptjs"); // Library for hashing passwords
const userMethods = require("./user-methods.js");
const cors = require("cors");

const app = express();

app.use(cors());

// Middleware to parse incoming JSON request bodies
app.use(bodyParser.json()); // Parses application/json request bodies

// Middleware to read incoming request's cookies
app.use(cookieParser());

// Serve static files from the routes/login/public directory
app.use("/login", express.static("./routes/login/public"));

// Serve static files from the routes/dashboard/public directory
app.use("/dashboard", express.static("./routes/dashboard/public"));

// Server static files from the routes/signup/public
app.use("/signup", express.static("./routes/signup/public"));

// Serve the signup page on GET request, handling existing tokens
app.get("/signup", async (req, res) => {
    const { authToken, refreshToken } = req.cookies;
    let valid = false;

    if (authToken && refreshToken) {
        jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, async (err) => {
            if (err) {
                jwt.verify(
                    refreshToken,
                    process.env.REFRESH_TOKEN_SECRET,
                    async (err2) => {
                        if (!err) {
                            // refresh token is valid
                            valid = true;
                        }
                    }
                );
            } else {
                // auth token is valid
                valid = true;
            }
        });
    }

    if (!valid) return res.sendFile(__dirname + "/routes/signup/signup.html");
    else res.redirect("/dasboard");
});

// Sign up a user with a post request on the /signup route
app.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate username and password
        try {
            validateUsername(username);
            validatePassword(password);
        } catch (err) {
            return res.json({
                status: 1,
                message: err.message,
            });
        }

        const result = await userMethods.createUser(username, password);

        res.json({
            status: 0,
            message: "Success!",
        });
    } catch (err) {
        if (err.code === "23505") {
            return res.json({
                status: 1,
                message: "Username has already been taken.",
            });
        }
        return res.json({
            status: 1,
            message: "Unable to sign up at this time.",
        });
    }
});

// Serve the login page on GET request, handling existing tokens
app.get("/login", async (req, res) => {
    const { authToken, refreshToken } = req.cookies;

    if (authToken && refreshToken) {
        // Verify the access token
        jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, async (err) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    // Access token expired, validate the refresh token
                    try {
                        const validRefreshToken = await jwt.verify(
                            refreshToken,
                            process.env.REFRESH_TOKEN_SECRET
                        );

                        if (validRefreshToken) {
                            // Check if refresh token exists in the database
                            const result = await pool.query(
                                `SELECT 1 FROM refreshtokens WHERE token=$1`,
                                [refreshToken]
                            );
                            if (result.rowCount > 0) {
                                // Valid refresh token, redirect to dashboard
                                return res.redirect("/dashboard");
                            }
                        }
                    } catch (err) {
                        // Invalid refresh token, serve the login page
                        return res.sendFile(__dirname + "/routes/login/login.html");
                    }
                } else {
                    // Invalid token (not expired), serve the login page
                    return res.sendFile(__dirname + "/routes/login/login.html");
                }
            }
            // Valid access token, redirect to dashboard
            return res.redirect("/dashboard");
        });
    } else {
        // No tokens provided, serve login page
        return res.sendFile(__dirname + "/routes/login/login.html");
    }
});

// Log out the user and redirect them to the login page.
app.get("/logout", authenticateRequest, async (req, res) => {
    try {
        // Clear the authentication cookies
        res
            .clearCookie("authToken") // Remove the access token cookie
            .clearCookie("refreshToken"); // Remove the refresh token cookie

        // Delete previous refresh tokens for the user from the database
        // This ensures that old refresh tokens cannot be used after logout
        await pool.query(`DELETE FROM refreshtokens WHERE username=LOWER($1)`, [
            req.user.username, // Use the authenticated username to find and delete the tokens
        ]);

        // Redirect the user to the login page
        // This ensures the user is sent to the login page after logout
        res.redirect("/login");
    } catch (err) {
        // Handle errors by sending a 500 status and error message
        // This will be shown if something goes wrong during logout
        res.status(500).send("Error logging out.");
    }
});

// Protected route for dashboard
app.get("/dashboard", authenticateRequest, async (req, res) => {
    res.sendFile(__dirname + "/routes/dashboard/dashboard.html");
});

// Protected route to get data of user
// Route to get user data
app.get("/get-user-data", authenticateRequest, async (req, res) => {
    // Fetch user data using the username obtained from the authenticated request
    const userData = await userMethods.getUserData(req.user.username);
    let status = 0; // Status code for the response

    // If userData is null or undefined, set status to 1 (indicating an error)
    if (!userData) {
        status = 1;
    }

    // Respond with JSON containing the status and user data
    res.json({
        status: status,
        data: userData, // This can be null if something is invalid
    });
});

// Route to add an expense to the user's account
app.post("/add-expense", authenticateRequest, async (req, res) => {
    // Destructure expenseName and expenseAmount from the request body
    const { expenseName, expenseAmount } = req.body;

    try {
        // Add the expense using the user's username and the provided expense details
        const updatedData = await userMethods.addExpense(
            req.user.username,
            expenseName,
            expenseAmount
        );

        // Respond with status 0 (success) and the updated user data
        res.json({
            status: 0,
            data: updatedData,
        });
    } catch (err) {
        // Log the error message and respond with a 500 status and error details
        console.error("Error adding expense:", err.message);
        res.status(500).json({ status: 1, message: err.message });
    }
});

// Route to add income to the user's account
app.post("/add-income", authenticateRequest, async (req, res) => {
    // Destructure incomeName and incomeAmount from the request body
    const { incomeName, incomeAmount } = req.body;

    try {
        // Add the income using the user's username and the provided income details
        const updatedData = await userMethods.addIncome(
            req.user.username,
            incomeName,
            incomeAmount
        );

        // Respond with status 0 (success) and the updated user data
        res.json({
            status: 0,
            data: updatedData,
        });
    } catch (err) {
        // Log the error message and respond with a 500 status and error details
        console.error("Error adding income:", err.message);
        res.status(500).json({ status: 1, message: err.message });
    }
});

// Route to delete an expense from the user's account
app.delete("/delete-expense", authenticateRequest, async (req, res) => {
    // Destructure expenseName from the request body
    const { expenseName } = req.body;

    try {
        // Delete the expense using the user's username and the provided expense name
        const updatedData = await userMethods.deleteExpense(
            req.user.username,
            expenseName
        );

        // Respond with status 0 (success) and the updated user data
        res.json({
            status: 0,
            data: updatedData,
        });
    } catch (err) {
        // Log the error message and respond with a 500 status and error details
        console.error("Error deleting expense:", err.message);
        res.status(500).json({ status: 1, message: err.message });
    }
});

// Route to delete income from the user's account
app.delete("/delete-income", authenticateRequest, async (req, res) => {
    // Destructure incomeName from the request body
    const { incomeName } = req.body;

    try {
        // Delete the income using the user's username and the provided income name
        const updatedData = await userMethods.deleteIncome(
            req.user.username,
            incomeName
        );

        // Respond with status 0 (success) and the updated user data
        res.json({
            status: 0,
            data: updatedData,
        });
    } catch (err) {
        // Log the error message and respond with a 500 status and error details
        console.error("Error deleting income:", err.message);
        res.status(500).json({ status: 1, message: err.message });
    }
});

// Handle login requests
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Validate username and password
        try {
            validateUsername(username);
            validatePassword(password);
        } catch (err) {
            return res.json({
                status: 1,
                message: err.message,
            });
        }

        // Query the database to find the user
        const query = `SELECT * FROM users WHERE username=LOWER($1);`;
        const result = await pool.query(query, [username]);
        const user = result.rows[0];

        if (!user) return res.json({ status: 1, message: "User not found!" });

        // Check if the provided password matches the stored hash
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches)
            return res.json({ status: 1, message: "Credentials do not match!" });

        // Delete previous refresh tokens for the user
        await pool.query(`DELETE FROM refreshtokens WHERE username=LOWER($1)`, [
            username,
        ]);

        // Generate new tokens
        const accessToken = generateAccessToken(username);
        const refreshToken = generateRefreshToken(username);

        // Store the new refresh token in the database
        await pool.query(
            `INSERT INTO refreshtokens (token, username, created) VALUES ($1, LOWER($2), NOW()::date);`,
            [refreshToken, username]
        );

        // Set the tokens in cookies
        res
            .cookie("refreshToken", refreshToken, {
                httpOnly: true, // Ensure the cookie is accessible only by the web server
            })
            .cookie("authToken", accessToken, {
                httpOnly: true, // Securely store the access token in a cookie
            })
            .json({
                status: 0, // Status: 0 -> success
                message: "Login successful.",
            });
    } catch (err) {
        res.json({
            status: 1, // Status: 1 -> error
            message: "Login unpermitted due to error.",
        });
    }
});

// Start the server and listen on the port specified in environment variables
const listener = app.listen(process.env.SERVER_PORT, (err) => {
    if (err) {
        console.log("Error in server setup"); // Log error if server setup fails
    }
    console.log("Server listening on Port", listener.address().port); // Log the port on which the server is listening
});

// Function to generate a new access token
function generateAccessToken(username) {
    return jwt.sign({ username: username }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m", // Access token is valid for 1 minute
    });
}

// Function to generate a new refresh token
function generateRefreshToken(username) {
    return jwt.sign({ username: username }, process.env.REFRESH_TOKEN_SECRET);
}

// Middleware function to authenticate the request
async function authenticateRequest(req, res, next) {
    const { authToken, refreshToken } = req.cookies;

    if (!authToken) {
        return res.redirect("/login"); // No authToken, redirect to login
    }

    // Verify the access token
    jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                // Access token expired, verify the refresh token
                const result = await pool.query(
                    `SELECT username FROM refreshtokens WHERE token=$1;`,
                    [refreshToken]
                );

                if (result.rowCount > 0) {
                    // Refresh token is valid, generate a new access token
                    const user = jwt.verify(
                        refreshToken,
                        process.env.REFRESH_TOKEN_SECRET
                    );

                    res.cookie("authToken", generateAccessToken(user.username), {
                        httpOnly: true, // Securely store the access token in a cookie
                    });
                    req.user = user;
                    next(); // Continue with the request
                    return;
                } else {
                    // Invalid refresh token, redirect to login
                    return res.redirect("/login");
                }
            } else {
                // Invalid authToken, redirect to login
                return res.redirect("/login");
            }
        } else {
            req.user = user; // Attach user information to request object
            next(); // Proceed to the next middleware or route handler
        }
    });
}

// Function to end the database connection pool and exit the process
async function endPool() {
    await pool.end(); // Close all connections in the pool
    process.exit(0); // Exit the process with a status code of 0 (success)
}

// Handle SIGTERM signal (e.g., for graceful shutdown)
process.on("SIGTERM", endPool);

// Handle SIGINT signal (e.g., when user presses Ctrl+C)
process.on("SIGINT", endPool);
