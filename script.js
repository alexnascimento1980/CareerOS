let expCount = 0;
let eduCount = 0;
let projCount = 0;
let cursoCount = 0;

const linkPattern =
  "^(https?:\\/\\/)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(?:\\/[^\\s]*)?$";
const linkTitle = "Insira um link válido (ex: github.com/projeto)";

// --- INTEGRAÇÃO API IBGE (LOCALIZAÇÃO) ---
async function carregarEstados() {
  const selectEstado = document.getElementById("estado");
  try {
    const response = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
    );
    const estados = await response.json();

    selectEstado.innerHTML =
      '<option value="" disabled selected>Selecione um estado...</option>';
    estados.forEach((estado) => {
      selectEstado.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`;
    });
  } catch (error) {
    console.error("Erro ao carregar estados:", error);
    selectEstado.innerHTML =
      '<option value="" disabled selected>Erro ao carregar</option>';
  }
}

async function carregarCidades(uf) {
  const selectCidade = document.getElementById("cidade");
  selectCidade.innerHTML =
    '<option value="" disabled selected>Carregando cidades...</option>';
  selectCidade.disabled = true;

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
    );
    const cidades = await response.json();

    selectCidade.innerHTML =
      '<option value="" disabled selected>Selecione uma cidade...</option>';
    cidades.forEach((cidade) => {
      selectCidade.innerHTML += `<option value="${cidade.nome}">${cidade.nome}</option>`;
    });
    selectCidade.disabled = false;
  } catch (error) {
    console.error("Erro ao carregar cidades:", error);
    selectCidade.innerHTML =
      '<option value="" disabled selected>Erro ao carregar</option>';
  }
}

document.getElementById("estado").addEventListener("change", function () {
  carregarCidades(this.value);
});

// --- MÁSCARA DE TELEFONE ---
document.getElementById("phone").addEventListener("input", function (event) {
  let input = event.target;
  let valor = input.value.replace(/\D/g, "");

  if (valor.length > 11) {
    valor = valor.substring(0, 11);
  }

  if (valor.length <= 10) {
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
    valor = valor.replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  } else {
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
    valor = valor.replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  }

  input.value = valor;
});

// --- FUNÇÕES AUXILIARES DE DATA ---
function formatarDataMesAno(valor) {
  if (!valor) return "";
  const partes = valor.split("-");
  if (partes.length === 2) {
    return `${partes[1]}/${partes[0]}`;
  }
  return valor;
}

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

// --- INJEÇÃO DE HTML (COM CLASSES DE ANIMAÇÃO E ÍCONES) ---
function adicionarExperiencia() {
  const html = `
        <div class="card mb-3 exp-block shadow-sm border-start border-primary border-4 fade-in" id="exp-${expCount}">
            <div class="card-body bg-white rounded">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-primary fw-bold"><i class="fas fa-building me-2"></i>Nova Experiência</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('exp-${expCount}')">
                        <i class="fas fa-trash-alt"></i> Remover
                    </button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6"><label class="form-label fw-bold text-muted small">Empresa</label><input type="text" class="form-control" class="exp-company" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold text-muted small">Cargo</label><input type="text" class="form-control exp-position-pt" required></div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label fw-bold text-muted small">Mês/Ano Início</label>
                        <input type="month" class="form-control exp-start" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold text-muted small">Mês/Ano Fim</label>
                        <input type="month" class="form-control exp-end input-data-fim" required>
                        <div class="form-check mt-2">
                            <input class="form-check-input exp-current" type="checkbox" onchange="toggleDataFim(this)" id="chk-exp-${expCount}">
                            <label class="form-check-label text-primary fw-bold small" for="chk-exp-${expCount}">Trabalho aqui atualmente</label>
                        </div>
                    </div>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold text-muted small"><i class="fas fa-list-ul me-1"></i> Atividades (separe por ";")</label>
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
        <div class="card mb-3 edu-block shadow-sm border-start border-info border-4 fade-in" id="edu-${eduCount}">
            <div class="card-body bg-white rounded">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-info fw-bold"><i class="fas fa-university me-2"></i>Nova Formação</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('edu-${eduCount}')">
                        <i class="fas fa-trash-alt"></i> Remover
                    </button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6"><label class="form-label fw-bold text-muted small">Instituição</label><input type="text" class="form-control edu-institution" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold text-muted small">Curso</label><input type="text" class="form-control edu-area-pt" required></div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4">
                        <label class="form-label fw-bold text-muted small">Mês/Ano Início</label>
                        <input type="month" class="form-control edu-start" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-bold text-muted small">Mês/Ano Término</label>
                        <input type="month" class="form-control edu-end input-data-fim" required>
                        <div class="form-check mt-2">
                            <input class="form-check-input edu-current" type="checkbox" onchange="toggleDataFim(this)" id="chk-edu-${eduCount}">
                            <label class="form-check-label text-info fw-bold small" for="chk-edu-${eduCount}">Cursando atualmente</label>
                        </div>
                    </div>
                    <div class="col-md-4"><label class="form-label fw-bold text-muted small">Status (Ex: 6º Semestre)</label><input type="text" class="form-control edu-status" required></div>
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
        <div class="card mb-3 curso-block shadow-sm border-start border-success border-4 fade-in" id="curso-${cursoCount}">
            <div class="card-body bg-white rounded">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-success fw-bold"><i class="fas fa-award me-2"></i>Novo Curso</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('curso-${cursoCount}')">
                        <i class="fas fa-trash-alt"></i> Remover
                    </button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-5"><label class="form-label fw-bold text-muted small">Nome do Curso</label><input type="text" class="form-control curso-name" required></div>
                    <div class="col-md-5"><label class="form-label fw-bold text-muted small">Instituição</label><input type="text" class="form-control curso-inst" required></div>
                    <div class="col-md-2">
                        <label class="form-label fw-bold text-muted small">Ano</label>
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
        <div class="card mb-3 proj-block shadow-sm border-start border-warning border-4 fade-in" id="proj-${projCount}">
            <div class="card-body bg-white rounded">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-warning fw-bold"><i class="fas fa-code-branch me-2"></i>Novo Projeto</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('proj-${projCount}')">
                        <i class="fas fa-trash-alt"></i> Remover
                    </button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold text-muted small">Nome do Projeto</label><input type="text" class="form-control proj-name" ${isRequired}></div>
                    <div class="col-md-4"><label class="form-label fw-bold text-muted small">Tecnologias</label><input type="text" class="form-control proj-tech" ${isRequired}></div>
                    <div class="col-md-4"><label class="form-label fw-bold text-muted small">Link (GitHub/Web)</label><input type="text" class="form-control proj-link" ${isRequired} pattern="${linkPattern}" title="${linkTitle}"></div>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold text-muted small"><i class="fas fa-align-justify me-1"></i> Descrição Resumida</label>
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
  const el = document.getElementById(id);
  // Animação de saída suave antes de remover
  el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  el.style.opacity = "0";
  el.style.transform = "translateY(10px)";
  setTimeout(() => el.remove(), 300);
}

document
  .getElementById("include-projects")
  .addEventListener("change", function () {
    const isChecked = this.checked;
    const container = document.getElementById("projetos-container");
    const btnAddProj = document.getElementById("btn-add-proj");
    const inputs = container.querySelectorAll("input, textarea");

    if (isChecked) {
      container.style.display = "block";
      container.classList.add("fade-in");
      btnAddProj.style.display = "inline-block";
      inputs.forEach((input) => input.setAttribute("required", "required"));
    } else {
      container.style.display = "none";
      container.classList.remove("fade-in");
      btnAddProj.style.display = "none";
      inputs.forEach((input) => input.removeAttribute("required"));
    }
  });

window.onload = function () {
  carregarEstados();
  adicionarExperiencia();
  adicionarFormacao();
  adicionarCurso();
  adicionarProjeto();
};

// --- SUBMISSÃO API ---
document
  .getElementById("cv-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const btnGerar = document.getElementById("btn-gerar");
    const idiomaSelecionado = document.getElementById("idioma_escolhido").value;
    const includeProjects = document.getElementById("include-projects").checked;

    // Feedback visual moderno no botão
    const originalBtnHTML = btnGerar.innerHTML;
    btnGerar.innerHTML =
      idiomaSelecionado === "en"
        ? '<i class="fas fa-language fa-spin me-2"></i> Traduzindo e Gerando...'
        : '<i class="fas fa-spinner fa-spin me-2"></i> Gerando PDF...';
    btnGerar.disabled = true;

    const cidadeSelect = document.getElementById("cidade").value;
    const estadoSelect = document.getElementById("estado").value;
    const localizacaoFinal = `${cidadeSelect}, ${estadoSelect}`;

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
        location: localizacaoFinal,
        linkedin: document.getElementById("linkedin").value,
        github: document.getElementById("github").value,
      },
      summary: { pt: [document.getElementById("summary_pt").value] },
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

      const nomeDigitado = document.getElementById("name").value;
      const nomeFormatado = nomeDigitado.trim().replace(/\s+/g, "_");
      const nomeArquivo = `${nomeFormatado}_curriculo_${idiomaSelecionado}.pdf`;

      a.style.display = "none";
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro:", error);
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      btnGerar.innerHTML = originalBtnHTML;
      btnGerar.disabled = false;
    }
  });
