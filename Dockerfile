# 1. Usa uma imagem oficial do Python, leve e baseada em Linux (Debian)
FROM python:3.10-slim

# 2. Define a pasta onde tudo vai acontecer dentro do container
WORKDIR /app

# 3. Instala o pdflatex e os pacotes extras (para o tabularx e enumitem funcionarem)
# O comando rm -rf limpa o cache após instalar, deixando a imagem mais leve
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

# 4. Copia apenas o arquivo de dependências primeiro
COPY requirements.txt .

# 5. Instala as bibliotecas do Python (Flask, Jinja2, tradutor, etc.)
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copia todo o resto do seu projeto (HTML, JS, app.py, pasta templates)
COPY . .

# 7. Informa que o container vai se comunicar pela porta 5000
EXPOSE 5000

# 8. Liga o servidor usando o Gunicorn em vez do Flask puro.
# --timeout 90: cada requisição pode envolver chamadas de tradução (rede) +
# compilação LaTeX (até 30s pelo próprio timeout do subprocess em app.py);
# o padrão do Gunicorn (30s) poderia matar o worker no meio do processo,
# gerando um 502 feio em vez do erro tratado que o app.py devolveria sozinho.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "90", "app:app"]