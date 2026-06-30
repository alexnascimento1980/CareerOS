# CareerOS - Gerador de Currículo ATS Bilíngue

O **CareerOS** é uma aplicação web full-stack desenvolvida para gerar currículos profissionais otimizados para sistemas ATS (Applicant Tracking Systems). Ele recebe dados estruturados através de uma interface dinâmica, processa as informações no backend e compila um documento PDF com design limpo utilizando o motor de tipografia LaTeX.

## 🚀 Funcionalidades

* **Interface Dinâmica:** Formulário construído com Vanilla JS e Bootstrap, permitindo a adição e remoção de blocos (Experiências, Formações, Cursos, Projetos) sob demanda.
* **Validação de Dados:** Máscaras e expressões regulares (Regex) rigorosas para datas, links, e-mails e telefones, garantindo a integridade do PDF final.
* **Tradução Automática (IA):** Integração com o Google Translate via backend. Com um clique, todo o currículo preenchido em Português é automaticamente traduzido e renderizado com cabeçalhos em Inglês.
* **Seções Condicionais:** Ocultação inteligente da seção de "Projetos Técnicos" (útil para transições de carreira entre gestão e tecnologia).
* **Motor LaTeX:** Renderização de alta precisão tipográfica em PDF, utilizando Jinja2 para injetar dados dinâmicos no template `.tex`.
* **Pronto para a Nuvem:** Arquitetura 100% dockerizada para deploy fácil em plataformas como Render ou Railway.

## 🛠️ Tecnologias Utilizadas

**Frontend:**
* HTML5 & CSS3
* JavaScript (ES6+)
* Bootstrap 5

**Backend & Infraestrutura:**
* Python 3.10+
* Flask (Web Framework)
* Jinja2 (Templating)
* deep-translator (API de Tradução)
* TeX Live / pdflatex (Motor PDF)
* Docker & Gunicorn (Deploy e Servidor de Produção)

## 📂 Estrutura do Projeto

```text
career-os/
├── templates/
│   └── base_ats.tex       # Template do currículo em LaTeX
├── app.py                 # Servidor Flask e rotas da API
├── index.html             # Interface do usuário (Formulário)
├── script.js              # Lógica de captura e envio de dados (Frontend)
├── requirements.txt       # Dependências do Python
├── Dockerfile             # Receita de infraestrutura para nuvem
├── .dockerignore          # Arquivos ignorados na build do Docker
└── README.md              # Documentação do projeto