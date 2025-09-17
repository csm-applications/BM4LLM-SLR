let allData = [];

    function getConfidenceConfig() {
      const config = {};
      document.querySelectorAll('#confidence-form input[type=number]').forEach(input => {
        config[input.name] = parseInt(input.value, 10);
      });
      return config;
    }

    function getMatchMode() {
      const inclusionMode = document.querySelector('input[name="inclusion-mode"]:checked')?.value || 'all';
      const exclusionMode = document.querySelector('input[name="exclusion-mode"]:checked')?.value || 'all';
      return { inclusionMode, exclusionMode };
    }

    function passesCriteria(output, config) {
      const { inclusionMode, exclusionMode } = getMatchMode();
      const inclusionCriteria = Object.keys(config).filter(k => k.startsWith('IC'));
      const exclusionCriteria = Object.keys(config).filter(k => k.startsWith('EC'));
      const validInclusionCriteria = inclusionCriteria.filter(c => output[c] !== undefined);
      const validExclusionCriteria = exclusionCriteria.filter(c => output[c] !== undefined);

      // Avaliar inclusão
      let inclusionPass = false;
      if (validInclusionCriteria.length === 0) {
        inclusionPass = true;
      } else if (inclusionMode === 'all') {
        inclusionPass = validInclusionCriteria.every(c => output[c] >= config[c]);
      } else if (inclusionMode === 'one') {
        inclusionPass = validInclusionCriteria.some(c => output[c] >= config[c]);
      }

      // Avaliar exclusão
      let exclusionPass = false;
      if (validExclusionCriteria.length === 0) {
        exclusionPass = false;
      } else if (exclusionMode === 'all') {
        exclusionPass = validExclusionCriteria.every(c => output[c] >= config[c]);
      } else if (exclusionMode === 'one') {
        exclusionPass = validExclusionCriteria.some(c => output[c] >= config[c]);
      }

      // --- NOVAS REGRAS ---

      // Regra 1: único critério de inclusão = -1 e nenhum exclusão satisfeito → inclui
      if (
        inclusionCriteria.length === 1 &&
        output[inclusionCriteria[0]] === -1 &&
        !exclusionPass
      ) {
        return true;
      }

      // Regra 2: passou inclusão e único critério de exclusão = -1 → inclui
      if (
        inclusionPass &&
        exclusionCriteria.length === 1 &&
        output[exclusionCriteria[0]] === -1
      ) {
        return true;
      }

      // Regra 3: inclusão = -1 e exclusão fraca → exclui
      if (
        inclusionCriteria.some(c => output[c] === -1) &&
        exclusionCriteria.some(c => output[c] < config[c]) // exclusão fraca
      ) {
        return false;
      }

      // Resultado padrão
      return inclusionPass && !exclusionPass;
    }



    function updateDisplay() {
      const config = getConfidenceConfig();
      const container = document.getElementById('studies');
      container.innerHTML = '';

      let included = 0, excluded = 0;
      const includedStudies = [];
      const excludedStudies = [];

      allData.forEach(study => {
        let decisionObj = {};
        if (typeof study.firstModelDecision === "string") {
          const lines = study.firstModelDecision.trim().split("\n");
          lines.forEach((line, idx) => {
            if (idx === 0) return;
            const [key, value] = line.split(",");
            if (key && value) decisionObj[key.trim()] = parseInt(value.trim(), 10);
          });
        } else {
          decisionObj = study.firstModelDecision || {};
        }

        const isIncluded = passesCriteria(decisionObj, config);
        if (isIncluded) {
          included++;
          includedStudies.push({ ...study, userDecision: "Include" });
        } else {
          excluded++;
          excludedStudies.push(study);
        }

        const card = document.createElement('div');
        card.className = `col-12 card p-4 shadow-sm ${isIncluded ? 'included' : 'excluded'}`;
        card.innerHTML = `
          <h5 class="mb-2"><a href="${study.url}" target="_blank" class="text-decoration-none">${study.title}</a></h5>
          <p class="mb-1"><strong>Authors:</strong> ${study.author || "N/A"}</p>
          <p class="mb-1"><strong>Journal:</strong> ${study.journal || "N/A"} (${study.year || "N/A"})</p>
          <p class="mb-1"><strong>Type:</strong> ${study.type} | <strong>Source:</strong> ${study.source}</p>
          <p class="mb-1"><strong>Volume/Issue:</strong> ${study.volume || ""} (${study.number || ""}), pp. ${study.pages || "N/A"}</p>
          <p class="mb-1"><strong>DOI:</strong> <a href="https://doi.org/${study.doi}" target="_blank">${study.doi}</a></p>
          <p class="mb-2"><strong>Note:</strong> ${study.note || ""}</p>
          <details><summary class="fw-bold">Abstract</summary><p class="mt-2">${study.abstract}</p></details>
          <hr/><p class="small text-muted"><strong>Model Decision:</strong> ${JSON.stringify(decisionObj)}</p>
        `;
        container.appendChild(card);
      });

      document.getElementById('summary').innerText = `Included: ${included} | Excluded: ${excluded}`;

      // Store included/excluded in localStorage
      localStorage.setItem("includedStudies", JSON.stringify(includedStudies));
      localStorage.setItem("excludedStudies", JSON.stringify(excludedStudies));
    }

    function generateDynamicCriteriaFormFromPreferences(preferences) {
      const inclusionContainer = document.getElementById('inclusion-fields');
      const exclusionContainer = document.getElementById('exclusion-fields');

      inclusionContainer.innerHTML = '';
      exclusionContainer.innerHTML = '';

      preferences.inclusionCriteria.forEach((criterion, idx) => {
        const key = `IC${idx + 1}`;
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-control';
        input.name = key;
        input.id = key;
        input.min = 1;
        input.max = 7;
        input.value = 6;

        const label = document.createElement('label');
        label.htmlFor = key;
        label.innerText = criterion;

        inclusionContainer.appendChild(label);
        inclusionContainer.appendChild(input);
      });

      preferences.exclusionCriteria.forEach((criterion, idx) => {
        const key = `EC${idx + 1}`;
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-control';
        input.name = key;
        input.id = key;
        input.min = 1;
        input.max = 7;
        input.value = 6;

        const label = document.createElement('label');
        label.htmlFor = key;
        label.innerText = criterion;

        exclusionContainer.appendChild(label);
        exclusionContainer.appendChild(input);
      });

      document.querySelectorAll('#confidence-form input[type=number]').forEach(input => {
        input.addEventListener('input', updateDisplay);
      });
    }

    document.getElementById('download-btn').addEventListener('click', () => {
      const config = getConfidenceConfig();

      const includedStudies = JSON.parse(localStorage.getItem("includedStudies") || "[]");
      const excludedStudies = JSON.parse(localStorage.getItem("excludedStudies") || "[]");
      const fullRunStudies = JSON.parse(localStorage.getItem("experimentAnswers") || "[]");
      const fullCriteria = JSON.parse(localStorage.getItem("fullCriteria") || "{}");

      // 🔹 Recuperar o objeto extra
      const studyMetadata = JSON.parse(localStorage.getItem("studyMetadata") || "{}");

      const zip = new JSZip();

      // 🔹 Agora incluir tudo no metadata
      const metadata = {
        config,
        fullcriteria: fullCriteria,
        studyInfo: studyMetadata   // <-- objeto que você mostrou
      };

      zip.file("metadata.json", JSON.stringify(metadata, null, 2));
      zip.file("included.json", JSON.stringify(includedStudies, null, 2));
      zip.file("excluded.json", JSON.stringify(excludedStudies, null, 2));
      zip.file("fullRunStudies.json", JSON.stringify(fullRunStudies, null, 2));

      zip.generateAsync({ type: "blob" }).then(content => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = "first_llm_screnning_assets.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      });
    });


    document.querySelectorAll('input[name="inclusion-mode"], input[name="exclusion-mode"]').forEach(radio => {
      radio.addEventListener('change', updateDisplay);
    });

    window.addEventListener('DOMContentLoaded', () => {
      try {
        const raw = localStorage.getItem('experimentAnswers');
        if (!raw) {
          document.getElementById('summary').innerText = "Nenhum dado salvo encontrado.";
          return;
        }

        allData = JSON.parse(raw);

        const prefsRaw = localStorage.getItem("preferencesData");
        if (prefsRaw) {
          const prefs = JSON.parse(prefsRaw);
          generateDynamicCriteriaFormFromPreferences(prefs);
        }

        updateDisplay();
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        document.getElementById('summary').innerText = "Erro ao carregar dados.";
      }
    });