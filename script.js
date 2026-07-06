const DEFAULT_CRITERIA = [
    { id: "commute", label: "Commute time" },
    { id: "price", label: "Price" },
    { id: "age", label: "Age" },
    { id: "infra", label: "Dist. to Infra." },
    { id: "water", label: "Water Bill" },
    { id: "gas_elec", label: "Gas/Elec. Bill" },
    { id: "floor_mat", label: "Floor material" },
    { id: "garage", label: "Garage (O/X)", type: "binary" },
    { id: "stairs", label: "Floor height / Stairs" },
    { id: "security", label: "Security" }
];
let criteria = DEFAULT_CRITERIA.slice();

let propertyList = [];
let currentLang = "ko";
let editingId = null;
let customCriteria = []; // 사용자 추가 항목
let removedBuiltinIds = []; // 삭제된 기본 항목 ID 목록
const MAX_CRITERIA = 15;  // 기본 항목 + 커스텀 합산 최대 15개
let preferenceOpen = false;
let propertyOpen = false;
const APP_ROUTE = "#/app";

// ===== Supabase 연동 (회원가입/로그인 + 데이터 저장) =====
// TODO: 아래 SUPABASE_URL을 본인 프로젝트의 Project URL로 바꿔주세요.
// (Supabase 대시보드 > Project Settings > API > Project URL, 형식: https://xxxxxxxx.supabase.co)
const SUPABASE_URL = "https://znzdzykirhrhlnmdxaxs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OBtMj9fN0ZM_bs2nQ4rLPg_vljxzu--";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let currentUser = null;      // { id, email, username }
let currentWeights = {};     // 현재 로그인한 사용자의 선호도 가중치
let isUnlocked = false;      // 현재 로그인한 사용자의 무제한 등록 잠금 해제 여부
let authMode = "login";      // "login" | "signup"

// 로그인/회원가입 탭 전환
function switchAuthMode(mode) {
    authMode = mode;
    document.getElementById("auth-tab-login").classList.toggle("active", mode === "login");
    document.getElementById("auth-tab-signup").classList.toggle("active", mode === "signup");
    document.getElementById("auth-username-group").style.display = mode === "signup" ? "block" : "none";
    document.getElementById("auth-submit-btn").innerText = mode === "signup"
        ? translations[currentLang].signupBtn
        : translations[currentLang].loginBtn;
    hideAuthMessage();
}

function showAuthMessage(msg) {
    const el = document.getElementById("auth-error");
    el.textContent = msg;
    el.style.display = "block";
}

function hideAuthMessage() {
    const el = document.getElementById("auth-error");
    el.style.display = "none";
}

// 회원가입 / 로그인 제출 처리
async function handleAuthSubmit() {
    hideAuthMessage();
    const t = translations[currentLang];
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const username = document.getElementById("auth-username").value.trim();

    if (!email || !password) {
        showAuthMessage(t.authMissingFields);
        return;
    }

    const btn = document.getElementById("auth-submit-btn");
    btn.disabled = true;

    try {
        if (authMode === "signup") {
            if (!username) {
                showAuthMessage(t.authMissingUsername);
                return;
            }
            const { data, error } = await sb.auth.signUp({
                email,
                password,
                options: { data: { username } }
            });
            if (error) throw error;

            if (data.session) {
                await onSignedIn(data.session.user);
            } else {
                // "Confirm email" 설정이 켜져 있으면 세션이 바로 생기지 않는다.
                showAuthMessage(t.authCheckEmail);
            }
        } else {
            const { data, error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await onSignedIn(data.user);
        }
    } catch (err) {
        showAuthMessage(err && err.message ? err.message : String(err));
    } finally {
        btn.disabled = false;
    }
}

// 로그인 성공 후 처리: 사용자 정보 확정 + DB에서 데이터 로드 + 화면 전환
async function onSignedIn(user) {
    currentUser = {
        id: user.id,
        email: user.email,
        username: (user.user_metadata && user.user_metadata.username) || null
    };

    if (!currentUser.username) {
        const { data } = await sb.from("profiles").select("username").eq("id", user.id).maybeSingle();
        if (data) currentUser.username = data.username;
    }

    await loadAllUserDataFromSupabase();
    renderForms();
    renderCustomAttrList();
    if (Object.keys(currentWeights).length) loadSavedWeights(currentWeights);
    showSignedInChrome();
    location.hash = "";
    applyRoute();
}

async function signOutUser() {
    await sb.auth.signOut();
    currentUser = null;
    currentWeights = {};
    isUnlocked = false;
    removedBuiltinIds = [];
    customCriteria = [];
    criteria = DEFAULT_CRITERIA.slice();
    propertyList = [];
    editingId = null;

    renderForms();
    renderCustomAttrList();
    const bar = document.getElementById("user-bar");
    if (bar) bar.style.display = "none";

    location.hash = "";
    applyRoute();
}

function showSignedInChrome() {
    const bar = document.getElementById("user-bar");
    if (bar) bar.style.display = "flex";
    updateGreeting();
}

function updateGreeting() {
    const el = document.getElementById("user-greeting");
    if (el && currentUser) el.textContent = translations[currentLang].greeting(currentUser.username || currentUser.email);
}

// 현재 URL 해시 + 로그인 상태에 맞춰 화면 전환 (뒤로/앞으로가기 버튼 대응)
function applyRoute() {
    if (!currentUser) {
        document.getElementById("login-section").style.display = "block";
        document.getElementById("title-section").style.display = "none";
        document.getElementById("app-header").style.display = "none";
        document.getElementById("step1-section").style.display = "none";
        document.getElementById("step2-section").style.display = "none";
        return;
    }

    document.getElementById("login-section").style.display = "none";
    const isAppView = location.hash === APP_ROUTE;
    document.getElementById("title-section").style.display = isAppView ? "none" : "block";
    document.getElementById("app-header").style.display = isAppView ? "block" : "none";
    document.getElementById("step1-section").style.display = isAppView ? "block" : "none";
    document.getElementById("step2-section").style.display = isAppView ? "block" : "none";
}

window.addEventListener("hashchange", applyRoute);

function criterionLabel(lang, c) {
    return translations[lang].criteria[c.id] || c.label;
}

// 사용자 추가 항목의 라벨은 언어별 번역본을 담은 객체({ko, en, zh})로 저장된다.
// 아직 번역되지 않았거나 예전 버전(문자열)으로 저장된 데이터도 안전하게 처리한다.
function customLabel(c, lang) {
    if (c.label && typeof c.label === "object") {
        return c.label[lang] || c.label.en || c.label.ko || c.label.zh || "";
    }
    return c.label || "";
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
}

function readStoredJSON(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function clearActiveButtons(container) {
    if (!container) return;
    for (let btn of container.getElementsByClassName("w-btn")) btn.classList.remove("w-active");
}

function setActiveButton(container, value, binary) {
    clearActiveButtons(container);
    const buttons = container ? container.getElementsByClassName("w-btn") : [];
    if (!buttons.length) return;
    const index = binary ? (value === 5 ? 0 : 1) : value - 1;
    if (buttons[index]) buttons[index].classList.add("w-active");
}

function criterionRowHtml(c, lang, custom = false) {
    const remove = custom ? `onclick="removeCustomAttribute('${c.id}')"` : `onclick="removeBuiltinCriteria('${c.id}')"`;
    return `
        <button type="button" class="remove-inline-btn" ${remove} title="Remove">✕</button>
        <label id="w-label-${c.id}">${custom ? escapeHtml(customLabel(c, lang)) : criterionLabel(lang, c)}</label>
        <div class="weight-buttons" id="w-container-${c.id}">
            <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 1)">1</button>
            <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 2)">2</button>
            <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 3)">3</button>
            <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 4)">4</button>
            <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 5)">5</button>
        </div>
        <input type="hidden" id="w-${c.id}" value="">
        `;
}

function propertyRowHtml(c, lang, custom = false) {
    const label = custom ? escapeHtml(customLabel(c, lang)) : criterionLabel(lang, c);
    return `
        <label id="p-label-${c.id}">${label}${c.type === "binary" ? "" : translations[lang].scoreLabelSuffix}</label>
        <div class="weight-buttons" id="p-container-${c.id}">
            ${c.type === "binary"
            ? `<button type="button" class="w-btn" id="p-btn-yes-${c.id}" style="width: 55px !important;" onclick="selectScoreBinary('${c.id}', 5)">${translations[lang].yesText}</button>
                   <button type="button" class="w-btn" id="p-btn-no-${c.id}" style="width: 55px !important;" onclick="selectScoreBinary('${c.id}', 1)">${translations[lang].noText}</button>`
            : `<button type="button" class="w-btn" onclick="selectScore('${c.id}', 1)">1</button>
                   <button type="button" class="w-btn" onclick="selectScore('${c.id}', 2)">2</button>
                   <button type="button" class="w-btn" onclick="selectScore('${c.id}', 3)">3</button>
                   <button type="button" class="w-btn" onclick="selectScore('${c.id}', 4)">4</button>
                   <button type="button" class="w-btn" onclick="selectScore('${c.id}', 5)">5</button>`}
        </div>
        <input type="hidden" id="p-${c.id}" value="">
    `;
}

function clearScoreFields(items) {
    items.forEach(c => {
        const el = document.getElementById(`p-${c.id}`);
        if (el) el.value = "";
        clearActiveButtons(document.getElementById(`p-container-${c.id}`));
    });
}

// 다국어 번역 사전
const translations = {
    ko: {
        titleStress: "Zero Stress",
        titleChoice: "Best Choice",
        goBtn: "GO",
        unlockText: "더 많은 옵션이 필요하신가요? 단 $4.99로 30일간 매물을 무제한 등록하세요.",
        unlockBtn: "지금 해제하기",
        step1Header: "1. 나의 선호도 설정 (가중치: 1~5)",
        nextBtn: "다음",
        step2Header: "2. 매물 점수 입력 (점수: 1~5)",
        propNameLabel: "매물 이름/닉네임",
        propNamePlaceholder: "예: 지역 이름",
        addAttrTitle: "항목 추가 (최대 15개)",
        addAttrPlaceholder: "항목명 입력",
        addAttrRating: "점수형 (1~5)",
        addAttrBinary: "Y/N형",
        addAttrBtn: "+ 추가",
        addAttrLimitReached: "항목은 최대 15개까지 추가할 수 있습니다.",
        addAttrEmptyName: "항목명을 입력하세요.",
        minCriteriaAlert: "항목은 최소 1개 이상 있어야 합니다.",
        submitBtn: "매물 평가 및 저장",
        submitUpdateBtn: "매물 수정 및 저장",
        resetBtn: "선호도 재설정",
        resultHeader: "📊 매물 비교 랭킹",
        thRank: "순위",
        thName: "매물명",
        thScore: "총점",
        thAction: "관리",
        editBtn: "편집",
        deleteBtn: "삭제",
        confirmDelete: "정말 이 매물을 삭제하시겠습니까?",
        yesText: "예",
        noText: "아니오",
        scoreLabelSuffix: " 점수",
        rankFormat: (val) => `${val}위`,
        scoreFormat: (val) => `${val}점`,
        alertSelectWeight: (label) => `나의 선호도 설정에서 [${label}] 가중치를 선택해 주세요.`,
        alertEnterName: "매물 이름을 입력하세요.",
        alertSelectScore: (label) => `매물 점수 입력에서 [${label}] 점수를 선택해 주세요.`,
        alertMoreOptions: "더 많은 옵션이 필요하신가요? 단 $4.99로 30일간 매물을 무제한 등록하세요.",
        alertPaymentSuccess: "결제가 완료되었습니다! 30일 동안 매물 무제한 등록 기능이 해제되었습니다.",
        loginTag: "로그인하면 비교 결과가 저장되고, 다음에도 이어서 사용할 수 있어요.",
        loginNote: "회원님의 데이터는 Supabase에 안전하게 저장됩니다.",
        signOutBtn: "로그아웃",
        greeting: (name) => `${name}님, 안녕하세요`,
        loginBtn: "로그인",
        signupBtn: "회원가입",
        usernameLabel: "닉네임",
        usernamePlaceholder: "예: 자취왕",
        emailLabel: "이메일",
        emailPlaceholder: "you@example.com",
        passwordLabel: "비밀번호",
        passwordPlaceholder: "••••••••",
        authMissingFields: "이메일과 비밀번호를 입력해 주세요.",
        authMissingUsername: "닉네임을 입력해 주세요.",
        authCheckEmail: "가입 확인 메일을 보냈어요. 메일함을 확인한 후 로그인해 주세요.",
        adLabel: "광고",
        adPlaceholder: "이 자리에 광고가 표시됩니다",
        aboutHeading: "RentBest는 이런 서비스예요!",
        aboutBullet1: "<span class=\"bullet-label\">⚖️ <strong>나만의 기준 설정</strong>:</span><span class=\"bullet-desc\">통근 시간, 보증금, 주차 등 내가 중요하게 생각하는 항목에 무게를 둬요.</span>",
        aboutBullet2: "<span class=\"bullet-label\">📝 <strong>방문 기록 및 메모</strong>:</span><span class=\"bullet-desc\">자취방이나 전월세 집을 구경하면서 현장에서 바로 점수를 입력해요.</span>",
        aboutBullet3: "<span class=\"bullet-label\">🏆 <strong>100점 만점 랭킹</strong>:</span><span class=\"bullet-desc\">복잡하게 고민할 필요 없이, 나에게 가장 잘 맞는 최적의 집을 순위로 확인해요.</span>",
        howItWorksHeading: "이용 방법",
        howStep1: "<span class=\"step-label\"><strong>1. 나의 선호도 설정</strong> —</span><span class=\"step-desc\">통근시간, 가격, 관리비 등 기본 항목의 중요도를 1~5점으로 매기고, 필요하면 나만의 항목을 추가하거나 삭제할 수 있습니다.</span>",
        howStep2: "<span class=\"step-label\"><strong>2. 매물 점수 입력</strong> —</span><span class=\"step-desc\">실제로 둘러본 매물의 닉네임을 정하고, 같은 항목 기준으로 점수를 입력합니다.</span>",
        howStep3: "<span class=\"step-label\"><strong>3. 랭킹 확인</strong> —</span><span class=\"step-desc\">가중치와 점수를 곱해 계산한 총점으로 매물들의 순위가 자동으로 정리되어, 로그인할 때마다 첫 화면에서 바로 확인할 수 있습니다.</span>",
        footerPrivacy: "개인정보처리방침",
        footerTerms: "이용약관",
        footerContact: "문의하기",
        criteria: {
            commute: "통근 시간",
            price: "가격",
            age: "연식/노후도",
            infra: "주변 편의시설 거리",
            water: "수도세",
            gas_elec: "가스/전기세",
            floor_mat: "바닥 자재",
            garage: "주차장 (유/무)",
            stairs: "층수 / 계단",
            security: "보안"
        }
    },
    en: {
        titleStress: "Zero Stress",
        titleChoice: "Best Choice",
        goBtn: "GO",
        unlockText: "More options? Unlock unlimited listings for 30 days for just $4.99",
        unlockBtn: "Unlock Now",
        step1Header: "1. My Preference Settings (Weighting: 1~5)",
        nextBtn: "Next",
        step2Header: "2. Property Score Input (Score: 1~5)",
        propNameLabel: "Property Name/Nickname",
        propNamePlaceholder: "e.g. Location Name",
        addAttrTitle: "Add Attribute (max 15)",
        addAttrPlaceholder: "Enter attribute name",
        addAttrRating: "Rating (1~5)",
        addAttrBinary: "Y/N",
        addAttrBtn: "+ Add",
        addAttrLimitReached: "You can add up to 15 attributes total.",
        addAttrEmptyName: "Please enter an attribute name.",
        minCriteriaAlert: "At least 1 attribute must remain.",
        submitBtn: "Evaluate & Save",
        submitUpdateBtn: "Update & Save",
        resetBtn: "Reset Preference",
        resultHeader: "📊 Property Ranking Comparison",
        thRank: "Rank",
        thName: "Property Name",
        thScore: "Total Score",
        thAction: "Action",
        editBtn: "Edit",
        deleteBtn: "Delete",
        confirmDelete: "Are you sure you want to delete this property?",
        yesText: "Yes",
        noText: "No",
        scoreLabelSuffix: " Score",
        rankFormat: (val) => `#${val}`,
        scoreFormat: (val) => `${val} pts`,
        alertSelectWeight: (label) => `Please select a weight for [${label}] in My Preference Settings.`,
        alertEnterName: "Please enter a property name.",
        alertSelectScore: (label) => `Please select a score for [${label}] in Property Score Input.`,
        alertMoreOptions: "More options? Unlock unlimited listings for 30 days for just $4.99",
        alertPaymentSuccess: "Payment successful! Unlimited listings unlocked for 30 days.",
        loginTag: "Sign in to save your comparisons and pick up right where you left off.",
        loginNote: "Your data is securely stored with Supabase.",
        signOutBtn: "Sign out",
        greeting: (name) => `Hi, ${name}`,
        loginBtn: "Log in",
        signupBtn: "Sign up",
        usernameLabel: "Username",
        usernamePlaceholder: "e.g. renter123",
        emailLabel: "Email",
        emailPlaceholder: "you@example.com",
        passwordLabel: "Password",
        passwordPlaceholder: "••••••••",
        authMissingFields: "Please enter your email and password.",
        authMissingUsername: "Please enter a username.",
        authCheckEmail: "Check your email to confirm your account, then log in.",
        adLabel: "Advertisement",
        adPlaceholder: "Your ad could appear here",
        aboutHeading: "What is RentBest?",
        aboutBullet1: "<span class=\"bullet-label\">⚖️ <strong>Your Personal Criteria</strong>:</span><span class=\"bullet-desc\">Set custom weightings for what matters most to you—whether it's rent, commute time, parking, or pet-friendliness.</span>",
        aboutBullet2: "<span class=\"bullet-label\">📝 <strong>On-the-Spot Inspection Scoring</strong>:</span><span class=\"bullet-desc\">Rate each property instantly on your phone while walking through the door.</span>",
        aboutBullet3: "<span class=\"bullet-label\">🏆 <strong>100-Point Match Score</strong>:</span><span class=\"bullet-desc\">No more guesswork. See a real-time, personalized leaderboard to secure your perfect home with confidence.</span>",
        howItWorksHeading: "How it works",
        howStep1: "<span class=\"step-label\"><strong>1. Set your preferences</strong> —</span><span class=\"step-desc\">Rate how important commute time, price, maintenance fees, and other criteria are to you (1-5), and add or remove criteria as needed.</span>",
        howStep2: "<span class=\"step-label\"><strong>2. Score each property</strong> —</span><span class=\"step-desc\">Give each place you visit a nickname and score it on the same criteria.</span>",
        howStep3: "<span class=\"step-label\"><strong>3. Check the ranking</strong> —</span><span class=\"step-desc\">Your weights and scores are multiplied into a total score, automatically ranking your properties on the home screen every time you log in.</span>",
        footerPrivacy: "Privacy Policy",
        footerTerms: "Terms of Service",
        footerContact: "Contact",
        criteria: {
            commute: "Commute time",
            price: "Price",
            age: "Age",
            infra: "Dist. to Infra.",
            water: "Water Bill",
            gas_elec: "Gas/Elec. Bill",
            floor_mat: "Floor material",
            garage: "Garage (Y/N)",
            stairs: "Floor height / Stairs",
            security: "Security"
        }
    },
    zh: {
        titleStress: "Zero Stress",
        titleChoice: "Best Choice",
        goBtn: "出发",
        unlockText: "想要更多选项？仅需 $4.99 即可解锁 30 天无限量房源。",
        unlockBtn: "立即解锁",
        step1Header: "1. 我的偏好设置 (权重: 1~5)",
        nextBtn: "下一步",
        step2Header: "2. 房源评分输入 (评分: 1~5)",
        propNameLabel: "房源名称/昵称",
        propNamePlaceholder: "例如：地区名称",
        addAttrTitle: "添加属性（最多15个）",
        addAttrPlaceholder: "输入属性名称",
        addAttrRating: "评分型 (1~5)",
        addAttrBinary: "是/否型",
        addAttrBtn: "+ 添加",
        addAttrLimitReached: "最多可添加15个属性。",
        addAttrEmptyName: "请输入属性名称。",
        minCriteriaAlert: "至少需要保留1个属性。",
        submitBtn: "评估并保存",
        submitUpdateBtn: "更新并保存",
        resetBtn: "重置偏好",
        resultHeader: "📊 房源对比排名",
        thRank: "排名",
        thName: "房源名称",
        thScore: "总分",
        thAction: "管理",
        editBtn: "编辑",
        deleteBtn: "删除",
        confirmDelete: "您确定要删除该房源吗？",
        yesText: "是",
        noText: "否",
        scoreLabelSuffix: " 评分",
        rankFormat: (val) => `第 ${val} 名`,
        scoreFormat: (val) => `${val} 分`,
        alertSelectWeight: (label) => `请在我的偏好设置中为 [${label}] 选择权重。`,
        alertEnterName: "请输入房源名称。",
        alertSelectScore: (label) => `请在房源评分输入中为 [${label}] 选择评分。`,
        alertMoreOptions: "想要更多选项？仅需 $4.99 即可解锁 30 天无限量房源。",
        alertPaymentSuccess: "支付成功！30天内无限房源已解锁。",
        loginTag: "登录后可保存对比结果，下次继续使用。",
        loginNote: "您的数据将安全地保存在 Supabase 中。",
        signOutBtn: "退出登录",
        greeting: (name) => `你好，${name}`,
        loginBtn: "登录",
        signupBtn: "注册",
        usernameLabel: "昵称",
        usernamePlaceholder: "例如：租房达人",
        emailLabel: "邮箱",
        emailPlaceholder: "you@example.com",
        passwordLabel: "密码",
        passwordPlaceholder: "••••••••",
        authMissingFields: "请输入邮箱和密码。",
        authMissingUsername: "请输入昵称。",
        authCheckEmail: "确认邮件已发送，请查收后再登录。",
        adLabel: "广告",
        adPlaceholder: "此处可展示广告",
        aboutHeading: "RentBest 是一个什么样的服务？",
        aboutBullet1: "<span class=\"bullet-label\">⚖️ <strong>自定义核心标准</strong>：</span><span class=\"bullet-desc\">无论是通勤时间、租金/押金、周边治安还是朝向，由您决定各项指标的权重。</span>",
        aboutBullet2: "<span class=\"bullet-label\">📝 <strong>看房实时打分</strong>：</span><span class=\"bullet-desc\">告别凌乱的备忘录！在实地看房（Inspection）时，随时随地用手机轻松记录每一套房源的分数。</span>",
        aboutBullet3: "<span class=\"bullet-label\">🏆 <strong>100分制智能推荐</strong>：</span><span class=\"bullet-desc\">无需纠结，系统会根据您的标准自动计算出最佳房源排行榜，助您高效做出完美决策。</span>",
        howItWorksHeading: "使用方法",
        howStep1: "<span class=\"step-label\"><strong>1. 设置我的偏好</strong> —</span><span class=\"step-desc\">为通勤时间、价格、管理费等基本项目打出1~5分的重要程度，也可以按需添加或删除自定义项目。</span>",
        howStep2: "<span class=\"step-label\"><strong>2. 输入房源评分</strong> —</span><span class=\"step-desc\">为实际看过的房源起个昵称，并按相同项目打分。</span>",
        howStep3: "<span class=\"step-label\"><strong>3. 查看排名</strong> —</span><span class=\"step-desc\">权重与评分相乘得出总分，房源排名会自动生成，每次登录都能在首页立即看到。</span>",
        footerPrivacy: "隐私政策",
        footerTerms: "服务条款",
        footerContact: "联系我们",
        criteria: {
            commute: "通勤时间",
            price: "价格",
            age: "房龄/折旧",
            infra: "周边设施距离",
            water: "水费",
            gas_elec: "燃气/电费",
            floor_mat: "地板材质",
            garage: "车库 (有/无)",
            stairs: "楼层 / 楼梯",
            security: "安保"
        }
    }
};

// 초기 UI 생성
window.onload = async function () {
    // 저장된 언어 불러오기 (기본값: 영어) — 언어는 기기 설정으로 취급, 사용자별로 나누지 않음
    currentLang = localStorage.getItem("selectedLang") || "en";

    // 기본 폼(로그인 전 상태) 먼저 렌더링
    renderForms();
    renderCustomAttrList();
    setupAuthEnterKey();

    // Supabase 세션 복원 (이미 로그인돼 있으면 자동으로 앱 화면까지 진입)
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        await onSignedIn(session.user);
    }

    // 초기 언어 적용
    changeLanguage(currentLang);

    // 현재 주소창 해시 + 로그인 상태에 맞는 화면 표시 (새로고침/북마크 대응)
    applyRoute();
};

// 로그인/회원가입 입력창에서 Enter를 누르면 제출 버튼을 누른 것과 동일하게 동작하도록 설정
function setupAuthEnterKey() {
    ["auth-username", "auth-email", "auth-password"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleAuthSubmit();
            }
        });
    });
}

// Supabase 세션이 만료되거나 다른 탭에서 로그아웃한 경우 등을 감지
sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" && currentUser) {
        signOutUser();
    }
});

// 로그인한 사용자의 저장 데이터(선호도, 커스텀 항목, 매물 목록)를 Supabase에서 불러오기
async function loadAllUserDataFromSupabase() {
    const { data: prefRow, error: prefError } = await sb
        .from("preferences")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (prefError) console.error("preferences load error:", prefError);

    if (prefRow) {
        removedBuiltinIds = prefRow.removed_builtin_ids || [];
        customCriteria = prefRow.custom_criteria || [];
        currentWeights = prefRow.weights || {};
        isUnlocked = !!prefRow.is_unlocked;
    } else {
        removedBuiltinIds = [];
        customCriteria = [];
        currentWeights = {};
        isUnlocked = false;
        // 최초 로그인이라면 preferences 행을 미리 만들어 둔다.
        const { error: insertError } = await sb.from("preferences").insert({ user_id: currentUser.id });
        if (insertError) console.error("preferences init error:", insertError);
    }

    criteria = removedBuiltinIds.length
        ? DEFAULT_CRITERIA.filter(c => !removedBuiltinIds.includes(c.id))
        : DEFAULT_CRITERIA.slice();

    const { data: props, error: propsError } = await sb
        .from("properties")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("score", { ascending: false });

    if (propsError) console.error("properties load error:", propsError);

    propertyList = (props || []).map(p => ({
        id: p.id,
        name: p.name,
        scores: p.scores || {},
        score: Number(p.score),
        note: p.note || ""
    }));

    updateRankingTable();
}

// preferences 행을 부분 갱신 (upsert)
async function savePreferences(partial) {
    if (!currentUser) return;
    const payload = { user_id: currentUser.id, ...partial };
    const { error } = await sb.from("preferences").upsert(payload, { onConflict: "user_id" });
    if (error) console.error("savePreferences error:", error);
}

// 기본 항목 삭제 함수 (최소 1개 유지)
async function removeBuiltinCriteria(id) {
    const total = criteria.length + customCriteria.length;
    if (total <= 1) {
        alert(translations[currentLang].minCriteriaAlert);
        return;
    }
    criteria = criteria.filter(c => c.id !== id);
    removedBuiltinIds.push(id);

    delete currentWeights[id];

    await savePreferences({ removed_builtin_ids: removedBuiltinIds, weights: currentWeights });

    renderForms();
    renderCustomAttrList();
    loadSavedWeights(currentWeights);
}

// 가중치 및 점수 입력 폼 동적 렌더링
function renderForms() {
    const weightForm = document.getElementById("weighting-form");
    const propForm = document.getElementById("property-form");

    weightForm.innerHTML = "";
    propForm.innerHTML = "";

    const lang = currentLang;

    criteria.forEach(c => {
        const wDiv = document.createElement("div");
        wDiv.className = "input-inline";
        wDiv.innerHTML = criterionRowHtml(c, lang);
        weightForm.appendChild(wDiv);

        const pDiv = document.createElement("div");
        pDiv.className = "input-inline";
        pDiv.innerHTML = propertyRowHtml(c, lang);
        propForm.appendChild(pDiv);
    });

    renderCustomAttrForms();
}

// 커스텀 항목 폼 렌더링 (property-form 내 기본 항목 뒤에 추가)
function renderCustomAttrForms() {
    const propForm = document.getElementById("property-form");
    const weightForm = document.getElementById("weighting-form");
    const lang = currentLang;

    propForm.querySelectorAll(".custom-form-row").forEach(el => el.remove());
    weightForm.querySelectorAll(".custom-form-row").forEach(el => el.remove());

    customCriteria.forEach(c => {
        const wDiv = document.createElement("div");
        wDiv.className = "input-inline custom-form-row";
        wDiv.innerHTML = criterionRowHtml(c, lang, true);
        weightForm.appendChild(wDiv);

        const pDiv = document.createElement("div");
        pDiv.className = "input-inline custom-form-row";
        pDiv.innerHTML = propertyRowHtml(c, lang, true);
        propForm.appendChild(pDiv);
    });
}

// 커스텀 항목 추가 함수
async function addCustomAttribute() {
    const lang = currentLang;
    const t = translations[lang];
    const totalCriteria = criteria.length + customCriteria.length;
    if (totalCriteria >= MAX_CRITERIA) {
        alert(t.addAttrLimitReached);
        return;
    }

    const nameInput = document.getElementById("new-attr-name");
    const typeSelect = document.getElementById("new-attr-type");
    const name = nameInput.value.trim();
    if (!name) {
        alert(t.addAttrEmptyName);
        return;
    }

    const id = "custom_" + Date.now();
    const type = typeSelect.value === "binary" ? "binary" : "rating";
    // 유저가 입력한 언어 그대로 저장 (자동 번역 없음)
    const newItem = { id, label: name, type };
    customCriteria.push(newItem);

    await savePreferences({ custom_criteria: customCriteria });

    // 입력 초기화
    nameInput.value = "";
    typeSelect.value = "rating";

    // 커스텀 항목 목록 및 폼 리렌더
    renderCustomAttrList();
    renderCustomAttrForms();
    loadSavedWeights(currentWeights);
}

// 커스텀 항목 삭제 함수
async function removeCustomAttribute(id) {
    customCriteria = customCriteria.filter(c => c.id !== id);
    await savePreferences({ custom_criteria: customCriteria });
    renderCustomAttrList();
    renderCustomAttrForms();
    loadSavedWeights(currentWeights);
}

// "항목 추가" 박스의 잔여 개수 텍스트만 업데이트 (개별 항목 삭제는 리스트의 ✕ 버튼으로 처리)
function renderCustomAttrList() {
    const lang = currentLang;
    const t = translations[lang];

    const addAttrTitleEl = document.getElementById("add-attr-title-text");
    if (addAttrTitleEl) {
        const remaining = MAX_CRITERIA - criteria.length - customCriteria.length;
        addAttrTitleEl.textContent = t.addAttrTitle.replace("15", MAX_CRITERIA) + ` (${remaining}${lang === 'en' ? ' left' : lang === 'zh' ? ' 剩余' : ' 남음'})`;
    }
}

// 언어 변경 함수
function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("selectedLang", lang);

    // 언어 선택 버튼 활성화 처리
    const langBtns = document.querySelectorAll(".lang-selector .lang-btn");
    langBtns.forEach(btn => {
        if (btn.id === `lang-${lang}`) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // 정적 텍스트 번역 적용
    document.getElementById("title-stress").innerHTML = translations[lang].titleStress;
    document.getElementById("title-choice").innerHTML = translations[lang].titleChoice;
    document.getElementById("login-title-stress").innerHTML = translations[lang].titleStress;
    document.getElementById("login-title-choice").innerHTML = translations[lang].titleChoice;
    document.getElementById("go-btn").innerText = translations[lang].goBtn;
    document.getElementById("unlock-banner-text").innerText = translations[lang].unlockText;
    document.getElementById("unlock-banner-btn").innerText = translations[lang].unlockBtn;
    document.getElementById("step1-header").innerText = translations[lang].step1Header;
    document.getElementById("step1-next-btn").innerText = translations[lang].nextBtn;
    document.getElementById("step2-header").innerText = translations[lang].step2Header;
    document.getElementById("prop-name-label").innerText = translations[lang].propNameLabel;
    document.getElementById("prop-name").placeholder = translations[lang].propNamePlaceholder;
    document.getElementById("submit-btn").innerText = editingId
        ? (translations[lang].submitUpdateBtn || translations[lang].submitBtn)
        : translations[lang].submitBtn;
    document.getElementById("result-header").innerText = translations[lang].resultHeader;

    document.getElementById("step1-toggle").setAttribute("aria-expanded", String(preferenceOpen));
    document.getElementById("step2-toggle").setAttribute("aria-expanded", String(propertyOpen));

    // 로그인 화면 텍스트
    document.getElementById("auth-tab-login").innerText = translations[lang].loginBtn;
    document.getElementById("auth-tab-signup").innerText = translations[lang].signupBtn;
    document.getElementById("auth-username-label").innerText = translations[lang].usernameLabel;
    document.getElementById("auth-username").placeholder = translations[lang].usernamePlaceholder;
    document.getElementById("auth-email-label").innerText = translations[lang].emailLabel;
    document.getElementById("auth-email").placeholder = translations[lang].emailPlaceholder;
    document.getElementById("auth-password-label").innerText = translations[lang].passwordLabel;
    document.getElementById("auth-password").placeholder = translations[lang].passwordPlaceholder;
    document.getElementById("auth-submit-btn").innerText = authMode === "signup" ? translations[lang].signupBtn : translations[lang].loginBtn;
    document.getElementById("login-tag").innerText = translations[lang].loginTag;
    document.getElementById("login-note").innerText = translations[lang].loginNote;
    document.getElementById("signout-btn").innerText = translations[lang].signOutBtn;
    // 광고 슬롯 비활성화 중 (당분간 무료 서비스) — ad-slot을 다시 켜면 아래 두 줄도 함께 주석 해제
    // document.getElementById("ad-label").innerText = translations[lang].adLabel;
    // document.getElementById("ad-placeholder").innerText = translations[lang].adPlaceholder;
    document.getElementById("about-heading").innerText = translations[lang].aboutHeading;
    document.getElementById("about-bullet-1").innerHTML = translations[lang].aboutBullet1;
    document.getElementById("about-bullet-2").innerHTML = translations[lang].aboutBullet2;
    document.getElementById("about-bullet-3").innerHTML = translations[lang].aboutBullet3;
    document.getElementById("how-it-works-heading").innerText = translations[lang].howItWorksHeading;
    document.getElementById("how-step-1").innerHTML = translations[lang].howStep1;
    document.getElementById("how-step-2").innerHTML = translations[lang].howStep2;
    document.getElementById("how-step-3").innerHTML = translations[lang].howStep3;
    document.getElementById("footer-privacy").innerText = translations[lang].footerPrivacy;
    document.getElementById("footer-terms").innerText = translations[lang].footerTerms;
    document.getElementById("footer-contact").innerText = translations[lang].footerContact;
    updateGreeting();

    // 커스텀 항목 추가 UI 번역 업데이트
    const newAttrInput = document.getElementById("new-attr-name");
    if (newAttrInput) newAttrInput.placeholder = translations[lang].addAttrPlaceholder;
    const addAttrTypeSelect = document.getElementById("new-attr-type");
    if (addAttrTypeSelect) {
        addAttrTypeSelect.options[0].text = translations[lang].addAttrRating;
        addAttrTypeSelect.options[1].text = translations[lang].addAttrBinary;
    }
    const addAttrBtnEl = document.querySelector(".add-attr-btn");
    if (addAttrBtnEl) addAttrBtnEl.innerText = translations[lang].addAttrBtn;
    const step2Caret = document.getElementById("step2-caret");
    if (step2Caret) step2Caret.textContent = propertyOpen ? "▴" : "▾";

    // 생성된 입력 폼 라벨 및 바이너리 버튼 다국어 즉시 업데이트 (기본 항목)
    [...criteria, ...customCriteria].forEach(c => {
        const baseLabel = criteria.some(x => x.id === c.id) ? criterionLabel(lang, c) : customLabel(c, lang);
        const pLabel = document.getElementById(`p-label-${c.id}`);
        if (pLabel) pLabel.innerText = c.type === "binary" ? baseLabel : baseLabel + translations[lang].scoreLabelSuffix;
        const btnYes = document.getElementById(`p-btn-yes-${c.id}`);
        const btnNo = document.getElementById(`p-btn-no-${c.id}`);
        if (btnYes && btnNo) {
            btnYes.innerText = translations[lang].yesText;
            btnNo.innerText = translations[lang].noText;
        }
        const wLabel = document.getElementById(`w-label-${c.id}`);
        if (wLabel) wLabel.innerText = baseLabel;
    });

    // 커스텀 항목 목록 업데이트 (언어에 따른 타입명 갱신)
    renderCustomAttrList();

    // 매물 비교 랭킹 카드 언어 리셋 적용
    updateRankingTable();
}

// 단계 이동 함수: "Go" 클릭 시 가중치가 이미 저장돼 있으면 1단계는 자동으로 접어두고
// 곧바로 2단계(매물 점수 입력)로 진입한다.
function startApp() {
    if (!currentUser) return;

    const step1 = document.getElementById("step1-section");
    const step2 = document.getElementById("step2-section");
    const hasWeights = currentWeights && Object.keys(currentWeights).length > 0;
    const hasProperty = propertyList.length > 0;
    const skipPreference = hasWeights || hasProperty;

    if (hasWeights) loadSavedWeights(currentWeights);

    preferenceOpen = !skipPreference;
    propertyOpen = skipPreference;
    step1.classList.toggle("is-collapsed", !preferenceOpen);
    step2.classList.toggle("is-collapsed", !propertyOpen);
    changePreferenceToggleLabel();

    // 별개 페이지로 이동한 것처럼 주소창 해시를 변경 (뒤로가기로 타이틀 화면 복귀 가능)
    location.hash = APP_ROUTE;
    applyRoute();

    const scrollTarget = skipPreference ? step2 : step1;
    scrollTarget.scrollIntoView({ behavior: "smooth" });
}

function changePreferenceToggleLabel() {
    const header = document.getElementById("step1-header");
    if (header) header.style.display = "inline";
    const caret = document.getElementById("step1-caret");
    if (caret) caret.textContent = preferenceOpen ? "▴" : "▾";
}

function togglePreferenceSection() {
    const section = document.getElementById("step1-section");
    if (!section) return;
    preferenceOpen = !preferenceOpen;
    section.classList.toggle("is-collapsed", !preferenceOpen);
    if (section.style.display === "none") section.style.display = "block";
    changePreferenceToggleLabel();
}

function togglePropertySection() {
    const section = document.getElementById("step2-section");
    if (!section) return;
    propertyOpen = !propertyOpen;
    section.classList.toggle("is-collapsed", !propertyOpen);
    if (section.style.display === "none") section.style.display = "block";
    changePreferenceToggleLabel();
}

function goToStep2() {
    // 모든 가중치가 선택되었는지 검증 및 수집
    const weights = {};
    for (let c of criteria) {
        const val = document.getElementById(`w-${c.id}`).value;
        if (!val) return alert(translations[currentLang].alertSelectWeight(criterionLabel(currentLang, c)));
        weights[c.id] = Number(val);
    }

    currentWeights = weights;
    savePreferences({ weights });

    document.getElementById("step1-section").classList.add("is-collapsed");
    preferenceOpen = false;
    document.getElementById("step2-section").style.display = "block";
    document.getElementById("step2-section").classList.remove("is-collapsed");
    propertyOpen = true;
    changePreferenceToggleLabel();
    document.getElementById("step2-section").scrollIntoView({ behavior: "smooth" });
}

function goToStep1() {
    togglePreferenceSection();
}

function loadSavedWeights(weights) {
    [...criteria, ...customCriteria].forEach(c => {
        const value = weights[c.id];
        if (!value) return;
        const el = document.getElementById(`w-${c.id}`);
        if (el) el.value = value;
        setActiveButton(document.getElementById(`w-container-${c.id}`), value, false);
    });
}

function selectWeight(id, value) {
    setActiveButton(document.getElementById(`w-container-${id}`), value, false);
    document.getElementById(`w-${id}`).value = value;
}

function selectScore(id, value) {
    setActiveButton(document.getElementById(`p-container-${id}`), value, false);
    document.getElementById(`p-${id}`).value = value;
}

function selectScoreBinary(id, value) {
    setActiveButton(document.getElementById(`p-container-${id}`), value, true);
    document.getElementById(`p-${id}`).value = value;
}

// 매물 편집 진입 함수
function editProperty(id) {
    const prop = propertyList.find(p => String(p.id) === String(id));
    if (!prop) return;

    editingId = id;

    // Show the score input step even when editing from the ranking on the title screen.
    location.hash = APP_ROUTE;
    applyRoute();
    document.getElementById("step1-section").classList.add("is-collapsed");
    preferenceOpen = false;
    document.getElementById("step2-section").classList.remove("is-collapsed");
    propertyOpen = true;
    changePreferenceToggleLabel();

    // 매물 이름 입력 필드에 대입
    document.getElementById("prop-name").value = prop.name;

    // 메모(note) 필드 복원
    document.getElementById("prop-note").value = prop.note || "";

    // 각 항목 점수 복원 및 UI 업데이트 (기본 + 커스텀)
    [...criteria, ...customCriteria].forEach(c => {
        const score = prop.scores && prop.scores[c.id] !== undefined ? prop.scores[c.id] : "";
        const el = document.getElementById(`p-${c.id}`);
        if (el) el.value = score;
        if (score !== "") setActiveButton(document.getElementById(`p-container-${c.id}`), score, c.type === "binary");
        else clearActiveButtons(document.getElementById(`p-container-${c.id}`));
    });

    // 등록 버튼 텍스트를 "매물 수정 및 저장"으로 변경
    document.getElementById("submit-btn").innerText = translations[currentLang].submitUpdateBtn;

    // 매물 점수 입력 영역으로 부드럽게 스크롤
    document.getElementById("step2-section").scrollIntoView({ behavior: "smooth" });
    document.getElementById("prop-name").focus();
}

// 매물 삭제 함수
async function deleteProperty(id) {
    if (confirm(translations[currentLang].confirmDelete)) {
        const { error } = await sb.from("properties").delete().eq("id", id).eq("user_id", currentUser.id);
        if (error) {
            alert(error.message);
            return;
        }
        propertyList = propertyList.filter(p => String(p.id) !== String(id));

        // 현재 삭제 중인 매물이 편집 중이던 항목이라면 편집 상태 초기화
        if (String(editingId) === String(id)) {
            editingId = null;
            document.getElementById("prop-name").value = "";
            clearScoreFields([...criteria, ...customCriteria]);
            document.getElementById("submit-btn").innerText = translations[currentLang].submitBtn;
        }

        updateRankingTable();
    }
}

// 매물 평가 실행 및 저장
async function analyzeProperty() {
    const name = document.getElementById("prop-name").value.trim();
    if (!name) return alert(translations[currentLang].alertEnterName);

    // 모든 기본 점수가 선택되었는지 검증
    for (let c of criteria) {
        const val = document.getElementById(`p-${c.id}`).value;
        if (!val) {
            alert(translations[currentLang].alertSelectScore(translations[currentLang].criteria[c.id]));
            return;
        }
    }
    // 커스텀 항목 점수 검증
    for (let c of customCriteria) {
        const el = document.getElementById(`p-${c.id}`);
        if (el && !el.value) {
            alert(translations[currentLang].alertSelectScore(customLabel(c, currentLang)));
            return;
        }
    }

    let totalScore = 0;
    let maxPossibleScore = 0;
    const scores = {};

    // 기본 항목 점수 계산
    criteria.forEach(c => {
        const weight = Number(document.getElementById(`w-${c.id}`).value) || 0;
        const score = Number(document.getElementById(`p-${c.id}`).value) || 0;
        totalScore += weight * score;
        maxPossibleScore += weight * 5;
        scores[c.id] = score;
    });

    // 커스텀 항목 점수 계산
    customCriteria.forEach(c => {
        const wEl = document.getElementById(`w-${c.id}`);
        const pEl = document.getElementById(`p-${c.id}`);
        const weight = wEl ? Number(wEl.value) || 0 : 0;
        const score = pEl ? Number(pEl.value) || 0 : 0;
        totalScore += weight * score;
        maxPossibleScore += weight * 5;
        scores[c.id] = score;
    });

    // 100점 만점 기준으로 환산
    const finalScore = maxPossibleScore > 0 ? ((totalScore / maxPossibleScore) * 100).toFixed(1) : "0.0";
    const note = document.getElementById("prop-note").value.trim();

    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;

    try {
        if (editingId !== null) {
            // 편집 저장 모드
            let { error } = await sb.from("properties")
                .update({ name, scores, score: Number(finalScore), note })
                .eq("id", editingId)
                .eq("user_id", currentUser.id);

            if (error && /note/i.test(error.message || "")) {
                // note 컬럼이 아직 DB에 없는 경우: note를 빼고 재시도해서 점수/랭킹 저장은 항상 되게 한다.
                ({ error } = await sb.from("properties")
                    .update({ name, scores, score: Number(finalScore) })
                    .eq("id", editingId)
                    .eq("user_id", currentUser.id));
            }
            if (error) throw error;

            const propIndex = propertyList.findIndex(p => String(p.id) === String(editingId));
            if (propIndex !== -1) {
                propertyList[propIndex].name = name;
                propertyList[propIndex].scores = scores;
                propertyList[propIndex].score = Number(finalScore);
                propertyList[propIndex].note = note;
            }
            editingId = null;
            document.getElementById("submit-btn").innerText = translations[currentLang].submitBtn;
        } else {
            // 신규 추가 모드
            let { data, error } = await sb.from("properties")
                .insert({ user_id: currentUser.id, name, scores, score: Number(finalScore), note })
                .select()
                .single();

            if (error && /note/i.test(error.message || "")) {
                // note 컬럼이 아직 DB에 없는 경우: note를 빼고 재시도해서 점수/랭킹 저장은 항상 되게 한다.
                ({ data, error } = await sb.from("properties")
                    .insert({ user_id: currentUser.id, name, scores, score: Number(finalScore) })
                    .select()
                    .single());
            }
            if (error) throw error;

            propertyList.push({ id: data.id, name, scores, score: Number(finalScore), note });
        }
    } catch (err) {
        alert(err && err.message ? err.message : String(err));
        submitBtn.disabled = false;
        return;
    }
    submitBtn.disabled = false;

    // 리스트 정렬
    propertyList.sort((a, b) => b.score - a.score);

    document.getElementById("prop-name").value = "";
    document.getElementById("prop-note").value = "";
    clearScoreFields([...criteria, ...customCriteria]);

    updateRankingTable();

    // 저장 후에는 첫 화면(랜딩)으로 돌아가 갱신된 랭킹을 바로 보여준다.
    location.hash = "";
    applyRoute();
    document.getElementById("title-section").scrollIntoView({ behavior: "smooth" });
}

// 랭킹 카드 갱신 (첫 화면/랜딩 페이지에 노출)
function updateRankingTable() {
    const body = document.getElementById("ranking-cards");
    if (!body) return;

    const t = translations[currentLang];

    body.innerHTML = propertyList.map((prop, index) => {
        const rankStr = t.rankFormat(index + 1);
        const scoreStr = t.scoreFormat(prop.score);
        return `
            <div class="rank-card">
                <div class="rank-tab">${rankStr}</div>
                <div class="rank-card-main">
                    <div class="rank-card-name">${escapeHtml(prop.name)}</div>
                    <div class="rank-card-actions">
                        <button class="ranking-btn edit-btn" onclick="editProperty('${prop.id}')">${t.editBtn}</button>
                        <button class="ranking-btn delete-btn" onclick="deleteProperty('${prop.id}')">${t.deleteBtn}</button>
                    </div>
                </div>
                <div class="rank-card-score"><span class="score-tag">${scoreStr}</span></div>
            </div>`;
    }).join("");

    const unlockBanner = document.getElementById("unlock-banner");
    const goBtn = document.getElementById("go-btn");

    if (unlockBanner && goBtn) {
        // ===== TEMP: 유료 잠금 기능 임시 비활성화 (원복 시 아래 블록으로 교체) =====
        // if (propertyList.length >= 3 && !isUnlocked) {
        //     unlockBanner.style.display = "flex";
        //     goBtn.style.display = "none";
        // } else {
        //     unlockBanner.style.display = "none";
        //     goBtn.style.display = "block";
        // }
        unlockBanner.style.display = "none";
        goBtn.style.display = "block";
        // ===== TEMP 끝 =====
    }

    document.getElementById("result-section").style.display = propertyList.length ? "block" : "none";
}

// 프리미엄 기능 잠금 해제
async function unlockApp() {
    isUnlocked = true;
    await savePreferences({ is_unlocked: true });
    alert(translations[currentLang].alertPaymentSuccess);
    updateRankingTable();
}