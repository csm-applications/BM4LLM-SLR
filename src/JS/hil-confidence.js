// Confidence buttons
document.getElementById('btn-low').addEventListener('click', () => {
    localStorage.setItem('hilConfidenceLevel', 'low');
    window.location.href = 'hil-low.html';
});
document.getElementById('btn-high').addEventListener('click', () => {
    localStorage.setItem('hilConfidenceLevel', 'high');
    window.location.href = 'hil-high.html';
});

// ZIP upload
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('uploadZip');
const status = document.getElementById('uploadStatus');
const error = document.getElementById('uploadError');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
    dropzone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); });
});
['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, () => dropzone.classList.add('dragover')));
['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, () => dropzone.classList.remove('dragover')));

dropzone.addEventListener('drop', e => { if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); });
dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

async function handleFile(file) {
    status.style.display = 'none'; error.style.display = 'none'; error.textContent = '';
    if (!file.name.toLowerCase().endsWith('.zip')) return errorMessage('Please upload a valid ZIP file.');

    try {
        const zip = await JSZip.loadAsync(file);
        const files = { 'metadata.json': 'metadata', 'included.json': 'includedStudies', 'excluded.json': 'excludedStudies', 'fullRunStudies.json': 'fullRunStudies' };
        let loaded = 0;

        for (const [fname, key] of Object.entries(files)) {
            if (zip.file(fname)) {
                const content = await zip.file(fname).async('string');
                try { JSON.parse(content); localStorage.setItem(key, content); loaded++; }
                catch { return errorMessage(`${fname} is not valid JSON.`); }
            }
        }
        console.log(localStorage)
        if (loaded > 0) statusMessage(`✅ Loaded ${loaded} file(s) successfully.`);
        else errorMessage('No valid JSON files found in ZIP.');
    } catch (err) { errorMessage('Failed to read ZIP file.'); }
}

function errorMessage(msg) { error.style.display = 'block'; error.textContent = '❌ ' + msg; }
function statusMessage(msg) { status.style.display = 'block'; status.textContent = msg; }