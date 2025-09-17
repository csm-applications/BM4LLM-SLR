 // Função que dispara o envio em sequência
    async function generateAllResponses() {
      const startTime = performance.now(); // ⏱️ Start timer

      const cards = document.querySelectorAll('.card');
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const promptId = `promptText${i}`;
        const textareaId = `outputBox${i}`;

        const textarea = document.getElementById(textareaId);
        textarea.value = `⏳ Gerando resposta para estudo ${i + 1}...`;

        // Aguarda terminar a chamada antes de ir para o próximo
        await sendPromptSequential(promptId, textareaId);
      }

      const endTime = performance.now(); // ⏱️ End timer
      const elapsedMs = endTime - startTime;

      // Converte para minutos e segundos
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      alert(`✅ Todas as respostas foram geradas!\n⏱️ Tempo total: ${minutes}m ${seconds}s`);
    }

    // Versão adaptada do sendPrompt para retornar Promise
    async function sendPromptSequential(promptId, textareaId) {
      const llmhost = document.querySelector("#llmUrlInput");
      const prompt = document.getElementById(promptId).innerText;
      const textarea = document.getElementById(textareaId);
      textarea.value = '';

      try {
        const response = await fetch(llmhost.value, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2',
            messages: [{ role: 'user', content: prompt }],
            stream: true
          })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let resultado = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const linhas = chunk.split('\n').filter(l => l.trim() !== '');

          for (const linha of linhas) {
            try {
              const obj = JSON.parse(linha);
              if (obj.message?.content) {
                resultado += obj.message.content;
                textarea.value = resultado;
              }
            } catch (e) {
              console.warn('Linha inválida:', linha);
            }
          }
        }
        return resultado;
      } catch (erro) {
        console.error('Erro ao chamar LLM:', erro);
        textarea.value = 'Ocorreu um erro.';
        return null;
      }
    }

    // Vincula o botão "Generate Responses from LLM"
    document.addEventListener("DOMContentLoaded", () => {
      $("#header").load("components/header.html");
      loadDataset();

      document.querySelector("#generateBtn")
        .addEventListener("click", generateAllResponses);
    });


    // ============================
    // Utility functions
    // ============================


    function buildCriteriaText(inclusion, exclusion) {
      const inc = inclusion.map((c, i) => `- IC${i + 1}: ${c}`);
      const exc = exclusion.map((c, i) => `- EC${i + 1}: ${c}`);
      return [...inc, ...exc].join("\n");
    }

    function generatePromptWithCriteria(type, study, criteriaText) {
      const title = study.title;
      const abstract = study.abstract;
      const keywords = study.keywords || "";
      const publication = study.journal || study.source || "—";
      const date = study.year || "—";

      switch (type) {
        case "felizardo":
          return templates.felizardo(title, abstract, keywords, publication, date, criteriaText);
        case "huotala":
          return templates.huotala(title, abstract, keywords, publication, date, criteriaText, "");
        case "thode":
          return templates.thode(title, abstract, keywords, publication, date, criteriaText);
        default:
          return "Prompt template not found.";
      }
    }

    function bindSaveEvents() {
      document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cards = document.querySelectorAll('.card');

          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const outputText = card.querySelector('.output-box').value.trim();
            if (!outputText) { alert(`Estudo ${i + 1}: falta colar a resposta do modelo.`); return; }
            selectedStudiesData[i].firstModelDecision = outputText;
          }

          localStorage.setItem('experimentAnswers', JSON.stringify(selectedStudiesData));
          window.location.href = 'review.html';
        });
      });
    }

    // ============================
    // Load JSON studies from localStorage and display them
    // ============================
    const template = "felizardo";
    let selectedStudiesData = [];

    async function loadDataset() {
      try {
        const studiesJSON = localStorage.getItem("uploadedJsonFile");
        if (!studiesJSON) {
          alert("No data found on review settings.");
          window.location.href = "index.html";
          return;
        }

        const studies = JSON.parse(studiesJSON);
        selectedStudiesData = studies;

        // Critérios de inclusão/exclusão
        const savedData = JSON.parse(localStorage.getItem("preferencesData")) || {};
        const inclusionCriteria = savedData.inclusionCriteria || [];
        const exclusionCriteria = savedData.exclusionCriteria || [];
        const criteriaText = buildCriteriaText(inclusionCriteria, exclusionCriteria);

        const container = document.getElementById('cardsContainer');
        container.innerHTML = "";

        studies.forEach((study, idx) => {
          const prompt = generatePromptWithCriteria(template, study, criteriaText);
          const card = document.createElement('div');
          card.className = "card mb-4 w-100";
          card.setAttribute("data-study", JSON.stringify(study));

          const textareaId = `outputBox${idx}`;
          const promptId = `promptText${idx}`;

          card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${idx + 1}. ${study.title || "—"}</h5>
          <p><strong>Authors:</strong> ${study.author || "—"}</p>
          <p><strong>Abstract:</strong> ${study.abstract || "—"}</p>
          <p><strong>Journal/Conference:</strong> ${study.journal || study.source || "—"}</p>
          <p><strong>Year:</strong> ${study.year || "—"}</p>
          <p><strong>DOI:</strong> <a href="${study.doi ? 'https://doi.org/' + study.doi : '#'}" target="_blank">${study.doi || "—"}</a></p>
          <p><strong>URL:</strong> <a href="${study.url || '#'}" target="_blank">${study.url || "—"}</a></p>

          <div class="accordion mb-3" id="promptAccordion${idx}">
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                  data-bs-target="#collapsePrompt${idx}" aria-expanded="false" aria-controls="collapsePrompt${idx}">
                  Show Prompt
                </button>
              </h2>
              <div id="collapsePrompt${idx}" class="accordion-collapse collapse" data-bs-parent="#promptAccordion${idx}">
                <div class="accordion-body">
                  <pre id="${promptId}" class="bg-light p-3 rounded" style="white-space: pre-wrap;">${prompt}</pre>
                  <div class="d-flex gap-2 mt-2">
                    <button class="btn btn-sm btn-primary copy-btn" data-target="${promptId}">Copy</button>
                    <button class="btn btn-sm btn-success" onclick="sendPrompt('${promptId}', '${textareaId}')">Send to Model</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Response from ${savedData.model1 || "the model"}:</label>
            <textarea id="${textareaId}" class="form-control output-box" rows="4" placeholder="Paste the result here..."></textarea>
          </div>
        </div>
      `;

          container.appendChild(card);
        });

        bindSaveEvents();

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }

    async function sendPrompt(promptId, textareaId) {
      const llmhost = document.querySelector("#llmUrlInput");
      const prompt = document.getElementById(promptId).innerText;
      const textarea = document.getElementById(textareaId);

      // Show waiting state
      textarea.value = '⏳ Waiting for response from server...';

      try {
        const response = await fetch(llmhost.value, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2',
            messages: [{ role: 'user', content: prompt }],
            stream: true
          })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let resultado = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const linhas = chunk.split('\n').filter(l => l.trim() !== '');

          for (const linha of linhas) {
            try {
              const obj = JSON.parse(linha);
              if (obj.message?.content) {
                resultado += obj.message.content;
                textarea.value = resultado;
              }
            } catch (e) {
              console.warn('Linha inválida:', linha);
            }
          }
        }
      } catch (erro) {
        console.error('Erro ao chamar Ollama local:', erro);
        textarea.value = '❌ Ocorreu um erro ao chamar o servidor.';
      }
    }
    window.sendPrompt = sendPrompt;

    // ============================
    // Clipboard copy
    // ============================
    document.addEventListener('click', function (event) {
      if (event.target.classList.contains('copy-btn')) {
        const targetId = event.target.getAttribute('data-target');
        const textToCopy = document.getElementById(targetId).innerText;

        navigator.clipboard.writeText(textToCopy).then(() => {
          event.target.innerText = 'Copied!';
          setTimeout(() => { event.target.innerText = 'Copy'; }, 2000);
        }).catch(() => { alert('Failed to copy text.'); });
      }
    });

    // ============================
    // Initial load
    // ============================
    window.addEventListener("DOMContentLoaded", () => {
      $("#header").load("components/header.html");
      loadDataset();
    });
