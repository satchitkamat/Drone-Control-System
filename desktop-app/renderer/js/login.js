
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const serialInput = document.getElementById("serialNumber");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginButton");
  const buttonText = document.getElementById("buttonText");
  const errorMessage = document.getElementById("errorMessage");

  // Password visibility elements
  const togglePassword = document.getElementById("togglePassword");
  const eyeIcon = document.getElementById("eyeIcon");

  // Show / Hide Password
  togglePassword.addEventListener("click", () => {
    const isPasswordHidden = passwordInput.type === "password";

    passwordInput.type = isPasswordHidden ? "text" : "password";

    togglePassword.setAttribute(
      "aria-label",
      isPasswordHidden ? "Hide password" : "Show password"
    );

    togglePassword.title = isPasswordHidden
      ? "Hide password"
      : "Show password";

    eyeIcon.innerHTML = isPasswordHidden
      ? `
        <path d="M3 3l18 18"/>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
        <path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a15.5 15.5 0 0 1-4 4.7"/>
        <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.3 0 2.5-.3 3.5-.7"/>
      `
      : `
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
  });

  // Login authentication
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const serialNumber = serialInput.value.trim().toUpperCase();
    const password = passwordInput.value;

    errorMessage.textContent = "";

    if (!serialNumber || !password) {
      errorMessage.textContent =
        "Enter your serial number and password.";
      return;
    }

    loginButton.disabled = true;
    buttonText.textContent = "AUTHENTICATING...";

    try {
      const result = await window.droneApp.login({
        serialNumber,
        password
      });

      if (!result.success) {
        errorMessage.textContent = result.message;
        return;
      }

      buttonText.textContent = "OPENING DASHBOARD...";

      const dashboardOpened =
        await window.droneApp.openDashboard();

      if (!dashboardOpened) {
        errorMessage.textContent =
          "Login successful, but dashboard could not open.";
      }

    } catch (error) {
      console.error("Login process error:", error);
      errorMessage.textContent = error.message;
    } finally {
      loginButton.disabled = false;
      buttonText.textContent = "CONNECT TO DRONE";
    }
  });
});
