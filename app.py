import os
import subprocess
import tempfile
import io
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from jinja2 import Environment, FileSystemLoader
from deep_translator import GoogleTranslator
import concurrent.futures

app = Flask(__name__, static_folder='.')

# Em produção, defina ALLOWED_ORIGINS (separado por vírgulas) para restringir
# quem pode chamar a API. Em desenvolvimento, libera tudo por padrão.
_origins_env = os.environ.get('ALLOWED_ORIGINS', '*')
_allowed_origins = '*' if _origins_env == '*' else [
    o.strip() for o in _origins_env.split(',') if o.strip()]
CORS(app, resources={r"/generate-cv": {"origins": _allowed_origins}})

# Caracteres com significado especial no LaTeX. A ordem importa: a barra
# invertida precisa ser tratada primeiro para não escapar duplicado o que
# as outras substituições geram.
_LATEX_ESCAPE_MAP = {
    '\\': r'\textbackslash{}',
    '{': r'\{',
    '}': r'\}',
    '$': r'\$',
    '&': r'\&',
    '#': r'\#',
    '_': r'\_',
    '%': r'\%',
    '~': r'\textasciitilde{}',
    '^': r'\textasciicircum{}',
}


def escapar_latex(texto):
    """Escapa caracteres especiais do LaTeX em texto vindo do usuário.

    Sem isso, valores como 'P&D', '100%' ou 'C#' quebram a compilação do
    PDF (ou, em teoria, poderiam injetar comandos LaTeX arbitrários).
    """
    if texto is None:
        return ''
    return ''.join(_LATEX_ESCAPE_MAP.get(ch, ch) for ch in str(texto))


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')


def validar_dados_cv(data):
    chaves_obrigatorias = ['basics', 'summary',
                           'experience', 'education', 'skills']
    if not data or not isinstance(data, dict):
        return False, "O payload deve ser um objeto JSON válido."
    for chave in chaves_obrigatorias:
        if chave not in data:
            return False, f"Falta o bloco obrigatório: '{chave}'"
    return True, "Dados validados com sucesso"


def traduzir_texto(texto):
    if not texto:
        return ""
    try:
        return GoogleTranslator(source='pt', target='en').translate(texto)
    except Exception as e:
        print(f"Erro ao traduzir '{texto}': {e}")
        return texto


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

        # 2. RECOLHER RESULTADOS (O Python aguarda todos terminarem e atribui)
        
        data['basics']['label_en'] = label_fut.result()
        
        if summary_futs:
            data['summary']['en'] = [f.result() for f in summary_futs]
            
        for exp, pos_fut, hl_futs in exp_futs:
            exp['position_en'] = pos_fut.result()
            exp['highlights_en'] = [f.result() for f in hl_futs]
            
        for edu, area_fut, status_fut in edu_futs:
            edu['area_en'] = area_fut.result()
            edu['status_en'] = status_fut.result()
            
        for proj, desc_fut in proj_futs:
            proj['description_en'] = desc_fut.result()
            
        for curso, name_fut in curso_futs:
            curso['name_en'] = name_fut.result()

    return data

@app.route('/generate-cv', methods=['POST'])
def generate_cv():
    data = request.json
    valido, mensagem = validar_dados_cv(data)

    if not valido:
        return jsonify({"erro": mensagem}), 400

    lang = data.get('lang', 'pt')
    if lang == 'en':
        data = traduzir_payload(data)

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
        return jsonify({"erro": f"Erro interno: {str(e)}"}), 500


if __name__ == '__main__':
    if not os.path.exists('templates'):
        os.makedirs('templates')
    app.run(debug=True)
