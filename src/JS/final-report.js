const zipZone = document.getElementById("zipDropZone");
const zipInput = document.getElementById("zipInput");
const fileNameDisplay = document.getElementById("fileNameZip");
const errorMsg = document.getElementById("errorMsg");
const tableContainer = document.getElementById("tableContainer");
const tableBody = document.getElementById("tableBody");
const downloadBibBtn = document.getElementById("downloadBibBtn");
const modalContent = document.getElementById("modalContent");

zipZone.addEventListener("click", () => zipInput.click());
zipInput.addEventListener("change", () => { fileNameDisplay.textContent = zipInput.files[0]?.name || ""; processZip(); });
zipZone.addEventListener("dragover", e => { e.preventDefault(); zipZone.classList.add("bg-light"); });
zipZone.addEventListener("dragleave", () => zipZone.classList.remove("bg-light"));
zipZone.addEventListener("drop", e => {
    e.preventDefault();
    zipZone.classList.remove("bg-light");
    if (e.dataTransfer.files.length) {
        zipInput.files = e.dataTransfer.files;
        fileNameDisplay.textContent = zipInput.files[0].name;
        processZip();
    }
});

async function processZip() {
    errorMsg.classList.add("d-none");
    tableContainer.classList.add("d-none");
    tableBody.innerHTML = "";
    downloadBibBtn.disabled = true;

    if (!zipInput.files.length) return;

    try {
        const file = zipInput.files[0];
        const data = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(data);

        const includedJson = await zip.file("included.json")?.async("string").then(JSON.parse) || [];
        const excludedJson = await zip.file("excluded.json")?.async("string").then(JSON.parse) || [];
        const metadataJson = await zip.file("metadata.json")?.async("string").then(JSON.parse) || [];

        if (!includedJson.length && !excludedJson.length) throw new Error("No included.json or excluded.json found");

        const combinedData = [
            ...includedJson.map(item => ({ ...item, decision: "Include" })),
            ...excludedJson.map(item => ({ ...item, decision: "Exclude" }))
        ];

        combinedData.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${item.title || "—"}</td>
            <td class="abstract-cell" title="${item.abstract || ""}">${item.abstract || "—"}</td>
            <td>${item.author || "—"}</td>
            <td>${item.year || "—"}</td>
            <td>${item.decision}</td>
            <td><button class="btn btn-sm btn-info detail-btn" data-index="${index}">Detail</button></td>
          `;
            tableBody.appendChild(tr);
        });

        // Evento para abrir modal com detalhes
        tableBody.addEventListener("click", e => {
            const btn = e.target.closest(".detail-btn");
            if (!btn) return;
            const idx = Number(btn.getAttribute("data-index"));
            const item = combinedData[idx];
            renderModal(item);
            const modalEl = document.getElementById("detailModal");
            const bsModal = new bootstrap.Modal(modalEl);
            bsModal.show();
        });

        tableContainer.classList.remove("d-none");
        window._combinedData = { metadata: metadataJson, data: combinedData };
        downloadBibBtn.disabled = false;

    } catch (err) {
        errorMsg.textContent = err.message || err;
        errorMsg.classList.remove("d-none");
    }
}

// Escape HTML para evitar problemas
function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Parser CSV simples com suporte a aspas
function parseCSVLine(line) {
    const res = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"'; i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === "," && !inQuotes) {
            res.push(cur); cur = "";
        } else {
            cur += ch;
        }
    }
    res.push(cur);
    return res.map(s => s.trim());
}

// Gera tabela HTML
function buildTable(headers, rows) {
    const thead = `<thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>`;
    return `<table class="table table-bordered table-sm">${thead}${tbody}</table>`;
}

// Converte string/array/objeto em tabela
function csvToTable(data) {
    if (data == null || data === "") return "<p class='text-muted'>No data</p>";

    if (typeof data === "string") {
        const s = data.trim();
        if (!s) return "<p class='text-muted'>No data</p>";
        const lines = s.split(/\r?\n/).filter(l => l.trim() !== "");
        if (lines.length === 0) return "<p class='text-muted'>No data</p>";
        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(parseCSVLine);
        return buildTable(headers, rows);
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return "<p class='text-muted'>No data</p>";
        if (data.every(r => Array.isArray(r))) {
            const headers = data[0].map(String);
            const rows = data.slice(1).map(r => r.map(String));
            return buildTable(headers, rows);
        }
        if (data.every(r => typeof r === "object" && r !== null)) {
            const headerSet = data.reduce((acc, obj) => {
                Object.keys(obj).forEach(k => acc.add(k));
                return acc;
            }, new Set());
            const headers = Array.from(headerSet);
            const rows = data.map(obj => headers.map(h => (obj[h] ?? "")));
            return buildTable(headers, rows);
        }
        return `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    }

    if (typeof data === "object") {
        const entries = Object.entries(data);
        const headers = ["Field", "Value"];
        const rows = entries.map(([k, v]) => [String(k), (typeof v === "object" ? JSON.stringify(v) : String(v))]);
        return buildTable(headers, rows);
    }

    return `<pre>${escapeHtml(String(data))}</pre>`;
}

// Renderiza modal
function renderModal(item) {
    modalContent.innerHTML = `
        <h6><strong>${escapeHtml(item.title || "—")}</strong></h6>
        <p><em>${escapeHtml(item.author || "—")}</em>, ${escapeHtml(item.year || "—")}</p>
        <hr>
        <h6>First Model</h6>
        ${csvToTable(item.firstModelDecision)}
        <h6>Second Model</h6>
        ${csvToTable(item.secondModelDecision)}
        <h6>Third Model</h6>
        ${csvToTable(item.thirdModelDecision)}
        <hr>
        <small class="text-muted">Raw ID: ${escapeHtml(item.ID || "")}</small>
      `;
}

function jsonToBib(data) {
    return data.map(item => {
        const entryType = item.ENTRYTYPE || "article";
        const citeKey = item.ID || item.doi?.replace(/[^\w]/g, "_") || "unknown";
        const fields = {
            author: item.author,
            title: item.title,
            journal: item.journal,
            year: item.year,
            volume: item.volume,
            number: item.number,
            pages: item.pages,
            doi: item.doi,
            url: item.url,
            decision: item.decision
        };
        const fieldStrings = Object.entries(fields)
            .filter(([_, v]) => v)
            .map(([k, v]) => `  ${k} = {${v}}`)
            .join(",\n");
        return `@${entryType}{${citeKey},\n${fieldStrings}\n}`;
    }).join("\n\n");
}

downloadBibBtn.addEventListener("click", () => {
    if (!window._combinedData) return;
    const bibText = jsonToBib(window._combinedData.data);
    const blob = new Blob([bibText], { type: "application/x-bibtex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "final_dataset.bib";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});