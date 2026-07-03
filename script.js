// 평가 기준 정의 (Garage만 Y/N형, 나머지는 1~5 점수형) — let으로 선언해 런타임 삭제 허용
let criteria = [
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
// 원본 목록 (복원 기준)
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

let propertyList = [];
let currentLang = "ko";
let editingId = null;
let customCriteria = []; // 사용자 추가 항목
let removedBuiltinIds = []; // 삭제된 기본 항목 ID 목록
const MAX_CRITERIA = 15;  // 기본 항목 + 커스텀 합산 최대 15개

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
        titleStress: "零压力",
        titleChoice: "最佳选择",
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
window.onload = function () {
    // 저장된 언어 불러오기 (기본값: 한국어)
    currentLang = localStorage.getItem("selectedLang") || "ko";

    // 삭제된 기본 항목 복원
    const savedRemoved = localStorage.getItem("removedBuiltinIds");
    if (savedRemoved) {
        removedBuiltinIds = JSON.parse(savedRemoved);
        criteria = DEFAULT_CRITERIA.filter(c => !removedBuiltinIds.includes(c.id));
    }

    // 저장된 커스텀 항목 복원
    const savedCustom = localStorage.getItem("customCriteria");
    if (savedCustom) {
        customCriteria = JSON.parse(savedCustom);
    }

    // 언어에 맞게 입력 UI 생성
    renderForms();
    renderCustomAttrList();

    // 로컬 스토리지 데이터 복원
    const savedList = localStorage.getItem("propertyList");
    if (savedList) {
        propertyList = JSON.parse(savedList);
        propertyList.forEach(prop => {
            if (!prop.id) prop.id = Date.now() + Math.random();
            if (!prop.scores) prop.scores = {};
        });
        updateRankingTable();
    }

    // 로컬 스토리지 가중치 데이터 복원
    const savedWeights = localStorage.getItem("weights");
    if (savedWeights) {
        loadSavedWeights(JSON.parse(savedWeights));
    }

    // 초기 언어 적용
    changeLanguage(currentLang);
};

// 기본 항목 삭제 함수 (최소 1개 유지)
function removeBuiltinCriteria(id) {
    const total = criteria.length + customCriteria.length;
    if (total <= 1) {
        alert(translations[currentLang].minCriteriaAlert);
        return;
    }
    criteria = criteria.filter(c => c.id !== id);
    removedBuiltinIds.push(id);
    localStorage.setItem("removedBuiltinIds", JSON.stringify(removedBuiltinIds));

    // 폼과 가중치 저장 갱신
    const savedWeights = localStorage.getItem("weights");
    let weights = savedWeights ? JSON.parse(savedWeights) : {};
    delete weights[id];
    localStorage.setItem("weights", JSON.stringify(weights));

    renderForms();
    renderCustomAttrList();
    loadSavedWeights(weights);
}

// 가중치 및 점수 입력 폼 동적 렌더링
function renderForms() {
    const weightForm = document.getElementById("weighting-form");
    const propForm = document.getElementById("property-form");

    weightForm.innerHTML = "";
    propForm.innerHTML = "";

    const lang = currentLang;

    // 기본 criteria 렌더링 (왼쪽 × 버튼 포함)
    criteria.forEach(c => {
        const labelText = translations[lang].criteria[c.id] || c.label;
        // 가중치 폼 행
        const wDiv = document.createElement("div");
        wDiv.className = "input-inline";
        wDiv.innerHTML = `
            <button type="button" class="remove-inline-btn" onclick="removeBuiltinCriteria('${c.id}')" title="Remove">✕</button>
            <label id="w-label-${c.id}">${labelText}</label>
            <div class="weight-buttons" id="w-container-${c.id}">
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 1)">1</button>
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 2)">2</button>
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 3)">3</button>
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 4)">4</button>
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 5)">5</button>
            </div>
            <input type="hidden" id="w-${c.id}" value="">`;
        weightForm.appendChild(wDiv);

        // 점수 폼 행
        const pDiv = document.createElement("div");
        pDiv.className = "input-inline";
        if (c.type === "binary") {
            pDiv.innerHTML = `
                <button type="button" class="remove-inline-btn" onclick="removeBuiltinCriteria('${c.id}')" title="Remove">✕</button>
                <label id="p-label-${c.id}">${labelText}</label>
                <div class="weight-buttons" id="p-container-${c.id}">
                    <button type="button" class="w-btn" id="p-btn-yes-${c.id}" style="width: 55px !important;" onclick="selectScoreBinary('${c.id}', 5)">${translations[lang].yesText}</button>
                    <button type="button" class="w-btn" id="p-btn-no-${c.id}" style="width: 55px !important;" onclick="selectScoreBinary('${c.id}', 1)">${translations[lang].noText}</button>
                </div>
                <input type="hidden" id="p-${c.id}" value="">`;
        } else {
            pDiv.innerHTML = `
                <button type="button" class="remove-inline-btn" onclick="removeBuiltinCriteria('${c.id}')" title="Remove">✕</button>
                <label id="p-label-${c.id}">${labelText}${translations[lang].scoreLabelSuffix}</label>
                <div class="weight-buttons" id="p-container-${c.id}">
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 1)">1</button>
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 2)">2</button>
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 3)">3</button>
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 4)">4</button>
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 5)">5</button>
                </div>
                <input type="hidden" id="p-${c.id}" value="">`;
        }
        propForm.appendChild(pDiv);
    });

    // 커스텀 criteria 폼 렌더링
    renderCustomAttrForms();
}

// 커스텀 항목 폼 렌더링 (property-form 내 기본 항목 뒤에 추가)
function renderCustomAttrForms() {
    const propForm = document.getElementById("property-form");
    const weightForm = document.getElementById("weighting-form");
    const lang = currentLang;

    // 기존 커스텀 항목 요소 제거 후 재렌더링
    propForm.querySelectorAll(".custom-form-row").forEach(el => el.remove());
    weightForm.querySelectorAll(".custom-form-row").forEach(el => el.remove());

    customCriteria.forEach(c => {
        // 가중치 폼 — 왼쪽 × 버튼
        const wDiv = document.createElement("div");
        wDiv.className = "input-inline custom-form-row";
        wDiv.innerHTML = `
            <button type="button" class="remove-inline-btn" onclick="removeCustomAttribute('${c.id}')" title="Remove">✕</button>
            <label id="w-label-${c.id}">${c.label}</label>
            <div class="weight-buttons" id="w-container-${c.id}">
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 1)">1</button>
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 2)">2</button>
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 3)">3</button>
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 4)">4</button>
                <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 5)">5</button>
            </div>
            <input type="hidden" id="w-${c.id}" value="">`;
        weightForm.appendChild(wDiv);

        // 점수 폼 — 왼쪽 × 버튼
        const pDiv = document.createElement("div");
        pDiv.className = "input-inline custom-form-row";
        if (c.type === "binary") {
            pDiv.innerHTML = `
                <button type="button" class="remove-inline-btn" onclick="removeCustomAttribute('${c.id}')" title="Remove">✕</button>
                <label id="p-label-${c.id}">${c.label}</label>
                <div class="weight-buttons" id="p-container-${c.id}">
                    <button type="button" class="w-btn" id="p-btn-yes-${c.id}" style="width: 55px !important;" onclick="selectScoreBinary('${c.id}', 5)">${translations[lang].yesText}</button>
                    <button type="button" class="w-btn" id="p-btn-no-${c.id}" style="width: 55px !important;" onclick="selectScoreBinary('${c.id}', 1)">${translations[lang].noText}</button>
                </div>
                <input type="hidden" id="p-${c.id}" value="">`;
        } else {
            pDiv.innerHTML = `
                <button type="button" class="remove-inline-btn" onclick="removeCustomAttribute('${c.id}')" title="Remove">✕</button>
                <label id="p-label-${c.id}">${c.label}${translations[lang].scoreLabelSuffix}</label>
                <div class="weight-buttons" id="p-container-${c.id}">
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 1)">1</button>
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 2)">2</button>
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 3)">3</button>
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 4)">4</button>
                    <button type="button" class="w-btn" onclick="selectScore('${c.id}', 5)">5</button>
                </div>
                <input type="hidden" id="p-${c.id}" value="">`;
        }
        propForm.appendChild(pDiv);
    });
}

// 커스텀 항목 추가 함수
function addCustomAttribute() {
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
    customCriteria.push({ id, label: name, type });

    // localStorage에 저장
    localStorage.setItem("customCriteria", JSON.stringify(customCriteria));

    // 입력 초기화
    nameInput.value = "";
    typeSelect.value = "rating";

    // 커스텀 항목 목록 및 폼 리렌더
    renderCustomAttrList();
    renderCustomAttrForms();

    // 저장된 가중치 복원
    const savedWeights = localStorage.getItem("weights");
    if (savedWeights) loadSavedWeights(JSON.parse(savedWeights));
}

// 커스텀 항목 삭제 함수
function removeCustomAttribute(id) {
    customCriteria = customCriteria.filter(c => c.id !== id);
    localStorage.setItem("customCriteria", JSON.stringify(customCriteria));
    renderCustomAttrList();
    renderCustomAttrForms();

    const savedWeights = localStorage.getItem("weights");
    if (savedWeights) loadSavedWeights(JSON.parse(savedWeights));
}

// 커스텀 항목 목록 UI 렌더링
function renderCustomAttrList() {
    const lang = currentLang;
    const t = translations[lang];
    const listEl = document.getElementById("custom-attr-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    customCriteria.forEach(c => {
        const typeLabel = c.type === "binary" ? t.addAttrBinary : t.addAttrRating;
        const item = document.createElement("div");
        item.className = "custom-attr-item";
        item.innerHTML = `
            <span>${c.label} <small style="color:#999;">(${typeLabel})</small></span>
            <button class="remove-attr-btn" onclick="removeCustomAttribute('${c.id}')">✕</button>`;
        listEl.appendChild(item);
    });

    // 추가 UI 상태 업데이트
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
    document.getElementById("reset-btn").innerText = translations[lang].resetBtn;
    document.getElementById("result-header").innerText = translations[lang].resultHeader;

    document.getElementById("th-rank").innerText = translations[lang].thRank;
    document.getElementById("th-name").innerText = translations[lang].thName;
    document.getElementById("th-score").innerText = translations[lang].thScore;
    document.getElementById("th-action").innerText = translations[lang].thAction;

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

    // 생성된 입력 폼 라벨 및 바이너리 버튼 다국어 즉시 업데이트 (기본 항목)
    criteria.forEach(c => {
        const wLabel = document.getElementById(`w-label-${c.id}`);
        if (wLabel) wLabel.innerText = translations[lang].criteria[c.id];

        const pLabel = document.getElementById(`p-label-${c.id}`);
        if (pLabel) {
            pLabel.innerText = c.type === "binary"
                ? translations[lang].criteria[c.id]
                : translations[lang].criteria[c.id] + translations[lang].scoreLabelSuffix;
        }

        const btnYes = document.getElementById(`p-btn-yes-${c.id}`);
        const btnNo = document.getElementById(`p-btn-no-${c.id}`);
        if (btnYes && btnNo) {
            btnYes.innerText = translations[lang].yesText;
            btnNo.innerText = translations[lang].noText;
        }
    });

    // 커스텀 항목 바이너리 버튼 번역 (커스텀 항목 Yes/No는 고정 다국어 반영)
    customCriteria.forEach(c => {
        const btnYes = document.getElementById(`p-btn-yes-${c.id}`);
        const btnNo = document.getElementById(`p-btn-no-${c.id}`);
        if (btnYes && btnNo) {
            btnYes.innerText = translations[lang].yesText;
            btnNo.innerText = translations[lang].noText;
        }
        const pLabel = document.getElementById(`p-label-${c.id}`);
        if (pLabel) {
            pLabel.innerText = c.type === "binary"
                ? c.label
                : c.label + translations[lang].scoreLabelSuffix;
        }
    });

    // 커스텀 항목 목록 업데이트 (언어에 따른 타입명 갱신)
    renderCustomAttrList();

    // 매물 비교 랭킹 테이블 언어 리셋 적용
    updateRankingTable();
}

// 단계 이동 함수
function startApp() {
    document.getElementById("title-section").style.display = "none";
    document.getElementById("app-header").style.display = "block";
    
    const savedWeights = localStorage.getItem("weights");
    if (savedWeights) {
        // 이미 가중치가 설정되어 있다면 복원 후 바로 2단계로
        loadSavedWeights(JSON.parse(savedWeights));
        document.getElementById("step2-section").style.display = "block";
    } else {
        // 처음이면 1단계로
        document.getElementById("step1-section").style.display = "block";
    }
}

function goToStep2() {
    // 모든 가중치가 선택되었는지 검증 및 수집
    const weights = {};
    for (let c of criteria) {
        const val = document.getElementById(`w-${c.id}`).value;
        if (!val) {
            alert(translations[currentLang].alertSelectWeight(translations[currentLang].criteria[c.id]));
            return;
        }
        weights[c.id] = Number(val);
    }
    
    // 가중치를 로컬 스토리지에 저장
    localStorage.setItem("weights", JSON.stringify(weights));

    document.getElementById("step1-section").style.display = "none";
    document.getElementById("step2-section").style.display = "block";
}

function goToStep1() {
    document.getElementById("step1-section").style.display = "block";
    document.getElementById("step2-section").style.display = "none";
}

function loadSavedWeights(weights) {
    // 기본 criteria 가중치 복원
    criteria.forEach(c => {
        const value = weights[c.id];
        if (value) {
            document.getElementById(`w-${c.id}`).value = value;

            const container = document.getElementById(`w-container-${c.id}`);
            if (container) {
                const buttons = container.getElementsByClassName("w-btn");
                for (let btn of buttons) btn.classList.remove("w-active");
                if (buttons[value - 1]) buttons[value - 1].classList.add("w-active");
            }
        }
    });
    // 커스텀 criteria 가중치 복원
    customCriteria.forEach(c => {
        const value = weights[c.id];
        if (value) {
            const el = document.getElementById(`w-${c.id}`);
            if (el) el.value = value;
            const container = document.getElementById(`w-container-${c.id}`);
            if (container) {
                const buttons = container.getElementsByClassName("w-btn");
                for (let btn of buttons) btn.classList.remove("w-active");
                if (buttons[value - 1]) buttons[value - 1].classList.add("w-active");
            }
        }
    });
}

function selectWeight(id, value) {
    const container = document.getElementById(`w-container-${id}`);
    const buttons = container.getElementsByClassName("w-btn");
    
    // 모든 버튼에서 active 클래스 제거
    for (let btn of buttons) {
        btn.classList.remove("w-active");
    }
    
    // 선택한 버튼에 active 클래스 추가
    buttons[value - 1].classList.add("w-active");
    
    // hidden input 값 업데이트
    document.getElementById(`w-${id}`).value = value;
}

function selectScore(id, value) {
    const container = document.getElementById(`p-container-${id}`);
    const buttons = container.getElementsByClassName("w-btn");
    
    // 모든 버튼에서 active 클래스 제거
    for (let btn of buttons) {
        btn.classList.remove("w-active");
    }
    
    // 선택한 버튼에 active 클래스 추가
    buttons[value - 1].classList.add("w-active");
    
    // hidden input 값 업데이트
    document.getElementById(`p-${id}`).value = value;
}

function selectScoreBinary(id, value) {
    const container = document.getElementById(`p-container-${id}`);
    const buttons = container.getElementsByClassName("w-btn");
    
    // 모든 버튼에서 active 클래스 제거
    for (let btn of buttons) {
        btn.classList.remove("w-active");
    }
    
    // Yes(5점)는 첫 번째 버튼(index 0), No(1점)는 두 번째 버튼(index 1)
    if (value === 5) {
        buttons[0].classList.add("w-active");
    } else {
        buttons[1].classList.add("w-active");
    }
    
    // hidden input 값 업데이트
    document.getElementById(`p-${id}`).value = value;
}

// 매물 편집 진입 함수
function editProperty(id) {
    const prop = propertyList.find(p => String(p.id) === String(id));
    if (!prop) return;

    editingId = id;

    // Show the score input step even when editing from the ranking on the title screen.
    document.getElementById("title-section").style.display = "none";
    document.getElementById("app-header").style.display = "block";
    document.getElementById("step1-section").style.display = "none";
    document.getElementById("step2-section").style.display = "block";

    // 매물 이름 입력 필드에 대입
    document.getElementById("prop-name").value = prop.name;

    // 각 항목 점수 복원 및 UI 업데이트 (기본 + 커스텀)
    [...criteria, ...customCriteria].forEach(c => {
        const score = prop.scores && prop.scores[c.id] !== undefined ? prop.scores[c.id] : "";
        const el = document.getElementById(`p-${c.id}`);
        if (el) el.value = score;

        const container = document.getElementById(`p-container-${c.id}`);
        if (container) {
            const buttons = container.getElementsByClassName("w-btn");
            for (let btn of buttons) btn.classList.remove("w-active");
            if (score !== "") {
                if (c.type === "binary") {
                    if (score === 5) buttons[0].classList.add("w-active");
                    else if (score === 1) buttons[1].classList.add("w-active");
                } else {
                    if (buttons[score - 1]) buttons[score - 1].classList.add("w-active");
                }
            }
        }
    });

    // 등록 버튼 텍스트를 "매물 수정 및 저장"으로 변경
    document.getElementById("submit-btn").innerText = translations[currentLang].submitUpdateBtn;

    // 매물 점수 입력 영역으로 부드럽게 스크롤
    document.getElementById("step2-section").scrollIntoView({ behavior: "smooth" });
    document.getElementById("prop-name").focus();
}

// 매물 삭제 함수
function deleteProperty(id) {
    if (confirm(translations[currentLang].confirmDelete)) {
        propertyList = propertyList.filter(p => String(p.id) !== String(id));
        localStorage.setItem("propertyList", JSON.stringify(propertyList));

        // 현재 삭제 중인 매물이 편집 중이던 항목이라면 편집 상태 초기화
        if (String(editingId) === String(id)) {
            editingId = null;
            document.getElementById("prop-name").value = "";
            [...criteria, ...customCriteria].forEach(c => {
                const el = document.getElementById(`p-${c.id}`);
                if (el) el.value = "";
                const container = document.getElementById(`p-container-${c.id}`);
                if (container) {
                    for (let btn of container.getElementsByClassName("w-btn")) {
                        btn.classList.remove("w-active");
                    }
                }
            });
            document.getElementById("submit-btn").innerText = translations[currentLang].submitBtn;
        }

        updateRankingTable();
    }
}

// 매물 평가 실행 및 저장
function analyzeProperty() {
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
            alert(translations[currentLang].alertSelectScore(c.label));
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

    const wasEditing = editingId !== null;

    if (wasEditing) {
        // 편집 저장 모드
        const propIndex = propertyList.findIndex(p => String(p.id) === String(editingId));
        if (propIndex !== -1) {
            propertyList[propIndex].name = name;
            propertyList[propIndex].scores = scores;
            propertyList[propIndex].score = Number(finalScore);
        }
        editingId = null;
        document.getElementById("submit-btn").innerText = translations[currentLang].submitBtn;
    } else {
        // 신규 추가 모드
        const propId = Date.now() + Math.random();
        propertyList.push({ id: propId, name, scores, score: Number(finalScore) });
    }

    // 리스트 정렬
    propertyList.sort((a, b) => b.score - a.score);

    // 로컬 스토리지에 저장
    localStorage.setItem("propertyList", JSON.stringify(propertyList));

    // 입력 데이터 초기화 (기본 + 커스텀)
    document.getElementById("prop-name").value = "";
    [...criteria, ...customCriteria].forEach(c => {
        const el = document.getElementById(`p-${c.id}`);
        if (el) el.value = "";
        const container = document.getElementById(`p-container-${c.id}`);
        if (container) {
            for (let btn of container.getElementsByClassName("w-btn")) {
                btn.classList.remove("w-active");
            }
        }
    });

    updateRankingTable();

    if (wasEditing) {
        document.getElementById("title-section").style.display = "block";
        document.getElementById("app-header").style.display = "none";
        document.getElementById("step1-section").style.display = "none";
        document.getElementById("step2-section").style.display = "none";
        document.getElementById("title-section").scrollIntoView({ behavior: "smooth" });
    }

    if (propertyList.length >= 3 && localStorage.getItem("isUnlocked") !== "true") {
        alert(translations[currentLang].alertMoreOptions);
    }
}

// 테이블 갱신
function updateRankingTable() {
    const body = document.getElementById("ranking-body");
    if (!body) return;
    
    body.innerHTML = "";

    propertyList.forEach((prop, index) => {
        const rankStr = translations[currentLang].rankFormat(index + 1);
        const scoreStr = translations[currentLang].scoreFormat(prop.score);
        body.innerHTML += `
            <tr>
                <td>${rankStr}</td>
                <td><b>${prop.name}</b></td>
                <td><span class="score-tag">${scoreStr}</span></td>
                <td>
                    <button class="ranking-btn edit-btn" onclick="editProperty('${prop.id}')">${translations[currentLang].editBtn}</button>
                    <button class="ranking-btn delete-btn" onclick="deleteProperty('${prop.id}')">${translations[currentLang].deleteBtn}</button>
                </td>
            </tr>`;
    });

    const isUnlocked = localStorage.getItem("isUnlocked") === "true";
    const unlockBanner = document.getElementById("unlock-banner");
    const goBtn = document.getElementById("go-btn");

    if (unlockBanner && goBtn) {
        if (propertyList.length >= 3 && !isUnlocked) {
            unlockBanner.style.display = "flex";
            goBtn.style.display = "none";
        } else {
            unlockBanner.style.display = "none";
            goBtn.style.display = "block";
        }
    }

    document.getElementById("result-section").style.display = "block";
}

// 프리미엄 기능 잠금 해제
function unlockApp() {
    localStorage.setItem("isUnlocked", "true");
    alert(translations[currentLang].alertPaymentSuccess);
    updateRankingTable();
}
