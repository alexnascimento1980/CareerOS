let expCount = 0;
let eduCount = 0;
let projCount = 0;
let cursoCount = 0;

const linkPattern =
  "^(https?:\\/\\/)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(?:\\/[^\\s]*)?$";
const linkTitle = "Insira um link válido (ex: github.com/projeto)";

// --- FUNÇÕES AUXILIARES DE DATA ---
// Transforma AAAA-MM (padrão do input month) em MM/AAAA (padrão do currículo)
function formatarDataMesAno(valor) {
  if (!valor) return "";
  const partes = valor.split("-");
  if (partes.length === 2) {
    return `${partes[1]}/${partes[0]}`;
  }
  return valor;
}

// Bloqueia o calendário de "Data Fim" se o usuário ainda estiver no cargo/curso
function toggleDataFim(checkbox) {
  const inputDataFim = checkbox
    .closest(".row")
    .querySelector(".input-data-fim");
  if (checkbox.checked) {
    inputDataFim.disabled = true;
    inputDataFim.removeAttribute("required");
    inputDataFim.value = "";
  } else {
    inputDataFim.disabled = false;
    inputDataFim.setAttribute("required", "required");
  }
}

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
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Mês/Ano Início</label>
                        <input type="month" class="form-control exp-start" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Mês/Ano Fim</label>
                        <input type="month" class="form-control exp-end input-data-fim" required>
                        <div class="form-check mt-1">
                            <input class="form-check-input exp-current" type="checkbox" onchange="toggleDataFim(this)">
                            <label class="form-check-label text-muted small">Trabalho aqui atualmente</label>
                        </div>
                    </div>
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
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Início</label>
                        <input type="month" class="form-control edu-start" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Término</label>
                        <input type="month" class="form-control edu-end input-data-fim" required>
                        <div class="form-check mt-1">
                            <input class="form-check-input edu-current" type="checkbox" onchange="toggleDataFim(this)">
                            <label class="form-check-label text-muted small">Cursando atualmente</label>
                        </div>
                    </div>
                    <div class="col-md-4"><label class="form-label fw-bold">Status (Ex: 6º Semestre)</label><input type="text" class="form-control edu-status" required></div>
                </div>
            </div>
        </div>`;
  document
    .getElementById("formacao-container")
    .insertAdjacentHTML("beforeend", html);
  eduCount++;
}

function adicionarCurso() {
  const currentYear = new Date().getFullYear();
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
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Ano</label>
                        <input type="number" class="form-control curso-year" min="1950" max="2050" step="1" value="${currentYear}" required>
                    </div>
                </div>
            </div>
        </div>`;
  document
    .getElementById("cursos-container")
    .insertAdjacentHTML("beforeend", html);
  cursoCount++;
}

function adicionarProjeto() {
  const isRequired = document.getElementById("include-projects").checked
    ? "required"
    : "";
  const html = `
        <div class="card mb-3 proj-block shadow-sm border-start border-warning border-3" id="proj-${projCount}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-warning fw-bold">Projeto Técnico</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerElemento('proj-${projCount}')">Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold">Nome do Projeto</label><input type="text" class="form-control proj-name" ${isRequired}></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Tecnologias</label><input type="text" class="form-control proj-tech" ${isRequired}></div>
                    <div class="col-md-4"><label class="form-label fw-bold">Link (GitHub)</label><input type="text" class="form-control proj-link" ${isRequired} pattern="${linkPattern}" title="${linkTitle}"></div>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Descrição</label>
                    <textarea class="form-control proj-desc-pt" rows="2" ${isRequired}></textarea>
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

// --- CONTROLE DE EXIBIÇÃO DE PROJETOS ---
document
  .getElementById("include-projects")
  .addEventListener("change", function () {
    const isChecked = this.checked;
    const container = document.getElementById("projetos-container");
    const btnAddProj = document.getElementById("btn-add-proj");
    const inputs = container.querySelectorAll("input, textarea");

    if (isChecked) {
      container.style.display = "block";
      btnAddProj.style.display = "inline-block";
      inputs.forEach((input) => input.setAttribute("required", "required"));
    } else {
      container.style.display = "none";
      btnAddProj.style.display = "none";
      inputs.forEach((input) => input.removeAttribute("required"));
    }
  });

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

      // Formata as datas no envio das experiências e verifica checkbox de "Presente"
      experience: Array.from(document.querySelectorAll(".exp-block")).map(
        (bloco) => {
          const isCurrent = bloco.querySelector(".exp-current").checked;
          const dataInicioFormatada = formatarDataMesAno(
            bloco.querySelector(".exp-start").value,
          );
          const dataFimFormatada = isCurrent
            ? idiomaSelecionado === "en"
              ? "Present"
              : "Presente"
            : formatarDataMesAno(bloco.querySelector(".exp-end").value);

          return {
            company: bloco.querySelector(".exp-company").value,
            position_pt: bloco.querySelector(".exp-position-pt").value,
            startDate: dataInicioFormatada,
            endDate: dataFimFormatada,
            highlights_pt: bloco
              .querySelector(".exp-highlights-pt")
              .value.split(";")
              .map((i) => i.trim())
              .filter((i) => i),
          };
        },
      ),

      // Formata as datas no envio das formações e verifica checkbox de "Presente"
      education: Array.from(document.querySelectorAll(".edu-block")).map(
        (bloco) => {
          const isCurrent = bloco.querySelector(".edu-current").checked;
          const dataInicioFormatada = formatarDataMesAno(
            bloco.querySelector(".edu-start").value,
          );
          const dataFimFormatada = isCurrent
            ? idiomaSelecionado === "en"
              ? "Present"
              : "Presente"
            : formatarDataMesAno(bloco.querySelector(".edu-end").value);

          return {
            institution: bloco.querySelector(".edu-institution").value,
            area_pt: bloco.querySelector(".edu-area-pt").value,
            startDate: dataInicioFormatada,
            endDate: dataFimFormatada,
            status_pt: bloco.querySelector(".edu-status").value,
          };
        },
      ),
      courses: cursosColetados,
      projects: includeProjects ? projetosColetados : [],
      skills: { technical: skillsArray, languages: [] },
    };

    try {
      const response = await fetch("/generate-cv", {
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
