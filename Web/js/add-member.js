/* =========================================================
   ADD MEMBER PAGE — STEP 3.3
   Supabase connection and chapter loading.
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const addMemberSupabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   PAGE ELEMENTS
   ========================================================= */

const addMemberForm =
    document.getElementById(
        "add-member-form"
    );


const chapterSelect =
    document.getElementById(
        "chapter-id"
    );


const chapterLoadingMessage =
    document.getElementById(
        "chapter-loading-message"
    );


const addMemberStatus =
    document.getElementById(
        "add-member-status"
    );


const saveMemberButton =
    document.getElementById(
        "save-member-button"
    );


const saveMemberButtonText =
    document.getElementById(
        "save-member-button-text"
    );


const saveMemberButtonSpinner =
    document.getElementById(
        "save-member-button-spinner"
    );


/* =========================================================
   HELPERS
   ========================================================= */

function showAddMemberStatus(
    message,
    type = "error"
) {

    if (!addMemberStatus) {
        return;
    }


    addMemberStatus.textContent =
        message;


    addMemberStatus.className =
        `form-status ${type}`;


    addMemberStatus.hidden =
        false;

}


function clearAddMemberStatus() {

    if (!addMemberStatus) {
        return;
    }


    addMemberStatus.textContent =
        "";


    addMemberStatus.hidden =
        true;


    addMemberStatus.className =
        "form-status";

}


function setSaveButtonLoading(
    isLoading
) {

    if (!saveMemberButton) {
        return;
    }


    saveMemberButton.disabled =
        isLoading;


    if (saveMemberButtonText) {

        saveMemberButtonText.textContent =
            isLoading
                ? "Saving..."
                : "Add Member";

    }


    if (saveMemberButtonSpinner) {

        saveMemberButtonSpinner.hidden =
            !isLoading;

    }

}


/* =========================================================
   SESSION CHECK
   ========================================================= */

async function checkAddMemberSession() {

    const {
        data: {
            session
        },
        error
    } =
        await addMemberSupabase.auth.getSession();


    if (error) {

        console.error(
            "Add Member session error:",
            error
        );


        showAddMemberStatus(
            "Your session could not be verified. Please sign in again."
        );


        return false;

    }


    if (!session) {

        window.location.href =
            "../index.html";


        return false;

    }


    console.log(
        "Add Member session verified:",
        session.user
    );


    return true;

}


/* =========================================================
   LOAD CHAPTERS
   ========================================================= */

async function loadChapters() {

    if (!chapterSelect) {
        return;
    }


    chapterSelect.disabled = true;


    if (chapterLoadingMessage) {

        chapterLoadingMessage.textContent =
            "Loading chapters...";

    }


    const {
        data,
        error
    } =
        await addMemberSupabase
            .from("chapter")
            .select("*");


    if (error) {

        console.error(
            "Chapter loading error:",
            error
        );


        chapterSelect.innerHTML = `
            <option value="">
                Unable to load chapters
            </option>
        `;


        if (chapterLoadingMessage) {

            chapterLoadingMessage.textContent =
                "Chapter list could not be loaded.";

        }


        showAddMemberStatus(
            "Chapter information could not be loaded. Please refresh the page and try again."
        );


        return false;

    }


    const chapters =
        data || [];


    /*
     * Sort in JavaScript instead of relying on
     * a database column name in the ORDER BY.
     */
    chapters.sort(
        (a, b) => {

            const nameA =
                String(
                    a.ChapterName ??
                    a.chapter_name ??
                    a.Chapter ??
                    a.name ??
                    ""
                );


            const nameB =
                String(
                    b.ChapterName ??
                    b.chapter_name ??
                    b.Chapter ??
                    b.name ??
                    ""
                );


            return nameA.localeCompare(
                nameB,
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            );

        }
    );


    chapterSelect.innerHTML = `
        <option value="">
            Select a chapter
        </option>
    `;


    chapters.forEach(
        chapter => {

            const chapterId =
                chapter.ChapterID ??
                chapter.chapter_id ??
                chapter.id;


            const chapterName =
                chapter.ChapterName ??
                chapter.chapter_name ??
                chapter.Chapter ??
                chapter.name ??
                `Chapter ${chapterId}`;


            if (
                chapterId === undefined ||
                chapterId === null
            ) {

                return;

            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(chapterId);


            option.textContent =
                String(chapterName);


            chapterSelect.appendChild(
                option
            );

        }
    );


    chapterSelect.disabled =
        chapters.length === 0;


    if (chapterLoadingMessage) {

        chapterLoadingMessage.textContent =

            chapters.length

                ? `${chapters.length} chapter${chapters.length === 1
                    ? ""
                    : "s"
                } available.`

                : "No chapters are currently available.";

    }


    if (!chapters.length) {

        showAddMemberStatus(
            "No chapters are currently available. Create a chapter before adding a member.",
            "info"
        );


        return false;

    }


    console.log(
        "Add Member - authenticated chapter data:",
        chapters
    );


    return true;

}


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

async function initializeAddMemberPage() {

    clearAddMemberStatus();


    const sessionValid =
        await checkAddMemberSession();


    if (!sessionValid) {
        return;
    }


    await loadChapters();

}


/* =========================================================
   FORM PLACEHOLDER
   ========================================================= */

/*
 * Form submission will be implemented in Step 3.6.
 *
 * For now, prevent accidental submission while
 * the database INSERT logic is not yet implemented.
 */

/* =========================================================
   FORM VALIDATION — STEP 3.4
   ========================================================= */


/* =========================================================
   FIELD HELPERS
   ========================================================= */

function getFieldValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return "";
    }

    return element.value.trim();

}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);

}


/* =========================================================
   CONTACT NUMBER VALIDATION
   ========================================================= */

function isValidContactNumber(contactNumber) {

    return /^\d{11}$/.test(
        contactNumber
    );

}


/* =========================================================
   BIRTH DATE VALIDATION
   ========================================================= */

function isValidBirthDate(birthDate) {

    if (!birthDate) {
        return false;
    }


    const selectedDate =
        new Date(
            `${birthDate}T00:00:00`
        );


    if (
        Number.isNaN(
            selectedDate.getTime()
        )
    ) {
        return false;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return selectedDate <= today;

}


/* =========================================================
   CLEAR FIELD ERROR
   ========================================================= */

function clearFieldError(
    id
) {

    const field =
        document.getElementById(id);


    if (!field) {
        return;
    }


    field.classList.remove(
        "input-error"
    );


    field.removeAttribute(
        "aria-invalid"
    );

}


/* =========================================================
   SHOW FIELD ERROR
   ========================================================= */

function showFieldError(
    id,
    message
) {

    const field =
        document.getElementById(id);


    if (!field) {
        return false;
    }


    field.classList.add(
        "input-error"
    );


    field.setAttribute(
        "aria-invalid",
        "true"
    );


    showAddMemberStatus(
        message,
        "error"
    );


    field.focus();


    return false;

}


/* =========================================================
   CLEAR ALL FIELD ERRORS
   ========================================================= */

function clearAllFieldErrors() {

    const fieldIds = [

        "first-name",

        "middle-name",

        "last-name",

        "birth-date",

        "contact-number",

        "email-address",

        "address",

        "chapter-id",

        "status"

    ];


    fieldIds.forEach(
        clearFieldError
    );

}


/* =========================================================
   VALIDATE FORM
   ========================================================= */

function validateAddMemberForm() {

    clearAllFieldErrors();

    clearAddMemberStatus();


    /* ---------------------------------------------
       Last Name
       --------------------------------------------- */

    const lastName =
        getFieldValue(
            "last-name"
        );


    if (!lastName) {

        return showFieldError(
            "last-name",
            "Last Name is required."
        );

    }


    /* ---------------------------------------------
       First Name
       --------------------------------------------- */

    const firstName =
        getFieldValue(
            "first-name"
        );


    if (!firstName) {

        return showFieldError(
            "first-name",
            "First Name is required."
        );

    }


    /* ---------------------------------------------
       Middle Name
       --------------------------------------------- */

    const middleName =
        getFieldValue(
            "middle-name"
        );


    /* ---------------------------------------------
       Birth Date
       --------------------------------------------- */

    const birthDate =
        getFieldValue(
            "birth-date"
        );


    if (!birthDate) {

        return showFieldError(
            "birth-date",
            "Birth Date is required."
        );

    }


    if (
        !isValidBirthDate(
            birthDate
        )
    ) {

        return showFieldError(
            "birth-date",
            "Birth Date cannot be in the future."
        );

    }


    /* ---------------------------------------------
       Contact Number
       --------------------------------------------- */

    const contactNumber =
        getFieldValue(
            "contact-number"
        );


    if (!contactNumber) {

        return showFieldError(
            "contact-number",
            "Contact Number is required."
        );

    }


    if (
        !isValidContactNumber(
            contactNumber
        )
    ) {

        return showFieldError(
            "contact-number",
            "Contact Number must contain exactly 11 digits."
        );

    }


    /* ---------------------------------------------
       Address
       --------------------------------------------- */

    const address =
        getFieldValue(
            "address"
        );


    if (!address) {

        return showFieldError(
            "address",
            "Address is required."
        );

    }


    /* ---------------------------------------------
       Email
       --------------------------------------------- */

    const emailAddress =
        getFieldValue(
            "email-address"
        );


    if (!emailAddress) {

        return showFieldError(
            "email-address",
            "Email Address is required."
        );

    }


    if (
        !isValidEmail(
            emailAddress
        )
    ) {

        return showFieldError(
            "email-address",
            "Please enter a valid Email Address."
        );

    }


    /* ---------------------------------------------
       Chapter
       --------------------------------------------- */

    const chapterId =
        getFieldValue(
            "chapter-id"
        );


    if (!chapterId) {

        return showFieldError(
            "chapter-id",
            "Please select a Chapter."
        );

    }


    /* ---------------------------------------------
       Status
       --------------------------------------------- */

    const status =
        getFieldValue(
            "status"
        );


    if (!status) {

        return showFieldError(
            "status",
            "Please select a Status."
        );

    }


    if (
        status !== "Active" &&
        status !== "Inactive"
    ) {

        return showFieldError(
            "status",
            "Please select a valid membership Status."
        );

    }


    /* ---------------------------------------------
       VALID
       --------------------------------------------- */

    return {

        valid: true,

        data: {

            lastName,

            firstName,

            middleName,

            birthDate,

            contactNumber,

            address,

            emailAddress,

            chapterId,

            status

        }

    };

}

/* =========================================================
   DATABASE PAYLOAD — STEP 3.5
   ========================================================= */

function buildMemberPayload(
    memberData
) {

    return {

        last_name:
            memberData.lastName,

        first_name:
            memberData.firstName,

        middle_name:
            memberData.middleName || null,

        birth_date:
            memberData.birthDate,

        contact_number:
            memberData.contactNumber,

        address:
            memberData.address,

        email_address:
            memberData.emailAddress,

        status:
            memberData.status,

        chapter_id:
            Number(
                memberData.chapterId
            )

    };

}

/* =========================================================
   INSERT MEMBER — STEP 3.7
   Database error handling.
   ========================================================= */

async function insertMember(
    memberPayload
) {

    try {

        const {
            data,
            error
        } =
            await addMemberSupabase
                .from("member")
                .insert(
                    memberPayload
                )
                .select()
                .single();


        if (error) {

            console.error(
                "Member insert error:",
                error
            );


            return {

                success: false,

                error

            };

        }


        console.log(
            "Member successfully inserted:",
            data
        );


        return {

            success: true,

            data

        };

    }

    catch (error) {

        console.error(
            "Unexpected member insert error:",
            error
        );


        return {

            success: false,

            error

        };

    }

}

/* =========================================================
   DATABASE ERROR MESSAGE
   ========================================================= */

function getMemberInsertErrorMessage(
    error
) {

    if (!error) {

        return (
            "The member could not be saved. " +
            "Please try again."
        );

    }


    const code =
        String(
            error.code || ""
        );


    const message =
        String(
            error.message || ""
        ).toLowerCase();


    /* ---------------------------------------------
       Duplicate / Unique Constraint
       PostgreSQL: 23505
       --------------------------------------------- */

    if (
        code === "23505" ||
        message.includes(
            "duplicate"
        ) ||
        message.includes(
            "already exists"
        )
    ) {

        return (
            "A member with the same unique information " +
            "already exists."
        );

    }


    /* ---------------------------------------------
       Foreign Key Constraint
       PostgreSQL: 23503
       --------------------------------------------- */

    if (
        code === "23503"
    ) {

        return (
            "The selected chapter is no longer available. " +
            "Please select another chapter and try again."
        );

    }


    /* ---------------------------------------------
       Not Null Constraint
       PostgreSQL: 23502
       --------------------------------------------- */

    if (
        code === "23502"
    ) {

        return (
            "Some required member information is missing. " +
            "Please review the form and try again."
        );

    }


    /* ---------------------------------------------
       Permission / Row-Level Security
       PostgreSQL: 42501
       --------------------------------------------- */

    if (
        code === "42501" ||
        message.includes(
            "permission denied"
        ) ||
        message.includes(
            "row-level security"
        ) ||
        message.includes(
            "policy"
        )
    ) {

        return (
            "You do not have permission to create a member. " +
            "Please contact an administrator."
        );

    }


    /* ---------------------------------------------
       Schema / Column Error
       PostgreSQL: 42703
       --------------------------------------------- */

    if (
        code === "42703" ||
        message.includes(
            "column"
        ) &&
        message.includes(
            "does not exist"
        )
    ) {

        return (
            "The member database structure is not configured correctly. " +
            "Please contact an administrator."
        );

    }


    /* ---------------------------------------------
       Network / Connection
       --------------------------------------------- */

    if (
        message.includes(
            "network"
        ) ||
        message.includes(
            "fetch"
        ) ||
        message.includes(
            "failed to fetch"
        )
    ) {

        return (
            "Unable to connect to the database. " +
            "Please check your internet connection and try again."
        );

    }


    /* ---------------------------------------------
       Fallback
       --------------------------------------------- */

    return (
        "The member could not be saved. " +
        "Please try again."
    );

}

/* =========================================================
   FORM SUBMISSION
   ========================================================= */

addMemberForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const validation =
            validateAddMemberForm();


        if (
            !validation ||
            validation.valid !== true
        ) {

            return;

        }


        const memberPayload =
            buildMemberPayload(
                validation.data
            );


        console.log(
            "Prepared member payload:",
            memberPayload
        );


        setSaveButtonLoading(
            true
        );


        showAddMemberStatus(
            "Saving member...",
            "info"
        );


        const result =
            await insertMember(
                memberPayload
            );


        setSaveButtonLoading(
            false
        );


        if (!result.success) {

            const errorMessage =
                getMemberInsertErrorMessage(
                    result.error
                );


            showAddMemberStatus(
                errorMessage,
                "error"
            );


            return;

        }

        /* =====================================================
   SUCCESS HANDLING
   ===================================================== */

        showAddMemberStatus(
            "Member successfully added. Redirecting to the Members directory...",
            "success"
        );


        /*
         * Keep the button disabled after a successful
         * submission so the user cannot accidentally
         * create the same member twice.
         */

        if (saveMemberButton) {

            saveMemberButton.disabled =
                true;

        }


        if (saveMemberButtonText) {

            saveMemberButtonText.textContent =
                "Member Added";

        }


        if (saveMemberButtonSpinner) {

            saveMemberButtonSpinner.hidden =
                true;

        }


        /*
         * Give the user a short moment to see the
         * success message before returning to Members.
         */

        setTimeout(
            () => {

                window.location.href =
                    "members.html?success=member-added";

            },
            900
        );

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeAddMemberPage
);