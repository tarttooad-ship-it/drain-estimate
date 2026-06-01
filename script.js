const KRW = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0
});

const steps = [
  {
    id: "place",
    title: "막힌 부위를 선택해주세요",
    hint: "가장 증상이 뚜렷한 위치를 기준으로 선택하면 견적이 더 정확해집니다.",
    options: [
      { label: "세면대", icon: "🧴", price: [50000, 80000] },
      { label: "변기", icon: "🚽", price: [70000, 120000] },
      { label: "싱크대", icon: "🍽", price: [60000, 100000] },
      { label: "욕실 바닥 배수구", icon: "🚿", price: [70000, 120000] },
      { label: "베란다 / 세탁실", icon: "🧺", price: [80000, 140000] },
      { label: "외부 하수구", icon: "🏠", price: [120000, 250000] }
    ]
  },
  {
    id: "symptom",
    title: "현재 증상은 어떤가요?",
    hint: "물이 내려가는 속도와 역류 여부를 기준으로 골라주세요. 이 항목은 견적 금액에 추가되지 않습니다.",
    options: [
      { label: "천천히 내려감", icon: "↓", price: [0, 0] },
      { label: "거의 내려가지 않음", icon: "⏳", price: [0, 0] },
      { label: "물이 역류함", icon: "↟", price: [0, 0] },
      { label: "악취가 심함", icon: "!", price: [0, 0] }
    ]
  },
  {
    id: "work",
    title: "필요해 보이는 작업을 선택해주세요",
    hint: "잘 모르겠다면 가장 기본 작업을 선택해도 됩니다.",
    options: (answers) => {
      const place = answers.place?.label;
      const common = [
        { label: "기본 뚫음 작업", icon: "🛠", price: [0, 0] },
        { label: "내시경 확인 필요", icon: "◎", price: [50000, 120000] }
      ];

      if (place === "세면대") {
        return [
          ...common,
          { label: "세면대 탈거 필요", icon: "▣", price: [30000, 70000] },
          { label: "벽 배관 작업 의심", icon: "↧", price: [70000, 150000] }
        ];
      }

      if (place === "변기") {
        return [
          ...common,
          { label: "변기 탈거 필요", icon: "▤", price: [50000, 100000] },
          { label: "오수관 막힘 의심", icon: "≋", price: [90000, 180000] }
        ];
      }

      if (place === "싱크대") {
        return [
          ...common,
          { label: "싱크대 하부 탈거 필요", icon: "▣", price: [30000, 70000] },
          { label: "기름때 고착 세척", icon: "≋", price: [80000, 180000] }
        ];
      }

      return [
        ...common,
        { label: "배수구 커버 탈거 필요", icon: "▣", price: [20000, 60000] },
        { label: "고압 세척 필요", icon: "≋", price: [100000, 220000] }
      ];
    }
  },
  {
    id: "duration",
    title: "막힘이 발생한 기간은 얼마나 되었나요?",
    hint: "오래된 막힘일수록 배관 안쪽까지 굳어있을 가능성이 있습니다.",
    options: [
      { label: "오늘 처음", icon: "1", price: [0, 0] },
      { label: "2~3일 정도", icon: "3", price: [10000, 20000] },
      { label: "일주일 이상", icon: "7", price: [20000, 50000] },
      { label: "반복적으로 막힘", icon: "∞", price: [40000, 90000] }
    ]
  },
  {
    id: "visit",
    title: "방문 조건을 선택해주세요",
    hint: "방문 상황을 확인하기 위한 항목입니다. 이 항목은 견적 금액에 추가되지 않습니다.",
    options: [
      { label: "일반 시간 / 가까운 지역", icon: "☀", price: [0, 0] },
      { label: "먼 지역 출장", icon: "↗", price: [0, 0] },
      { label: "야간 / 주말", icon: "◐", price: [0, 0] },
      { label: "긴급 출동", icon: "⚡", price: [0, 0] }
    ]
  }
];

const state = {
  currentStep: 0,
  answers: {}
};

const optionGrid = document.querySelector("#optionGrid");
const stepLabel = document.querySelector("#stepLabel");
const questionTitle = document.querySelector("#questionTitle");
const questionHint = document.querySelector("#questionHint");
const summaryList = document.querySelector("#summaryList");
const totalRange = document.querySelector("#totalRange");
const estimateNote = document.querySelector("#estimateNote");
const progressFill = document.querySelector("#progressFill");
const backButton = document.querySelector("#backButton");
const quoteButton = document.querySelector("#quoteButton");
const resetButton = document.querySelector("#resetButton");
const resultView = document.querySelector("#resultView");
const finalTotal = document.querySelector("#finalTotal");
const breakdown = document.querySelector("#breakdown");
const editButton = document.querySelector("#editButton");
const newEstimateButton = document.querySelector("#newEstimateButton");

function formatRange(range) {
  if (range[0] === range[1]) return KRW.format(range[0]);
  return `${KRW.format(range[0])} ~ ${KRW.format(range[1])}`;
}

function hasPrice(range) {
  return range[0] > 0 || range[1] > 0;
}

function formatOptionPrice(range) {
  return hasPrice(range) ? `<span class="option-price">+ ${formatRange(range)}</span>` : "";
}

function formatBreakdownPrice(range) {
  return hasPrice(range) ? formatRange(range) : "추가 없음";
}

function getTotal() {
  return Object.values(state.answers).reduce(
    (total, answer) => [total[0] + answer.price[0], total[1] + answer.price[1]],
    [0, 0]
  );
}

function getStepOptions(step) {
  return typeof step.options === "function" ? step.options(state.answers) : step.options;
}

function renderStep() {
  const step = steps[state.currentStep];
  stepLabel.textContent = `${state.currentStep + 1} / ${steps.length}`;
  questionTitle.textContent = step.title;
  questionHint.textContent = step.hint;
  progressFill.style.width = `${((state.currentStep + 1) / steps.length) * 100}%`;

  optionGrid.innerHTML = "";
  getStepOptions(step).forEach((option) => {
    const isSelected = state.answers[step.id]?.label === option.label;
    const button = document.createElement("button");
    button.className = `option-card${isSelected ? " selected" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span class="option-icon">${option.icon}</span>
      <span class="option-title">${option.label}</span>
      ${formatOptionPrice(option.price)}
    `;
    button.addEventListener("click", () => selectOption(step.id, option));
    optionGrid.appendChild(button);
  });

  backButton.disabled = state.currentStep === 0;
  quoteButton.textContent = state.currentStep === steps.length - 1 ? "견적 확인" : "다음";
  renderSummary();
}

function selectOption(stepId, option) {
  const changed = state.answers[stepId]?.label !== option.label;
  state.answers[stepId] = option;
  if (changed) {
    const selectedIndex = steps.findIndex((step) => step.id === stepId);
    steps.slice(selectedIndex + 1).forEach((step) => {
      delete state.answers[step.id];
    });
  }
  if (state.currentStep < steps.length - 1) {
    state.currentStep += 1;
  }
  renderStep();
}

function renderSummary() {
  const answers = steps
    .filter((step) => state.answers[step.id])
    .map((step) => ({ step, answer: state.answers[step.id] }));

  summaryList.innerHTML = "";
  if (!answers.length) {
    const empty = document.createElement("li");
    empty.textContent = "아직 선택된 항목이 없습니다.";
    summaryList.appendChild(empty);
  } else {
    answers.forEach(({ step, answer }) => {
      const item = document.createElement("li");
      item.innerHTML = `<span>${step.title.replace(" 선택해주세요", "")}</span><strong>${answer.label}</strong>`;
      summaryList.appendChild(item);
    });
  }

  const total = getTotal();
  totalRange.textContent = total[1] > 0 ? formatRange(total) : "0원";
  estimateNote.textContent = answers.length === steps.length
    ? "모든 항목이 반영된 예상 견적입니다."
    : `${steps.length - answers.length}개 항목을 더 선택하면 견적이 완성됩니다.`;
}

function showResult() {
  const missingStep = steps.find((step) => !state.answers[step.id]);
  if (missingStep) {
    state.currentStep = steps.indexOf(missingStep);
    renderStep();
    return;
  }

  const total = getTotal();
  finalTotal.textContent = formatRange(total);
  breakdown.innerHTML = "";

  steps.forEach((step) => {
    const answer = state.answers[step.id];
    const row = document.createElement("div");
    row.className = "breakdown-row";
    row.innerHTML = `
      <span>${answer.label}</span>
      <strong>${formatBreakdownPrice(answer.price)}</strong>
    `;
    breakdown.appendChild(row);
  });

  document.querySelector(".workspace").hidden = true;
  resultView.hidden = false;
}

function resetEstimate() {
  state.currentStep = 0;
  state.answers = {};
  document.querySelector(".workspace").hidden = false;
  resultView.hidden = true;
  renderStep();
}

backButton.addEventListener("click", () => {
  if (state.currentStep > 0) {
    state.currentStep -= 1;
    renderStep();
  }
});

quoteButton.addEventListener("click", () => {
  if (state.currentStep < steps.length - 1) {
    state.currentStep += 1;
    renderStep();
  } else {
    showResult();
  }
});

resetButton.addEventListener("click", resetEstimate);
editButton.addEventListener("click", () => {
  document.querySelector(".workspace").hidden = false;
  resultView.hidden = true;
});
newEstimateButton.addEventListener("click", resetEstimate);

renderStep();
