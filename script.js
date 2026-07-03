// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const supabaseUrl = "https://vaiedrsonmktbnkcktqv.supabase.co";
const supabaseKey = "sb_publishable_K1kdVFqNe9olG91GCEe-rg_D6BcQZk8";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let isSavingToCloud = false;
let currentResumeId = null;
let currentResumeName = "Novo Currículo";

// ==========================================
// LÓGICA DE AUTENTICAÇÃO
// ==========================================
async function checarSessao() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  atualizarUIAuth(session?.user || null);
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    atualizarUIAuth(session?.user || null);
  });
}

function atualizarUIAuth(user) {
  currentUser = user;
  const bannerLogin = document.getElementById("login-banner");
  const bannerLogged = document.getElementById("logged-banner");

  if (user) {
    bannerLogin.style.setProperty("display", "none", "important");
    bannerLogged.style.setProperty("display", "flex", "important");
    carregarListaCurriculos();
  } else {
    bannerLogin.style.setProperty("display", "flex", "important");
    bannerLogged.style.setProperty("display", "none", "important");
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
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) { errorDiv.textContent = error.message; errorDiv.style.display = "block"; }
  else { alert("Conta criada com sucesso!"); bootstrap.Modal.getInstance(document.getElementById("authModal")).hide(); }
}

async function fazerLogin() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const errorDiv = document.getElementById("auth-error");
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { errorDiv.textContent = "Falha no login."; errorDiv.style.display = "block"; }
  else { bootstrap.Modal.getInstance(document.getElementById("authModal")).hide(); }
}

async function loginComGoogle() {
  await supabaseClient.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
}

async function fazerLogout() {
  await supabaseClient.auth.signOut();
  window.location.reload();
}

// ==========================================
// GESTÃO DE MÚLTIPLOS CURRÍCULOS
// ==========================================
async function carregarListaCurriculos() {
  if (!currentUser) return;
  const { data, error } = await supabaseClient
    .from("curriculos")
    .select("id, resume_name, updated_at")
    .eq("user_id", currentUser.id)
    .order("updated_at", { ascending: false });

  const list = document.getElementById("resumesList");
  list.innerHTML = "";

  if (data && data.length > 0) {
    data.forEach(r => {
      const activeClass = r.id === currentResumeId ? "active" : "";
      const date = new Date(r.updated_at).toLocaleDateString("pt-BR");
      list.innerHTML += `
        <div class="resume-item ${activeClass}" onclick="carregarCurriculo('${r.id}')">
          <div>
            <div class="fw-bold">${r.resume_name} ${r.id === currentResumeId ? '<span class="badge-current">Editando</span>' : ''}</div>
            <div class="resume-item-date">Atualizado em ${date}</div>
          </div>
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-danger border-0" onclick="event.stopPropagation(); deletarCurriculo('${r.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>`;
    });
    // Se nenhum estiver selecionado, carrega o primeiro da lista
    if (!currentResumeId) carregarCurriculo(data[0].id);
  } else {
    list.innerHTML = '<div class="p-4 text-center text-muted">Nenhum currículo salvo.</div>';
    abrirModalNovoCurriculo();
  }
}

function abrirModalNovoCurriculo() {
  document.getElementById("resumeNameInput").value = "";
  const modal = new bootstrap.Modal(document.getElementById("resumeModal"));
  document.getElementById("saveResumeNameBtn").onclick = () => {
    const nome = document.getElementById("resumeNameInput").value.trim();
    if (nome) { criarNovoCurriculo(nome); modal.hide(); }
  };
  modal.show();
}

async function criarNovoCurriculo(nome) {
  const novo = {
    user_id: currentUser.id,
    resume_name: nome,
    dados: { basics: { name: "" }, summary: { pt: [""] }, experience: [], education: [], courses: [], projects: [], skills: { technical: [] } }
  };
  const { data, error } = await supabaseClient.from("curriculos").insert(novo).select();
  if (!error) {
    currentResumeId = data[0].id;
    currentResumeName = nome;
    carregarCurriculo(data[0].id);
  }
}

async function carregarCurriculo(id) {
  currentResumeId = id;
  const { data, error } = await supabaseClient.from("curriculos").select("*").eq("id", id).single();
  if (data) {
    currentResumeName = data.resume_name;
    document.getElementById("current-resume-title").textContent = data.resume_name;
    preencherFormulario(data.dados);
    carregarListaCurriculos();
    bootstrap.Offcanvas.getInstance(document.getElementById("resumePanel"))?.hide();
  }
}

async function deletarCurriculo(id) {
  if (confirm("Deseja excluir este currículo permanentemente?")) {
    await supabaseClient.from("curriculos").delete().eq("id", id);
    if (currentResumeId === id) { currentResumeId = null; limparFormulario(); }
    carregarListaCurriculos();
  }
}

// ==========================================
// FORMULÁRIO E DINÂMICOS
// ==========================================
let expCount = 0, eduCount = 0, projCount = 0, cursoCount = 0;

function adicionarExperiencia() {
  const id = expCount++;
  const html = `
    <div class="card mb-3 exp-block border-start border-primary border-4 fade-in" id="exp-${id}">
      <div class="card-body">
        <div class="d-flex justify-content-between mb-3">
          <h6 class="text-primary fw-bold">Experiência</h6>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="document.getElementById('exp-${id}').remove(); agendarSalvamentoNuvem();">Remover</button>
        </div>
        <div class="row mb-2">
          <div class="col-md-6"><label class="form-label small">Empresa</label><input type="text" class="form-control exp-company" required></div>
          <div class="col-md-6"><label class="form-label small">Cargo</label><input type="text" class="form-control exp-position-pt" required></div>
        </div>
        <div class="row mb-2">
          <div class="col-md-6"><label class="form-label small">Início</label><input type="month" class="form-control exp-start" required></div>
          <div class="col-md-6"><label class="form-label small">Fim</label><input type="month" class="form-control exp-end" required>
            <div class="form-check mt-1"><input class="form-check-input exp-current" type="checkbox" onchange="this.previousElementSibling.disabled = this.checked"> <label class="small">Atual</label></div>
          </div>
        </div>
        <textarea class="form-control exp-highlights-pt" rows="2" placeholder="Atividades..."></textarea>
      </div>
    </div>`;
  document.getElementById("experiencias-container").insertAdjacentHTML("beforeend", html);
}

function adicionarFormacao() {
  const id = eduCount++;
  const html = `
    <div class="card mb-3 edu-block border-start border-info border-4 fade-in" id="edu-${id}">
      <div class="card-body">
        <div class="d-flex justify-content-between mb-3"><h6>Formação</h6><button type="button" class="btn btn-sm btn-outline-danger" onclick="document.getElementById('edu-${id}').remove(); agendarSalvamentoNuvem();">Remover</button></div>
        <div class="row mb-2">
          <div class="col-md-6"><input type="text" class="form-control edu-institution" placeholder="Instituição"></div>
          <div class="col-md-6"><input type="text" class="form-control edu-area-pt" placeholder="Curso"></div>
        </div>
        <div class="row">
          <div class="col-md-4"><input type="month" class="form-control edu-start"></div>
          <div class="col-md-4"><input type="month" class="form-control edu-end"></div>
          <div class="col-md-4"><input type="text" class="form-control edu-status" placeholder="Status"></div>
        </div>
      </div>
    </div>`;
  document.getElementById("formacao-container").insertAdjacentHTML("beforeend", html);
}

function adicionarCurso() {
  const id = cursoCount++;
  const html = `<div class="card mb-3 curso-block border-start border-success border-4" id="curso-${id}"><div class="card-body d-flex gap-2 align-items-center"><input type="text" class="form-control curso-name" placeholder="Curso"><input type="text" class="form-control curso-inst" placeholder="Instituição"><input type="number" class="form-control curso-year" style="width:100px"><button type="button" class="btn btn-sm btn-outline-danger" onclick="document.getElementById('curso-${id}').remove(); agendarSalvamentoNuvem();">X</button></div></div>`;
  document.getElementById("cursos-container").insertAdjacentHTML("beforeend", html);
}

function adicionarProjeto() {
  const id = projCount++;
  const html = `<div class="card mb-3 proj-block border-start border-warning border-4" id="proj-${id}"><div class="card-body"><div class="d-flex justify-content-between mb-2"><h6>Projeto</h6><button type="button" class="btn btn-sm btn-outline-danger" onclick="document.getElementById('proj-${id}').remove(); agendarSalvamentoNuvem();">X</button></div><div class="row mb-2"><div class="col-md-4"><input type="text" class="form-control proj-name" placeholder="Nome"></div><div class="col-md-4"><input type="text" class="form-control proj-tech" placeholder="Techs"></div><div class="col-md-4"><input type="text" class="form-control proj-link" placeholder="Link"></div></div><textarea class="form-control proj-desc-pt" rows="2" placeholder="Descrição..."></textarea></div></div>`;
  document.getElementById("projetos-container").insertAdjacentHTML("beforeend", html);
}

// ==========================================
// PERSISTÊNCIA
// ==========================================
let timeoutSalvar;
function agendarSalvamentoNuvem() {
  if (!currentUser || !currentResumeId) return;
  clearTimeout(timeoutSalvar);
  timeoutSalvar = setTimeout(salvarDadosNuvem, 1500);
}

async function salvarDadosNuvem() {
  if (!currentUser || !currentResumeId || isSavingToCloud) return;
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
    skills: { technical: document.getElementById("skills").value.split(",").map(s => s.trim()).filter(s => s) },
    experience: Array.from(document.querySelectorAll(".exp-block")).map(b => ({
      company: b.querySelector(".exp-company").value,
      position: b.querySelector(".exp-position-pt").value,
      start: b.querySelector(".exp-start").value,
      end: b.querySelector(".exp-end").value,
      isCurrent: b.querySelector(".exp-current").checked,
      highlights: b.querySelector(".exp-highlights-pt").value,
    })),
    education: Array.from(document.querySelectorAll(".edu-block")).map(b => ({
      institution: b.querySelector(".edu-institution").value,
      area: b.querySelector(".edu-area-pt").value,
      start: b.querySelector(".edu-start").value,
      end: b.querySelector(".edu-end").value,
      status: b.querySelector(".edu-status").value,
    })),
    courses: Array.from(document.querySelectorAll(".curso-block")).map(b => ({
      name: b.querySelector(".curso-name").value,
      institution: b.querySelector(".curso-inst").value,
      year: b.querySelector(".curso-year").value,
    })),
    projects: Array.from(document.querySelectorAll(".proj-block")).map(b => ({
      name: b.querySelector(".proj-name").value,
      tech: b.querySelector(".proj-tech").value,
      link: b.querySelector(".proj-link").value,
      desc: b.querySelector(".proj-desc-pt").value,
    })),
  };

  await supabaseClient.from("curriculos").update({ dados: r, updated_at: new Date().toISOString() }).eq("id", currentResumeId);
  isSavingToCloud = false;
  mostrarStatusSalvamento(false);
}

function preencherFormulario(r) {
  document.getElementById("cv-form").reset();
  document.getElementById("experiencias-container").innerHTML = "";
  document.getElementById("formacao-container").innerHTML = "";
  document.getElementById("cursos-container").innerHTML = "";
  document.getElementById("projetos-container").innerHTML = "";
  expCount = 0; eduCount = 0; projCount = 0; cursoCount = 0;

  if (!r) return;
  document.getElementById("name").value = r.basics?.name || "";
  document.getElementById("label_pt").value = r.basics?.label_pt || "";
  document.getElementById("email").value = r.basics?.email || "";
  document.getElementById("phone").value = r.basics?.phone || "";
  document.getElementById("linkedin").value = r.basics?.linkedin || "";
  document.getElementById("github").value = r.basics?.github || "";
  document.getElementById("summary_pt").value = r.summary?.pt?.[0] || "";
  document.getElementById("skills").value = r.skills?.technical?.join(", ") || "";
  
  if (r.basics?.estado) {
    document.getElementById("estado").value = r.basics.estado;
    carregarCidades(r.basics.estado).then(() => { if (r.basics.cidade) document.getElementById("cidade").value = r.basics.cidade; });
  }

  r.experience?.forEach(e => {
    adicionarExperiencia();
    const b = document.getElementById(`exp-${expCount-1}`);
    b.querySelector(".exp-company").value = e.company;
    b.querySelector(".exp-position-pt").value = e.position;
    b.querySelector(".exp-start").value = e.start;
    b.querySelector(".exp-current").checked = e.isCurrent;
    b.querySelector(".exp-end").value = e.end;
    b.querySelector(".exp-highlights-pt").value = e.highlights;
  });

  r.education?.forEach(e => {
    adicionarFormacao();
    const b = document.getElementById(`edu-${eduCount-1}`);
    b.querySelector(".edu-institution").value = e.institution;
    b.querySelector(".edu-area-pt").value = e.area;
    b.querySelector(".edu-start").value = e.start;
    b.querySelector(".edu-end").value = e.end;
    b.querySelector(".edu-status").value = e.status;
  });

  r.courses?.forEach(c => {
    adicionarCurso();
    const b = document.getElementById(`curso-${cursoCount-1}`);
    b.querySelector(".curso-name").value = c.name;
    b.querySelector(".curso-inst").value = c.institution;
    b.querySelector(".curso-year").value = c.year;
  });

  r.projects?.forEach(p => {
    adicionarProjeto();
    const b = document.getElementById(`proj-${projCount-1}`);
    b.querySelector(".proj-name").value = p.name;
    b.querySelector(".proj-tech").value = p.tech;
    b.querySelector(".proj-link").value = p.link;
    b.querySelector(".proj-desc-pt").value = p.desc;
  });

  // Garante pelo menos um bloco se vazio
  if (expCount === 0) adicionarExperiencia();
  if (eduCount === 0) adicionarFormacao();
}

function limparFormulario() {
  document.getElementById("cv-form").reset();
  document.getElementById("current-resume-title").textContent = "Nenhum selecionado";
  currentResumeId = null;
  preencherFormulario(null);
}

function mostrarStatusSalvamento(s) {
  const i = document.getElementById("save-status-indicator");
  if (s) { i.classList.add("saving"); i.style.display = "block"; }
  else { i.classList.remove("saving"); setTimeout(() => i.style.display = "none", 2000); }
}

function mostrarNotificacao(m, t) {
  const c = document.getElementById("notificacoes-container");
  const a = document.createElement("div");
  a.className = `alert alert-${t} alert-dismissible fade show`;
  a.innerHTML = `${m}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  c.appendChild(a);
  setTimeout(() => a.remove(), 4000);
}

async function carregarEstados() {
  const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
  const data = await res.json();
  const s = document.getElementById("estado");
  s.innerHTML = '<option value="" disabled selected>Estado...</option>';
  data.forEach(e => s.innerHTML += `<option value="${e.sigla}">${e.nome}</option>`);
}

async function carregarCidades(uf) {
  const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
  const data = await res.json();
  const s = document.getElementById("cidade");
  s.innerHTML = '<option value="" disabled selected>Cidade...</option>';
  data.forEach(c => s.innerHTML += `<option value="${c.nome}">${c.nome}</option>`);
  s.disabled = false;
}

document.getElementById("estado").addEventListener("change", (e) => carregarCidades(e.target.value));
document.getElementById("cv-form").addEventListener("input", agendarSalvamentoNuvem);

window.onload = () => { carregarEstados(); checarSessao(); };

document.getElementById("cv-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  if (!this.checkValidity()) { this.classList.add("was-validated"); return; }
  const b = document.getElementById("btn-gerar");
  b.disabled = true;
  await salvarDadosNuvem();
  alert("Gerando PDF... (Simulação)");
  b.disabled = false;
});
