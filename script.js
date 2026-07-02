// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const supabaseUrl = "https://vaiedrsonmktbnkcktqv.supabase.co";
const supabaseKey = "sb_publishable_K1kdVFqNe9olG91GCEe-rg_D6BcQZk8";
// NOME ALTERADO AQUI PARA EVITAR COLISÃO: supabaseClient
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;

// ==========================================
// LÓGICA DE AUTENTICAÇÃO (LOGIN / REGISTRO)
// ==========================================
async function checarSessao() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  atualizarUIAuth(session?.user || null);

  // Escuta mudanças (login, logout)
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    atualizarUIAuth(session?.user || null);
  });
}

function atualizarUIAuth(user) {
  currentUser = user;
  const bannerLogin = document.getElementById("login-banner");
  const bannerLogged = document.getElementById("logged-banner");
  const emailDisplay = document.getElementById("user-email-display");

  if (user) {
    // Usuário logado
    bannerLogin.style.setProperty("display", "none", "important");
    bannerLogged.style.setProperty("display", "flex", "important");
    emailDisplay.textContent = user.email;
    carregarRascunhoNuvem(user.id);
  } else {
    // Usuário deslogado
    bannerLogin.style.setProperty("display", "flex", "important");
    bannerLogged.style.setProperty("display", "none", "important");
    emailDisplay.textContent = "";
    limparFormulario();
  }
}

async function fazerCadastro() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const errorDiv = document.getElementById("auth-error");

  if (!email || password.length < 6) {
    errorDiv.textContent = "E-mail inválido ou senha menor que 6 caracteres.";
    errorDiv.style.display = "block";
    return;
  }

  errorDiv.style.display = "none";
  const btn = document.getElementById("btn-register");
  btn.textContent = "Criando...";

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  btn.textContent = "Criar Nova Conta";

  if (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = "block";
  } else {
    alert("Conta criada com sucesso! Você já está logado.");
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("authModal"),
    );
    modal.hide();
  }
}

async function fazerLogin() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const errorDiv = document.getElementById("auth-error");

  errorDiv.style.display = "none";
  const btn = document.getElementById("btn-login");
  btn.textContent = "Entrando...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  btn.textContent = "Entrar";

  if (error) {
    errorDiv.textContent = "Falha no login. Verifique e-mail e senha.";
    errorDiv.style.display = "block";
  } else {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("authModal"),
    );
    modal.hide();
  }
}

async function fazerLogout() {
  await supabaseClient.auth.signOut();
}

// ==========================================
// VARIÁVEIS E IBGE
// ==========================================
let expCount = 0;
let eduCount = 0;
let projCount = 0;
let cursoCount = 0;

const linkPattern = "https?://.+";

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
  if (valor.length > 11) valor = valor.substring(0, 11);

  if (valor.length <= 10) {
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
    valor = valor.replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  } else {
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
    valor = valor.replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  }
  input.value = valor;
});

function formatarDataMesAno(valor) {
  if (!valor) return "";
  const partes = valor.split("-");
  return partes.length === 2 ? `${partes[1]}/${partes[0]}` : valor;
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

// --- INJEÇÃO DE HTML ---
function adicionarExperiencia() {
  const html = `
        <div class="card mb-3 exp-block shadow-sm border-start border-primary border-4 fade-in" id="exp-${expCount}">
            <div class="card-body bg-white rounded">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-primary fw-bold"><i class="fas fa-building me-2"></i>Nova Experiência</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('exp-${expCount}')"><i class="fas fa-trash-alt"></i> Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6"><label class="form-label fw-bold text-muted small">Empresa</label><input type="text" class="form-control exp-company" required></div>
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
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('edu-${eduCount}')"><i class="fas fa-trash-alt"></i> Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-6"><label class="form-label fw-bold text-muted small">Instituição</label><input type="text" class="form-control edu-institution" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold text-muted small">Curso</label><input type="text" class="form-control edu-area-pt" required></div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold text-muted small">Mês/Ano Início</label><input type="month" class="form-control edu-start" required></div>
                    <div class="col-md-4">
                        <label class="form-label fw-bold text-muted small">Mês/Ano Término</label>
                        <input type="month" class="form-control edu-end input-data-fim" required>
                        <div class="form-check mt-2">
                            <input class="form-check-input edu-current" type="checkbox" onchange="toggleDataFim(this)" id="chk-edu-${eduCount}">
                            <label class="form-check-label text-info fw-bold small" for="chk-edu-${eduCount}">Cursando atualmente</label>
                        </div>
                    </div>
                    <div class="col-md-4"><label class="form-label fw-bold text-muted small">Status</label><input type="text" class="form-control edu-status" required></div>
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
        <div class="card mb-3 curso-block shadow-sm border-start border-success border-4 fade-in" id="curso-${cursoCount}">
            <div class="card-body bg-white rounded">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-success fw-bold"><i class="fas fa-award me-2"></i>Novo Curso</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('curso-${cursoCount}')"><i class="fas fa-trash-alt"></i> Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-5"><label class="form-label fw-bold text-muted small">Nome do Curso</label><input type="text" class="form-control curso-name" required></div>
                    <div class="col-md-5"><label class="form-label fw-bold text-muted small">Instituição</label><input type="text" class="form-control curso-inst" required></div>
                    <div class="col-md-2"><label class="form-label fw-bold text-muted small">Ano</label><input type="number" class="form-control curso-year" value="2024" required></div>
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
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('proj-${projCount}')"><i class="fas fa-trash-alt"></i> Remover</button>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><label class="form-label fw-bold text-muted small">Nome</label><input type="text" class="form-control proj-name" ${isRequired}></div>
                    <div class="col-md-4"><label class="form-label fw-bold text-muted small">Tecnologias</label><input type="text" class="form-control proj-tech" ${isRequired}></div>
                    <div class="col-md-4"><label class="form-label fw-bold text-muted small">Link</label><input type="text" class="form-control proj-link" ${isRequired} pattern="${linkPattern}"></div>
                </div>
                <div class="mb-2"><label class="form-label fw-bold text-muted small">Descrição</label><textarea class="form-control proj-desc-pt" rows="2" ${isRequired}></textarea></div>
            </div>
        </div>`;
  document
    .getElementById("projetos-container")
    .insertAdjacentHTML("beforeend", html);
  projCount++;
}

function removerElemento(id) {
  const el = document.getElementById(id);
  el.style.opacity = "0";
  setTimeout(() => {
    el.remove();
    salvarDadosNuvem();
  }, 300);
}

document
  .getElementById("include-projects")
  .addEventListener("change", function () {
    const isChecked = this.checked;
    const container = document.getElementById("projetos-container");
    const inputs = container.querySelectorAll("input, textarea");
    container.style.display = isChecked ? "block" : "none";
    document.getElementById("btn-add-proj").style.display = isChecked
      ? "inline-block"
      : "none";
    inputs.forEach((i) =>
      isChecked
        ? i.setAttribute("required", "required")
        : i.removeAttribute("required"),
    );
  });

// ==========================================
// PERSISTÊNCIA NA NUVEM (SUPABASE)
// ==========================================
let timeoutSalvar;
function agendarSalvamentoNuvem() {
  if (!currentUser) return;
  clearTimeout(timeoutSalvar);
  timeoutSalvar = setTimeout(salvarDadosNuvem, 1500);
}

async function salvarDadosNuvem() {
  if (!currentUser) return;

  const rascunho = {
    basics: {
      name: document.getElementById("name").value,
      label_pt: document.getElementById("label_pt").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      estado: document.getElementById("estado").value,
      cidade: document.getElementById("cidade").value,
      linkedin: document.getElementById("linkedin").value,
      github: document.getElementById("github").value,
    },
    summary: document.getElementById("summary_pt").value,
    skills: document.getElementById("skills").value,
    config: {
      includeProjects: document.getElementById("include-projects").checked,
      idioma: document.getElementById("idioma_escolhido").value,
    },
    experience: Array.from(document.querySelectorAll(".exp-block")).map(
      (bloco) => ({
        company: bloco.querySelector(".exp-company").value,
        position: bloco.querySelector(".exp-position-pt").value,
        start: bloco.querySelector(".exp-start").value,
        end: bloco.querySelector(".exp-end").value,
        isCurrent: bloco.querySelector(".exp-current").checked,
        highlights: bloco.querySelector(".exp-highlights-pt").value,
      }),
    ),
    education: Array.from(document.querySelectorAll(".edu-block")).map(
      (bloco) => ({
        institution: bloco.querySelector(".edu-institution").value,
        area: bloco.querySelector(".edu-area-pt").value,
        start: bloco.querySelector(".edu-start").value,
        end: bloco.querySelector(".edu-end").value,
        isCurrent: bloco.querySelector(".edu-current").checked,
        status: bloco.querySelector(".edu-status").value,
      }),
    ),
    courses: Array.from(document.querySelectorAll(".curso-block")).map(
      (bloco) => ({
        name: bloco.querySelector(".curso-name").value,
        institution: bloco.querySelector(".curso-inst").value,
        year: bloco.querySelector(".curso-year").value,
      }),
    ),
    projects: Array.from(document.querySelectorAll(".proj-block")).map(
      (bloco) => ({
        name: bloco.querySelector(".proj-name").value,
        tech: bloco.querySelector(".proj-tech").value,
        link: bloco.querySelector(".proj-link").value,
        desc: bloco.querySelector(".proj-desc-pt").value,
      }),
    ),
  };

  const { error } = await supabaseClient
    .from("curriculos")
    .upsert(
      { user_id: currentUser.id, dados: rascunho },
      { onConflict: "user_id" },
    );

  if (error) console.error("Erro ao salvar na nuvem:", error);
}

async function carregarRascunhoNuvem(userId) {
  limparFormulario();

  const { data, error } = await supabaseClient
    .from("curriculos")
    .select("dados")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data || !data.dados) {
    console.log("Iniciando novo formulário ou sem dados na nuvem.");
    // Garante que o formulário tenha os campos básicos caso não existam dados
    if (typeof adicionarExperiencia === "function") {
      adicionarExperiencia();
      adicionarFormacao();
    }
    return;
  }

  const rascunho = data.dados;
  // O resto da sua lógica de preenchimento de campos aqui...

  document.getElementById("name").value = rascunho.basics.name || "";
  document.getElementById("label_pt").value = rascunho.basics.label_pt || "";
  document.getElementById("email").value = rascunho.basics.email || "";
  document.getElementById("phone").value = rascunho.basics.phone || "";
  document.getElementById("linkedin").value = rascunho.basics.linkedin || "";
  document.getElementById("github").value = rascunho.basics.github || "";
  document.getElementById("summary_pt").value = rascunho.summary || "";
  document.getElementById("skills").value = rascunho.skills || "";

  const checkProj = document.getElementById("include-projects");
  checkProj.checked = rascunho.config.includeProjects;
  checkProj.dispatchEvent(new Event("change"));

  if (rascunho.basics.estado) {
    document.getElementById("estado").value = rascunho.basics.estado;
    await carregarCidades(rascunho.basics.estado);
    if (rascunho.basics.cidade)
      document.getElementById("cidade").value = rascunho.basics.cidade;
  }

  rascunho.experience.forEach((exp) => {
    adicionarExperiencia();
    const bloco = document.getElementById(`exp-${expCount - 1}`);
    bloco.querySelector(".exp-company").value = exp.company;
    bloco.querySelector(".exp-position-pt").value = exp.position;
    bloco.querySelector(".exp-start").value = exp.start;
    const chk = bloco.querySelector(".exp-current");
    chk.checked = exp.isCurrent;
    bloco.querySelector(".exp-end").value = exp.end;
    toggleDataFim(chk);
    bloco.querySelector(".exp-highlights-pt").value = exp.highlights;
  });

  rascunho.education.forEach((edu) => {
    adicionarFormacao();
    const bloco = document.getElementById(`edu-${eduCount - 1}`);
    bloco.querySelector(".edu-institution").value = edu.institution;
    bloco.querySelector(".edu-area-pt").value = edu.area;
    bloco.querySelector(".edu-start").value = edu.start;
    const chk = bloco.querySelector(".edu-current");
    chk.checked = edu.isCurrent;
    bloco.querySelector(".edu-end").value = edu.end;
    toggleDataFim(chk);
    bloco.querySelector(".edu-status").value = edu.status;
  });

  rascunho.courses.forEach((curso) => {
    adicionarCurso();
    const bloco = document.getElementById(`curso-${cursoCount - 1}`);
    bloco.querySelector(".curso-name").value = curso.name;
    bloco.querySelector(".curso-inst").value = curso.institution;
    bloco.querySelector(".curso-year").value = curso.year;
  });

  rascunho.projects.forEach((proj) => {
    adicionarProjeto();
    const bloco = document.getElementById(`proj-${projCount - 1}`);
    bloco.querySelector(".proj-name").value = proj.name;
    bloco.querySelector(".proj-tech").value = proj.tech;
    bloco.querySelector(".proj-link").value = proj.link;
    bloco.querySelector(".proj-desc-pt").value = proj.desc;
  });
}

function limparFormulario() {
  document.getElementById("cv-form").reset();
  document.getElementById("experiencias-container").innerHTML = "";
  document.getElementById("formacao-container").innerHTML = "";
  document.getElementById("cursos-container").innerHTML = "";
  document.getElementById("projetos-container").innerHTML = "";
}

document
  .getElementById("cv-form")
  .addEventListener("input", agendarSalvamentoNuvem);
document
  .getElementById("cv-form")
  .addEventListener("change", agendarSalvamentoNuvem);

window.onload = async function () {
  await carregarEstados();
  await checarSessao();
};

// ==========================================
// SUBMISSÃO API (GERAR PDF)
// ==========================================
document
  .getElementById("cv-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!currentUser) {
      alert("Por favor, faça login para gerar o currículo.");
      // Garante que o Bootstrap carregou antes de tentar usar
      if (typeof bootstrap !== "undefined") {
        const modal = new bootstrap.Modal(document.getElementById("authModal"));
        modal.show();
      }
      return;
    }

    const btnGerar = document.getElementById("btn-gerar");
    const idiomaSelecionado = document.getElementById("idioma_escolhido").value;
    const includeProjects = document.getElementById("include-projects").checked;

    const originalBtnHTML = btnGerar.innerHTML;
    btnGerar.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i> Gerando PDF...';
    btnGerar.disabled = true;

    await salvarDadosNuvem();

    const cidadeSelect = document.getElementById("cidade").value;
    const estadoSelect = document.getElementById("estado").value;
    const localizacaoFinal = `${cidadeSelect}, ${estadoSelect}`;

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
          return {
            company: bloco.querySelector(".exp-company").value,
            position_pt: bloco.querySelector(".exp-position-pt").value,
            startDate: formatarDataMesAno(
              bloco.querySelector(".exp-start").value,
            ),
            endDate: isCurrent
              ? idiomaSelecionado === "en"
                ? "Present"
                : "Presente"
              : formatarDataMesAno(bloco.querySelector(".exp-end").value),
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
          return {
            institution: bloco.querySelector(".edu-institution").value,
            area_pt: bloco.querySelector(".edu-area-pt").value,
            startDate: formatarDataMesAno(
              bloco.querySelector(".edu-start").value,
            ),
            endDate: isCurrent
              ? idiomaSelecionado === "en"
                ? "Present"
                : "Presente"
              : formatarDataMesAno(bloco.querySelector(".edu-end").value),
            status_pt: bloco.querySelector(".edu-status").value,
          };
        },
      ),
      courses: Array.from(document.querySelectorAll(".curso-block")).map(
        (bloco) => ({
          name_pt: bloco.querySelector(".curso-name").value,
          institution: bloco.querySelector(".curso-inst").value,
          year: bloco.querySelector(".curso-year").value,
        }),
      ),
      projects: includeProjects
        ? Array.from(document.querySelectorAll(".proj-block")).map((bloco) => ({
            name: bloco.querySelector(".proj-name").value,
            technologies: bloco.querySelector(".proj-tech").value,
            link: bloco.querySelector(".proj-link").value,
            description_pt: bloco.querySelector(".proj-desc-pt").value,
          }))
        : [],
      skills: { technical: skillsArray, languages: [] },
    };

    try {
      const response = await fetch("/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro na requisição.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${document.getElementById("name").value.trim().replace(/\s+/g, "_")}_curriculo_${idiomaSelecionado}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      if (typeof gtag === "function") {
        gtag("event", "gerar_curriculo", {
          app_name: "CareerOS",
          idioma_pdf: idiomaSelecionado,
          incluiu_projetos: includeProjects ? "sim" : "nao",
          estado_candidato: estadoSelect,
        });
      }
    } catch (error) {
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      btnGerar.innerHTML = originalBtnHTML;
      btnGerar.disabled = false;
    }
  });
