import os
import subprocess
import tempfile
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from jinja2 import Environment, FileSystemLoader

# Configura o Flask para aceitar arquivos estáticos da pasta raiz ('.')
app = Flask(__name__, static_folder='.')
CORS(app) # Habilita o frontend a fazer requisições para a API

# --- ROTAS DO FRONTEND ---

@app.route('/')
def index():
    """Serve o arquivo HTML principal quando acessamos localhost:5000"""
    return send_from_directory('.', 'index.html')

@app.route('/script.js')
def script():
    """Serve o arquivo JavaScript para o HTML conseguir carregá-lo"""
    return send_from_directory('.', 'script.js')

# --- ROTAS DA API ---

def validar_dados_cv(data):
    chaves_obrigatorias = ['basics', 'summary', 'experience', 'education', 'skills']
    
    if not data or not isinstance(data, dict):
        return False, "O payload deve ser um objeto JSON válido."
        
    for chave in chaves_obrigatorias:
        if chave not in data:
            return False, f"Falta o bloco obrigatório: '{chave}'"
            
    if 'name' not in data.get('basics', {}):
        return False, "O campo 'name' dentro do bloco 'basics' é obrigatório."
        
    return True, "Dados validados com sucesso"


@app.route('/generate-cv', methods=['POST'])
def generate_cv():
    data = request.json
    
    valido, mensagem = validar_dados_cv(data)
    if not valido:
        return jsonify({"erro": mensagem}), 400
        
    lang = data.get('lang', 'pt')
    
    try:
        env = Environment(loader=FileSystemLoader('templates'))
        template = env.get_template('base_ats.tex')
        rendered_tex = template.render(dados=data, lang=lang)
        
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_path = os.path.join(tmpdir, 'curriculo.tex')
            pdf_path = os.path.join(tmpdir, 'curriculo.pdf')
            
            with open(tex_path, 'w', encoding='utf-8') as f:
                f.write(rendered_tex)
                
            result = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode', '-output-directory', tmpdir, tex_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            if result.returncode != 0:
                return jsonify({
                    "erro": "Erro na compilação do arquivo LaTeX.",
                    "detalhes": result.stdout
                }), 500
            
            if os.path.exists(pdf_path):
                return send_file(
                    pdf_path,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=f"curriculo_{lang}.pdf"
                )
            else:
                return jsonify({"erro": "O arquivo PDF não pôde ser encontrado."}), 500
                
    except Exception as e:
        return jsonify({"erro": f"Erro interno no servidor: {str(e)}"}), 500


if __name__ == '__main__':
    if not os.path.exists('templates'):
        os.makedirs('templates')
    app.run(debug=True)