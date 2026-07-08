# 📄 Relatório Técnico e Documentação de Deploy: Currícula

**Projeto:** Currícula - Gerador de Currículo ATS Bilíngue Inteligente
**Autor:** Alex Aparecido Pereira do Nascimento
**Repositório:** [https://github.com/alexnascimento1980/curricula](https://github.com/alexnascimento1980/curricula)

---

## 1. Visão Geral do Produto

O **Currícula** é uma aplicação web full-stack projetada para solucionar a ineficiência na criação de currículos otimizados para sistemas ATS (Applicant Tracking Systems).

Idealizado para suportar profissionais com perfis híbridos e em transição de carreira (como a intersecção entre Logística Operacional e Ciência de Dados), o sistema permite a geração dinâmica de currículos em formato PDF de alta precisão tipográfica, utilizando processamento backend e templates dinâmicos.

![Print da Tela Inicial do Currícula](caminho_para_sua_imagem_1.png)
_(Figura 1: Interface principal do Currícula com design responsivo em Bootstrap 5)_

---

## 2. Arquitetura do Sistema

A aplicação adota uma arquitetura Cliente-Servidor clássica, conteinerizada para garantir alta portabilidade e escalabilidade.

### 2.1. Frontend (Interface do Usuário)

- **Core:** HTML5, CSS3 e Vanilla JavaScript (ES6+).
- **UI/UX:** Bootstrap 5 para responsividade e FontAwesome para iconografia.
- **Gerenciamento de Estado:** Utilização da API nativa `localStorage` para implementar uma rotina de _Auto-Save_, garantindo persistência de dados no lado do cliente (Zero Data Loss) sem a necessidade de um banco de dados relacional.
- **Integrações Assíncronas:** Consumo da API pública do IBGE via `fetch` para renderização dinâmica de cascatas de localização (Estado -> Cidade).

### 2.2. Backend (Processamento e Renderização)

- **Framework:** Python 3.10+ operando com Flask e Gunicorn (WSGI HTTP Server para produção).
- **Motor de Tradução:** Integração com a biblioteca `deep-translator` para chamadas em tempo real à IA do Google Translate, gerando matrizes bilíngues do documento (Português/Inglês).
- **Motor de Tipografia:** Uso do sistema **LaTeX** (`pdflatex`) injetado via **Jinja2**. Essa abordagem garante alinhamento matemático perfeito das margens, eliminando tabelas complexas e gerando um binário PDF otimizado para a leitura de robôs de recrutamento.

![Diagrama Arquitetural](caminho_para_sua_imagem_2.png)
_(Figura 2: Fluxo de dados e compilação do documento PDF)_

---

## 3. Funcionalidades de Destaque

1. **Seccionamento Condicional (Toggle):**
   - Implementação de uma chave seletora que injeta ou remove a obrigatoriedade (DOM `required`) da seção de "Projetos Técnicos". Permite exportar um documento estritamente voltado para gestão ou um documento híbrido voltado para tecnologia.
2. **Máscaras e Validação (Regex):**
   - Algoritmos de sanitização no Frontend para campos de telefone, datas (conversão de calendário nativo para formato MM/AAAA) e validação de URIs (LinkedIn e GitHub).
3. **Tradução Silenciosa e Nomenclatura Automática:**
   - O sistema altera os cabeçalhos fixos no nível do template `.tex` e os textos dinâmicos no nível do payload JSON.
   - O binário final é devolvido ao navegador já formatado com o nome do candidato (ex: `Alex_Nascimento_curriculo_en.pdf`).

---

## 4. Documentação de Deploy (Render / Docker)

A aplicação foi desenhada com infraestrutura como código (IaC) utilizando Docker, isolando as pesadas dependências do ambiente LaTeX do sistema operacional base.

### 4.1. Estrutura do Container (`Dockerfile`)

O ambiente de produção é construído sobre uma imagem leve (`python:3.10-slim`). Durante o _build_, o gerenciador de pacotes (`apt-get`) instala as dependências mínimas do TeX Live, enquanto o `pip` resolve o ecossistema Python.

### 4.2. Fluxo de Publicação Contínua no Render

O ambiente de produção está hospedado no Render.com, vinculado diretamente à branch `main` do repositório GitHub.

**Passo a Passo de Setup:**

1. Conexão do repositório no dashboard do Render como um **Web Service**.
2. Definição do Runtime para **Docker**.
3. Exposição da porta padrão (`5000`) comandada pelo Gunicorn:
   `CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]`

![Print do painel do Render](caminho_para_sua_imagem_3.png)
_(Figura 3: Monitoramento de deploy contínuo no ambiente Render)_

### 4.3. Instalação e Execução Local (Modo Desenvolvedor)

Caso seja necessário depurar a aplicação em ambiente de desenvolvimento isolado, basta possuir o Docker instalado e executar a seguinte cadeia no terminal:

```bash
# 1. Clonar o projeto
git clone [https://github.com/alexnascimento1980/curricula.git](https://github.com/alexnascimento1980/curricula.git)
cd curricula

# 2. Construir a imagem (Download do Ubuntu, Python e dependências LaTeX)
docker build -t career-os-local .

# 3. Executar o container realizando o mapeamento de portas
docker run -p 5000:5000 career-os-local
```
