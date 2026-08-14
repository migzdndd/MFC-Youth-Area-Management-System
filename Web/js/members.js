/* =========================================================
   MEMBERS PAGE — STEP 1
   Real Supabase member directory and summary data.
   ========================================================= */

const membersSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


const membersState = {
    members: [],
    chapters: [],
    services: [],
    assignments: []
};


/* =========================================================
   HELPERS
   ========================================================= */

function field(row, names, fallback = "") {

    for (const name of names) {

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


function normalizeStatus(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   MEMBER HELPERS
   ========================================================= */

function getMemberName(member) {

    const first = field(
        member,
        ["FirstName", "first_name"]
    );

    const middle = field(
        member,
        ["MiddleName", "middle_name"]
    );

    const last = field(
        member,
        ["LastName", "last_name"]
    );

    return [
        first,
        middle,
        last
    ]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unnamed member";
}


function getInitials(name) {

    const parts = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) {
        return "M";
    }

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   CHAPTER HELPERS
   ========================================================= */

function getChapterName(chapterId) {

    const chapter = membersState.chapters.find(
        item =>
            String(
                field(
                    item,
                    [
                        "ChapterID",
                        "chapter_id",
                        "id"
                    ]
                )
            ) === String(chapterId)
    );

    return field(
        chapter,
        [
            "ChapterName",
            "chapter_name",
            "Chapter",
            "name"
        ],
        "Unassigned"
    );
}


/* =========================================================
   SERVICE HELPERS
   ========================================================= */

function getMemberServices(memberId) {

    const serviceIds = membersState.assignments
        .filter(
            assignment =>
                String(
                    field(
                        assignment,
                        [
                            "MemberID",
                            "member_id"
                        ]
                    )
                ) === String(memberId)
        )
        .map(
            assignment =>
                field(
                    assignment,
                    [
                        "ServiceID",
                        "service_id"
                    ]
                )
        );

    return serviceIds
        .map(
            serviceId =>
                membersState.services.find(
                    service =>
                        String(
                            field(
                                service,
                                [
                                    "ServiceID",
                                    "service_id",
                                    "id"
                                ]
                            )
                        ) === String(serviceId)
                )
        )
        .filter(Boolean)
        .map(
            service =>
                field(
                    service,
                    [
                        "ServiceName",
                        "service_name",
                        "Service",
                        "name"
                    ],
                    "Unnamed service"
                )
        );
}


/* =========================================================
   UI HELPERS
   ========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function setError(message = "") {

    const error =
        document.getElementById("members-error");

    if (!error) {
        return;
    }

    error.textContent = message;

    error.hidden = !message;
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderSummary() {

    const members =
        membersState.members;


    const active =
        members.filter(
            member =>
                normalizeStatus(
                    field(
                        member,
                        [
                            "Status",
                            "status"
                        ]
                    )
                ) === "active"
        );


    const inactive =
        members.filter(
            member =>
                normalizeStatus(
                    field(
                        member,
                        [
                            "Status",
                            "status"
                        ]
                    )
                ) === "inactive"
        );


    const withoutServices =
        members.filter(
            member => {

                const memberId =
                    field(
                        member,
                        [
                            "MemberID",
                            "member_id",
                            "id"
                        ]
                    );

                return (
                    getMemberServices(memberId)
                        .length === 0
                );
            }
        );


    setText(
        "total-members",
        members.length
    );


    setText(
        "active-members",
        active.length
    );


    setText(
        "inactive-members",
        inactive.length
    );


    setText(
        "members-without-services",
        withoutServices.length
    );


    setText(
        "member-count-label",
        `${members.length} ${members.length === 1
            ? "member"
            : "members"
        }`
    );
}


/* =========================================================
   MEMBER TABLE
   ========================================================= */

function renderTable() {

    const body =
        document.getElementById(
            "members-table-body"
        );


    if (!body) {
        return;
    }


    /* Empty state */

    if (!membersState.members.length) {

        body.innerHTML = `
            <tr>
                <td colspan="5">

                    <div class="members-state">

                        <div
                            class="members-state-icon"
                            aria-hidden="true"
                        >
                            ◉
                        </div>

                        <div class="members-state-title">
                            No members found
                        </div>

                        <p class="members-state-text">
                            There are currently no
                            member records available
                            to your account.
                        </p>

                    </div>

                </td>
            </tr>
        `;

        return;
    }


    /* Member rows */

    body.innerHTML =
        membersState.members
            .map(member => {

                const memberId =
                    field(
                        member,
                        [
                            "MemberID",
                            "member_id",
                            "id"
                        ]
                    );


                const name =
                    getMemberName(member);


                const email =
                    field(
                        member,
                        [
                            "EmailAddress",
                            "email_address",
                            "email"
                        ]
                    );


                const chapterId =
                    field(
                        member,
                        [
                            "ChapterID",
                            "chapter_id"
                        ]
                    );


                const chapterName =
                    getChapterName(
                        chapterId
                    );


                const contact =
                    field(
                        member,
                        [
                            "ContactNumber",
                            "contact_number",
                            "contact"
                        ],
                        "—"
                    );


                const status =
                    normalizeStatus(
                        field(
                            member,
                            [
                                "Status",
                                "status"
                            ]
                        )
                    );


                const services =
                    getMemberServices(
                        memberId
                    );


                /* Service badges */

                const serviceMarkup =
                    services.length

                        ? services
                            .map(
                                service => `
                                    <span
                                        class="member-service-badge"
                                    >
                                        ${escapeHtml(service)}
                                    </span>
                                `
                            )
                            .join("")

                        : `
                            <span
                                class="member-email"
                            >
                                No services
                            </span>
                        `;


                /* Status */

                const statusClass =
                    status === "active"
                        ? "active"
                        : "inactive";


                const statusLabel =
                    status
                        ? status
                        : "unknown";


                return `
                    <tr>

                        <!-- Member -->

                        <td>

                            <div class="member-cell">

                                <span
                                    class="member-avatar"
                                    aria-hidden="true"
                                >
                                    ${escapeHtml(
                    getInitials(name)
                )}
                                </span>


                                <div>

                                    <div class="member-name">
                                        ${escapeHtml(name)}
                                    </div>


                                    <div class="member-email">
                                        ${escapeHtml(
                    email ||
                    "No email address"
                )}
                                    </div>

                                </div>

                            </div>

                        </td>


                        <!-- Chapter -->

                        <td>
                            ${escapeHtml(
                    chapterName
                )}
                        </td>


                        <!-- Contact -->

                        <td>
                            ${escapeHtml(
                    contact
                )}
                        </td>


                        <!-- Services -->

                        <td>

                            <div
                                class="member-services"
                            >
                                ${serviceMarkup}
                            </div>

                        </td>


                        <!-- Status -->

                        <td>

                            <span
                                class="
                                    member-status
                                    ${statusClass}
                                "
                            >
                                ${escapeHtml(
                    statusLabel
                )}
                            </span>

                        </td>

                    </tr>
                `;

            })
            .join("");
}


/* =========================================================
   LOAD MEMBERS DATA
   ========================================================= */

async function loadMembersPage() {

    setError("");


    const body =
        document.getElementById(
            "members-table-body"
        );


    /* Loading state */

    if (body) {

        body.innerHTML = `
            <tr class="members-loading-row">

                <td colspan="5">

                    <div
                        class="members-skeleton"
                    ></div>

                </td>

            </tr>
        `;
    }


    try {

        const [
            membersResult,
            chaptersResult,
            servicesResult,
            assignmentsResult
        ] = await Promise.all([

            membersSupabase
                .from("member")
                .select("*")
                .order(
                    "LastName",
                    {
                        ascending: true
                    }
                ),


            membersSupabase
                .from("chapter")
                .select("*")
                .order(
                    "ChapterName",
                    {
                        ascending: true
                    }
                ),


            membersSupabase
                .from("service")
                .select("*")
                .order(
                    "ServiceName",
                    {
                        ascending: true
                    }
                ),


            membersSupabase
                .from("member_service")
                .select("*")

        ]);


        /* Find first database error */

        const firstError = [

            membersResult.error,

            chaptersResult.error,

            servicesResult.error,

            assignmentsResult.error

        ].find(Boolean);


        if (firstError) {
            throw firstError;
        }


        /* Store database data */

        membersState.members =
            membersResult.data || [];


        membersState.chapters =
            chaptersResult.data || [];


        membersState.services =
            servicesResult.data || [];


        membersState.assignments =
            assignmentsResult.data || [];


        /* Render */

        renderSummary();

        renderTable();


        /* Debug information */

        console.log(
            "Members page data loaded:",
            {
                members:
                    membersState.members,

                chapters:
                    membersState.chapters,

                services:
                    membersState.services,

                assignments:
                    membersState.assignments
            }
        );

    }

    catch (error) {

        console.error(
            "Members page data error:",
            error
        );


        setError(
            "Member data could not be loaded. " +
            "Please check the connected database " +
            "and try Refresh again."
        );


        membersState.members = [];

        membersState.chapters = [];

        membersState.services = [];

        membersState.assignments = [];


        renderSummary();

        renderTable();
    }
}


/* =========================================================
   SESSION CHECK
   ========================================================= */

async function checkMembersSession() {

    const {
        data: {
            session
        },
        error
    } =
        await membersSupabase.auth.getSession();


    if (error) {

        console.error(
            "Session check failed:",
            error
        );

        return;
    }


    if (!session) {

        window.location.href =
            "../index.html";

        return;
    }


    await loadMembersPage();
}


/* =========================================================
   REFRESH
   ========================================================= */

document
    .getElementById("refresh-members")
    ?.addEventListener(
        "click",
        loadMembersPage
    );


/* =========================================================
   INITIALIZE
   ========================================================= */

checkMembersSession();