// Helper function to validate password strength
function validatePassword(password) {
    // Define the minimum length and regex patterns for password complexity
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Check if the password meets the length requirement
    if (password.length < minLength) {
        throw new Error("Password must be at least 8 characters long");
    }
    // Check if the password meets the complexity requirements
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
        throw new Error(
            "Password must include uppercase, lowercase, number, and special character"
        );
    }
}

// Helper function to validate username
function validateUsername(username) {
    // Allow only alphanumeric characters and underscores
    const isValid = /^[a-zA-Z0-9_]+$/.test(username);
    if (!isValid) {
        throw new Error(
            "Username can only contain letters, numbers, and underscores"
        );
    }
}

module.exports = {
    validateUsername, validatePassword
}