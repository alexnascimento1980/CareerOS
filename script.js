let expCount = 0;

// 1. Função para injetar dinamicamente campos de Experiência no HTML
function adicionarExperiencia() {
  const container = document.getElementById("experiencias-container");
  const html = `
        <div class="card mb-3 exp-block shadow-sm" id="exp-${expCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-secondary">Nova Experiência</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('exp-${expCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6">
                        <label class="form-label">Empresa</label>
                        <input type="text" class="form-control exp-company" placeholder="Ex: DHL Supply Chain" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Cargo</label>
                        <input type="text" class="form-control exp-position" placeholder="Ex: Assistente de Transporte" required>
                    </div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6">
                        <label class="form-label">Data Início</label>
                        <input type="text" class="form-control exp-start" placeholder="Ex: 05/2019" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Data Fim</label>
                        <input type="text" class="form-control exp-end" placeholder="Ex: 09/2024" required>
                    </div>
                </div>
                <div class="mb-2">
                    <label class="form-label">Atividades (separe cada atividade por ponto e vírgula ";")</label>
                    <textarea class="form-control exp-highlights" rows="3" placeholder="Ex: Monitoramento de métricas; Gestão de dados operacionais;" required></textarea>
                </div>
            </div>
        </div>
    `;
  container.insertAdjacentHTML("beforeend", html);
  expCount++;
}

// 2. Função para remover um bloco específico de experiência
function removerElemento(id) {
  document.getElementById(id).remove();
}

// 3. Função para fazer o varrimento da interface e recolher as experiências inseridas
function coletarExperiencias() {
  const experiencias = [];
  const blocos = document.querySelectorAll(".exp-block");

  blocos.forEach((bloco) => {
    const textoHighlights = bloco.querySelector(".exp-highlights").value;
    // Divide o texto do textarea gerando um array limpo de atividades
    const arrayHighlights = textoHighlights
      .split(";")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    experiencias.push({
      company: bloco.querySelector(".exp-company").value,
      position_pt: bloco.querySelector(".exp-position").value,
      position_en: bloco.querySelector(".exp-position").value, // Espelho temporário
      startDate: bloco.querySelector(".exp-start").value,
      endDate: bloco.querySelector(".exp-end").value,
      highlights_pt: arrayHighlights,
      highlights_en: arrayHighlights, // Espelho temporário
    });
  });

  return experiencias;
}

// Garante que o formulário comece com pelo menos um bloco de experiência visível
window.onload = function () {
  adicionarExperiencia();
};

// 4. Interceção do Submit do formulário e comunicação com a API Backend
document
  .getElementById("cv-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Impede o recarregamento da página

    const btnGerar = document.getElementById("btn-gerar");
    btnGerar.textContent = "Gerando PDF...";
    btnGerar.disabled = true;

    // Recolhe a lista dinâmica de experiências
    const listaExperiencias = coletarExperiencias();

    // Montagem do payload completo exigido pelo validador do app.py
    const payload = {
      lang: "pt",
      basics: {
        name: document.getElementById("name").value,
        label_pt: document.getElementById("label_pt").value,
        label_en: document.getElementById("label_pt").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        location: document.getElementById("location").value,
        linkedin: document.getElementById("linkedin").value,
        github: document.getElementById("github").value,
      },
      summary: {
        pt: [
          "Profissional de logística integrando competências de Ciência de Dados para a otimização de fluxos operacionais e automação de processos.",
        ],
        en: [
          "Logistics professional integrating Data Science skills to optimize operational workflows and process automation.",
        ],
      },
      experience: listaExperiencias,
      education: [
        {
          institution: "UNIVESP",
          startDate: "2024",
          endDate: "Presente",
          area_pt: "Bacharel em Ciência de Dados",
          area_en: "Bachelor's in Data Science",
          status_pt: "6º semestre",
          status_en: "6th semester",
        },
      ],
      skills: { technical: ["Python", "SQL", "Power BI"], languages: [] },
      projects: [],
    };

    try {
      // Envio dos dados via POST para o servidor Flask
      const response = await fetch("http://localhost:5000/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const erro = await response.json();
        alert("Erro ao gerar: " + erro.erro);
        throw new Error("Erro na requisição obtida do servidor.");
      }

      // Processamento do retorno binário (Blob) para despoletar o download do PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "meu_curriculo.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro verificado:", error);
      alert("Ocorreu um erro ao comunicar com o servidor backend.");
    } finally {
      // Restaura o estado original do botão
      btnGerar.textContent = "Gerar Currículo PDF";
      btnGerar.disabled = false;
    }
  });
