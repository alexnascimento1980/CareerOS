import os
import subprocess
import tempfile
import io
import time
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from jinja2 import Environment, FileSystemLoader
from deep_translator import GoogleTranslator
import concurrent.futures
from latex_utils import escapar_latex

app = Flask(__name__, static_folder='.')

# Protege contra payloads absurdamente grandes (abuso/DoS via pdflatex).
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2 MB

# Em produção, defina ALLOWED_ORIGINS (separado por vírgulas) para restringir
# quem pode chamar a API. Em desenvolvimento, libera tudo por padrão.
_origins_env = os.environ.get('ALLOWED_ORIGINS', '*')
_allowed_origins = '*' if _origins_env == '*' else [
    o.strip() for o in _origins_env.split(',') if o.strip()]
CORS(app, resources={r"/generate-cv": {"origins": _allowed_origins}})

# Cada chamada a /generate-cv dispara tradução (chamadas de rede) + compilação
# LaTeX (uso pesado de CPU). Sem limite, uma única pessoa poderia sobrecarregar
# o servidor repetindo a requisição. Os limites usam o IP por padrão; em
# produção atrás de um proxy/load balancer, configure X-Forwarded-For.
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://",
)


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')


def normalizar_url_perfil(valor):
    """Remove https://, http:// e www. do início, já que o template monta
    o link como https://{{ valor }} — se o usuário colar a URL completa
    (o normal ao copiar do navegador), o link final ficaria duplicado e
    quebrado (https://https://...)."""
    valor = str(valor or '').strip()
    for prefixo in ('https://', 'http://'):
        if valor.lower().startswith(prefixo):
            valor = valor[len(prefixo):]
            break
    if valor.lower().startswith('www.'):
        valor = valor[4:]
    return valor


def validar_dados_cv(data):
    if not data or not isinstance(data, dict):
        return False, "O payload deve ser um objeto JSON válido."

    lang = data.get('lang', 'pt')
    if lang not in ('pt', 'en'):
        return False, "O campo 'lang' deve ser 'pt' ou 'en'."

    # --- basics (obrigatório) ---
    basics = data.get('basics')
    if not isinstance(basics, dict):
        return False, "O bloco 'basics' é obrigatório e deve ser um objeto."
    if not str(basics.get('name', '')).strip():
        return False, "O campo 'basics.name' é obrigatório."
    if len(str(basics.get('name', ''))) > 200:
        return False, "O campo 'basics.name' excede o tamanho máximo permitido."
    email = str(basics.get('email', '')).strip()
    if not email or '@' not in email or ' ' in email:
        return False, "O campo 'basics.email' deve ser um e-mail válido."

    linkedin = normalizar_url_perfil(basics.get('linkedin', ''))
    if linkedin and 'linkedin.com' not in linkedin.lower():
        return False, "O campo 'basics.linkedin' deve ser um link do linkedin.com."

    github = normalizar_url_perfil(basics.get('github', ''))
    if github and 'github.com' not in github.lower():
        return False, "O campo 'basics.github' deve ser um link do github.com."

    # --- summary (obrigatório) ---
    summary = data.get('summary')
    if not isinstance(summary, dict):
        return False, "O bloco 'summary' é obrigatório e deve ser um objeto."
    if not isinstance(summary.get('pt', []), list):
        return False, "O campo 'summary.pt' deve ser uma lista de textos."

    # --- skills (obrigatório) ---
    skills = data.get('skills')
    if not isinstance(skills, dict):
        return False, "O bloco 'skills' é obrigatório e deve ser um objeto."
    if not isinstance(skills.get('technical', []), list):
        return False, "O campo 'skills.technical' deve ser uma lista."

    # --- blocos em lista (obrigatórios: experience/education; opcionais: courses/projects) ---
    listas_obrigatorias = ['experience', 'education']
    listas_opcionais = ['courses', 'projects']
    limites_itens = {'experience': 30, 'education': 15,
                      'courses': 30, 'projects': 30}

    for campo in listas_obrigatorias:
        if campo not in data:
            return False, f"Falta o bloco obrigatório: '{campo}'"

    for campo in listas_obrigatorias + listas_opcionais:
        valor = data.get(campo, [])
        if not isinstance(valor, list):
            return False, f"O campo '{campo}' deve ser uma lista."
        if len(valor) > limites_itens[campo]:
            return False, f"O campo '{campo}' excede o limite de {limites_itens[campo]} itens."
        for i, item in enumerate(valor):
            if not isinstance(item, dict):
                return False, f"O item {i + 1} de '{campo}' deve ser um objeto."

    # 'company' é usado como cabeçalho de cada experiência no template;
    # sem ele o PDF sai com uma linha em branco sem indicar o motivo.
    for i, xp in enumerate(data.get('experience', [])):
        if not str(xp.get('company', '')).strip():
            return False, f"O item {i + 1} de 'experience' precisa do campo 'company'."

    return True, "Dados validados com sucesso"


def traduzir_texto(texto, tentativas=2):
    """Traduz um texto PT->EN. Retorna (texto_traduzido, sucesso).

    Faz uma segunda tentativa antes de desistir, já que o serviço por trás
    (scraping não-oficial do Google Translate, sem SLA) falha de vez em
    quando por instabilidade transitória. Se mesmo assim falhar, devolve o
    texto original e sucesso=False, para o chamador decidir o que fazer —
    nunca deve virar um "sucesso" silencioso com conteúdo não traduzido.
    """
    if not texto:
        return "", True
    ultimo_erro = None
    for tentativa in range(tentativas):
        try:
            return GoogleTranslator(source='pt', target='en').translate(texto), True
        except Exception as e:
            ultimo_erro = e
            time.sleep(0.4)
    app.logger.warning(
        f"Falha ao traduzir texto após {tentativas} tentativas: {ultimo_erro}")
    return texto, False


# def traduzir_payload(data):
#     data['basics']['label_en'] = traduzir_texto(
#         data['basics'].get('label_pt', ''))

#     if 'summary' in data and 'pt' in data['summary']:
#         data['summary']['en'] = [traduzir_texto(
#             p) for p in data['summary']['pt']]

#     for exp in data.get('experience', []):
#         exp['position_en'] = traduzir_texto(exp.get('position_pt', ''))
#         exp['highlights_en'] = [traduzir_texto(
#             h) for h in exp.get('highlights_pt', [])]

#     for edu in data.get('education', []):
#         edu['area_en'] = traduzir_texto(edu.get('area_pt', ''))
#         edu['status_en'] = traduzir_texto(edu.get('status_pt', ''))

#     for proj in data.get('projects', []):
#         proj['description_en'] = traduzir_texto(proj.get('description_pt', ''))

#     for curso in data.get('courses', []):
#         curso['name_en'] = traduzir_texto(curso.get('name_pt', ''))

#     return data
def traduzir_payload(data):
    falhas = []

    # Usamos ThreadPoolExecutor para disparar TODAS as traduções ao mesmo tempo
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:

        # 1. DISPARAR TAREFAS (Gatilhos simultâneos)

        # Básicos
        label_fut = executor.submit(traduzir_texto, data.get('basics', {}).get('label_pt', ''))

        # Resumo
        summary_futs = []
        if 'summary' in data and 'pt' in data['summary']:
            summary_futs = [executor.submit(traduzir_texto, p) for p in data['summary']['pt']]

        # Experiências
        exp_futs = []
        for exp in data.get('experience', []):
            pos_fut = executor.submit(traduzir_texto, exp.get('position_pt', ''))
            hl_futs = [executor.submit(traduzir_texto, h) for h in exp.get('highlights_pt', [])]
            exp_futs.append((exp, pos_fut, hl_futs))

        # Educação
        edu_futs = []
        for edu in data.get('education', []):
            area_fut = executor.submit(traduzir_texto, edu.get('area_pt', ''))
            status_fut = executor.submit(traduzir_texto, edu.get('status_pt', ''))
            edu_futs.append((edu, area_fut, status_fut))

        # Projetos
        proj_futs = []
        for proj in data.get('projects', []):
            desc_fut = executor.submit(traduzir_texto, proj.get('description_pt', ''))
            proj_futs.append((proj, desc_fut))

        # Cursos
        curso_futs = []
        for curso in data.get('courses', []):
            name_fut = executor.submit(traduzir_texto, curso.get('name_pt', ''))
            curso_futs.append((curso, name_fut))

        # Habilidades técnicas
        skills_futs = []
        if 'skills' in data and 'technical' in data['skills']:
            skills_futs = [executor.submit(traduzir_texto, s)
                            for s in data['skills']['technical']]

        # 2. RECOLHER RESULTADOS (O Python aguarda todos terminarem e atribui)

        def coletar(fut):
            texto, ok = fut.result()
            if not ok:
                falhas.append(True)
            return texto

        data['basics']['label_en'] = coletar(label_fut)

        if summary_futs:
            data['summary']['en'] = [coletar(f) for f in summary_futs]

        for exp, pos_fut, hl_futs in exp_futs:
            exp['position_en'] = coletar(pos_fut)
            exp['highlights_en'] = [coletar(f) for f in hl_futs]

        for edu, area_fut, status_fut in edu_futs:
            edu['area_en'] = coletar(area_fut)
            edu['status_en'] = coletar(status_fut)

        for proj, desc_fut in proj_futs:
            proj['description_en'] = coletar(desc_fut)

        for curso, name_fut in curso_futs:
            curso['name_en'] = coletar(name_fut)

        if skills_futs:
            data['skills']['technical_en'] = [coletar(f) for f in skills_futs]

    return data, len(falhas) == 0

@app.route('/generate-cv', methods=['POST'])
@limiter.limit("10 per minute; 60 per hour")
def generate_cv():
    data = request.json
    valido, mensagem = validar_dados_cv(data)

    if not valido:
        return jsonify({"erro": mensagem}), 400

    # Normaliza depois de validado: se a pessoa colou a URL completa (comum
    # ao copiar do navegador), removemos o https://www. daqui, já que o
    # template monta o link como https://{{ valor }} — sem isso o link do
    # PDF sairia duplicado e quebrado (https://https://linkedin.com/...).
    data['basics']['linkedin'] = normalizar_url_perfil(
        data['basics'].get('linkedin', ''))
    data['basics']['github'] = normalizar_url_perfil(
        data['basics'].get('github', ''))

    lang = data.get('lang', 'pt')
    if lang == 'en':
        data, traducao_ok = traduzir_payload(data)
        if not traducao_ok:
            return jsonify({
                "erro": "Não foi possível traduzir o currículo para inglês no momento "
                        "(serviço de tradução instável). Tente novamente em alguns minutos."
            }), 502

    try:
        env = Environment(loader=FileSystemLoader('templates'))
        env.filters['latex'] = escapar_latex
        template = env.get_template('base_ats.tex')
        rendered_tex = template.render(dados=data, lang=lang)

        pdf_bytes = None

        with tempfile.TemporaryDirectory() as tmpdir:
            tex_path = os.path.join(tmpdir, 'curriculo.tex')
            pdf_path = os.path.join(tmpdir, 'curriculo.pdf')

            with open(tex_path, 'w', encoding='utf-8') as f:
                f.write(rendered_tex)

            try:
                result = subprocess.run(
                    ['pdflatex', '-interaction=nonstopmode',
                        '-output-directory', tmpdir, tex_path],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                    timeout=30
                )
            except subprocess.TimeoutExpired:
                return jsonify({"erro": "Tempo limite excedido ao compilar o PDF."}), 504

            if result.returncode != 0:
                return jsonify({"erro": "Erro na compilação do LaTeX.", "detalhes": result.stdout}), 500

            if os.path.exists(pdf_path):
                with open(pdf_path, 'rb') as pf:
                    pdf_bytes = pf.read()
            else:
                return jsonify({"erro": "O arquivo PDF não pôde ser encontrado."}), 500

        mem_pdf = io.BytesIO(pdf_bytes)

        # --- LÓGICA DE NOMECLATURA NO BACKEND ---
        nome_candidato = data.get('basics', {}).get(
            'name', 'Candidato').strip().replace(' ', '_')
        nome_arquivo = f"{nome_candidato}_curriculo_{lang}.pdf"

        return send_file(mem_pdf, mimetype='application/pdf', as_attachment=True, download_name=nome_arquivo)

    except Exception as e:
        # Loga o detalhe real só no servidor; o cliente recebe uma mensagem
        # genérica para não vazar caminhos de arquivo, versões de biblioteca
        # ou outros detalhes internos que ajudariam um atacante.
        app.logger.exception("Erro inesperado em /generate-cv")
        return jsonify({"erro": "Erro interno ao gerar o PDF. Tente novamente."}), 500


if __name__ == '__main__':
    if not os.path.exists('templates'):
        os.makedirs('templates')
    # debug=True só liga se você explicitamente pedir (FLASK_DEBUG=1). Isso
    # evita expor o debugger interativo do Werkzeug (execução de código
    # arbitrário via console) caso alguém rode "python app.py" por engano
    # fora do ambiente de desenvolvimento local.
    modo_debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    app.run(debug=modo_debug)