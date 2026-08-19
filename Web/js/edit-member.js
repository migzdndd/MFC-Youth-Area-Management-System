/* =========================================================
   EDIT MEMBER PAGE
   Step 4.2 — Load existing member
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const editMemberSupabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   STATE
   ========================================================= */

const editMemberState = {

    memberId: null,

    member: null,

    chapters: [],

    isLoading: false

};


/* =========================================================
   DOM
   ========================================================= */

const editMemberForm =
    document.getElementById(
        "edit-member-form"
    );

const editMemberStatus =
    document.getElementById(
        "edit-member-status"
    );

const chapterSelect =
    document.getElementById(
        "chapter-id"
    );

const chapterLoadingStatus =
    document.getElementById(
        "chapter-loading-status"
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

function getField(
    row,
    names,
    fallback = ""
) {

    for (
        const name of names
    ) {

        if (
            row &&
            row[name] !== undefined &&
            row[name] !== null
        ) {

            return row[name];

        }

    }

    return fallback;

}


function getMemberId(
    member
) {

    return getField(
        member,
        [
            "MemberID",
            "member_id",
            "id"
        ]
    );

}


function showStatus(
    message,
    type = "info"
) {

    if (!editMemberStatus) {
        return;
    }


    editMemberStatus.textContent =
        message;

    editMemberStatus.className =
        `form-status ${type}`;

    editMemberStatus.hidden =
        !message;

}


function clearStatus() {

    showStatus("");

}


function setSaveButtonLoading(
    loading
) {

    if (saveMemberButton) {

        saveMemberButton.disabled =
            loading;

    }


    if (saveMemberButtonText) {

        saveMemberButtonText.textContent =
            loading
                ? "Loading..."
                : "Save Changes";

    }


    if (saveMemberButtonSpinner) {

        saveMemberButtonSpinner.hidden =
            !loading;

    }

}


/* =========================================================
   URL MEMBER ID
   ========================================================= */

function getMemberIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const value =
        params.get(
            "id"
        );


    if (!value) {
        return null;
    }


    const memberId =
        Number(value);


    if (
        !Number.isInteger(
            memberId
        ) ||
        memberId <= 0
    ) {

        return null;

    }


    return memberId;

}


/* =========================================================
   LOAD CHAPTERS
   ========================================================= */

async function loadChapters() {

    if (!chapterSelect) {
        return;
    }


    chapterSelect.innerHTML = `
        <option value="">
            Loading chapters...
        </option>
    `;


    try {

        const {
            data,
            error
        } =
            await editMemberSupabase
                .from("chapter")
                .select("*");


        if (error) {

            console.error(
                "Edit Member chapter error:",
                error
            );

            throw error;

        }


        editMemberState.chapters =
            data || [];


        chapterSelect.innerHTML = `
            <option value="">
                Select a chapter
            </option>
        `;


        editMemberState.chapters
            .sort(
                (a, b) =>
                    String(
                        getField(
                            a,
                            [
                                "ChapterName",
                                "chapter_name",
                                "Chapter",
                                "name"
                            ]
                        )
                    ).localeCompare(
                        String(
                            getField(
                                b,
                                [
                                    "ChapterName",
                                    "chapter_name",
                                    "Chapter",
                                    "name"
                                ]
                            )
                        ),
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    )
            )
            .forEach(
                chapter => {

                    const id =
                        getField(
                            chapter,
                            [
                                "ChapterID",
                                "chapter_id",
                                "id"
                            ]
                        );


                    const name =
                        getField(
                            chapter,
                            [
                                "ChapterName",
                                "chapter_name",
                                "Chapter",
                                "name"
                            ],
                            "Unnamed chapter"
                        );


                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        String(id);

                    option.textContent =
                        name;


                    chapterSelect.appendChild(
                        option
                    );

                }
            );


        if (chapterLoadingStatus) {

            chapterLoadingStatus.textContent =
                `${editMemberState.chapters.length} chapters available.`;

        }


        console.log(
            "Edit Member - authenticated chapter data:",
            editMemberState.chapters
        );

    }

    catch (error) {

        if (chapterLoadingStatus) {

            chapterLoadingStatus.textContent =
                "Chapter data could not be loaded.";

        }


        showStatus(
            "Chapter data could not be loaded. Please try again.",
            "error"
        );

    }

}


/* =========================================================
   LOAD MEMBER
   ========================================================= */

async function loadMember() {

    const memberId =
        editMemberState.memberId;


    if (!memberId) {

        showStatus(
            "No valid member was selected.",
            "error"
        );

        return false;

    }


    setSaveButtonLoading(
        true
    );


    showStatus(
        "Loading member information...",
        "info"
    );


    try {

        const {
            data,
            error
        } =
            await editMemberSupabase
                .from("member")
                .select("*")
                .eq(
                    "member_id",
                    memberId
                )
                .single();


        if (error) {

            console.error(
                "Edit Member load error:",
                error
            );

            throw error;

        }


        if (!data) {

            showStatus(
                "The selected member could not be found.",
                "error"
            );

            return false;

        }


        editMemberState.member =
            data;


        populateMemberForm(
            data
        );


        clearStatus();


        console.log(
            "Edit Member loaded:",
            data
        );


        return true;

    }

    catch (error) {

        console.error(
            "Edit Member load error:",
            error
        );


        showStatus(
            "Member information could not be loaded. Please try again.",
            "error"
        );


        return false;

    }

    finally {

        setSaveButtonLoading(
            false
        );

    }

}


/* =========================================================
   POPULATE FORM
   ========================================================= */

function populateMemberForm(
    member
) {

    const lastName =
        document.getElementById(
            "last-name"
        );

    const firstName =
        document.getElementById(
            "first-name"
        );

    const middleName =
        document.getElementById(
            "middle-name"
        );

    const birthDate =
        document.getElementById(
            "birth-date"
        );

    const contactNumber =
        document.getElementById(
            "contact-number"
        );

    const emailAddress =
        document.getElementById(
            "email-address"
        );

    const address =
        document.getElementById(
            "address"
        );

    const status =
        document.getElementById(
            "status"
        );


    if (lastName) {

        lastName.value =
            getField(
                member,
                [
                    "LastName",
                    "last_name"
                ]
            );

    }


    if (firstName) {

        firstName.value =
            getField(
                member,
                [
                    "FirstName",
                    "first_name"
                ]
            );

    }


    if (middleName) {

        middleName.value =
            getField(
                member,
                [
                    "MiddleName",
                    "middle_name"
                ]
            );

    }


    if (birthDate) {

        const value =
            getField(
                member,
                [
                    "BirthDate",
                    "birth_date"
                ]
            );


        if (value) {

            birthDate.value =
                String(value).slice(
                    0,
                    10
                );

        }

    }


    if (contactNumber) {

        contactNumber.value =
            getField(
                member,
                [
                    "ContactNumber",
                    "contact_number"
                ]
            );

    }


    if (emailAddress) {

        emailAddress.value =
            getField(
                member,
                [
                    "EmailAddress",
                    "email_address",
                    "email"
                ]
            );

    }


    if (address) {

        address.value =
            getField(
                member,
                [
                    "Address",
                    "address"
                ]
            );

    }


    if (status) {

        status.value =
            getField(
                member,
                [
                    "Status",
                    "status"
                ]
            );

    }


    if (chapterSelect) {

        chapterSelect.value =
            String(
                getField(
                    member,
                    [
                        "ChapterID",
                        "chapter_id"
                    ]
                )
            );

    }

}


/* =========================================================
   CANCEL
   ========================================================= */

function cancelEditMember() {

    window.location.href =
        "members.html";

}


document
    .getElementById(
        "cancel-edit-member"
    )
    ?.addEventListener(
        "click",
        cancelEditMember
    );


document
    .getElementById(
        "cancel-edit-member-bottom"
    )
    ?.addEventListener(
        "click",
        cancelEditMember
    );


/* =========================================================
   FORM SUBMISSION
   ========================================================= */

editMemberForm?.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        /*
         * UPDATE functionality will be implemented
         * in the next Edit Member step.
         */

        showStatus(
            "Edit Member saving will be enabled in the next step.",
            "info"
        );

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeEditMemberPage() {

    editMemberState.memberId =
        getMemberIdFromUrl();


    if (
        !editMemberState.memberId
    ) {

        showStatus(
            "No valid member ID was provided.",
            "error"
        );

        return;

    }


    console.log(
        "Edit Member ID:",
        editMemberState.memberId
    );


    await loadChapters();


    await loadMember();

}


document.addEventListener(
    "DOMContentLoaded",
    initializeEditMemberPage
);