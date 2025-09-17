    // ============================
    // Load data and generate cards
    // ============================
    let studiesData = [];
    const templateType = 'felizardo';

    function buildCriteriaText(inclusion, exclusion) {
      const inc = inclusion.map((c, i) => `- IC${i + 1}: ${c}`);
      const exc = exclusion.map((c, i) => `- EC${i + 1}: ${c}`);
      return [...inc, ...exc].join("\n");
    }

    function generatePromptWithCriteria(study, criteriaText) {
      const title = study.title || "—";
      const abstract = study.abstract || "—";
      const keywords = study.keywords || "";
      const publication = study.journal || study.source || "—";
      const date = study.year || "—";
      return templates.felizardo(title, abstract, keywords, publication, date, criteriaText);
    }

    function loadStudies() {
      const uploadedData = localStorage.getItem('excludedStudies');
      if (!uploadedData) {
        alert('No study data found. Please upload assets first.');
        window.location.href = 'step4.html';
        return;
      }
      studiesData = JSON.parse(uploadedData);

      const savedData = JSON.parse(localStorage.getItem("preferencesData")) || {};
      const inclusionCriteria = savedData.inclusionCriteria || [];
      const exclusionCriteria = savedData.exclusionCriteria || [];
      const criteriaText = buildCriteriaText(inclusionCriteria, exclusionCriteria);

      const container = document.getElementById('cardsContainer');
      container.innerHTML = '';

      studiesData.forEach((study, idx) => {
        const prompt = generatePromptWithCriteria(study, criteriaText);
        const card = document.createElement('div');
        card.className = 'card mb-4 w-100';
        const textareaId = `outputBox${idx}`;
        const promptId = `promptText${idx}`;

        card.innerHTML = `
          <div class="card-body">
            <h5 class="card-title">${idx + 1}. ${study.title || "—"}</h5>
            <p><strong>Authors:</strong> ${study.author || "—"}</p>
            <p><strong>Abstract:</strong> ${study.abstract || "—"}</p>

            <div class="accordion mb-3" id="promptAccordion${idx}">
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    data-bs-target="#collapsePrompt${idx}" aria-expanded="false">
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
              <label class="form-label">LLM Response:</label>
              <textarea id="${textareaId}" class="form-control output-box" rows="4" placeholder="Response will appear here..."></textarea>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
      bindSaveButton();
    }

    function bindSaveButton() {
      document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cards = document.querySelectorAll('.card');
          for (let i = 0; i < cards.length; i++) {
            const outputText = cards[i].querySelector('.output-box').value.trim();
            if (!outputText) {
              alert(`Study ${i + 1}: missing response.`);
              return;
            }
            studiesData[i].secondModelDecision = outputText;
          }
          localStorage.setItem('excludedStudies', JSON.stringify(studiesData));
          // Redireciona para consensus.html
          window.location.href = 'consensus.html';
        });
      });
    }


    // ============================
    // LLM integration
    // ============================
    async function sendPrompt(promptId, textareaId) {
      const llmhost = document.querySelector("#llmUrlInput").value;
      const prompt = document.getElementById(promptId).innerText;
      const textarea = document.getElementById(textareaId);
      textarea.value = '⏳ Waiting for response...';

      try {
        const response = await fetch(llmhost, {
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
        let result = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.trim() !== '');
          for (const line of lines) {
            try {
              const obj = JSON.parse(line);
              if (obj.message?.content) {
                result += obj.message.content;
                textarea.value = result;
              }
            } catch { }
          }
        }
      } catch (err) {
        console.error(err);
        textarea.value = '❌ Error calling LLM.';
      }
    }

    async function generateAllResponses() {
      const cards = document.querySelectorAll('.card');
      for (let i = 0; i < cards.length; i++) {
        const textareaId = `outputBox${i}`;
        const promptId = `promptText${i}`;
        const textarea = document.getElementById(textareaId);
        textarea.value = `⏳ Generating response for study ${i + 1}...`;
        await sendPrompt(promptId, textareaId);
      }
      alert("All responses generated!");
    }

    document.addEventListener('DOMContentLoaded', () => {
      $("#header").load("components/header.html");
      loadStudies();
      document.getElementById('generateBtn').addEventListener('click', generateAllResponses);
    });

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
        });
      }
    });