// ============================
// Utility Functions
// ============================

function createInput(value = "", placeholder = "", required = true) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control mb-2";
    input.required = required;
    input.value = value;
    input.placeholder = placeholder;
    return input;
}

function getCriteriaValues(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input`))
        .map(i => i.value.trim())
        .filter(Boolean);
}

function setCriteria(containerId, criteria = [], placeholder = "") {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    criteria.forEach(c => container.appendChild(createInput(c, placeholder)));
}

function toggleFormState(isEnabled) {
    document.querySelectorAll("#selectionForm input, #selectionForm select, #selectionForm textarea, #selectionForm button")
        .forEach(el => {
            if (!el.id.includes("editBtn")) el.disabled = !isEnabled;
        });

    document.getElementById("editBtn").classList.toggle("d-none", isEnabled);
    document.getElementById("saveBtn").classList.toggle("d-none", !isEnabled);
}

function showModal(modalId, bodyContent, isHtml = false) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    const body = document.getElementById(`${modalId}Body`);
    if (isHtml) body.innerHTML = bodyContent;
    else body.innerText = bodyContent;
    modal.show();
}


// ============================
// Criteria Management
// ============================

// Generic function used by both inclusion and exclusion criteria
function addCriteria(containerId) {
    const container = document.getElementById(containerId);
    const placeholder =
        containerId === "inclusionCriteria"
            ? "Inclusion Criterion"
            : "Exclusion Criterion";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control mb-2";
    input.placeholder = placeholder;
    input.required = true;

    container.appendChild(input);
}

// ============================
// Data Handling
// ============================

function collectFormData() {
    return {
        studyTitle: document.getElementById("studyTitle").value,
        studyAbstract: document.getElementById("studyAbstract").value,
        studyKeywords: document.getElementById("studyKeywords").value,
        searchString: document.getElementById("searchString").value,
        inclusionCriteria: getCriteriaValues("inclusionCriteria"),
        exclusionCriteria: getCriteriaValues("exclusionCriteria"),
        prompt: document.querySelector("input[name='prompt']:checked")?.value,
        model1: document.getElementById("model1").value,
        model2: document.getElementById("model2").value,
        model3: document.getElementById("model3").value
    };
}

function saveData(data) {
    localStorage.setItem("preferencesData", JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem("preferencesData");
    return saved ? JSON.parse(saved) : null;
}

// ============================
// Template Generation
// ============================

function buildCriteriaText(inclusion, exclusion) {
    const inc = inclusion.map((c, i) => `- IC${i + 1}: ${c}`);
    const exc = exclusion.map((c, i) => `- EC${i + 1}: ${c}`);
    return [...inc, ...exc].join("\n");
}

function generateTemplate(promptType, data, criteriaText) {
    if (!promptType || !templates[promptType]) return "";

    const dummyData = {
        title: "Dummy Study Title",
        abstract: data.studyAbstract,
        keywords: data.studyKeywords,
        venue: "Dummy Venue",
        date: "2024-01-01",
        criteria: criteriaText
    };

    return templates[promptType](
        dummyData.title,
        dummyData.abstract,
        dummyData.keywords,
        dummyData.venue,
        dummyData.date,
        dummyData.criteria
    );
}

// ============================
// Event Handlers
// ============================

function handleSave() {
    const form = document.getElementById("selectionForm");
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = collectFormData();
    if (data.inclusionCriteria.length < 1 || data.exclusionCriteria.length < 1) {
        showModal("errorModal", "É necessário pelo menos 1 critério de inclusão e 1 de exclusão.");
        return;
    }

    saveData(data);

    const criteriaText = buildCriteriaText(data.inclusionCriteria, data.exclusionCriteria);
    const templateText = generateTemplate(data.prompt, data, criteriaText);

    toggleFormState(false);

    const successMessage = `
        <p>The review data has been successfully stored! You can now start selecting the studies.</p>
        <p>Your prompt will look more or less like the example below. If you want to change the inclusion and exclusion criteria, click in "edit" button and save changes.</p>
        <pre class="bg-light p-2 rounded" style="max-height:300px; overflow:auto;">${templateText}</pre>
      `;
    showModal("saveModal", successMessage, true);
}

function handleEdit() {
    toggleFormState(true);
}

function restoreForm() {
    const data = loadData();
    if (!data) {
        toggleFormState(true);
        return;
    }

    document.getElementById("studyTitle").value = data.studyTitle || "";
    document.getElementById("studyAbstract").value = data.studyAbstract || "";
    document.getElementById("studyKeywords").value = data.studyKeywords || "";
    document.getElementById("searchString").value = data.searchString || "";

    setCriteria("inclusionCriteria", data.inclusionCriteria, "Inclusion Criterion");
    setCriteria("exclusionCriteria", data.exclusionCriteria, "Exclusion Criterion");

    if (data.prompt) {
        const radio = document.querySelector(`input[name='prompt'][value='${data.prompt}']`);
        if (radio) radio.checked = true;
    }

    document.getElementById("model1").value = data.model1 || "";
    document.getElementById("model2").value = data.model2 || "";
    document.getElementById("model3").value = data.model3 || "";

    toggleFormState(false);
}

// ============================
// Initialization
// ============================

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("saveBtn").addEventListener("click", handleSave);
    document.getElementById("editBtn").addEventListener("click", handleEdit);

    // Add initial empty fields if no saved data
    if (!loadData()) {
        setCriteria("inclusionCriteria", [""], "Inclusion Criterion");
        setCriteria("exclusionCriteria", [""], "Exclusion Criterion");
    }

    restoreForm();
});

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("jsonFileInput");
const fileNameDisplay = document.getElementById("fileName");

// Highlight ao arrastar
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("bg-light");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("bg-light");
});

// Drag & Drop
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("bg-light");
    const file = e.dataTransfer.files[0];
    if (!file) return;
    processFile(file);
});

// Input via botão
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file);
});

// -----------------------------
// Funções de tratamento
// -----------------------------
function processFile(file) {
    const name = file.name.toLowerCase();

    if (name.endsWith(".json")) {
        handleJsonFile(file);
    } else if (name.endsWith(".bib")) {
        handleBibFile(file);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        handleExcelFile(file); // Agora cobre ambos
    } else {
        alert("Por favor selecione um arquivo .json, .bib, .xlsx ou .xls válido.");
    }
}

function handleJsonFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const jsonData = JSON.parse(event.target.result);
            saveFile(jsonData, file.name);
        } catch (err) {
            alert("O arquivo selecionado não é um JSON válido.");
        }
    };
    reader.readAsText(file);
}

function handleBibFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const bibText = event.target.result;
            let jsonData = bibToJson(bibText);

            jsonData = jsonData.filter(
                (entry) => entry.ID !== "unknown" && entry.ENTRYTYPE !== "unknown"
            );

            if (jsonData.length === 0) {
                alert("Nenhuma entrada válida encontrada no arquivo .bib.");
                return;
            }

            saveFile(jsonData, file.name + " (convertido de .bib)");
        } catch (err) {
            alert("O arquivo .bib não pôde ser convertido.");
        }
    };
    reader.readAsText(file);
}

function bibToJson(bibText) {
    const entries = bibText.split(/@/).filter(Boolean);
    return entries.map((entry) => {
        const typeMatch = entry.match(/^(\w+){([^,]+),/);
        const type = typeMatch ? typeMatch[1] : "unknown";
        const id = typeMatch ? typeMatch[2] : "unknown";
        const fields = {};
        const fieldRegex = /(\w+)\s*=\s*[{"]([^}"]+)[}"]/g;
        let match;
        while ((match = fieldRegex.exec(entry)) !== null) {
            fields[match[1]] = match[2];
        }
        return { ID: id, ENTRYTYPE: type, ...fields };
    });
}

// Agora trata .xls e .xlsx
function handleExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Converte para JSON (primeira linha = headers)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (jsonData.length === 0) {
                alert("Planilha vazia ou sem dados válidos.");
                return;
            }

            saveFile(jsonData, file.name + " (convertido de Excel)");
        } catch (err) {
            console.error(err);
            alert("O arquivo Excel não pôde ser convertido.");
        }
    };
    reader.readAsArrayBuffer(file);
}

// Salvar no localStorage
function saveFile(jsonData, fileName) {
    localStorage.setItem("uploadedJsonFile", JSON.stringify(jsonData));
    localStorage.setItem("uploadedJsonFileName", fileName);
    fileNameDisplay.textContent = "Arquivo carregado: " + fileName;
}
// Função para criar um input com botão de exclusão
function createCriteriaInput(value = "", placeholder = "") {
    const wrapper = document.createElement("div");
    wrapper.className = "d-flex mb-2 align-items-center";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control me-2";
    input.required = true;
    input.value = value;
    input.placeholder = placeholder;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-outline-danger btn-sm";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.onclick = () => wrapper.remove();

    wrapper.appendChild(input);
    wrapper.appendChild(deleteBtn);

    return wrapper;
}

// Atualiza a função setCriteria para usar createCriteriaInput
function setCriteria(containerId, criteria = [], placeholder = "") {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    criteria.forEach(c => container.appendChild(createCriteriaInput(c, placeholder)));
}

// Atualiza a função addCriteria para usar createCriteriaInput
function addCriteria(containerId) {
    const placeholder =
        containerId === "inclusionCriteria"
            ? "Inclusion Criterion"
            : "Exclusion Criterion";

    const container = document.getElementById(containerId);
    container.appendChild(createCriteriaInput("", placeholder));
}

