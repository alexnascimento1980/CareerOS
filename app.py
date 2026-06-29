import os
import subprocess
import tempfile
from flask import Flask, request, jsonify, send_file
from jinja2 import Environment, FileSystemLoader

app = Flask(__name__)


def validar_dados_cv(data):
    """
    Função auxiliar para validar se a estrutura do JSON enviado pelo 
    frontend contém todas as chaves obrigatórias exigidas pelo template LaTeX.
    """
    chaves_obrigatorias = ['basics', 'summary',
                           'experience', 'education', 'skills']

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

    # 1. Validação da Entrada de Dados
    valido, mensagem = validar_dados_cv(data)
    if not valido:
        return jsonify({"erro": mensagem}), 400

    # Define o idioma com base no parâmetro enviado ou assume 'pt' por padrão
    lang = data.get('lang', 'pt')

    try:
        # 2. Configuração do ambiente Jinja2 e carregamento do template
        env = Environment(loader=FileSystemLoader('templates'))
        template = env.get_template('base_ats.tex')

        # 3. Renderização do código LaTeX com os dados recebidos
        rendered_tex = template.render(dados=data, lang=lang)

        # 4. Geração isolada do PDF utilizando um diretório temporário
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_path = os.path.join(tmpdir, 'curriculo.tex')
            pdf_path = os.path.join(tmpdir, 'curriculo.pdf')

            # Grava o arquivo .tex renderizado no ambiente temporário
            with open(tex_path, 'w', encoding='utf-8') as f:
                f.write(rendered_tex)

            # Executa o comando pdflatex direcionando os arquivos de saída para a pasta temporária
            result = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode',
                    '-output-directory', tmpdir, tex_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Se houver erro de compilação no LaTeX, retorna o log do erro para depuração
            if result.returncode != 0:
                return jsonify({
                    "erro": "Erro na compilação do arquivo LaTeX.",
                    "detalhes": result.stdout
                }), 500

            # 5. Retorno do arquivo PDF para download direto
            if os.path.exists(pdf_path):
                return send_file(
                    pdf_path,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=f"curriculo_{lang}.pdf"
                )
            else:
                return jsonify({"erro": "O arquivo PDF não pôde ser encontrado após a compilação."}), 500

    except Exception as e:
        return jsonify({"erro": f"Erro interno no servidor: {str(e)}"}), 500


if __name__ == '__main__':
    # Garante que a pasta de templates exista no ambiente de execução
    if not os.path.exists('templates'):
        os.makedirs('templates')

    # Inicializa o servidor Flask em modo de desenvolvimento
    app.run(debug=True)
