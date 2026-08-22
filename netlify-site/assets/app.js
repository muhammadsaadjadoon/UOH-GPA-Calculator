const SCALE = [
  [85, 100, "A", 4.00, "Outstanding"],
  [80, 84.99, "A-", 3.50, "Excellent"],
  [75, 79.99, "B+", 3.00, "Very Good"],
  [70, 74.99, "B", 2.50, "Good"],
  [65, 69.99, "B-", 2.00, "Satisfactory"],
  [60, 64.99, "C+", 1.50, "Adequate"],
  [55, 59.99, "C", 1.00, "Pass"],
  [50, 54.99, "D", 0.50, "Minimum Pass"],
  [0, 49.99, "F", 0.00, "Fail"],
];

const GRADE_COLORS = {
  "A": ["#e8f6ed", "#1b7a48"],
  "A-": ["#e8f6ed", "#1b7a48"],
  "B+": ["#e9f2ff", "#2452b7"],
  "B": ["#e9f2ff", "#2452b7"],
  "B-": ["#e9f2ff", "#2452b7"],
  "C+": ["#fff5df", "#a85b00"],
  "C": ["#fff5df", "#a85b00"],
  "D": ["#fff0f1", "#a72b36"],
  "F": ["#ffe8eb", "#a81826"],
};

let mode = "gpa";
let rowCounter = 0;
let selectedTarget = 3.70;
let toastTimer;
let currentUser = null;
let currentProfile = null;
let pendingAvatarData = "";
let authMode = "login";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function gradeFromMarks(marks) {
  const m = Number(marks);
  if (m >= 85 && m <= 100) return { letter: "A", points: 4.00 };
  if (m >= 80 && m < 85) return { letter: "A-", points: 3.50 + ((m - 80) * 0.10) };
  if (m >= 75 && m < 80) return { letter: "B+", points: 3.00 + ((m - 75) * 0.10) };
  if (m >= 70 && m < 75) return { letter: "B", points: 2.50 + ((m - 70) * 0.10) };
  if (m >= 65 && m < 70) return { letter: "B-", points: 2.00 + ((m - 65) * 0.10) };
  if (m >= 60 && m < 65) return { letter: "C+", points: 1.50 + ((m - 60) * 0.10) };
  if (m >= 55 && m < 60) return { letter: "C", points: 1.00 + ((m - 55) * 0.10) };
  if (m >= 50 && m < 55) return { letter: "D", points: 0.50 + ((m - 50) * 0.10) };
  return { letter: "F", points: 0.00 };
}

function letterFromGpa(gpa) {
  const g = Number(gpa);
  if (g >= 4) return "A";
  if (g >= 3.5) return "A-";
  if (g >= 3) return "B+";
  if (g >= 2.5) return "B";
  if (g >= 2) return "B-";
  if (g >= 1.5) return "C+";
  if (g >= 1) return "C";
  if (g >= .5) return "D";
  return "F";
}

function resultColor(value) {
  if (value >= 3.5) return "#1b7a48";
  if (value >= 2.5) return "#2452ff";
  if (value >= 1.5) return "#ad5a00";
  return "#bd2c37";
}

function professionalMessage(value) {
  if (value >= 3.5) return "Excellent academic performance. Keep the same consistency.";
  if (value >= 3.0) return "Strong performance with a solid academic average.";
  if (value >= 2.5) return "Good progress. A few stronger courses can lift the average further.";
  if (value >= 2.0) return "The average is stable, with room for improvement in upcoming courses.";
  if (value >= 1.0) return "Focus on higher-scoring courses to improve the overall average.";
  return "Review the entered marks and plan improvement for the next courses.";
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function setSection(section) {
  $$(".section").forEach((item) => item.classList.toggle("active", item.id === `section-${section}`));
  $$(".nav-btn").forEach((button) => {
    const active = button.dataset.section === section;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (section === "history") renderHistory();
  if (section === "scale") renderScale();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setMode(nextMode) {
  mode = nextMode;
  $$(".mode-btn").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  $("#resultLabel").textContent = mode === "gpa" ? "Your GPA" : "Your CGPA";
  $("#valueColumnLabel").textContent = mode === "gpa" ? "Marks" : "GPA";
  $("#addEntryBtn").textContent = mode === "gpa" ? "+ Add subject" : "+ Add semester";
  const mobileAddButton = $("#mobileAddEntryBtn");
  if (mobileAddButton) mobileAddButton.textContent = mode === "gpa" ? "+ Add subject" : "+ Add semester";
  $("#calculateBtn").textContent = mode === "gpa" ? "Calculate GPA" : "Calculate CGPA";
  resetResult();
  $("#entryList").innerHTML = "";
  addEntry();
}

function resetResult() {
  const value = $("#resultValue");
  value.textContent = "0.00";
  value.style.color = "#2452ff";
  const grade = $("#resultGrade");
  grade.textContent = "—";
  grade.className = "grade-pill neutral";
  grade.removeAttribute("style");
  $("#resultMessage").textContent = mode === "gpa"
    ? "Add your subjects below, then select Calculate."
    : "Add completed semesters below, then select Calculate.";
  $("#metricCredits").textContent = "0";
  $("#metricQP").textContent = "0.00";
  $("#progressFill").style.width = "0%";
  $("#breakdown").hidden = true;
}

function markCalculatorDirty() {
  const hasResult = !$("#breakdown").hidden || $("#resultValue").textContent !== "0.00";
  if (!hasResult) return;
  resetResult();
  $("#resultMessage").textContent = "Inputs changed. Calculate again to update your result.";
}

function addEntry() {
  const list = $("#entryList");
  if (list.children.length >= 30) {
    showToast("You can add up to 30 entries at a time.");
    return;
  }

  if (list.children.length > 0) markCalculatorDirty();

  rowCounter += 1;
  const row = document.createElement("div");
  row.className = "entry-row";
  row.dataset.row = String(rowCounter);

  const namePlaceholder = mode === "gpa" ? "Subject name" : "Semester name";
  const valuePlaceholder = mode === "gpa" ? "Marks (0–100)" : "GPA (0–4)";
  const valueMax = mode === "gpa" ? "100" : "4";
  const valueStep = mode === "gpa" ? "0.5" : "0.01";
  const creditMax = mode === "gpa" ? "6" : "30";
  const creditMin = mode === "gpa" ? "0.5" : "1";
  const creditStep = mode === "gpa" ? "0.5" : "1";

  row.innerHTML = `
    <label class="entry-field name-field">
      <span class="entry-mobile-label">${mode === "gpa" ? "Subject" : "Semester"}</span>
      <input class="input name-input" type="text" maxlength="80" placeholder="${namePlaceholder}" aria-label="${namePlaceholder}">
    </label>
    <label class="entry-field">
      <span class="entry-mobile-label">${mode === "gpa" ? "Marks" : "GPA"}</span>
      <input class="input value-input" type="number" min="0" max="${valueMax}" step="${valueStep}" inputmode="decimal" placeholder="${valuePlaceholder}" aria-label="${valuePlaceholder}">
    </label>
    <label class="entry-field">
      <span class="entry-mobile-label">Credit hours</span>
      <input class="input credit-input" type="number" min="${creditMin}" max="${creditMax}" step="${creditStep}" inputmode="decimal" placeholder="Credit hrs" aria-label="Credit hours">
    </label>
    <div class="grade-field">
      <span class="entry-mobile-label">Grade</span>
      <div class="live-grade" aria-label="Live grade">—</div>
    </div>
    <button class="remove-btn" type="button" aria-label="Clear this entry" title="Clear this entry">Clear</button>
  `;

  const nameInput = $(".name-input", row);
  const valueInput = $(".value-input", row);
  const creditInput = $(".credit-input", row);

  const handleEdit = (input) => {
    input.classList.remove("invalid");
    markCalculatorDirty();
  };

  nameInput.addEventListener("input", () => markCalculatorDirty());
  valueInput.addEventListener("input", () => {
    handleEdit(valueInput);
    updateLiveGrade(row);
  });
  creditInput.addEventListener("input", () => handleEdit(creditInput));
  $(".remove-btn", row).addEventListener("click", () => clearEntry(row));

  list.appendChild(row);
}

function updateLiveGrade(row) {
  const input = $(".value-input", row);
  const badge = $(".live-grade", row);
  const value = Number(input.value);
  const max = mode === "gpa" ? 100 : 4;

  if (input.value === "" || Number.isNaN(value) || value < 0 || value > max) {
    badge.textContent = "—";
    badge.removeAttribute("style");
    return;
  }

  const letter = mode === "gpa" ? gradeFromMarks(value).letter : letterFromGpa(value);
  const [background, color] = GRADE_COLORS[letter] || ["#edf1f6", "#596579"];
  badge.textContent = letter;
  badge.style.background = background;
  badge.style.color = color;
}

function clearEntry(row) {
  $$(".input", row).forEach((input) => {
    input.value = "";
    input.classList.remove("invalid");
  });

  const badge = $(".live-grade", row);
  badge.textContent = "—";
  badge.removeAttribute("style");
  markCalculatorDirty();

  const firstInput = $(".name-input", row) || $(".value-input", row);
  firstInput?.focus({ preventScroll: true });
}

function clearInvalid() {
  $$(".input.invalid").forEach((input) => input.classList.remove("invalid"));
}

function validateRows() {
  clearInvalid();

  const rows = $$(".entry-row");
  const parsed = [];
  let firstInvalid = null;
  const minCredits = mode === "gpa" ? 0.5 : 1;
  const maxCredits = mode === "gpa" ? 6 : 30;
  const maxValue = mode === "gpa" ? 100 : 4;

  rows.forEach((row, index) => {
    const nameInput = $(".name-input", row);
    const valueInput = $(".value-input", row);
    const creditInput = $(".credit-input", row);

    const nameText = nameInput.value.trim();
    const valueText = valueInput.value.trim();
    const creditText = creditInput.value.trim();

    // Completely empty extra rows are ignored rather than blocking a valid calculation.
    if (!nameText && !valueText && !creditText && rows.length > 1) return;

    const value = Number(valueText);
    const credits = Number(creditText);

    if (
      valueText === "" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > maxValue
    ) {
      valueInput.classList.add("invalid");
      firstInvalid ||= valueInput;
    }

    if (
      creditText === "" ||
      !Number.isFinite(credits) ||
      credits < minCredits ||
      credits > maxCredits
    ) {
      creditInput.classList.add("invalid");
      firstInvalid ||= creditInput;
    }

    parsed.push({
      name: nameText || `${mode === "gpa" ? "Subject" : "Semester"} ${index + 1}`,
      value,
      credits,
    });
  });

  if (!parsed.length) {
    const row = rows[0];
    const valueInput = $(".value-input", row);
    const creditInput = $(".credit-input", row);
    valueInput.classList.add("invalid");
    creditInput.classList.add("invalid");
    firstInvalid = valueInput;
  }

  if (firstInvalid) {
    firstInvalid.focus({ preventScroll: false });
    firstInvalid.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return { valid: !firstInvalid, parsed };
}

function calculate() {
  const { valid, parsed } = validateRows();
  if (!valid) {
    showToast(mode === "gpa" ? "Enter valid marks and credit hours." : "Enter valid GPA and credit hours.");
    return;
  }

  let totalCredits = 0;
  let totalQP = 0;
  let details;

  if (mode === "gpa") {
    details = parsed.map((entry) => {
      const grade = gradeFromMarks(entry.value);
      const qp = grade.points * entry.credits;
      totalCredits += entry.credits;
      totalQP += qp;
      return {
        name: entry.name,
        marks: entry.value,
        credits: entry.credits,
        letter: grade.letter,
        points: Math.round(grade.points * 100) / 100,
        qp: Math.round(qp * 100) / 100,
      };
    });
  } else {
    details = parsed.map((entry) => {
      const qp = entry.value * entry.credits;
      totalCredits += entry.credits;
      totalQP += qp;
      return {
        name: entry.name,
        gpa: entry.value,
        credits: entry.credits,
        letter: letterFromGpa(entry.value),
        qp: Math.round(qp * 100) / 100,
      };
    });
  }

  const value = totalCredits ? Math.round((totalQP / totalCredits) * 100) / 100 : 0;
  const result = {
    type: mode,
    value,
    totalCredits: Math.round(totalCredits * 100) / 100,
    totalQP: Math.round(totalQP * 100) / 100,
    details,
    letter: letterFromGpa(value),
  };

  renderResult(result);
  saveHistory(result);
  showToast(`${mode.toUpperCase()} calculated successfully.`);
}

function renderResult(result) {
  const color = resultColor(result.value);
  $("#resultValue").textContent = result.value.toFixed(2);
  $("#resultValue").style.color = color;

  const pill = $("#resultGrade");
  const [background, foreground] = GRADE_COLORS[result.letter] || ["#eef3ff", "#2452ff"];
  pill.textContent = result.letter;
  pill.className = "grade-pill";
  pill.style.background = background;
  pill.style.color = foreground;

  $("#resultMessage").textContent = professionalMessage(result.value);
  $("#metricCredits").textContent = String(result.totalCredits);
  $("#metricQP").textContent = result.totalQP.toFixed(2);

  const progress = $("#progressFill");
  progress.style.width = `${Math.max(0, Math.min(100, result.value / 4 * 100))}%`;
  progress.style.background = color;

  renderBreakdown(result);
}

function renderBreakdown(result) {
  const table = $("#breakdownTable");
  const bars = $("#performanceBars");

  if (result.type === "gpa") {
    table.innerHTML = `
      <thead><tr><th>Subject</th><th>Marks</th><th>Credits</th><th>Grade</th><th>Points</th><th>Quality points</th></tr></thead>
      <tbody>
        ${result.details.map((item) => `<tr>
          <td>${escapeHtml(item.name)}</td><td>${item.marks}</td><td>${item.credits}</td><td>${item.letter}</td><td>${item.points.toFixed(2)}</td><td>${item.qp.toFixed(2)}</td>
        </tr>`).join("")}
        <tr><td>Total / GPA</td><td>—</td><td>${result.totalCredits}</td><td>${result.letter}</td><td>${result.value.toFixed(2)}</td><td>${result.totalQP.toFixed(2)}</td></tr>
      </tbody>`;

    bars.innerHTML = result.details.map((item) => `
      <div class="performance-row">
        <span title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        <div class="performance-track"><div class="performance-fill" style="width:${Math.max(0, Math.min(100, item.marks))}%;background:${resultColor(item.points)}"></div></div>
        <span class="performance-value">${item.marks}%</span>
      </div>`).join("");
  } else {
    table.innerHTML = `
      <thead><tr><th>Semester</th><th>GPA</th><th>Credits</th><th>Grade</th><th>Quality points</th></tr></thead>
      <tbody>
        ${result.details.map((item) => `<tr>
          <td>${escapeHtml(item.name)}</td><td>${item.gpa.toFixed(2)}</td><td>${item.credits}</td><td>${item.letter}</td><td>${item.qp.toFixed(2)}</td>
        </tr>`).join("")}
        <tr><td>CGPA</td><td>${result.value.toFixed(2)}</td><td>${result.totalCredits}</td><td>${result.letter}</td><td>${result.totalQP.toFixed(2)}</td></tr>
      </tbody>`;

    bars.innerHTML = result.details.map((item) => `
      <div class="performance-row">
        <span title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        <div class="performance-track"><div class="performance-fill" style="width:${Math.max(0, Math.min(100, item.gpa / 4 * 100))}%;background:${resultColor(item.gpa)}"></div></div>
        <span class="performance-value">${item.gpa.toFixed(2)}</span>
      </div>`).join("");
  }

  $("#breakdown").hidden = false;
}

function clearCalculator() {
  $("#entryList").innerHTML = "";
  addEntry();
  resetResult();
  showToast("Calculator cleared.");
}

function renderScale() {
  $("#scaleGrid").innerHTML = SCALE.map(([min, max, letter, points, note]) => {
    const [background, color] = GRADE_COLORS[letter] || ["#eef3ff", "#2452ff"];
    const range = max === 100 ? `${min}–100%` : `${min}–${Math.floor(max)}%`;
    return `<article class="scale-card" style="--grade-bg:${background};--grade-color:${color}">
      <div class="scale-grade-badge">
        <strong>${letter}</strong>
      </div>
      <div class="scale-info">
        <div class="scale-points-line">
          <span>Grade Points</span>
          <strong>${points.toFixed(2)}</strong>
        </div>
        <div class="scale-range">${range}</div>
        <div class="scale-note">${note}</div>
      </div>
      <div class="scale-card-glow" aria-hidden="true"></div>
    </article>`;
  }).join("");
}

function updateConverter() {
  const input = $("#marksConverter");
  const result = $("#converterResult");
  const value = Number(input.value);
  const invalid = input.value !== "" && (!Number.isFinite(value) || value < 0 || value > 100);

  input.classList.toggle("invalid", invalid);

  if (input.value === "" || invalid) {
    result.textContent = "—";
    result.removeAttribute("style");
    return;
  }

  const grade = gradeFromMarks(value);
  const [background, color] = GRADE_COLORS[grade.letter] || ["#eef3ff", "#2452ff"];
  result.textContent = `${grade.letter} · ${grade.points.toFixed(2)}`;
  result.style.background = background;
  result.style.color = color;
}


async function saveHistory(result) {
  if (!currentUser) return;

  const item = {
    type: result.type,
    value: result.value,
    totalCredits: result.totalCredits,
    totalQP: result.totalQP,
    count: result.details.length,
    letter: result.letter,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error();
  } catch {
    showToast("Result calculated, but account history could not be updated.");
  }
}

async function getHistoryItems() {
  if (!currentUser) return [];

  try {
    const response = await fetch("/api/history", {
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    showToast("Could not load account history.");
    return [];
  }
}

async function renderHistory() {
  const history = await getHistoryItems();
  const container = $("#historyContent");
  const description = $("#historyDescription");

  if (description) {
    description.textContent = currentUser
      ? "Your calculation history is securely linked to your account."
      : "Sign in to save and review calculation history. Guest calculations remain fully available.";
  }

  if (!currentUser) {
    container.innerHTML = `<div class="history-empty">
      <strong>Sign in to use account history</strong>
      <span>Your calculator remains fully available in Guest Mode. Create an account only when you want results saved to your profile.</span>
    </div>`;
    return;
  }

  if (!history.length) {
    container.innerHTML = `<div class="history-empty">
      <strong>No saved calculations yet</strong>
      <span>Your account results will appear here after you calculate a GPA or CGPA.</span>
    </div>`;
    return;
  }

  container.innerHTML = `<div class="history-list">${history.map((item) => {
    const label = item.type === "gpa" ? "GPA" : "CGPA";
    const countLabel = item.type === "gpa" ? "subjects" : "semesters";
    const time = new Date(item.timestamp);
    return `<article class="history-item">
      <div class="history-score" style="color:${resultColor(item.value)}">${Number(item.value).toFixed(2)}</div>
      <div class="history-main">
        <strong>${label} · ${escapeHtml(item.letter)}</strong>
        <p>${item.count} ${countLabel} · ${item.totalCredits} credits · ${Number(item.totalQP).toFixed(2)} quality points</p>
      </div>
      <div class="history-side">
        <time>${time.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time>
        <button type="button" data-history-delete="${item.id}">Remove</button>
      </div>
    </article>`;
  }).join("")}</div>`;

  $$('[data-history-delete]').forEach((button) => {
    button.addEventListener("click", () => deleteHistoryItem(button.dataset.historyDelete));
  });
}

async function deleteHistoryItem(key) {
  if (!currentUser) return;

  try {
    const response = await fetch(`/api/history/${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error();
  } catch {
    showToast("Could not update account history.");
  }

  renderHistory();
}

async function clearHistory() {
  if (!currentUser) {
    showToast("Sign in to manage saved history.");
    return;
  }

  try {
    const response = await fetch("/api/history", { method: "DELETE" });
    if (!response.ok) throw new Error();
  } catch {
    showToast("Could not clear account history.");
    return;
  }

  renderHistory();
  showToast("Account history cleared.");
}

function runSimulator() {
  const current = Number($("#simCurrent").value || 0);
  const completed = Number($("#simCompleted").value || 0);
  const upcoming = Number($("#simUpcoming").value);
  const target = Number($("#simTarget").value);

  const fields = [
    ["#simCurrent", Number.isFinite(current) && current >= 0 && current <= 4],
    ["#simCompleted", Number.isFinite(completed) && completed >= 0],
    ["#simUpcoming", Number.isFinite(upcoming) && upcoming > 0],
    ["#simTarget", Number.isFinite(target) && target >= 0 && target <= 4],
  ];

  fields.forEach(([selector, valid]) => $(selector).classList.toggle("invalid", !valid));
  const invalidField = fields.find(([, valid]) => !valid);

  if (invalidField) {
    $(invalidField[0]).focus();
    showToast("Check the highlighted planning field and try again.");
    return;
  }

  const totalCredits = completed + upcoming;
  const required = ((target * totalCredits) - (current * completed)) / upcoming;
  const result = $("#simResult");
  let status;

  if (required <= 0) status = "Your target is already met based on the values entered.";
  else if (required > 4) status = "This target cannot be reached in one semester with a 4.00 maximum GPA.";
  else if (required >= 3.5) status = "This is an ambitious target and will require a very strong semester.";
  else status = "This target is mathematically achievable with the required semester GPA shown below.";

  result.innerHTML = `
    <h3>Planning result</h3>
    <div class="planner-result-grid">
      <div class="planner-metric"><span>Current CGPA</span><strong>${current.toFixed(2)}</strong></div>
      <div class="planner-metric"><span>Target CGPA</span><strong>${target.toFixed(2)}</strong></div>
      <div class="planner-metric"><span>Required GPA</span><strong>${required <= 0 ? "Already met" : required > 4 ? "> 4.00" : required.toFixed(2)}</strong></div>
    </div>
    <p class="result-note">${status}</p>`;
  result.hidden = false;
}

function selectTarget(button) {
  $$(".target-card").forEach((card) => card.classList.toggle("selected", card === button));
  selectedTarget = Number(button.dataset.target);
  if ($("#targetSubjects").value) buildTargetInputs();
}

function buildTargetInputs() {
  const count = Number.parseInt($("#targetSubjects").value, 10);
  const container = $("#targetInputs");
  $("#targetResult").hidden = true;
  if (!count || count < 1 || count > 12) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = Array.from({ length: count }, (_, index) => `
    <label class="target-input"><span>Subject ${index + 1} credit hours</span><input class="input target-credit" type="number" min="0.5" max="6" step="0.5" placeholder="e.g. 3"></label>
  `).join("");
}

function minimumMarksForGpa(target) {
  for (let marks = 0; marks <= 100; marks += 0.5) {
    if (gradeFromMarks(marks).points >= target) return marks;
  }
  return 100;
}

function calculateTarget() {
  const inputs = $$(".target-credit");
  if (!inputs.length) {
    showToast("Choose the number of subjects first.");
    return;
  }

  const credits = inputs.map((input) => Number(input.value));
  inputs.forEach((input, index) => {
    const valid = Number.isFinite(credits[index]) && credits[index] >= 0.5 && credits[index] <= 6;
    input.classList.toggle("invalid", !valid);
  });

  const invalidInput = inputs.find((input) => input.classList.contains("invalid"));
  if (invalidInput) {
    invalidInput.focus();
    showToast("Enter 0.5 to 6 credit hours for every subject.");
    return;
  }

  const totalCredits = credits.reduce((sum, value) => sum + value, 0);
  const minimumMarks = minimumMarksForGpa(selectedTarget);
  const grade = gradeFromMarks(minimumMarks);
  const result = $("#targetResult");

  result.innerHTML = `
    <h3>Target estimate</h3>
    <div class="planner-result-grid">
      <div class="planner-metric"><span>Target GPA</span><strong>${selectedTarget.toFixed(2)}</strong></div>
      <div class="planner-metric"><span>Total credits</span><strong>${totalCredits}</strong></div>
      <div class="planner-metric"><span>Approx. minimum</span><strong>${minimumMarks.toFixed(minimumMarks % 1 ? 1 : 0)}%+</strong></div>
    </div>
    <p class="result-note">A score around <strong>${minimumMarks.toFixed(minimumMarks % 1 ? 1 : 0)}% or higher</strong> in each subject corresponds to approximately <strong>${grade.letter} / ${grade.points.toFixed(2)}</strong> grade points under this calculator's scale. Actual weighted results can vary when subject marks differ.</p>`;
  result.hidden = false;
}


function userInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

function setProfileAvatar(element, avatarData, fallbackName) {
  if (!element) return;

  if (avatarData) {
    element.innerHTML = `<img src="${avatarData}" alt="">`;
    return;
  }

  element.textContent = userInitials(fallbackName);
}

function renderAuthState() {
  const button = $("#accountButton");
  const avatar = $("#accountAvatar");
  const title = $("#accountButtonTitle");
  const subtitle = $("#accountButtonSubtitle");
  const prompt = $("#guestPrompt");
  const hint = $("#profileClickHint");

  button.setAttribute("aria-expanded", "false");

  if (currentUser) {
    button.classList.remove("guest");
    button.classList.add("authenticated");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("title", "Open your profile");
    setProfileAvatar(avatar, currentProfile?.avatar_data, currentUser.full_name);
    title.textContent = currentUser.full_name;
    subtitle.textContent = currentUser.email;
    prompt.hidden = true;
    hint.hidden = false;
  } else {
    button.classList.add("guest");
    button.classList.remove("authenticated");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("title", "Sign in or create an account");
    avatar.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"/></svg>`;
    title.textContent = "Sign in";
    subtitle.textContent = "Optional account";
    prompt.hidden = false;
    hint.hidden = true;
  }

  if ($("#section-history").classList.contains("active")) renderHistory();
}

async function refreshProfileData() {
  if (!currentUser) {
    currentProfile = null;
    return null;
  }

  try {
    const response = await fetch("/api/profile", {
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    currentProfile = data.profile || {};
    if (data.user) currentUser = { ...currentUser, ...data.user };
    return currentProfile;
  } catch {
    currentProfile = null;
    return null;
  }
}

async function refreshAuthState() {
  try {
    const response = await fetch("/api/auth/me", {
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) throw new Error();

    const data = await response.json();
    currentUser = data.authenticated ? data.user : null;

    if (currentUser) await refreshProfileData();
    else currentProfile = null;
  } catch {
    currentUser = null;
    currentProfile = null;
  }

  renderAuthState();
}

function setAuthMode(modeName) {
  authMode = modeName === "register" ? "register" : "login";
  $$(".auth-mode-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === authMode);
  });

  const register = authMode === "register";
  $("#authNameField").hidden = !register;
  $("#authName").required = register;
  $("#authTitle").textContent = register ? "Create your account" : "Welcome back";
  $("#authIntro").textContent = register
    ? "Create an optional profile to keep calculation history with your account."
    : "Sign in to continue with your personal academic history.";
  $("#authSubmitText").textContent = register ? "Create account" : "Sign in";
  $("#authPassword").autocomplete = register ? "new-password" : "current-password";
  $("#authMessage").hidden = true;
  $("#authMessage").textContent = "";
}

function openAuth(modeName = "login") {
  setAuthMode(modeName);
  $("#authPassword").value = "";
  const dialog = $("#authDialog");
  if (!dialog.open) dialog.showModal();

  setTimeout(() => {
    const field = authMode === "register" ? $("#authName") : $("#authEmail");
    field?.focus({ preventScroll: true });
  }, 80);
}

function closeAuth() {
  const dialog = $("#authDialog");
  if (dialog.open) dialog.close();
}

async function submitAuth(event) {
  event.preventDefault();

  const fullName = $("#authName").value.trim();
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const message = $("#authMessage");
  const submit = $("#authSubmitButton");

  if (authMode === "register" && fullName.length < 2) {
    message.textContent = "Enter your full name.";
    message.hidden = false;
    $("#authName").focus();
    return;
  }

  if (!email || !$("#authEmail").checkValidity()) {
    message.textContent = "Enter a valid email address.";
    message.hidden = false;
    $("#authEmail").focus();
    return;
  }

  if (!password) {
    message.textContent = "Enter your password.";
    message.hidden = false;
    $("#authPassword").focus();
    return;
  }

  if (authMode === "register" && password.length < 6) {
    message.textContent = "Password must be at least 6 characters.";
    message.hidden = false;
    $("#authPassword").focus();
    return;
  }

  submit.disabled = true;
  message.hidden = true;

  try {
    const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const payload = authMode === "register"
      ? { full_name: fullName, email, password }
      : { email, password };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error || "Could not complete your request.";
      message.hidden = false;
      return;
    }

    currentUser = data.user;
    await refreshProfileData();
    closeAuth();
    renderAuthState();
    $("#authPassword").value = "";
    showToast(authMode === "register" ? "Account created. You're signed in." : "Signed in successfully.");
  } catch {
    message.textContent = "Could not reach the server. Try again.";
    message.hidden = false;
  } finally {
    submit.disabled = false;
  }
}

function formatJoinedDate(value) {
  if (!value) return "Account profile";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Account profile";

  return `Member since ${date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
  })}`;
}

function renderProfilePhotoPreview() {
  const preview = $("#profilePhotoPreview");
  setProfileAvatar(preview, pendingAvatarData, $("#profileFullName").value || currentUser?.full_name || "Student");
  $("#profilePhotoRemove").hidden = !pendingAvatarData;
}

function populateProfileForm() {
  if (!currentUser) return;

  const profile = currentProfile || {};

  $("#profileFullName").value = currentUser.full_name || "";
  $("#profileEmail").value = currentUser.email || "";
  $("#profileStudentId").value = profile.student_id || "";
  $("#profileProgram").value = profile.program || "";
  $("#profileSemester").value = profile.semester ?? "";
  $("#profileTargetCgpa").value = profile.target_cgpa ?? "";
  $("#profileBio").value = profile.bio || "";
  $("#profileBioCount").textContent = String($("#profileBio").value.length);

  pendingAvatarData = profile.avatar_data || "";
  renderProfilePhotoPreview();

  $("#profileSummaryName").textContent = currentUser.full_name || "Student";
  $("#profileSummaryEmail").textContent = currentUser.email || "";
  $("#profileJoined").textContent = formatJoinedDate(currentUser.created_at);

  const message = $("#profileMessage");
  message.hidden = true;
  message.classList.remove("success");
  message.textContent = "";

  $$(".profile-field input.invalid, .profile-field textarea.invalid").forEach((field) => {
    field.classList.remove("invalid");
  });
}

async function openProfile() {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  const dialog = $("#profileDialog");
  populateProfileForm();

  if (!dialog.open) dialog.showModal();

  // Refresh once after opening so profile changes from another session/device are reflected.
  const latest = await refreshProfileData();
  if (latest && dialog.open) populateProfileForm();
}

function closeProfile() {
  const dialog = $("#profileDialog");
  if (dialog.open) dialog.close();
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process image."));
    image.src = source;
  });
}

async function prepareProfilePhoto(file) {
  if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Choose a PNG, JPG, or WebP image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile photo must be 5 MB or smaller.");
  }

  const source = await readImageFile(file);
  const image = await loadImage(source);

  const encode = (maxSide, quality) => {
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not process image.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
  };

  let data = encode(512, 0.82);
  if (data.length > 450000) data = encode(420, 0.76);
  if (data.length > 450000) data = encode(340, 0.70);

  if (data.length > 450000) {
    throw new Error("Please choose a smaller profile photo.");
  }

  return data;
}

async function handleProfilePhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const message = $("#profileMessage");
  message.hidden = true;

  try {
    pendingAvatarData = await prepareProfilePhoto(file);
    renderProfilePhotoPreview();
  } catch (error) {
    message.textContent = error.message || "Could not process that image.";
    message.classList.remove("success");
    message.hidden = false;
  } finally {
    event.target.value = "";
  }
}

function validateProfileForm() {
  const fullName = $("#profileFullName").value.trim();
  const semesterText = $("#profileSemester").value.trim();
  const targetText = $("#profileTargetCgpa").value.trim();

  let firstInvalid = null;

  const markInvalid = (field, invalid) => {
    field.classList.toggle("invalid", invalid);
    if (invalid && !firstInvalid) firstInvalid = field;
  };

  markInvalid($("#profileFullName"), fullName.length < 2 || fullName.length > 70);

  if (semesterText) {
    const semester = Number(semesterText);
    markInvalid($("#profileSemester"), !Number.isInteger(semester) || semester < 1 || semester > 16);
  } else {
    markInvalid($("#profileSemester"), false);
  }

  if (targetText) {
    const target = Number(targetText);
    markInvalid($("#profileTargetCgpa"), !Number.isFinite(target) || target < 0 || target > 4);
  } else {
    markInvalid($("#profileTargetCgpa"), false);
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return null;
  }

  return {
    full_name: fullName,
    student_id: $("#profileStudentId").value.trim(),
    program: $("#profileProgram").value.trim(),
    semester: semesterText ? Number(semesterText) : null,
    target_cgpa: targetText ? Number(targetText) : null,
    bio: $("#profileBio").value.trim(),
    avatar_data: pendingAvatarData,
  };
}

async function saveProfile(event) {
  event.preventDefault();

  const payload = validateProfileForm();
  const message = $("#profileMessage");
  const button = $("#profileSaveButton");

  if (!payload) {
    message.textContent = "Check the highlighted profile field and try again.";
    message.classList.remove("success");
    message.hidden = false;
    return;
  }

  button.disabled = true;
  message.hidden = true;

  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error || "Could not save your profile.";
      message.classList.remove("success");
      message.hidden = false;
      return;
    }

    currentUser = { ...currentUser, ...data.user };
    currentProfile = data.profile || {};
    pendingAvatarData = currentProfile.avatar_data || "";

    populateProfileForm();
    renderAuthState();

    message.textContent = "Profile updated successfully.";
    message.classList.add("success");
    message.hidden = false;
    showToast("Profile saved.");
  } catch {
    message.textContent = "Could not save your profile. Check your connection and try again.";
    message.classList.remove("success");
    message.hidden = false;
  } finally {
    button.disabled = false;
  }
}

async function logout() {
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error();
  } catch {
    showToast("Could not log out. Check your connection and try again.");
    return;
  }

  closeProfile();
  currentUser = null;
  currentProfile = null;
  pendingAvatarData = "";
  renderAuthState();
  showToast("Logged out. Guest mode is still available.");
}

function bindAuthEvents() {
  $("#accountButton").addEventListener("click", () => {
    if (currentUser) openProfile();
    else openAuth("login");
  });

  $("#guestSignInButton").addEventListener("click", () => openAuth("login"));
  $("#authCloseButton").addEventListener("click", closeAuth);
  $("#authLoginMode").addEventListener("click", () => setAuthMode("login"));
  $("#authRegisterMode").addEventListener("click", () => setAuthMode("register"));
  $("#authForm").addEventListener("submit", submitAuth);

  $("#authPasswordToggle").addEventListener("click", () => {
    const input = $("#authPassword");
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    $("#authPasswordToggle").setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });

  $("#authDialog").addEventListener("click", (event) => {
    if (event.target === $("#authDialog")) closeAuth();
  });

  $("#profileCloseButton").addEventListener("click", closeProfile);
  $("#profileForm").addEventListener("submit", saveProfile);
  $("#profilePhotoInput").addEventListener("change", handleProfilePhoto);
  $("#profilePhotoRemove").addEventListener("click", () => {
    pendingAvatarData = "";
    renderProfilePhotoPreview();
  });
  $("#profileLogoutButton").addEventListener("click", logout);
  $("#profileFullName").addEventListener("input", () => {
    $("#profileFullName").classList.remove("invalid");
    renderProfilePhotoPreview();
    $("#profileSummaryName").textContent = $("#profileFullName").value.trim() || "Student";
  });
  $("#profileSemester").addEventListener("input", () => $("#profileSemester").classList.remove("invalid"));
  $("#profileTargetCgpa").addEventListener("input", () => $("#profileTargetCgpa").classList.remove("invalid"));
  $("#profileBio").addEventListener("input", () => {
    $("#profileBioCount").textContent = String($("#profileBio").value.length);
  });

  $("#profileDialog").addEventListener("click", (event) => {
    if (event.target === $("#profileDialog")) closeProfile();
  });
}

function bindEvents() {
  $$(".nav-btn").forEach((button) => button.addEventListener("click", () => setSection(button.dataset.section)));
  $$(".mode-btn").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  $("#addEntryBtn").addEventListener("click", addEntry);
  const mobileAddButton = $("#mobileAddEntryBtn");
  if (mobileAddButton) mobileAddButton.addEventListener("click", addEntry);
  $("#calculateBtn").addEventListener("click", calculate);
  $("#clearBtn").addEventListener("click", clearCalculator);
  $("#printBtn").addEventListener("click", () => window.print());
  $("#marksConverter").addEventListener("input", updateConverter);
  $("#clearHistoryBtn").addEventListener("click", clearHistory);
  $("#runSimulatorBtn").addEventListener("click", runSimulator);
  ["#simCurrent", "#simCompleted", "#simUpcoming", "#simTarget"].forEach((selector) => {
    $(selector).addEventListener("input", () => $(selector).classList.remove("invalid"));
  });
  $$(".target-card").forEach((button) => button.addEventListener("click", () => selectTarget(button)));
  $("#targetSubjects").addEventListener("input", buildTargetInputs);
  $("#calculateTargetBtn").addEventListener("click", calculateTarget);
}

async function init() {
  bindEvents();
  bindAuthEvents();
  renderScale();
  addEntry();
  await refreshAuthState();
}

document.addEventListener("DOMContentLoaded", init);
