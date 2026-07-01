// 10가지 평가 기준 정의 (Garage만 Y/N형, 나머지는 1~5 점수형)
const criteria = [
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

// 초기 UI 생성
window.onload = function () {
    const weightForm = document.getElementById("weighting-form");
    const propForm = document.getElementById("property-form");

    criteria.forEach(c => {
        // 가중치 입력 UI (1~5 버튼 선택형)
        weightForm.innerHTML += `
            <div class="input-inline">
                <label>${c.label}</label>
                <div class="weight-buttons" id="w-container-${c.id}">
                    <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 1)">1</button>
                    <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 2)">2</button>
                    <button type="button" class="w-btn w-active" onclick="selectWeight('${c.id}', 3)">3</button>
                    <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 4)">4</button>
                    <button type="button" class="w-btn" onclick="selectWeight('${c.id}', 5)">5</button>
                </div>
                <input type="hidden" id="w-${c.id}" value="3">
            </div>`;

        // 매물 점수 입력 UI
        if (c.type === "binary") {
            propForm.innerHTML += `
                <div class="input-inline">
                    <label>${c.label}</label>
                    <select id="p-${c.id}">
                        <option value="5">Yes (5점)</option>
                        <option value="1">No (1점)</option>
                    </select>
                </div>`;
        } else {
            propForm.innerHTML += `
                <div class="input-inline">
                    <label>${c.label} 점수</label>
                    <input type="number" id="p-${c.id}" min="1" max="5" value="3" placeholder="1~5점">
                </div>`;
        }
    });
};

// 단계 이동 함수
function goToStep2() {
    document.getElementById("step1-section").style.display = "none";
    document.getElementById("step2-section").style.display = "block";
}

function goToStep1() {
    document.getElementById("step1-section").style.display = "block";
    document.getElementById("step2-section").style.display = "none";
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

// 매물 평가 실행 및 저장
function analyzeProperty() {
    const name = document.getElementById("prop-name").value.trim();
    if (!name) return alert("매물 이름을 입력하세요.");

    let totalScore = 0;
    let maxPossibleScore = 0;

    criteria.forEach(c => {
        const weight = Number(document.getElementById(`w-${c.id}`).value) || 0;
        const score = Number(document.getElementById(`p-${c.id}`).value) || 0;

        totalScore += weight * score;
        maxPossibleScore += weight * 5; // 항목당 가중치 * 만점(5점)
    });

    // 100점 만점 기준으로 환산 (선택사항, 스케일 통일용)
    const finalScore = ((totalScore / maxPossibleScore) * 100).toFixed(1);

    // 리스트 저장 및 정렬
    propertyList.push({ name, score: Number(finalScore) });
    propertyList.sort((a, b) => b.score - a.score);

    updateRankingTable();
}

// 테이블 갱신
function updateRankingTable() {
    const body = document.getElementById("ranking-body");
    body.innerHTML = "";

    propertyList.forEach((prop, index) => {
        body.innerHTML += `
            <tr>
                <td>${index + 1}위</td>
                <td><b>${prop.name}</b></td>
                <td><span class="score-tag">${prop.score}점</span></td>
            </tr>`;
    });

    document.getElementById("result-section").style.display = "block";
}