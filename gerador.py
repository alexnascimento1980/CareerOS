import os  # Adicione este import no topo do arquivo!
import json
from jinja2 import Environment, FileSystemLoader


def gerar_curriculos():
    ambiente_jinja = Environment(loader=FileSystemLoader('templates'))

    with open('dados.json', 'r', encoding='utf-8') as f:
        dados_cv = json.load(f)

    dados_limpos = {k: limpar_para_latex(v) for k, v in dados_cv.items()}

    # CRIAÇÃO AUTOMÁTICA DA PASTA
    if not os.path.exists('saida'):
        os.makedirs('saida')

    templates = ['base_ats.tex']

    for nome_template in templates:
        template = ambiente_jinja.get_template(nome_template)
        renderizado = template.render(dados_limpos)

        output_filename = os.path.join('saida', 'curriculo_ats_pt.tex')

        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write(renderizado)
        print(f"Gerado: {output_filename}")
