let expCount = 0;
let eduCount = 0;
let projCount = 0;

// --- FUNÇÕES DE EXPERIÊNCIA ---
function adicionarExperiencia() {
  const html = `
        <div class="card mb-3 exp-block shadow-sm" id="exp-${expCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-secondary">Nova Experiência</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('exp-${expCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6"><label class="form-label">Empresa</label><input type="text" class="form-control exp-company" required></div>
                    <div class="col-md-6"><label class="form-label">Cargo</label><input type="text" class="form-control exp-position" required></div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6"><label class="form-label">Data Início</label><input type="text" class="form-control exp-start" required></div>
                    <div class="col-md-6"><label class="form-label">Data Fim</label><input type="text" class="form-control exp-end" required></div>
                </div>
                <div class="mb-2">
                    <label class="form-label">Atividades (separe por ponto e vírgula ";")</label>
                    <textarea class="form-control exp-highlights" rows="2" required></textarea>
                </div>
            </div>
        </div>`;
  document
    .getElementById("experiencias-container")
    .insertAdjacentHTML("beforeend", html);
  expCount++;
}

function coletarExperiencias() {
  return Array.from(document.querySelectorAll(".exp-block")).map((bloco) => {
    const atividades = bloco
      .querySelector(".exp-highlights")
      .value.split(";")
      .map((i) => i.trim())
      .filter((i) => i);
    const cargo = bloco.querySelector(".exp-position").value;
    return {
      company: bloco.querySelector(".exp-company").value,
      position_pt: cargo,
      position_en: cargo,
      startDate: bloco.querySelector(".exp-start").value,
      endDate: bloco.querySelector(".exp-end").value,
      highlights_pt: atividades,
      highlights_en: atividades,
    };
  });
}

// --- FUNÇÕES DE FORMAÇÃO ---
function adicionarFormacao() {
  const html = `
        <div class="card mb-3 edu-block shadow-sm" id="edu-${eduCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-secondary">Nova Formação</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('edu-${eduCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6"><label class="form-label">Instituição</label><input type="text" class="form-control edu-institution" required></div>
                    <div class="col-md-6"><label class="form-label">Curso</label><input type="text" class="form-control edu-area" required></div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label">Início</label><input type="text" class="form-control edu-start" required></div>
                    <div class="col-md-4"><label class="form-label">Fim</label><input type="text" class="form-control edu-end" required></div>
                    <div class="col-md-4"><label class="form-label">Status</label><input type="text" class="form-control edu-status" required></div>
                </div>
            </div>
        </div>`;
  document
    .getElementById("formacao-container")
    .insertAdjacentHTML("beforeend", html);
  eduCount++;
}

function coletarFormacoes() {
  return Array.from(document.querySelectorAll(".edu-block")).map((bloco) => {
    const curso = bloco.querySelector(".edu-area").value;
    const status = bloco.querySelector(".edu-status").value;
    return {
      institution: bloco.querySelector(".edu-institution").value,
      area_pt: curso,
      area_en: curso,
      startDate: bloco.querySelector(".edu-start").value,
      endDate: bloco.querySelector(".edu-end").value,
      status_pt: status,
      status_en: status,
    };
  });
}

// --- FUNÇÕES DE PROJETOS ---
function adicionarProjeto() {
  const html = `
        <div class="card mb-3 proj-block shadow-sm" id="proj-${projCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-secondary">Novo Projeto</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('proj-${projCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label">Nome do Projeto</label><input type="text" class="form-control proj-name" placeholder="Ex: API Data Tracker" required></div>
                    <div class="col-md-4"><label class="form-label">Tecnologias</label><input type="text" class="form-control proj-tech" placeholder="Ex: Python, Flask" required></div>
                    <div class="col-md-4"><label class="form-label">Link</label><input type="text" class="form-control proj-link" placeholder="Ex: github.com/..." required></div>
                </div>
                <div class="mb-2">
                    <label class="form-label">Descrição</label>
                    <textarea class="form-control proj-desc" rows="2" required></textarea>
                </div>
            </div>
        </div>`;
  document
    .getElementById("projetos-container")
    .insertAdjacentHTML("beforeend", html);
  projCount++;
}

function coletarProjetos() {
  return Array.from(document.querySelectorAll(".proj-block")).map((bloco) => {
    const desc = bloco.querySelector(".proj-desc").value;
    return {
      name: bloco.querySelector(".proj-name").value,
      technologies: bloco.querySelector(".proj-tech").value,
      link: bloco.querySelector(".proj-link").value,
      description_pt: desc,
      description_en: desc,
    };
  });
}

// --- UTILITÁRIOS ---
function removerElemento(id) {
  document.getElementById(id).remove();
}

window.onload = function () {
  adicionarExperiencia();
  adicionarFormacao();
  adicionarProjeto();
};

// --- SUBMISSÃO ---
document
  .getElementById("cv-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const btnGerar = document.getElementById("btn-gerar");
    btnGerar.textContent = "Gerando PDF...";
    btnGerar.disabled = true;

    // Captura o idioma selecionado
    const idiomaSelecionado = document.getElementById("idioma_escolhido").value;

    const summaryText = document.getElementById("summary").value;
    const skillsArray = document
      .getElementById("skills")
      .value.split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    const payload = {
      lang: idiomaSelecionado, // Injeta o idioma dinamicamente
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
      summary: { pt: [summaryText], en: [summaryText] },
      experience: coletarExperiencias(),
      education: coletarFormacoes(),
      projects: coletarProjetos(),
      skills: { technical: skillsArray, languages: [] },
    };

    try {
      const response = await fetch("http://localhost:5000/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const erro = await response.json();
        alert("Erro ao gerar: " + erro.erro);
        throw new Error("Erro na requisição.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      // O nome do arquivo baixado agora reflete o idioma selecionado
      a.download = `meu_curriculo_${idiomaSelecionado}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      btnGerar.textContent = "Gerar Currículo PDF";
      btnGerar.disabled = false;
    }
  });
