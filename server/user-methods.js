// Import required modules
const pool = require("./pool.js"); // Database connection pool instance
const bcrypt = require("bcryptjs"); // Library for hashing passwords
const { validateUsername, validatePassword } = require("./validation.js")

// Function to check if a user with a specific username exists
async function checkUserExists(username) {
    try {
        // Ensure username is provided and valid
        if (!username) {
            throw new Error("Username is required");
        }
        validateUsername(username);

        // The SQL query to check if a user with the given username exists
        const query = `SELECT 1 FROM users WHERE username=LOWER($1)`;

        // Execute the query with the provided username
        const res = await pool.query(query, [username]);
        // Return true if user exists, false otherwise
        return res.rowCount > 0;
    } catch (err) {
        console.log("Err checking for user:", err.stack);
        throw err;
    }
}

// Function to create a new user with a hashed password and default data
async function createUser(username, password) {
    try {
        // Ensure username is provided and valid
        if (!username) {
            throw new Error("Username is required");
        }
        validateUsername(username);

        // Ensure password is provided and strong
        if (!password) {
            throw new Error("Password is required");
        }
        validatePassword(password);

        // Hash the password for security
        const hashedPass = await bcrypt.hash(password, 10);

        // Default data structure for a new user
        const defaultData = JSON.stringify({
            expenses: [],
            incomes: [],
        });

        // The SQL query to insert a new user into the database
        const query = `INSERT INTO users (username, password, data) 
                       VALUES (LOWER($1), $2, $3) 
                       RETURNING *;`;

        // Execute the query with the provided username, hashed password, and default data
        const res = await pool.query(query, [username, hashedPass, defaultData]);

        // Return the newly created user data
        return res;
    } catch (err) {
        console.log("Err adding user:", err.stack);
        throw err;
    }
}

// Function to delete a user by username
async function deleteUser(username) {
    try {
        // Ensure username is provided and valid
        if (!username) {
            throw new Error("Username is required");
        }
        validateUsername(username);

        // The SQL query to delete a user from the database
        const query = `DELETE FROM users WHERE username=LOWER($1);`;

        // Execute the query with the provided username
        const res = await pool.query(query, [username]);

        // Return true if a user was deleted, false otherwise
        return res.rowCount > 0;
    } catch (err) {
        console.log("Err deleting user:", err.stack);
        throw err;
    }
}

// Function to retrieve user data by username
async function getUserData(username) {
    try {
        // Ensure username is provided and valid
        if (!username) {
            throw new Error("Username is required");
        }
        validateUsername(username);

        // The SQL query to retrieve user data
        const query = "SELECT data FROM users WHERE username=LOWER($1);";

        // Execute the query with the provided username
        const res = await pool.query(query, [username]);

        // Return the user data if found, otherwise return null
        return res.rowCount > 0 ? res.rows[0].data : null;
    } catch (err) {
        console.log("Err getting user data:", err.stack);
        return null;
    }
}

// Function to add a new expense to a user's data
async function addExpense(username, expenseName, expenseAmount) {
    try {
        // Ensure username is provided and valid
        if (!username) {
            throw new Error("Username is required");
        }
        validateUsername(username);

        // Ensure expense name is provided
        if (!expenseName) {
            throw new Error("Expense name is required");
        }

        // Ensure expense amount is a valid number and greater than zero
        if (isNaN(expenseAmount) || parseFloat(expenseAmount) <= 0) {
            throw new Error("Expense amount must be a positive number");
        }

        // Retrieve the current data of the user
        let data = await getUserData(username);

        // Ensure the data doesn't exceed a certain size (e.g., 1MB)
        const dataSizeLimit = 1024 * 1024; // 1MB in bytes
        const newSize =
            Buffer.byteLength(JSON.stringify(data)) +
            Buffer.byteLength(
                JSON.stringify({ name: expenseName, amount: parseFloat(expenseAmount) })
            );
        if (newSize > dataSizeLimit) {
            throw new Error("Data size limit exceeded");
        }

        // Check if user data exists
        if (data && data.expenses) {
            let expenseFound = false;

            // Update the amount if the expense already exists
            data.expenses.forEach((expense) => {
                if (expense.name.toLowerCase() === expenseName.toLowerCase()) {

                    if (expense.amount === parseFloat(expenseAmount)) {
                        // same amount, no need to query
                        return data;
                    }

                    expense.amount = parseFloat(expenseAmount);
                    expenseFound = true;
                }
            });

            // Add the expense if it is new
            if (!expenseFound) {
                data.expenses.push({
                    name: expenseName,
                    amount: parseFloat(expenseAmount), // Convert amount to a float
                });
            }

            // The SQL query to update the user's data in the database
            const query = `UPDATE users SET data = $1 WHERE username = LOWER($2) RETURNING data;`;

            // Execute the query with the updated data and username
            const res = await pool.query(query, [JSON.stringify(data), username]);

            // Return the updated user data
            return res.rowCount > 0 ? res.rows[0].data : null;
        } else {
            throw new Error(
                "User data does not exist or the expenses field is missing"
            );
        }
    } catch (err) {
        console.log("Err updating (adding expense) user data:", err.message);
        throw err;
    }
}

// Function to delete an expense from a user's data
async function deleteExpense(username, expenseName) {
    try {
        // Ensure username is provided and valid
        if (!username) {
            throw new Error("Username is required");
        }
        validateUsername(username);

        // Ensure expense name is provided
        if (!expenseName) {
            throw new Error("Expense name is required");
        }

        // Retrieve the current data of the user
        let data = await getUserData(username);

        // Check if user data exists and contains expenses
        if (data && data.expenses) {
            let originalLength = data.expenses.length;
            // Filter out the expense that matches the given expense name
            data.expenses = data.expenses.filter((expense) => expense.name.toLowerCase() !== expenseName.toLowerCase());

            // Check if any expense was removed
            if (data.expenses.length === originalLength) {
                throw new Error(`Expense with the name "${expenseName}" not found.`);
            }

            // The SQL query to update the user's data in the database
            const query = `UPDATE users SET data = $1 WHERE username = LOWER($2) RETURNING data;`;

            // Execute the query with the updated data and username
            const res = await pool.query(query, [JSON.stringify(data), username]);

            // Return the updated user data
            return res.rowCount > 0 ? res.rows[0].data : null;
        } else {
            throw new Error(
                "User data does not exist or the expenses field is missing"
            );
        }
    } catch (err) {
        console.log("Err updating (deleting expense) user data:", err.message);
        throw err;
    }
}

// Function to add a new income to a user's data
async function addIncome(username, incomeName, incomeAmount) {
    try {
        // Ensure username is provided and valid
        if (!username) {
            throw new Error("Username is required");
        }
        validateUsername(username);

        // Ensure income name is provided
        if (!incomeName) {
            throw new Error("Income name is required");
        }

        // Ensure income amount is a valid number and greater than zero
        if (isNaN(incomeAmount) || parseFloat(incomeAmount) <= 0) {
            throw new Error("Income amount must be a positive number");
        }

        // Retrieve the current data of the user
        let data = await getUserData(username);

        // Ensure the data doesn't exceed a certain size (e.g., 1MB)
        const dataSizeLimit = 1024 * 1024; // 1MB in bytes
        const newSize =
            Buffer.byteLength(JSON.stringify(data)) +
            Buffer.byteLength(
                JSON.stringify({ name: incomeName, amount: parseFloat(incomeAmount) })
            );
        if (newSize > dataSizeLimit) {
            throw new Error("Data size limit exceeded");
        }

        // Check if user data exists
        if (data && data.incomes) {
            let incomeFound = false;

            // Update the amount if the income already exists
            data.incomes.forEach((income) => {
                if (income.name.toLowerCase() === incomeName.toLowerCase()) {

                    if (income.amount === parseFloat(incomeAmount)) {
                        // same amount, no need to query
                        return data;
                    }

                    income.amount = parseFloat(incomeAmount);
                    incomeFound = true;
                }
            });

            // Add the income if it is new
            if (!incomeFound) {
                data.incomes.push({
                    name: incomeName,
                    amount: parseFloat(incomeAmount), // Convert amount to a float
                });
            }

            // The SQL query to update the user's data in the database
            const query = `UPDATE users SET data = $1 WHERE username = LOWER($2) RETURNING data;`;

            // Execute the query with the updated data and username
            const res = await pool.query(query, [JSON.stringify(data), username]);

            // Return the updated user data
            return res.rowCount > 0 ? res.rows[0].data : null;
        } else {
            throw new Error(
                "User data does not exist or the incomes field is missing"
            );
        }
    } catch (err) {
        console.log("Err updating (adding income) user data:", err.message);
        throw err;
    }
}

// Function to delete an income from a user's data
async function deleteIncome(username, incomeName) {
    try {
        // Ensure username is provided and valid
        if (!username) {
            throw new Error("Username is required");
        }
        validateUsername(username);

        // Ensure income name is provided
        if (!incomeName) {
            throw new Error("Income name is required");
        }

        // Retrieve the current data of the user
        let data = await getUserData(username);

        // Check if user data exists and contains incomes
        if (data && data.incomes) {
            let originalLength = data.incomes.length;
            // Filter out the income that matches the given income name
            data.incomes = data.incomes.filter((income) => income.name.toLowerCase() !== incomeName.toLowerCase());

            // Check if any income was removed
            if (data.incomes.length === originalLength) {
                throw new Error(`Income with the name "${incomeName}" not found.`);
            }

            // The SQL query to update the user's data in the database
            const query = `UPDATE users SET data = $1 WHERE username = LOWER($2) RETURNING data;`;

            // Execute the query with the updated data and username
            const res = await pool.query(query, [JSON.stringify(data), username]);

            // Return the updated user data
            return res.rowCount > 0 ? res.rows[0].data : null;
        } else {
            throw new Error(
                "User data does not exist or the incomes field is missing"
            );
        }
    } catch (err) {
        console.log("Err updating (deleting income) user data:", err.message);
        throw err;
    }
}

// Export all the functions for use in other modules
module.exports = {
    checkUserExists,
    createUser,
    deleteUser,
    addExpense,
    deleteExpense,
    addIncome,
    deleteIncome,
    getUserData
};
