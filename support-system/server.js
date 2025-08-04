const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const db = new sqlite3.Database('database.sqlite');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Criação das tabelas
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS participants (
            email TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant_email TEXT NOT NULL,
            studies INTEGER,
            expertise TEXT,
            llmUsage TEXT,
            llmTasks TEXT,
            FOREIGN KEY (participant_email) REFERENCES participants(email)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS run (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant_email TEXT NOT NULL,
            theme TEXT NOT NULL,
            prompt TEXT,
            firstmodel TEXT,
            secondmodel TEXT,
            thirdmodel TEXT,
            FOREIGN KEY (participant_email) REFERENCES participants(email)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER NOT NULL,
            true_positives INTEGER,
            true_negatives INTEGER,
            false_positives INTEGER,
            false_negatives INTEGER,
            accuracy REAL,
            recall REAL,
            FOREIGN KEY (run_id) REFERENCES run(id)
        )
    `);
});

// Etapa 1: Questionário
app.post('/questionnaire', (req, res) => {
    const { name, email, studies, expertise, llmUsage, llmTasks } = req.body;

    if (!name || !email) {
        return res.status(400).send('Nome e e-mail são obrigatórios.');
    }

    const tasks = Array.isArray(llmTasks) ? llmTasks.join(', ') : (llmTasks || '');

    db.run(`INSERT OR IGNORE INTO participants (email, name) VALUES (?, ?)`, [email, name], (err) => {
        if (err) return res.status(500).send('Erro ao registrar participante.');

        db.run(`
            INSERT INTO responses (participant_email, studies, expertise, llmUsage, llmTasks)
            VALUES (?, ?, ?, ?, ?)
        `, [email, studies, expertise, llmUsage, tasks], function (err) {
            if (err) {
                console.error('Erro ao salvar resposta:', err.message);
                return res.status(500).send('Erro ao registrar a resposta.');
            }
            res.send('Sucesso... prossiga!');
        });
    });
});

// Criar um novo run
app.post('/start-run', (req, res) => {
    const { email, theme, prompt, firstmodel, secondmodel, thirdmodel } = req.body;

    if (!email || !theme || !prompt || !firstmodel || !secondmodel || !thirdmodel) {
        return res.status(400).send("Todos os campos são obrigatórios.");
    }

    const sql = `
        INSERT INTO run (participant_email, theme, prompt, firstmodel, secondmodel, thirdmodel)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [email, theme, prompt, firstmodel, secondmodel, thirdmodel];

    db.run(sql, params, function (err) {
        if (err) {
            console.error("Erro ao iniciar run:", err.message);
            return res.status(500).send("Erro ao criar execução.");
        }
        res.json({ runId: this.lastID });
    });
});

// Setar prompt
app.post('/set-prompt', (req, res) => {
    const { runId, prompt } = req.body;

    if (!runId || !prompt) return res.status(400).send("ID da run ou prompt ausente.");

    db.run(`UPDATE run SET prompt = ? WHERE id = ?`, [prompt, runId], function (err) {
        if (err) {
            console.error("Erro ao salvar prompt:", err.message);
            return res.status(500).send("Erro ao registrar prompt.");
        }
        res.send("Prompt registrado com sucesso!");
    });
});

// Salvar métricas do run
app.post('/save-results', (req, res) => {
    const { runId, true_positives, true_negatives, false_positives, false_negatives, accuracy, recall } = req.body;

    if (!runId) return res.status(400).send("RunId ausente.");

    db.run(`
        INSERT INTO results (run_id, true_positives, true_negatives, false_positives, false_negatives, accuracy, recall)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [runId, true_positives, true_negatives, false_positives, false_negatives, accuracy, recall],
        function (err) {
            if (err) {
                console.error("Erro ao salvar resultados:", err.message);
                return res.status(500).send("Erro ao salvar resultados.");
            }
            res.send("Resultados registrados.");
        }
    );
});

// Obter tema de um run
app.get('/get-theme/:runId', (req, res) => {
    const runId = req.params.runId;

    db.get(`SELECT theme FROM run WHERE id = ?`, [runId], (err, row) => {
        if (err) return res.status(500).send("Erro ao buscar tema.");
        if (!row) return res.status(404).send("Run não encontrada.");
        res.json({ theme: row.theme });
    });
});

// Obter todos os dados de uma run
app.get('/get-run/:runId', (req, res) => {
    const runId = req.params.runId;

    db.get(`SELECT * FROM run WHERE id = ?`, [runId], (err, row) => {
        if (err) return res.status(500).send("Erro ao buscar run.");
        if (!row) return res.status(404).send("Run não encontrada.");

        res.json({
            theme: row.theme,
            prompt: row.prompt,
            firstmodel: row.firstmodel,
            secondmodel: row.secondmodel,
            thirdmodel: row.thirdmodel
        });
    });
});

// Servir datasets
app.get('/get-dataset/:id', (req, res) => {
    const filePath = path.join(__dirname, 'data', `${req.params.id}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).send('Dataset não encontrado.');
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).send('Erro ao processar JSON.');
        }
    });
});

// Dados para revisão
app.get('/review-data', (req, res) => {
    const query = `
        SELECT 
            l.id,
            r.participant_email,
            r.prompt,
            r.firstmodel,
            r.secondmodel,
            r.thirdmodel,
            r.theme,
            l.study_data,
            l.output
        FROM llmresponse l
        JOIN run r ON r.id = l.run_id
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).send("Erro ao buscar dados.");
        const parsedRows = rows.map(row => {
            let output = {};
            try {
                row.study_data = JSON.parse(row.study_data);
                output = parseCSV(row.output);
            } catch (e) {
                console.error("Erro ao parsear:", e.message);
            }
            return { ...row, output };
        });
        res.json(parsedRows);
    });
});

// Obter todos os runs de um participante
app.get('/runs/:email', (req, res) => {
    const email = req.params.email;
    db.all(`SELECT * FROM run WHERE participant_email = ? ORDER BY id DESC`, [email], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar runs:", err.message);
            return res.status(500).send("Erro ao buscar runs.");
        }
        res.json(rows);
    });
});

// Utilitário para CSV
function parseCSV(csv) {
    const lines = csv.trim().split('\n').slice(1);
    const result = {};
    lines.forEach(line => {
        const [criteria, rate] = line.split(',');
        result[criteria.trim()] = parseInt(rate.trim(), 10);
    });
    return result;
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
