import os
import subprocess
import tempfile
import io
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from jinja2 import Environment, FileSystemLoader
from deep_translator import GoogleTranslator

app = Flask(__name__, static_folder='.')
CORS(app)

# --- ROTAS DO FRONTEND ---


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')

# --- FUNÇÕES AUXILIARES ---


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
    """Usa o Google Translate para traduzir de PT para EN"""
    if not texto:
        return ""
    try:
        return GoogleTranslator(source='pt', target='en').translate(texto)
    except Exception as e:
        print(f"Erro ao traduzir '{texto}': {e}")
        return texto  # Retorna o original em caso de falha


def traduzir_payload(data):
    """Varre o JSON e traduz os campos específicos para o inglês"""
    # Dados Básicos
    data['basics']['label_en'] = traduzir_texto(
        data['basics'].get('label_pt', ''))

    # Resumo
    if 'summary' in data and 'pt' in data['summary']:
        data['summary']['en'] = [traduzir_texto(
            p) for p in data['summary']['pt']]

    # Experiências
    for exp in data.get('experience', []):
        exp['position_en'] = traduzir_texto(exp.get('position_pt', ''))
        exp['highlights_en'] = [traduzir_texto(
            h) for h in exp.get('highlights_pt', [])]

    # Formação Acadêmica
    for edu in data.get('education', []):
        edu['area_en'] = traduzir_texto(edu.get('area_pt', ''))
        edu['status_en'] = traduzir_texto(edu.get('status_pt', ''))

    # Projetos
    for proj in data.get('projects', []):
        proj['description_en'] = traduzir_texto(proj.get('description_pt', ''))

    return data

# --- ROTA DA API ---


@app.route('/generate-cv', methods=['POST'])
def generate_cv():
    data = request.json

    valido, mensagem = validar_dados_cv(data)
    if not valido:
        return jsonify({"erro": mensagem}), 400

    lang = data.get('lang', 'pt')

    # Se o idioma for inglês, aciona o motor de tradução automático
    if lang == 'en':
        data = traduzir_payload(data)

    try:
        env = Environment(loader=FileSystemLoader('templates'))
        template = env.get_template('base_ats.tex')
        rendered_tex = template.render(dados=data, lang=lang)

        pdf_bytes = None

        with tempfile.TemporaryDirectory() as tmpdir:
            tex_path = os.path.join(tmpdir, 'curriculo.tex')
            pdf_path = os.path.join(tmpdir, 'curriculo.pdf')

            with open(tex_path, 'w', encoding='utf-8') as f:
                f.write(rendered_tex)

            result = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode',
                    '-output-directory', tmpdir, tex_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            if result.returncode != 0:
                return jsonify({"erro": "Erro na compilação do LaTeX.", "detalhes": result.stdout}), 500

            if os.path.exists(pdf_path):
                with open(pdf_path, 'rb') as pf:
                    pdf_bytes = pf.read()
            else:
                return jsonify({"erro": "O arquivo PDF não pôde ser encontrado."}), 500

        mem_pdf = io.BytesIO(pdf_bytes)
        return send_file(
            mem_pdf, mimetype='application/pdf', as_attachment=True, download_name=f"curriculo_{lang}.pdf"
        )

    except Exception as e:
        return jsonify({"erro": f"Erro interno: {str(e)}"}), 500


if __name__ == '__main__':
    if not os.path.exists('templates'):
        os.makedirs('templates')
    app.run(debug=True)
