/* =========================================================
   MFC YOUTH AREA MANAGEMENT SYSTEM
   Authentication
   ========================================================= */


/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const loginForm =
    document.getElementById("login-form");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("login-button");

const loginButtonText =
    document.getElementById("login-button-text");

const loginButtonSpinner =
    document.getElementById("login-button-spinner");

const loginStatus =
    document.getElementById("login-status");

const togglePasswordButton =
    document.getElementById("toggle-password");


/* =========================================================
   LOGIN STATUS
   ========================================================= */

function setLoginStatus(message, type = "error") {

    if (!loginStatus) {
        return;
    }

    loginStatus.textContent = message;

    loginStatus.classList.remove(
        "success",
        "error"
    );

    if (message) {
        loginStatus.classList.add(type);
    }

}


/* =========================================================
   LOGIN LOADING STATE
   ========================================================= */

function setLoginLoading(isLoading) {

    if (!loginButton) {
        return;
    }

    loginButton.disabled = isLoading;

    if (loginButtonText) {

        loginButtonText.textContent =
            isLoading
                ? "Signing in..."
                : "Sign In";

    }

    if (loginButtonSpinner) {

        loginButtonSpinner.hidden =
            !isLoading;

    }

}


/* =========================================================
   FORM VALIDATION
   ========================================================= */

function validateLoginForm() {

    const email =
        emailInput?.value.trim();

    const password =
        passwordInput?.value;

    if (!email) {

        setLoginStatus(
            "Please enter your email address."
        );

        emailInput?.focus();

        return false;
    }


    if (!emailInput.checkValidity()) {

        setLoginStatus(
            "Please enter a valid email address."
        );

        emailInput?.focus();

        return false;
    }


    if (!password) {

        setLoginStatus(
            "Please enter your password."
        );

        passwordInput?.focus();

        return false;
    }


    return true;
}


/* =========================================================
   SIGN IN
   ========================================================= */

async function signIn() {

    if (!validateLoginForm()) {
        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    setLoginStatus("");

    setLoginLoading(true);


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            setLoginStatus(
                getFriendlyAuthError(error)
            );

            return;
        }


        if (!data?.session) {

            setLoginStatus(
                "Login could not be completed. Please try again."
            );

            return;
        }


        console.log(
            "Authentication successful:",
            data.user
        );


        setLoginStatus(
            "Login successful. Redirecting...",
            "success"
        );


        /*
         * Give the user a short visual confirmation
         * before moving to the dashboard.
         */

        setTimeout(() => {

            window.location.href =
                "pages/dashboard.html";

        }, 500);


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        setLoginStatus(
            "Something went wrong while signing in. Please try again."
        );

    } finally {

        setLoginLoading(false);

    }

}


/* =========================================================
   FRIENDLY AUTHENTICATION ERRORS
   ========================================================= */

function getFriendlyAuthError(error) {

    if (!error) {

        return "Unable to sign in. Please try again.";

    }


    const message =
        error.message?.toLowerCase() || "";


    if (
        message.includes("invalid login credentials")
    ) {

        return "Incorrect email or password.";

    }


    if (
        message.includes("email not confirmed")
    ) {

        return "Please confirm your email address before signing in.";

    }


    if (
        message.includes("too many requests")
    ) {

        return "Too many login attempts. Please wait a moment and try again.";

    }


    if (
        message.includes("network")
    ) {

        return "Unable to connect to the authentication service. Check your internet connection.";

    }


    return (
        error.message ||
        "Unable to sign in. Please try again."
    );

}


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

function initializePasswordToggle() {

    if (
        !togglePasswordButton ||
        !passwordInput
    ) {
        return;
    }


    togglePasswordButton.addEventListener(
        "click",
        () => {

            const showingPassword =
                passwordInput.type === "text";


            passwordInput.type =
                showingPassword
                    ? "password"
                    : "text";


            togglePasswordButton.textContent =
                showingPassword
                    ? "Show"
                    : "Hide";


            togglePasswordButton.setAttribute(
                "aria-label",
                showingPassword
                    ? "Show password"
                    : "Hide password"
            );


            togglePasswordButton.setAttribute(
                "aria-pressed",
                String(!showingPassword)
            );

        }
    );

}


/* =========================================================
   EXISTING SESSION
   ========================================================= */

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session check error:",
                error
            );

            return;
        }


        const session =
            data?.session;


        if (session) {

            console.log(
                "Existing session found:",
                session.user
            );


            window.location.href =
                "pages/dashboard.html";

        }

    } catch (error) {

        console.error(
            "Unexpected session error:",
            error
        );

    }

}


/* =========================================================
   LOGIN FORM
   ========================================================= */

function initializeLoginForm() {

    if (!loginForm) {
        return;
    }


    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            await signIn();

        }
    );

}


/* =========================================================
   ENTER KEY / INPUT CLEANUP
   ========================================================= */

function initializeInputBehavior() {

    if (emailInput) {

        emailInput.addEventListener(
            "input",
            () => {

                setLoginStatus("");

            }
        );

    }


    if (passwordInput) {

        passwordInput.addEventListener(
            "input",
            () => {

                setLoginStatus("");

            }
        );

    }

}


/* =========================================================
   INITIALIZE AUTHENTICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeLoginForm();

        initializePasswordToggle();

        initializeInputBehavior();

        await checkExistingSession();

    }
);