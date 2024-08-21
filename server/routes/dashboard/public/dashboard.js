// Initial data structure to store incomes and expenses
let data = {
    expenses: [],
    incomes: []
};

// Function to update the display of incomes, expenses, and net balance
function updateDisplay() {
    const incomeList = document.getElementById('incomeList'); // List element for displaying incomes
    const expenseList = document.getElementById('expenseList'); // List element for displaying expenses
    const totalIncome = document.getElementById('totalIncome'); // Element for displaying total income
    const totalExpenses = document.getElementById('totalExpenses'); // Element for displaying total expenses
    const netBalance = document.getElementById('netBalance'); // Element for displaying net balance

    // Clear existing list items before updating
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';

    // Variables to accumulate total income and total expenses
    let incomeTotal = 0;
    let expenseTotal = 0;

    // Iterate through incomes and display them
    data.incomes.forEach((income) => {
        incomeTotal += income.amount; // Add income amount to total
        const li = document.createElement('li');
        li.textContent = `${income.name}: $${income.amount.toFixed(2)}`; // Display income name and amount

        // Add delete button for each income entry
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.onclick = () => deleteIncome(income.name); // Set delete functionality
        li.appendChild(deleteBtn);

        incomeList.appendChild(li); // Append income entry to the list
    });

    // Iterate through expenses and display them
    data.expenses.forEach((expense) => {
        expenseTotal += expense.amount; // Add expense amount to total
        const li = document.createElement('li');
        li.textContent = `${expense.name}: $${expense.amount.toFixed(2)}`; // Display expense name and amount

        // Add delete button for each expense entry
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.onclick = () => deleteExpense(expense.name); // Set delete functionality
        li.appendChild(deleteBtn);

        expenseList.appendChild(li); // Append expense entry to the list
    });

    // Update the total income, total expenses, and net balance on the UI
    totalIncome.textContent = incomeTotal.toFixed(2);
    totalExpenses.textContent = expenseTotal.toFixed(2);
    netBalance.textContent = (incomeTotal - expenseTotal).toFixed(2);
}

// Function to fetch user data from the server
async function getData() {
    try {
        const response = await fetch("/get-user-data", { method: "GET" });
        if (response.ok) {
            const respData = await response.json(); // Parse JSON response
            if (respData.status == 1) {
                throw new Error("Trouble retrieving data."); // Error if status is 1
            } else {
                data = respData.data; // Update local data with server data
                updateDisplay(); // Refresh display
            }
        } else {
            throw new Error("Trouble retrieving data."); // Error if response is not OK
        }
    } catch (err) {
        window.alert(err); // Display error message to the user
    }
}

// Function to add an expense
async function addExpense(name, amount) {
    try {
        const response = await fetch("/add-expense", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // Set content type to JSON
            },
            body: JSON.stringify({
                expenseName: name, // Pass expense name
                expenseAmount: amount // Pass expense amount
            })
        });

        if (response.ok) {
            const respData = await response.json(); // Parse JSON response

            if (respData.status == 1) {
                throw new Error("Trouble adding expense data."); // Error if status is 1
            } else {
                data = respData.data; // Update local data with server data
                updateDisplay(); // Refresh display
            }
        } else {
            throw new Error("Trouble adding expense data."); // Error if response is not OK
        }
    } catch (err) {
        window.alert(err); // Display error message to the user
    }
}

// Function to add income
async function addIncome(name, amount) {
    try {
        const response = await fetch("/add-income", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // Set content type to JSON
            },
            body: JSON.stringify({
                incomeName: name, // Pass income name
                incomeAmount: amount // Pass income amount
            })
        });

        if (response.ok) {
            const respData = await response.json(); // Parse JSON response

            if (respData.status == 1) {
                throw new Error("Trouble adding income data."); // Error if status is 1
            } else {
                data = respData.data; // Update local data with server data
                updateDisplay(); // Refresh display
            }
        } else {
            throw new Error("Trouble adding income data."); // Error if response is not OK
        }
    } catch (err) {
        window.alert(err); // Display error message to the user
    }
}

// Function to delete an expense
async function deleteExpense(name) {
    try {
        const response = await fetch("/delete-expense", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json" // Set content type to JSON
            },
            body: JSON.stringify({
                expenseName: name // Pass expense name to delete
            })
        });

        if (response.ok) {
            const respData = await response.json(); // Parse JSON response

            if (respData.status == 1) {
                throw new Error("Trouble deleting expense data."); // Error if status is 1
            } else {
                data = respData.data; // Update local data with server data
                updateDisplay(); // Refresh display
            }
        } else {
            throw new Error("Trouble deleting expense data."); // Error if response is not OK
        }
    } catch (err) {
        window.alert(err); // Display error message to the user
    }
}

// Function to delete income
async function deleteIncome(name) {
    try {
        const response = await fetch("/delete-income", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json" // Set content type to JSON
            },
            body: JSON.stringify({
                incomeName: name // Pass income name to delete
            })
        });

        if (response.ok) {
            const respData = await response.json(); // Parse JSON response

            if (respData.status == 1) {
                throw new Error("Trouble deleting income data."); // Error if status is 1
            } else {
                data = respData.data; // Update local data with server data
                updateDisplay(); // Refresh display
            }
        } else {
            throw new Error("Trouble deleting income data."); // Error if response is not OK
        }
    } catch (err) {
        window.alert(err); // Display error message to the user
    }
}

// Function to handle form submission for adding a new entry
document.getElementById('financeForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent the default form submission

    const entryType = document.getElementById('entryType').value; // Get type of entry (income or expense)
    const entryName = document.getElementById('entryName').value; // Get name of the entry
    const entryAmount = parseFloat(document.getElementById('entryAmount').value); // Get amount of the entry

    if (entryType === 'income') {
        await addIncome(entryName, entryAmount); // Add income if entry type is 'income'
    } else {
        await addExpense(entryName, entryAmount); // Add expense if entry type is 'expense'
    }

    // Clear form fields after submission
    document.getElementById('entryName').value = '';
    document.getElementById('entryAmount').value = '';
});

document.getElementById("logoutButton").addEventListener('click', async function () {
    window.location.href = "/logout";
})

// Fetch and display data when the page is loaded
getData();
