# 📄 Resume as Code: Automação de Currículo com Python e LaTeX

Este repositório contém a arquitetura do meu currículo automatizado. Em vez de editar documentos de texto estáticos, utilizo uma abordagem orientada a dados para gerenciar minha trajetória profissional e acadêmica.

## ⚙️ Como funciona a arquitetura

1. **Base de Dados (`dados.json`):** Todas as minhas informações (experiências, educação, habilidades) ficam centralizadas em um único arquivo JSON, suportando múltiplos idiomas.
2. **Motor de Renderização (`gerador.py`):** Um script em Python, utilizando a biblioteca **Jinja2**, lê os dados do JSON e injeta as variáveis dinamicamente em templates.
3. **Templates Modulares (`/templates`):** Esqueletos em LaTeX limpos e separados por caso de uso.
4. **Saída (`/saida`):** O script gera instantaneamente os arquivos `.tex` finais em duas versões (Design Visual e formato ATS), tanto em português quanto em inglês.
5. **Compilação:** Os arquivos de saída são compilados em PDF de alta qualidade.

Automação de CV ati

## 🚀 Tecnologias Utilizadas

- **Python** (Lógica, manipulação de JSON e I/O)
- **Jinja2** (Motor de templates)
- **LaTeX** (Tipografia e estruturação de documentos)
- **Git/GitHub** (Versionamento de código)
