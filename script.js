import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configuração final do seu Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD3pM3np3_mZYWuDcVKGBVJQzsYGWDynu0",
  authDomain: "gui-mecca-metodo-abc.firebaseapp.com",
  projectId: "gui-mecca-metodo-abc",
  storageBucket: "gui-mecca-metodo-abc.firebasestorage.app",
  messagingSenderId: "681459438749",
  appId: "1:681459438749:web:f74d29c5b89095d1bf3074",
  measurementId: "G-CKR88VMG3F",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- LÓGICA DINÂMICA DE CLIENTE ---
const urlParams = new URLSearchParams(window.location.search);
const dashboardId = urlParams.get("cliente");
const loadingOverlay = document.getElementById("loading");

if (!dashboardId) {
  loadingOverlay.innerHTML = `
        <div class="text-center p-4 bg-white rounded-lg shadow-lg">
            <h1 class="text-2xl font-bold text-red-700">ERRO: CLIENTE NÃO ESPECIFICADO</h1>
            <p class="mt-2 text-gray-600">Para usar o dashboard, adicione <strong class="text-gray-800">?cliente=nomedocliente</strong> ao final da URL.</p>
            <p class="mt-4 text-sm text-gray-500">Exemplo: .../dashboard.html?cliente=guilherme-mecca</p>
        </div>
    `;
  throw new Error("ID do cliente não encontrado na URL.");
}

const docRef = doc(db, "h4ck_dashboards", dashboardId);

// --- DOM Elements ---
const dataFields = document.querySelectorAll(".data-field");
const clientNameHeader = document.getElementById("client-name-header");
const strategyModeSelect = document.getElementById("strategyMode");
const addRowBtn = document.getElementById("addRowBtn");
const kpiTableBody = document.getElementById("kpi-table-body");
const clientBioInput = document.getElementById("clientBio");
const clientPersonasInput = document.getElementById("clientPersonas");
const generateContentBtn = document.getElementById("generate-content-btn");
const iaResultArea = document.getElementById("ia-result-area");
const generateSpinner = document.getElementById("generate-spinner");

let kpiData = [];

// --- Data Persistence (Automatic) ---
async function saveData() {
  const dataToSave = { kpiData: kpiData || [] };
  dataFields.forEach((field) => {
    dataToSave[field.id] = field.value;
  });
  try {
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar dados: ", error);
  }
}

function loadData(data) {
  if (data) {
    dataFields.forEach((field) => {
      if (data[field.id]) field.value = data[field.id];
    });
    clientNameHeader.textContent = data.clientName || "-- NOME DO CLIENTE --";
    kpiData = data.kpiData || [];
    renderKpiTable();
    updateCharts();
  }
  loadingOverlay.classList.add("hidden");
}

// --- KPI Table Logic ---
function renderKpiTable() {
  kpiTableBody.innerHTML = "";
  kpiData.forEach((rowData, index) => {
    const row = document.createElement("tr");
    row.className = "border-b border-gray-200";
    row.innerHTML = `
            <td class="p-2"><input type="date" class="text-input text-sm" value="${
              rowData.date || ""
            }" data-index="${index}" data-prop="date"></td>
            <td class="p-2"><input type="number" class="text-input text-sm" value="${
              rowData.followers || ""
            }" placeholder="+/-" data-index="${index}" data-prop="followers"></td>
            <td class="p-2"><input type="text" class="text-input text-sm" value="${
              rowData.engagement || ""
            }" placeholder="X.X%" data-index="${index}" data-prop="engagement"></td>
            <td class="p-2"><input type="number" class="text-input text-sm" value="${
              rowData.clicks || ""
            }" placeholder="Nº" data-index="${index}" data-prop="clicks"></td>
            <td class="p-2 text-center"><button class="text-red-500 hover:text-red-700 remove-row" data-index="${index}">X</button></td>
        `;
    kpiTableBody.appendChild(row);
  });
}

function handleTableUpdate(e) {
  const target = e.target;
  if (target.classList.contains("text-input")) {
    kpiData[target.dataset.index][target.dataset.prop] = target.value;
  } else if (target.classList.contains("remove-row")) {
    kpiData.splice(target.dataset.index, 1);
    renderKpiTable();
  }
  saveData();
}

addRowBtn.addEventListener("click", () => {
  kpiData.push({ date: "", followers: "", engagement: "", clicks: "" });
  renderKpiTable();
  saveData();
});

// --- Chart Logic ---
const volumeCtx = document.getElementById("volumeChart").getContext("2d");
const paretoCtx = document.getElementById("paretoChart").getContext("2d");
let volumeChart, paretoChart;

function updateCharts() {
  const data = strategyModeSelect.value.split(",").map(Number);
  const cumulative = [data[0], data[0] + data[1], 100];

  if (volumeChart) volumeChart.destroy();
  volumeChart = new Chart(volumeCtx, {
    type: "bar",
    data: {
      labels: ["Categoria A", "Categoria B", "Categoria C"],
      datasets: [
        {
          label: "Volume",
          data: data,
          backgroundColor: ["#2ECC71", "#F1C40F", "#3498DB"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: "Distribuição de Conteúdo" },
        legend: { display: false },
      },
    },
  });

  if (paretoChart) paretoChart.destroy();
  paretoChart = new Chart(paretoCtx, {
    type: "bar",
    data: {
      labels: ["Categoria A", "Categoria B", "Categoria C"],
      datasets: [
        {
          type: "bar",
          label: "Volume (%)",
          data: data,
          backgroundColor: ["#2ECC71", "#F1C40F", "#3498DB"],
          yAxisID: "y",
        },
        {
          type: "line",
          label: "Resultado Acum. (%)",
          data: cumulative,
          borderColor: "#1A433A",
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { title: { display: true, text: "Análise de Pareto" } },
      scales: {
        y: { position: "left" },
        y1: { position: "right", grid: { drawOnChartArea: false } },
      },
    },
  });
}

// --- AI Content Studio Logic ---
async function handleGenerateContent() {
  const bio = clientBioInput.value;
  const persona = clientPersonasInput.value;

  if (!persona.trim() || !bio.trim()) {
    alert(
      "Por favor, preencha a BIO e a PERSONA DO FÃ primeiro. Elas são o cérebro da IA."
    );
    return;
  }

  generateContentBtn.disabled = true;
  generateSpinner.classList.remove("hidden");
  iaResultArea.textContent =
    "Gerando conteúdo... A IA está no estúdio criando...";

  const targetAudience = document.getElementById("ia-target-audience").value;
  const funnelStage = document.getElementById("ia-funnel-stage").value;
  const contentType = document.getElementById("ia-content-type").value;
  const format = document.getElementById("ia-format").value;
  const customInstruction = document.getElementById("ia-custom-prompt").value;

  const prompt = `
        Aja como um diretor de criação e estrategista musical sênior para a agência H4CK, especializada em artistas.
        ARTISTA: ${bio}
        PERSONA DO FÃ: ${persona}
        Sua tarefa é gerar 3 ideias de posts para as redes sociais deste artista, com as seguintes especificações:
        - Público-alvo: ${targetAudience}
        - Etapa do Funil: ${funnelStage}
        - Tipo de Conteúdo: ${contentType}
        - Formato: ${format}
        - Instrução Adicional: ${customInstruction || "Nenhuma"}
        Para cada ideia, forneça:
        1.  **Conceito Musical:** Uma descrição curta e direta da ideia, conectada ao universo do artista.
        2.  **Legenda Sugerida:** Um texto para a legenda que gere conexão com os fãs, com hashtags de nicho musical relevantes.
        3.  **Call-to-Action (CTA):** Uma chamada para ação clara (Ex: 'Ouça no Spotify', 'Comente sua parte favorita', 'Garanta seu ingresso').
        Apresente as 3 ideias de forma organizada, prontas para um músico usar.
    `;

  const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
  const apiKey = ""; // Chave da API é injetada pelo ambiente
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content.parts[0].text
    ) {
      iaResultArea.textContent = result.candidates[0].content.parts[0].text;
    } else {
      console.error("Resposta da IA inválida:", result);
      throw new Error(
        result.error?.message || "Resposta da IA inválida ou vazia."
      );
    }
  } catch (error) {
    console.error("Erro ao gerar conteúdo:", error);
    iaResultArea.textContent = `Falha ao gerar ideias: ${error.message}. Verifique o console.`;
  } finally {
    generateContentBtn.disabled = false;
    generateSpinner.classList.add("hidden");
  }
}

// --- Event Listeners & Initialization ---
kpiTableBody.addEventListener("input", handleTableUpdate);
kpiTableBody.addEventListener("click", handleTableUpdate);
dataFields.forEach((field) => field.addEventListener("change", saveData));
strategyModeSelect.addEventListener("change", updateCharts);
generateContentBtn.addEventListener("click", handleGenerateContent);

onSnapshot(
  docRef,
  (doc) => {
    loadData(doc.data());
  },
  (error) => {
    console.error("Erro ao ouvir o documento:", error);
    loadingOverlay.classList.add("hidden");
  }
);
