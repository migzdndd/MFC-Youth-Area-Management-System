/* =========================================================
   MEMBERS PAGE — STEP 2
   Member directory, search, filters, and real Supabase data.
   ========================================================= */

const membersSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


const membersState = {
    members: [],
    chapters: [],
    services: [],
    assignments: [],
    filteredMembers: [],

    filters: {
        search: "",
        status: "all",
        chapter: "all",
        service: "all"
    },

    isLoading: false
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


function normalizeSearch(value) {

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


function formatCount(value, singular, plural) {

    return `${value} ${value === 1
        ? singular
        : plural
        }`;

}


/* =========================================================
   MEMBER HELPERS
   ========================================================= */

function getMemberId(member) {

    return field(
        member,
        [
            "MemberID",
            "member_id",
            "id"
        ]
    );

}


function getMemberName(member) {

    const first = field(
        member,
        [
            "FirstName",
            "first_name"
        ]
    );

    const middle = field(
        member,
        [
            "MiddleName",
            "middle_name"
        ]
    );

    const last = field(
        member,
        [
            "LastName",
            "last_name"
        ]
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

    const parts =
        String(name)
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

    const chapter =
        membersState.chapters.find(
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

    const serviceIds =
        membersState.assignments
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
   SEARCH TEXT
   ========================================================= */

function getMemberSearchText(member) {

    const memberId =
        getMemberId(member);


    const chapterId =
        field(
            member,
            [
                "ChapterID",
                "chapter_id"
            ]
        );


    const searchValues = [

        memberId,

        getMemberName(member),

        field(
            member,
            [
                "EmailAddress",
                "email_address",
                "email"
            ]
        ),

        field(
            member,
            [
                "ContactNumber",
                "contact_number",
                "contact"
            ]
        ),

        field(
            member,
            [
                "Address",
                "address"
            ]
        ),

        field(
            member,
            [
                "Status",
                "status"
            ]
        ),

        getChapterName(chapterId),

        ...getMemberServices(memberId)

    ];


    return searchValues
        .map(normalizeSearch)
        .join(" ");

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
        document.getElementById(
            "members-error"
        );


    if (!error) {
        return;
    }


    error.textContent =
        message;

    error.hidden =
        !message;

}

/* =========================================================
   SUCCESS NOTIFICATION
   ========================================================= */

function setSuccess(
    message = ""
) {

    const success =
        document.getElementById(
            "members-success"
        );


    if (!success) {
        return;
    }


    success.textContent =
        message;

    success.hidden =
        !message;

}


function setLoading(isLoading) {

    membersState.isLoading =
        isLoading;


    const button =
        document.getElementById(
            "refresh-members"
        );


    if (!button) {
        return;
    }


    button.disabled =
        isLoading;


    button.textContent =
        isLoading
            ? "Refreshing..."
            : "Refresh";

}


function hasActiveFilters() {

    return Boolean(

        membersState.filters.search ||

        membersState.filters.status !== "all" ||

        membersState.filters.chapter !== "all" ||

        membersState.filters.service !== "all"

    );

}


function updateClearControls() {

    const search =
        document.getElementById(
            "member-search"
        );


    const clearSearch =
        document.getElementById(
            "clear-member-search"
        );


    const clearFilters =
        document.getElementById(
            "clear-member-filters"
        );


    if (clearSearch) {

        clearSearch.hidden =
            !normalizeSearch(
                search?.value
            );

    }


    if (clearFilters) {

        clearFilters.hidden =
            !hasActiveFilters();

    }

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
            member =>
                getMemberServices(
                    getMemberId(member)
                ).length === 0
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

}


/* =========================================================
   CHAPTER FILTER
   ========================================================= */

function populateChapterFilter() {

    const select =
        document.getElementById(
            "member-chapter-filter"
        );


    if (!select) {
        return;
    }


    const currentValue =
        membersState.filters.chapter;


    const chapters =
        [...membersState.chapters]
            .sort(
                (a, b) =>
                    getChapterName(
                        field(
                            a,
                            [
                                "ChapterID",
                                "chapter_id",
                                "id"
                            ]
                        )
                    ).localeCompare(
                        getChapterName(
                            field(
                                b,
                                [
                                    "ChapterID",
                                    "chapter_id",
                                    "id"
                                ]
                            )
                        )
                    )
            );


    select.innerHTML = `

        <option value="all">
            All chapters
        </option>

        ${chapters
            .map(chapter => {

                const id =
                    field(
                        chapter,
                        [
                            "ChapterID",
                            "chapter_id",
                            "id"
                        ]
                    );


                return `
                        <option value="${escapeHtml(String(id))}">
                            ${escapeHtml(
                    getChapterName(id)
                )}
                        </option>
                    `;

            })
            .join("")
        }

    `;


    if (
        [...select.options]
            .some(
                option =>
                    option.value ===
                    currentValue
            )
    ) {

        select.value =
            currentValue;

    }

}


/* =========================================================
   FILTERING
   ========================================================= */

function applyMemberFilters() {

    const search =
        normalizeSearch(
            membersState.filters.search
        );


    const status =
        membersState.filters.status;


    const chapter =
        membersState.filters.chapter;


    const service =
        membersState.filters.service;


    membersState.filteredMembers =
        membersState.members.filter(
            member => {

                /* Search */

                if (
                    search &&
                    !getMemberSearchText(member)
                        .includes(search)
                ) {

                    return false;

                }


                /* Status */

                const memberStatus =
                    normalizeStatus(
                        field(
                            member,
                            [
                                "Status",
                                "status"
                            ]
                        )
                    );


                if (
                    status !== "all" &&
                    memberStatus !== status
                ) {

                    return false;

                }


                /* Chapter */

                if (
                    chapter !== "all"
                ) {

                    const memberChapter =
                        field(
                            member,
                            [
                                "ChapterID",
                                "chapter_id"
                            ]
                        );


                    if (
                        String(memberChapter) !==
                        String(chapter)
                    ) {

                        return false;

                    }

                }


                /* Service Assignment */

                const hasServices =
                    getMemberServices(
                        getMemberId(member)
                    ).length > 0;


                if (
                    service === "assigned" &&
                    !hasServices
                ) {

                    return false;

                }


                if (
                    service === "unassigned" &&
                    hasServices
                ) {

                    return false;

                }


                return true;

            }
        );


    renderTable();

    renderFilterSummary();

    updateClearControls();

}


/* =========================================================
   FILTER SUMMARY
   ========================================================= */

function renderFilterSummary() {

    const total =
        membersState.members.length;


    const visible =
        membersState.filteredMembers.length;


    setText(
        "member-filter-summary",

        hasActiveFilters()

            ? `Showing ${formatCount(
                visible,
                "matching member",
                "matching members"
            )} of ${formatCount(
                total,
                "member",
                "members"
            )}`

            : `Showing all ${formatCount(
                total,
                "member",
                "members"
            )}`

    );


    setText(
        "member-count-label",

        formatCount(
            visible,
            "member",
            "members"
        )

    );

}


/* =========================================================
   TABLE
   ========================================================= */

function renderTable() {

    const body =
        document.getElementById(
            "members-table-body"
        );


    if (!body) {
        return;
    }


    const members =
        membersState.filteredMembers;


    /* No results */

    if (!members.length) {

        body.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="members-state">

                        <div
                            class="members-state-icon"
                            aria-hidden="true"
                        >
                            ${hasActiveFilters()
                ? "⌕"
                : "◉"
            }
                        </div>


                        <div class="members-state-title">

                            ${hasActiveFilters()
                ? "No matching members"
                : "No members found"
            }

                        </div>


                        <p class="members-state-text">

                            ${hasActiveFilters()
                ? "Try adjusting your search or filters."
                : "There are currently no member records available to your account."
            }

                        </p>


                        ${hasActiveFilters()

                ? `

                                    <button
                                        type="button"
                                        class="btn btn-secondary"
                                        id="empty-state-clear-filters"
                                    >
                                        Clear Filters
                                    </button>

                                `

                : ""
            }

                    </div>

                </td>

            </tr>

        `;


        document
            .getElementById(
                "empty-state-clear-filters"
            )
            ?.addEventListener(
                "click",
                clearMemberFilters
            );


        return;
    }


    /* Member rows */

    body.innerHTML =
        members
            .map(
                member => {

                    const memberId =
                        getMemberId(member);


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


                    const chapterName =
                        getChapterName(
                            field(
                                member,
                                [
                                    "ChapterID",
                                    "chapter_id"
                                ]
                            )
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


                    const serviceMarkup =
                        services.length

                            ? services
                                .map(
                                    service => `

                                        <span
                                            class="member-service-badge"
                                        >
                                            ${escapeHtml(
                                        service
                                    )}
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


                    const statusClass =

                        status === "active"

                            ? "active"

                            : status === "inactive"

                                ? "inactive"

                                : "unknown";


                    return `

                        <tr>

                            <td>

                                <div
                                    class="member-cell"
                                >

                                    <span
                                        class="member-avatar"
                                        aria-hidden="true"
                                    >
                                        ${escapeHtml(
                        getInitials(name)
                    )}
                                    </span>


                                    <div>

                                        <div
                                            class="member-name"
                                        >
                                            ${escapeHtml(
                        name
                    )}
                                        </div>


                                        <div
                                            class="member-email"
                                        >
                                            ${escapeHtml(
                        email ||
                        "No email address"
                    )}
                                        </div>

                                    </div>

                                </div>

                            </td>


                            <td>
                                ${escapeHtml(
                        chapterName
                    )}
                            </td>


                            <td>
                                ${escapeHtml(
                        contact
                    )}
                            </td>


                            <td>

                                <div
                                    class="member-services"
                                >
                                    ${serviceMarkup}
                                </div>

                            </td>


                            <td>

                                <span
                                    class="
                                        member-status
                                        ${statusClass}
                                    "
                                >
                                    ${escapeHtml(
                        status ||
                        "unknown"
                    )}
                                </span>

                            </td>

                            <td>

    <div class="member-actions">

        <button
            type="button"
            class="btn btn-secondary btn-sm member-edit-button"
            data-member-id="${escapeHtml(
                        String(memberId)
                    )}"
        >
            Edit
        </button>

    </div>

</td>

                        </tr>

                    `;

                }
            )
            .join("");
    document
        .querySelectorAll(
            ".member-edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const memberId =
                            button.dataset.memberId;


                        openEditMember(
                            memberId
                        );

                    }
                );

            }
        );

}

/* =========================================================
   EDIT MEMBER NAVIGATION
   ========================================================= */

function openEditMember(memberId) {

    const id = String(
        memberId ?? ""
    ).trim();


    if (!id) {

        console.error(
            "Cannot edit member: missing MemberID.",
            memberId
        );

        return;

    }


    const editUrl =
        `${window.location.origin}/pages/edit-member.html?id=${encodeURIComponent(id)}`;


    console.log(
        "Opening Edit Member:",
        {
            memberId: id,
            url: editUrl
        }
    );


    window.location.assign(
        editUrl
    );

}

/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadMembersPage() {

    if (membersState.isLoading) {
        return;
    }


    setError("");

    setLoading(true);


    const body =
        document.getElementById(
            "members-table-body"
        );


    if (body) {

        body.innerHTML = `

            <tr
                class="members-loading-row"
            >

                <td colspan="6">

                    <div
                        class="members-loading-state"
                    >

                        <span
                            class="members-loading-spinner"
                            aria-hidden="true"
                        ></span>


                        <span>
                            Loading members...
                        </span>

                    </div>

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
                .select("*"),

            membersSupabase
                .from("chapter")
                .select("*"),

            membersSupabase
                .from("service")
                .select("*"),

            membersSupabase
                .from("member_service")
                .select("*")

        ]);


        const firstError =
            [
                membersResult.error,
                chaptersResult.error,
                servicesResult.error,
                assignmentsResult.error
            ]
                .find(Boolean);


        if (firstError) {
            throw firstError;
        }


        membersState.members =
            membersResult.data || [];


        membersState.chapters =
            chaptersResult.data || [];


        membersState.services =
            servicesResult.data || [];


        membersState.assignments =
            assignmentsResult.data || [];

        /* =====================================================
CLIENT-SIDE SORTING
===================================================== */

        membersState.members.sort(
            (a, b) =>
                String(
                    field(
                        a,
                        [
                            "LastName",
                            "last_name"
                        ]
                    )
                ).localeCompare(
                    String(
                        field(
                            b,
                            [
                                "LastName",
                                "last_name"
                            ]
                        )
                    ),
                    undefined,
                    {
                        sensitivity: "base"
                    }
                )
        );


        membersState.chapters.sort(
            (a, b) =>
                String(
                    field(
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
                        field(
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
        );


        membersState.services.sort(
            (a, b) =>
                String(
                    field(
                        a,
                        [
                            "ServiceName",
                            "service_name",
                            "Service",
                            "name"
                        ]
                    )
                ).localeCompare(
                    String(
                        field(
                            b,
                            [
                                "ServiceName",
                                "service_name",
                                "Service",
                                "name"
                            ]
                        )
                    ),
                    undefined,
                    {
                        sensitivity: "base"
                    }
                )
        );


        populateChapterFilter();


        renderSummary();


        applyMemberFilters();


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
            "Please try Refresh again."
        );


        membersState.members = [];

        membersState.chapters = [];

        membersState.services = [];

        membersState.assignments = [];

        membersState.filteredMembers = [];


        renderSummary();

        renderTable();

        renderFilterSummary();

    }

    finally {

        setLoading(false);

    }

}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

function clearMemberFilters() {

    membersState.filters = {

        search: "",

        status: "all",

        chapter: "all",

        service: "all"

    };


    const search =
        document.getElementById(
            "member-search"
        );


    const status =
        document.getElementById(
            "member-status-filter"
        );


    const chapter =
        document.getElementById(
            "member-chapter-filter"
        );


    const service =
        document.getElementById(
            "member-service-filter"
        );


    if (search) {
        search.value = "";
    }


    if (status) {
        status.value = "all";
    }


    if (chapter) {
        chapter.value = "all";
    }


    if (service) {
        service.value = "all";
    }


    applyMemberFilters();

}


/* =========================================================
   FILTER EVENTS
   ========================================================= */

function initializeMemberFilters() {

    const search =
        document.getElementById(
            "member-search"
        );


    const status =
        document.getElementById(
            "member-status-filter"
        );


    const chapter =
        document.getElementById(
            "member-chapter-filter"
        );


    const service =
        document.getElementById(
            "member-service-filter"
        );


    const clearSearch =
        document.getElementById(
            "clear-member-search"
        );


    const clearFilters =
        document.getElementById(
            "clear-member-filters"
        );


    search?.addEventListener(
        "input",
        () => {

            membersState.filters.search =
                search.value;

            applyMemberFilters();

        }
    );


    status?.addEventListener(
        "change",
        () => {

            membersState.filters.status =
                status.value;

            applyMemberFilters();

        }
    );


    chapter?.addEventListener(
        "change",
        () => {

            membersState.filters.chapter =
                chapter.value;

            applyMemberFilters();

        }
    );


    service?.addEventListener(
        "change",
        () => {

            membersState.filters.service =
                service.value;

            applyMemberFilters();

        }
    );


    clearSearch?.addEventListener(
        "click",
        () => {

            membersState.filters.search =
                "";


            if (search) {
                search.value = "";
            }


            applyMemberFilters();


            search?.focus();

        }
    );


    clearFilters?.addEventListener(
        "click",
        clearMemberFilters
    );

}


/* =========================================================
   SESSION
   ========================================================= */

/* =========================================================
SUCCESS MESSAGE
========================================================= */

function handleMembersSuccessMessage() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const success =
        params.get(
            "success"
        );


    if (
        success ===
        "member-added"
    ) {

        setSuccess(
            "Member successfully added to the directory."
        );


        /*
         * Remove the success parameter from the URL
         * after reading it.
         */

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );


        /*
         * Automatically hide the notification
         * after a few seconds.
         */

        setTimeout(
            () => {

                setSuccess("");

            },
            5000
        );

    }

}

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


        setError(
            "Your session could not be verified. " +
            "Please sign in again."
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
   EVENTS
   ========================================================= */

document
    .getElementById(
        "refresh-members"
    )
    ?.addEventListener(
        "click",
        loadMembersPage
    );


document
    .getElementById(
        "add-member-button"
    )
    ?.addEventListener(
        "click",
        () => {

            /*
             * Add Member is intentionally reserved
             * for Phase 3, Step 3.
             */

            setError(
                "Add Member will be enabled in the next step."
            );

        }
    );


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMemberFilters();

        handleMembersSuccessMessage();

        checkMembersSession();

    }
);