import os
import json
from jinja2 import Environment, FileSystemLoader
from app import escapar_latex


def gerar_curriculos():
    # Carrega os dados
    with open('dados.json', 'r', encoding='utf-8') as f:
        dados_cv = json.load(f)

    # Configura o ambiente Jinja2
    ambiente_jinja = Environment(loader=FileSystemLoader('templates'))
    ambiente_jinja.filters['latex'] = escapar_latex
    template = ambiente_jinja.get_template('base_ats.tex')

    # Cria pasta de saída se não existir
    if not os.path.exists('saida'):
        os.makedirs('saida')

    # Lista de idiomas para gerar
    idiomas = ['pt', 'en']

    for lang in idiomas:
        print(f"Gerando para: {lang}")
        renderizado = template.render(dados=dados_cv, lang=lang)

        output_filename = os.path.join('saida', f'curriculo_ats_{lang}.tex')
        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write(renderizado)
        print(f"Arquivo gerado: {output_filename}")


if __name__ == "__main__":
    gerar_curriculos()
