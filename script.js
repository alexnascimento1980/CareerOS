let expCount = 0;
let eduCount = 0;
let projCount = 0;

// --- FUNÇÕES DE EXPERIÊNCIA BILÍNGUE ---
function adicionarExperiencia() {
  const html = `
        <div class="card mb-3 exp-block shadow-sm border-start border-primary border-3" id="exp-${expCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-primary fw-bold">Experiência Profissional</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('exp-${expCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold">Empresa</label><input type="text" class="form-control exp-company" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Cargo (PT)</label><input type="text" class="form-control exp-position-pt" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Cargo (EN)</label><input type="text" class="form-control exp-position-en" required></div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><label class="form-label fw-bold">Data Início</label><input type="text" class="form-control exp-start" placeholder="MM/AAAA" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">Data Fim</label><input type="text" class="form-control exp-end" placeholder="MM/AAAA ou Pres." required></div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Atividades em Português (separe por ";")</label>
                        <textarea class="form-control exp-highlights-pt" rows="3" required></textarea>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Atividades em Inglês (separe por ";")</label>
                        <textarea class="form-control exp-highlights-en" rows="3" required></textarea>
                    </div>
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
    const hPt = bloco
      .querySelector(".exp-highlights-pt")
      .value.split(";")
      .map((i) => i.trim())
      .filter((i) => i);
    const hEn = bloco
      .querySelector(".exp-highlights-en")
      .value.split(";")
      .map((i) => i.trim())
      .filter((i) => i);
    return {
      company: bloco.querySelector(".exp-company").value,
      position_pt: bloco.querySelector(".exp-position-pt").value,
      position_en: bloco.querySelector(".exp-position-en").value,
      startDate: bloco.querySelector(".exp-start").value,
      endDate: bloco.querySelector(".exp-end").value,
      highlights_pt: hPt,
      highlights_en: hEn,
    };
  });
}

// --- FUNÇÕES DE FORMAÇÃO BILÍNGUE ---
function adicionarFormacao() {
  const html = `
        <div class="card mb-3 edu-block shadow-sm border-start border-info border-3" id="edu-${eduCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-info fw-bold">Formação Acadêmica</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('edu-${eduCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold">Instituição</label><input type="text" class="form-control edu-institution" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Curso (PT)</label><input type="text" class="form-control edu-area-pt" placeholder="Bacharelado em..." required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Curso (EN)</label><input type="text" class="form-control edu-area-en" placeholder="Bachelor's Degree in..." required></div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold">Ano Início</label><input type="text" class="form-control edu-start" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Ano Fim</label><input type="text" class="form-control edu-end" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Status (PT/EN)</label><input type="text" class="form-control edu-status" placeholder="Ex: Cursando / In Progress" required></div>
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
    const cursoPt = bloco.querySelector(".edu-area-pt").value;
    const cursoEn = bloco.querySelector(".edu-area-en").value;
    const status_comum = bloco.querySelector(".edu-status").value;
    return {
      institution: bloco.querySelector(".edu-institution").value,
      area_pt: cursoPt,
      area_en: cursoEn,
      startDate: bloco.querySelector(".edu-start").value,
      endDate: bloco.querySelector(".edu-end").value,
      status_pt: status_comum,
      status_en: status_comum,
    };
  });
}

// --- FUNÇÕES DE PROJETOS BILÍNGUE ---
function adicionarProjeto() {
  const html = `
        <div class="card mb-3 proj-block shadow-sm border-start border-warning border-3" id="proj-${projCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-warning fw-bold">Projeto Técnico</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('proj-${projCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold">Nome do Projeto</label><input type="text" class="form-control proj-name" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Tecnologias</label><input type="text" class="form-control proj-tech" placeholder="Python, Flask" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Link (GitHub)</label><input type="text" class="form-control proj-link" required></div>
                </div>
                <div class="row mt-2">
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Descrição (Português)</label>
                        <textarea class="form-control proj-desc-pt" rows="2" required></textarea>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Descrição (Inglês)</label>
                        <textarea class="form-control proj-desc-en" rows="2" required></textarea>
                    </div>
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
    return {
      name: bloco.querySelector(".proj-name").value,
      technologies: bloco.querySelector(".proj-tech").value,
      link: bloco.querySelector(".proj-link").value,
      description_pt: bloco.querySelector(".proj-desc-pt").value,
      description_en: bloco.querySelector(".proj-desc-en").value,
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

    const idiomaSelecionado = document.getElementById("idioma_escolhido").value;
    const skillsArray = document
      .getElementById("skills")
      .value.split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    const payload = {
      lang: idiomaSelecionado,
      basics: {
        name: document.getElementById("name").value,
        label_pt: document.getElementById("label_pt").value,
        label_en: document.getElementById("label_en").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        location: document.getElementById("location").value,
        linkedin: document.getElementById("linkedin").value,
        github: document.getElementById("github").value,
      },
      summary: {
        pt: [document.getElementById("summary_pt").value],
        en: [document.getElementById("summary_en").value],
      },
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
      a.download = `curriculo_${idiomaSelecionado}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro:", error);
      alert("Ocorreu um erro ao gerar o PDF. Verifique o terminal do Flask.");
    } finally {
      btnGerar.textContent = "Gerar Currículo PDF";
      btnGerar.disabled = false;
    }
  });
