// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const supabaseUrl = "https://vaiedrsonmktbnkcktqv.supabase.co";
const supabaseKey = "sb_publishable_K1kdVFqNe9olG91GCEe-rg_D6BcQZk8";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let isSavingToCloud = false;
let isLoadingResume = false;

// ==========================================
// LÓGICA DE AUTENTICAÇÃO
// ==========================================

// Depois do login via OAuth (Google), o Supabase redireciona de volta com
// os tokens de sessão expostos no #hash da URL (ex: #access_token=...).
// O client do Supabase já lê e usa esses tokens automaticamente, mas eles
// continuam visíveis na barra de endereço até serem removidos manualmente.
// Isso é sensível: qualquer pessoa que veja essa URL (histórico do
// navegador, print de tela, link compartilhado) teria acesso à sessão.
function limparTokenDaURL() {
  if (window.location.hash && window.location.hash.includes("access_token")) {
    const urlLimpa =
      window.location.origin +
      window.location.pathname +
      window.location.search;
    window.history.replaceState({}, document.title, urlLimpa);
  }
}

async function checarSessao() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  atualizarUIAuth(session?.user || null);
  limparTokenDaURL();
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    // O Supabase dispara um evento (ex: INITIAL_SESSION) imediatamente ao
    // registrar este listener, repetindo a mesma sessão que já processamos
    // acima via getSession(). Sem essa checagem, carregarRascunhoNuvem()
    // roda duas vezes em paralelo e pode deixar blocos de experiência/
    // formação duplicados ou "fantasmas" no formulário.
    const novoUserId = session?.user?.id || null;
    if (novoUserId === (currentUser?.id || null)) return;
    atualizarUIAuth(session?.user || null);
    limparTokenDaURL();
  });
}

function atualizarUIAuth(user) {
  currentUser = user;
  const bannerLogin = document.getElementById("login-banner");
  const bannerLogged = document.getElementById("logged-banner");
  const emailDisplay = document.getElementById("user-email-display");

  if (user) {
    bannerLogin.style.setProperty("display", "none", "important");
    bannerLogged.style.setProperty("display", "flex", "important");
    emailDisplay.textContent = user.email;
    carregarRascunhoNuvem(user.id);
  } else {
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
  const { error } = await supabaseClient.auth.signUp({ email, password });
  btn.textContent = "Criar Conta";
  if (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = "block";
  } else {
    alert("Conta criada com sucesso!");
    bootstrap.Modal.getInstance(document.getElementById("authModal")).hide();
  }
}

async function fazerLogin() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const errorDiv = document.getElementById("auth-error");
  errorDiv.style.display = "none";
  const btn = document.getElementById("btn-login");
  btn.textContent = "Entrando...";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  btn.textContent = "Entrar";
  if (error) {
    errorDiv.textContent = "Falha no login. Verifique e-mail e senha.";
    errorDiv.style.display = "block";
  } else {
    bootstrap.Modal.getInstance(document.getElementById("authModal")).hide();
  }
}

async function loginComGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) alert("Erro no login com Google: " + error.message);
}

async function fazerLogout() {
  await supabaseClient.auth.signOut();
}

// ==========================================
// VARIÁVEIS E IBGE
// ==========================================
let expCount = 0,
  eduCount = 0,
  projCount = 0,
  cursoCount = 0;
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
    estados.forEach(
      (estado) =>
        (selectEstado.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`),
    );
  } catch (e) {
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
    cidades.forEach(
      (cidade) =>
        (selectCidade.innerHTML += `<option value="${cidade.nome}">${cidade.nome}</option>`),
    );
    selectCidade.disabled = false;
  } catch (e) {
    selectCidade.innerHTML =
      '<option value="" disabled selected>Erro ao carregar</option>';
  }
}

document.getElementById("estado").addEventListener("change", function () {
  carregarCidades(this.value);
});

document.getElementById("phone").addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length <= 10) {
    v = v
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  } else {
    v = v
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  }
  e.target.value = v;
});

function formatarDataMesAno(v) {
  if (!v) return "";
  const p = v.split("-");
  return p.length === 2 ? `${p[1]}/${p[0]}` : v;
}

function toggleDataFim(checkbox) {
  const input = checkbox.closest(".row").querySelector(".input-data-fim");
  if (checkbox.checked) {
    input.disabled = true;
    input.removeAttribute("required");
    input.value = "";
  } else {
    input.disabled = false;
    input.setAttribute("required", "required");
  }
}

// --- INJEÇÃO DE HTML ---
function adicionarExperiencia() {
  const isReq = document.getElementById("include-experience").checked
    ? "required"
    : "";
  const html = `
    <div class="card mb-3 exp-block shadow-sm border-start border-primary border-4 fade-in" id="exp-${expCount}">
      <div class="card-body bg-white rounded">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 text-primary fw-bold"><i class="fas fa-building me-2"></i>Nova Experiência</h6>
          <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('exp-${expCount}')"><i class="fas fa-trash-alt"></i> Remover</button>
        </div>
        <div class="row mb-2">
          <div class="col-md-6"><label class="form-label fw-bold text-muted small">Empresa</label><input type="text" class="form-control exp-company" ${isReq}></div>
          <div class="col-md-6"><label class="form-label fw-bold text-muted small">Cargo</label><input type="text" class="form-control exp-position-pt" ${isReq}></div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6"><label class="form-label fw-bold text-muted small">Mês/Ano Início</label><input type="month" class="form-control exp-start" ${isReq}></div>
          <div class="col-md-6">
            <label class="form-label fw-bold text-muted small">Mês/Ano Fim</label>
            <input type="month" class="form-control exp-end input-data-fim" ${isReq}>
            <div class="form-check mt-2">
              <input class="form-check-input exp-current" type="checkbox" onchange="toggleDataFim(this)" id="chk-exp-${expCount}">
              <label class="form-check-label text-primary fw-bold small" for="chk-exp-${expCount}">Trabalho aqui atualmente</label>
            </div>
          </div>
        </div>
        <div class="mb-2"><label class="form-label fw-bold text-muted small">Atividades (separe por ";")</label><textarea class="form-control exp-highlights-pt" rows="3" ${isReq}></textarea></div>
      </div>
    </div>`;
  document
    .getElementById("experiencias-container")
    .insertAdjacentHTML("beforeend", html);
  expCount++;
}

function adicionarFormacao() {
  const isReq = document.getElementById("include-education").checked
    ? "required"
    : "";
  const html = `
    <div class="card mb-3 edu-block shadow-sm border-start border-info border-4 fade-in" id="edu-${eduCount}">
      <div class="card-body bg-white rounded">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 text-info fw-bold"><i class="fas fa-university me-2"></i>Nova Formação</h6>
          <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('edu-${eduCount}')"><i class="fas fa-trash-alt"></i> Remover</button>
        </div>
        <div class="row mb-2">
          <div class="col-md-6"><label class="form-label fw-bold text-muted small">Instituição</label><input type="text" class="form-control edu-institution" ${isReq}></div>
          <div class="col-md-6"><label class="form-label fw-bold text-muted small">Curso</label><input type="text" class="form-control edu-area-pt" ${isReq}></div>
        </div>
        <div class="row mb-2">
          <div class="col-md-4"><label class="form-label fw-bold text-muted small">Mês/Ano Início</label><input type="month" class="form-control edu-start" ${isReq}></div>
          <div class="col-md-4">
            <label class="form-label fw-bold text-muted small">Mês/Ano Término</label>
            <input type="month" class="form-control edu-end input-data-fim" ${isReq}>
            <div class="form-check mt-2">
              <input class="form-check-input edu-current" type="checkbox" onchange="toggleDataFim(this)" id="chk-edu-${eduCount}">
              <label class="form-check-label text-info fw-bold small" for="chk-edu-${eduCount}">Cursando atualmente</label>
            </div>
          </div>
          <div class="col-md-4"><label class="form-label fw-bold text-muted small">Status</label><input type="text" class="form-control edu-status" ${isReq}></div>
        </div>
      </div>
    </div>`;
  document
    .getElementById("formacao-container")
    .insertAdjacentHTML("beforeend", html);
  eduCount++;
}

function adicionarCurso() {
  const isReq = document.getElementById("include-courses").checked
    ? "required"
    : "";
  const html = `
    <div class="card mb-3 curso-block shadow-sm border-start border-success border-4 fade-in" id="curso-${cursoCount}">
      <div class="card-body bg-white rounded">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 text-success fw-bold"><i class="fas fa-award me-2"></i>Novo Curso</h6>
          <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('curso-${cursoCount}')"><i class="fas fa-trash-alt"></i> Remover</button>
        </div>
        <div class="row mb-2">
          <div class="col-md-5"><label class="form-label fw-bold text-muted small">Nome do Curso</label><input type="text" class="form-control curso-name" ${isReq}></div>
          <div class="col-md-5"><label class="form-label fw-bold text-muted small">Instituição</label><input type="text" class="form-control curso-inst" ${isReq}></div>
          <div class="col-md-2"><label class="form-label fw-bold text-muted small">Ano</label><input type="number" class="form-control curso-year" value="2024" ${isReq}></div>
        </div>
      </div>
    </div>`;
  document
    .getElementById("cursos-container")
    .insertAdjacentHTML("beforeend", html);
  cursoCount++;
}

function adicionarProjeto() {
  const isReq = document.getElementById("include-projects").checked
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
          <div class="col-md-4"><label class="form-label fw-bold text-muted small">Nome</label><input type="text" class="form-control proj-name" ${isReq}></div>
          <div class="col-md-4"><label class="form-label fw-bold text-muted small">Tecnologias</label><input type="text" class="form-control proj-tech" ${isReq}></div>
          <div class="col-md-4"><label class="form-label fw-bold text-muted small">Link</label><input type="text" class="form-control proj-link" ${isReq} pattern="${linkPattern}"></div>
        </div>
        <div class="mb-2"><label class="form-label fw-bold text-muted small">Descrição</label><textarea class="form-control proj-desc-pt" rows="2" ${isReq}></textarea></div>
      </div>
    </div>`;
  document
    .getElementById("projetos-container")
    .insertAdjacentHTML("beforeend", html);
  projCount++;
}

function removerElemento(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.opacity = "0";
    setTimeout(() => {
      el.remove();
      agendarSalvamentoNuvem();
    }, 300);
  }
}

document
  .getElementById("include-experience")
  .addEventListener("change", function () {
    const isChecked = this.checked;
    document
      .querySelectorAll(
        "#experiencias-container input, #experiencias-container textarea",
      )
      .forEach((i) =>
        isChecked
          ? i.setAttribute("required", "required")
          : i.removeAttribute("required"),
      );
  });

document
  .getElementById("include-education")
  .addEventListener("change", function () {
    const isChecked = this.checked;
    document
      .querySelectorAll(
        "#formacao-container input, #formacao-container textarea",
      )
      .forEach((i) =>
        isChecked
          ? i.setAttribute("required", "required")
          : i.removeAttribute("required"),
      );
  });

document
  .getElementById("include-courses")
  .addEventListener("change", function () {
    const isChecked = this.checked;
    document
      .querySelectorAll("#cursos-container input, #cursos-container textarea")
      .forEach((i) =>
        isChecked
          ? i.setAttribute("required", "required")
          : i.removeAttribute("required"),
      );
  });

document
  .getElementById("include-projects")
  .addEventListener("change", function () {
    const isChecked = this.checked;
    document
      .querySelectorAll(
        "#projetos-container input, #projetos-container textarea",
      )
      .forEach((i) =>
        isChecked
          ? i.setAttribute("required", "required")
          : i.removeAttribute("required"),
      );
  });

// ==========================================
// PERSISTÊNCIA NA NUVEM
// ==========================================
let timeoutSalvar;
function agendarSalvamentoNuvem() {
  if (!currentUser) return;
  clearTimeout(timeoutSalvar);
  timeoutSalvar = setTimeout(salvarDadosNuvem, 1500);
}

async function salvarDadosNuvem() {
  if (!currentUser || isSavingToCloud) return;
  try {
    isSavingToCloud = true;
    mostrarStatusSalvamento(true);
    const r = {
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
      summary: { pt: [document.getElementById("summary_pt").value] },
      skills: {
        technical: document
          .getElementById("skills")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      },
      config: {
        includeExperience:
          document.getElementById("include-experience").checked,
        includeEducation: document.getElementById("include-education").checked,
        includeCourses: document.getElementById("include-courses").checked,
        includeProjects: document.getElementById("include-projects").checked,
        idioma: document.getElementById("idioma_escolhido").value,
      },
      experience: Array.from(document.querySelectorAll(".exp-block")).map(
        (b) => ({
          company: b.querySelector(".exp-company").value,
          position: b.querySelector(".exp-position-pt").value,
          start: b.querySelector(".exp-start").value,
          end: b.querySelector(".exp-end").value,
          isCurrent: b.querySelector(".exp-current").checked,
          highlights: b.querySelector(".exp-highlights-pt").value,
        }),
      ),
      education: Array.from(document.querySelectorAll(".edu-block")).map(
        (b) => ({
          institution: b.querySelector(".edu-institution").value,
          area: b.querySelector(".edu-area-pt").value,
          start: b.querySelector(".edu-start").value,
          end: b.querySelector(".edu-end").value,
          isCurrent: b.querySelector(".edu-current").checked,
          status: b.querySelector(".edu-status").value,
        }),
      ),
      courses: Array.from(document.querySelectorAll(".curso-block")).map(
        (b) => ({
          name: b.querySelector(".curso-name").value,
          institution: b.querySelector(".curso-inst").value,
          year: b.querySelector(".curso-year").value,
        }),
      ),
      projects: Array.from(document.querySelectorAll(".proj-block")).map(
        (b) => ({
          name: b.querySelector(".proj-name").value,
          tech: b.querySelector(".proj-tech").value,
          link: b.querySelector(".proj-link").value,
          desc: b.querySelector(".proj-desc-pt").value,
        }),
      ),
    };
    // const { error } = await supabaseClient
    //   .from("curriculos")
    //   .upsert({
    //     user_id: currentUser.id,
    //     dados: r,
    //     updated_at: new Date().toISOString(),
    //   });
    // Substitua a parte do .upsert por esta versão:
    const { error } = await supabaseClient.from("curriculos").upsert(
      {
        user_id: currentUser.id,
        dados: r,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }, // Esta linha diz ao Supabase: "Se o user_id já existir, apenas atualize os dados"
    );

    if (error) console.error("Erro ao salvar:", error);
  } catch (e) {
    console.error("Erro inesperado:", e);
  } finally {
    isSavingToCloud = false;
    mostrarStatusSalvamento(false);
  }
}

async function carregarRascunhoNuvem(userId) {
  if (isLoadingResume) return;
  isLoadingResume = true;

  // Limpeza total antes de carregar para evitar duplicação
  document.getElementById("experiencias-container").innerHTML = "";
  document.getElementById("formacao-container").innerHTML = "";
  document.getElementById("cursos-container").innerHTML = "";
  document.getElementById("projetos-container").innerHTML = "";
  expCount = 0;
  eduCount = 0;
  projCount = 0;
  cursoCount = 0;

  try {
    const { data, error } = await supabaseClient
      .from("curriculos")
      .select("dados")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data || !data.dados) throw new Error("Sem dados");
    const r = data.dados;

    document.getElementById("name").value = r.basics?.name || "";
    document.getElementById("label_pt").value = r.basics?.label_pt || "";
    document.getElementById("email").value = r.basics?.email || "";
    document.getElementById("phone").value = r.basics?.phone || "";
    document.getElementById("linkedin").value = r.basics?.linkedin || "";
    document.getElementById("github").value = r.basics?.github || "";
    document.getElementById("summary_pt").value = r.summary?.pt?.[0] || "";
    document.getElementById("skills").value =
      r.skills?.technical?.join(", ") || "";

    // Restaura o estado de cada toggle "Incluir no PDF?" ANTES de recriar os
    // blocos abaixo, já que adicionarExperiencia/Formacao/Curso/Projeto leem
    // o checkbox correspondente para decidir se os campos são obrigatórios.
    const cfg = r.config || {};
    document.getElementById("include-experience").checked =
      cfg.includeExperience !== false;
    document.getElementById("include-education").checked =
      cfg.includeEducation !== false;
    document.getElementById("include-courses").checked =
      cfg.includeCourses !== false;
    document.getElementById("include-projects").checked =
      cfg.includeProjects !== false;

    if (r.basics?.estado) {
      document.getElementById("estado").value = r.basics.estado;
      await carregarCidades(r.basics.estado);
      if (r.basics.cidade)
        document.getElementById("cidade").value = r.basics.cidade;
    }

    // Carregamento dinâmico
    if (r.experience?.length) {
      r.experience.forEach((e) => {
        adicionarExperiencia();
        const b = document.getElementById(`exp-${expCount - 1}`);
        b.querySelector(".exp-company").value = e.company || "";
        b.querySelector(".exp-position-pt").value = e.position || "";
        b.querySelector(".exp-start").value = e.start || "";
        b.querySelector(".exp-current").checked = e.isCurrent || false;
        toggleDataFim(b.querySelector(".exp-current"));
        b.querySelector(".exp-end").value = e.end || "";
        b.querySelector(".exp-highlights-pt").value = e.highlights || "";
      });
    } else {
      adicionarExperiencia();
    }

    if (r.education?.length) {
      r.education.forEach((e) => {
        adicionarFormacao();
        const b = document.getElementById(`edu-${eduCount - 1}`);
        b.querySelector(".edu-institution").value = e.institution || "";
        b.querySelector(".edu-area-pt").value = e.area || "";
        b.querySelector(".edu-start").value = e.start || "";
        b.querySelector(".edu-current").checked = e.isCurrent || false;
        toggleDataFim(b.querySelector(".edu-current"));
        b.querySelector(".edu-end").value = e.end || "";
        b.querySelector(".edu-status").value = e.status || "";
      });
    } else {
      adicionarFormacao();
    }

    if (r.courses?.length) {
      r.courses.forEach((c) => {
        adicionarCurso();
        const b = document.getElementById(`curso-${cursoCount - 1}`);
        b.querySelector(".curso-name").value = c.name || "";
        b.querySelector(".curso-inst").value = c.institution || "";
        b.querySelector(".curso-year").value = c.year || "";
      });
    } else {
      adicionarCurso();
    }

    if (r.projects?.length) {
      r.projects.forEach((p) => {
        adicionarProjeto();
        const b = document.getElementById(`proj-${projCount - 1}`);
        b.querySelector(".proj-name").value = p.name || "";
        b.querySelector(".proj-tech").value = p.tech || "";
        b.querySelector(".proj-link").value = p.link || "";
        b.querySelector(".proj-desc-pt").value = p.desc || "";
      });
    } else {
      adicionarProjeto();
    }

    mostrarNotificacao("Currículo carregado com sucesso!", "info");
  } catch (e) {
    // Se der erro ou não tiver dados, garante que o formulário tenha exatamente um bloco de cada
    if (expCount === 0) adicionarExperiencia();
    if (eduCount === 0) adicionarFormacao();
    if (cursoCount === 0) adicionarCurso();
    if (projCount === 0) adicionarProjeto();
  } finally {
    isLoadingResume = false;
  }
}

function limparFormulario() {
  document.getElementById("cv-form").reset();
  document.getElementById("experiencias-container").innerHTML = "";
  document.getElementById("formacao-container").innerHTML = "";
  document.getElementById("cursos-container").innerHTML = "";
  document.getElementById("projetos-container").innerHTML = "";
  expCount = 0;
  eduCount = 0;
  projCount = 0;
  cursoCount = 0;
  adicionarExperiencia();
  adicionarFormacao();
  adicionarCurso();
  adicionarProjeto();
}

function mostrarStatusSalvamento(s = true) {
  const i = document.getElementById("save-status-indicator");
  if (!i) return;
  if (s) {
    i.classList.add("saving");
    i.style.display = "block";
    document.getElementById("save-status-text").textContent = "Salvando...";
  } else {
    i.classList.remove("saving");
    document.getElementById("save-status-text").textContent = "Salvo";
    setTimeout(() => (i.style.display = "none"), 2000);
  }
}

function mostrarNotificacao(m, t = "info") {
  const c = document.getElementById("notificacoes-container");
  if (!c) return;
  const a = document.createElement("div");
  a.className = `alert alert-${t} alert-dismissible fade show`;
  a.innerHTML = `${m}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  c.appendChild(a);
  setTimeout(() => a.remove(), 5000);
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

document
  .getElementById("cv-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!this.checkValidity()) {
      this.classList.add("was-validated");
      alert("Verifique os campos obrigatórios.");
      return;
    }
    if (!currentUser) {
      new bootstrap.Modal(document.getElementById("authModal")).show();
      return;
    }
    const b = document.getElementById("btn-gerar");
    const h = b.innerHTML;
    b.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Gerando...';
    b.disabled = true;
    await salvarDadosNuvem();
    const p = {
      lang: document.getElementById("idioma_escolhido").value,
      basics: {
        name: document.getElementById("name").value,
        label_pt: document.getElementById("label_pt").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        location: `${document.getElementById("cidade").value}, ${document.getElementById("estado").value}`,
        linkedin: document.getElementById("linkedin").value,
        github: document.getElementById("github").value,
      },
      summary: { pt: [document.getElementById("summary_pt").value] },
      experience: document.getElementById("include-experience").checked
        ? Array.from(document.querySelectorAll(".exp-block")).map((b) => ({
            company: b.querySelector(".exp-company").value,
            position_pt: b.querySelector(".exp-position-pt").value,
            startDate: formatarDataMesAno(b.querySelector(".exp-start").value),
            endDate: b.querySelector(".exp-current").checked
              ? "Presente"
              : formatarDataMesAno(b.querySelector(".exp-end").value),
            highlights_pt: b
              .querySelector(".exp-highlights-pt")
              .value.split(";")
              .map((i) => i.trim())
              .filter((i) => i),
          }))
        : [],
      education: document.getElementById("include-education").checked
        ? Array.from(document.querySelectorAll(".edu-block")).map((b) => ({
            institution: b.querySelector(".edu-institution").value,
            area_pt: b.querySelector(".edu-area-pt").value,
            startDate: formatarDataMesAno(b.querySelector(".edu-start").value),
            endDate: b.querySelector(".edu-current").checked
              ? "Presente"
              : formatarDataMesAno(b.querySelector(".edu-end").value),
            status_pt: b.querySelector(".edu-status").value,
          }))
        : [],
      courses: document.getElementById("include-courses").checked
        ? Array.from(document.querySelectorAll(".curso-block")).map((b) => ({
            name_pt: b.querySelector(".curso-name").value,
            institution: b.querySelector(".curso-inst").value,
            year: b.querySelector(".curso-year").value,
          }))
        : [],
      projects: document.getElementById("include-projects").checked
        ? Array.from(document.querySelectorAll(".proj-block")).map((b) => ({
            name: b.querySelector(".proj-name").value,
            technologies: b.querySelector(".proj-tech").value,
            link: b.querySelector(".proj-link").value,
            description_pt: b.querySelector(".proj-desc-pt").value,
          }))
        : [],
      skills: {
        technical: document
          .getElementById("skills")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      },
    };
    try {
      const res = await fetch("/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (!res.ok) {
        let mensagem = "Erro ao gerar PDF.";
        try {
          const erroJson = await res.json();
          mensagem = erroJson.erro || mensagem;
        } catch (_) {
          // resposta de erro não veio em JSON, mantém mensagem padrão
        }
        mostrarNotificacao(mensagem, "danger");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${document.getElementById("name").value.trim().replace(/\s+/g, "_")}_curriculo.pdf`;
      a.click();
      mostrarNotificacao("PDF gerado com sucesso!", "success");
    } catch (err) {
      mostrarNotificacao("Erro ao gerar PDF.", "danger");
    } finally {
      b.innerHTML = h;
      b.disabled = false;
    }
  });
