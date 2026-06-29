let expCount = 0;
let eduCount = 0;
let projCount = 0;
let cursoCount = 0;

// --- INJEÇÃO DE HTML ---
function adicionarExperiencia() {
  const html = `
        <div class="card mb-3 exp-block shadow-sm border-start border-primary border-3" id="exp-${expCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-primary fw-bold">Experiência Profissional</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('exp-${expCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6"><label class="form-label fw-bold">Empresa</label><input type="text" class="form-control exp-company" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">Cargo</label><input type="text" class="form-control exp-position-pt" required></div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><label class="form-label fw-bold">Data Início</label><input type="text" class="form-control exp-start" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">Data Fim</label><input type="text" class="form-control exp-end" required></div>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Atividades (separe por ";")</label>
                    <textarea class="form-control exp-highlights-pt" rows="3" required></textarea>
                </div>
            </div>
        </div>`;
  document
    .getElementById("experiencias-container")
    .insertAdjacentHTML("beforeend", html);
  expCount++;
}

function adicionarFormacao() {
  const html = `
        <div class="card mb-3 edu-block shadow-sm border-start border-info border-3" id="edu-${eduCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-info fw-bold">Formação Acadêmica</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('edu-${eduCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6"><label class="form-label fw-bold">Instituição</label><input type="text" class="form-control edu-institution" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">Curso</label><input type="text" class="form-control edu-area-pt" required></div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold">Ano Início</label><input type="text" class="form-control edu-start" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Ano Fim</label><input type="text" class="form-control edu-end" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Status</label><input type="text" class="form-control edu-status" required></div>
                </div>
            </div>
        </div>`;
  document
    .getElementById("formacao-container")
    .insertAdjacentHTML("beforeend", html);
  eduCount++;
}

function adicionarCurso() {
  const html = `
        <div class="card mb-3 curso-block shadow-sm border-start border-success border-3" id="curso-${cursoCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-success fw-bold">Curso Complementar</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('curso-${cursoCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold">Nome do Curso</label><input type="text" class="form-control curso-name" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Instituição</label><input type="text" class="form-control curso-inst" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Ano</label><input type="text" class="form-control curso-year" required></div>
                </div>
            </div>
        </div>`;
  document
    .getElementById("cursos-container")
    .insertAdjacentHTML("beforeend", html);
  cursoCount++;
}

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
                    <div class="col-md-4"><label class="form-label fw-bold">Tecnologias</label><input type="text" class="form-control proj-tech" required></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Link (GitHub)</label><input type="text" class="form-control proj-link" required></div>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Descrição</label>
                    <textarea class="form-control proj-desc-pt" rows="2" required></textarea>
                </div>
            </div>
        </div>`;
  document
    .getElementById("projetos-container")
    .insertAdjacentHTML("beforeend", html);
  projCount++;
}

function removerElemento(id) {
  document.getElementById(id).remove();
}

window.onload = function () {
  adicionarExperiencia();
  adicionarFormacao();
  adicionarCurso();
  adicionarProjeto();
};

// --- SUBMISSÃO ---
document
  .getElementById("cv-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const btnGerar = document.getElementById("btn-gerar");
    const idiomaSelecionado = document.getElementById("idioma_escolhido").value;
    const includeProjects = document.getElementById("include-projects").checked;

    btnGerar.textContent =
      idiomaSelecionado === "en"
        ? "Traduzindo e Gerando PDF..."
        : "Gerando PDF...";
    btnGerar.disabled = true;

    const skillsArray = document
      .getElementById("skills")
      .value.split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    // Coleta as listas
    const projetosColetados = Array.from(
      document.querySelectorAll(".proj-block"),
    ).map((bloco) => ({
      name: bloco.querySelector(".proj-name").value,
      technologies: bloco.querySelector(".proj-tech").value,
      link: bloco.querySelector(".proj-link").value,
      description_pt: bloco.querySelector(".proj-desc-pt").value,
    }));

    const cursosColetados = Array.from(
      document.querySelectorAll(".curso-block"),
    ).map((bloco) => ({
      name_pt: bloco.querySelector(".curso-name").value,
      institution: bloco.querySelector(".curso-inst").value,
      year: bloco.querySelector(".curso-year").value,
    }));

    const payload = {
      lang: idiomaSelecionado,
      basics: {
        name: document.getElementById("name").value,
        label_pt: document.getElementById("label_pt").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        location: document.getElementById("location").value,
        linkedin: document.getElementById("linkedin").value,
        github: document.getElementById("github").value,
      },
      summary: { pt: [document.getElementById("summary_pt").value] },
      experience: Array.from(document.querySelectorAll(".exp-block")).map(
        (bloco) => ({
          company: bloco.querySelector(".exp-company").value,
          position_pt: bloco.querySelector(".exp-position-pt").value,
          startDate: bloco.querySelector(".exp-start").value,
          endDate: bloco.querySelector(".exp-end").value,
          highlights_pt: bloco
            .querySelector(".exp-highlights-pt")
            .value.split(";")
            .map((i) => i.trim())
            .filter((i) => i),
        }),
      ),
      education: Array.from(document.querySelectorAll(".edu-block")).map(
        (bloco) => ({
          institution: bloco.querySelector(".edu-institution").value,
          area_pt: bloco.querySelector(".edu-area-pt").value,
          startDate: bloco.querySelector(".edu-start").value,
          endDate: bloco.querySelector(".edu-end").value,
          status_pt: bloco.querySelector(".edu-status").value,
        }),
      ),
      courses: cursosColetados,
      // Se a chave estiver ativada envia a lista, senão envia uma lista vazia
      projects: includeProjects ? projetosColetados : [],
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
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      btnGerar.textContent = "Gerar Currículo PDF";
      btnGerar.disabled = false;
    }
  });
