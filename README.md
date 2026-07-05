# CareerOS — Gerador de Currículo ATS Bilíngue

O **CareerOS** é uma aplicação web full-stack para gerar currículos profissionais otimizados para sistemas ATS (Applicant Tracking Systems). O candidato preenche um formulário dinâmico, o backend valida e processa os dados, e um PDF é compilado com o motor de tipografia LaTeX — com suporte a múltiplos currículos salvos por usuário e tradução automática para inglês.

## 🚀 Funcionalidades

- **Múltiplos currículos por usuário:** crie, liste, alterne, renomeie e exclua diferentes versões do currículo (ex: uma para vagas de gestão, outra para tecnologia), todas salvas na nuvem.
- **Autenticação completa:** cadastro e login por e-mail/senha, login com Google (OAuth), e recuperação de senha por e-mail — tudo via Supabase Auth.
- **Interface dinâmica:** formulário em Vanilla JS + Bootstrap, com blocos repetíveis (Experiências, Formações, Cursos, Projetos) adicionados/removidos sob demanda.
- **Seções opcionais ("Incluir no PDF?"):** cada seção (Experiência, Formação, Cursos, Projetos) pode ser individualmente incluída ou ocultada do documento final, sem exigir preenchimento de seções que o candidato não quer usar.
- **Tradução automática (PT → EN):** com um clique, todo o conteúdo do currículo é traduzido para inglês. Se o serviço de tradução falhar, o sistema recusa gerar o PDF em vez de entregar um documento parcialmente traduzido.
- **Motor LaTeX:** renderização de alta precisão tipográfica via Jinja2 injetando dados no template `.tex`, com escaping automático de caracteres especiais (`&`, `%`, `#`, `_`, etc.) para evitar quebra de compilação.
- **Backup automático diário:** workflow do GitHub Actions que exporta os dados dos currículos todo dia, já que o plano gratuito do Supabase não inclui backups.
- **Pronto para produção:** Docker + Gunicorn, rate limiting, CORS restrito, e modo debug desligado por padrão.

## 🔒 Segurança

Pontos que receberam atenção específica durante o desenvolvimento:

- **Row Level Security (RLS)** no Postgres/Supabase: cada usuário só acessa seus próprios currículos, reforçado por políticas de `SELECT`/`INSERT`/`UPDATE`/`DELETE`.
- **Validação rigorosa no backend:** tipos, tamanhos, limites de itens e formato de campos (e-mail, LinkedIn, GitHub) são checados no servidor, não só no navegador.
- **Escaping de LaTeX:** entradas do usuário nunca são injetadas cruas no template, prevenindo tanto falhas de compilação quanto injeção de comandos LaTeX.
- **Rate limiting** no endpoint de geração de PDF (10/min, 60/hora), já que cada requisição dispara compilação LaTeX (uso pesado de CPU).
- **Mensagens de erro genéricas** para o cliente — detalhes internos (stack traces, caminhos de arquivo) ficam só no log do servidor.

## 🧪 Testes Automatizados

O backend tem uma suíte com **42 testes** (`pytest`), cobrindo validação de dados, escaping de LaTeX, normalização de URLs, e o endpoint de geração de PDF de ponta a ponta (incluindo compilação real com `pdflatex`). Roda automaticamente via GitHub Actions a cada push/PR.

## 🛠️ Tecnologias Utilizadas

**Frontend:**

- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5
- Supabase JS Client (autenticação e banco de dados)

**Backend & Infraestrutura:**

- Python 3.12+, Flask
- Jinja2 (templating do LaTeX)
- Flask-Limiter (rate limiting), Flask-Cors
- deep-translator (tradução PT → EN)
- TeX Live / pdflatex (motor de PDF)
- Supabase (PostgreSQL + Auth + RLS)
- Docker & Gunicorn (deploy e servidor de produção)
- pytest (testes automatizados)
- GitHub Actions (CI de testes + backup diário)

## 📂 Estrutura do Projeto

```text
CareerOS/
├── .github/
│   └── workflows/
│       ├── tests.yml              # CI: roda a suíte de testes a cada push/PR
│       └── backup_supabase.yml    # Backup diário automático da tabela curriculos
├── templates/
│   └── base_ats.tex               # Template do currículo em LaTeX
├── tests/
│   └── test_app.py                # Suíte de testes automatizados (pytest)
├── app.py                         # Servidor Flask e rotas da API
├── latex_utils.py                 # Escaping de caracteres especiais do LaTeX
├── index.html                     # Interface do usuário (formulário)
├── script.js                      # Lógica de frontend (auth, currículos, envio de dados)
├── requirements.txt                # Dependências de produção
├── requirements-dev.txt           # Dependências de desenvolvimento/teste
├── Dockerfile                     # Receita de infraestrutura para nuvem
├── .dockerignore
├── .gitignore
└── README.md
```

## ▶️ Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/alexnascimento1980/CareerOS.git
cd CareerOS

# 2. Crie e ative um ambiente virtual
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure as credenciais do Supabase em script.js
#    (supabaseUrl e supabaseKey no topo do arquivo)

# 5. Rode o servidor
python app.py
```

Acesse `http://127.0.0.1:5000`. É necessário ter o TeX Live (`pdflatex`) instalado no sistema para a geração de PDF funcionar.

Para rodar os testes automatizados:

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```

## 🗺️ Roadmap

- [ ] Aplicativo mobile (Android/iOS) reaproveitando a interface atual via Capacitor
