import json
import os

from jinja2 import Environment, FileSystemLoader
from latex_utils import escapar_latex, escapar_pdfmeta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DADOS_PATH = os.path.join(BASE_DIR, "sample-data", "dados.json")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
SAIDA_DIR = os.path.join(BASE_DIR, "..", "saida")


def gerar_curriculos():
    # Carrega os dados
    with open(DADOS_PATH, "r", encoding="utf-8") as f:
        dados_cv = json.load(f)

    # Configura o ambiente Jinja2
    ambiente_jinja = Environment(loader=FileSystemLoader(TEMPLATES_DIR))
    ambiente_jinja.filters["latex"] = escapar_latex
    ambiente_jinja.filters["latexmeta"] = escapar_pdfmeta
    template = ambiente_jinja.get_template("base_ats.tex")

    # Cria pasta de saída se não existir
    if not os.path.exists(SAIDA_DIR):
        os.makedirs(SAIDA_DIR)

    # Lista de idiomas para gerar
    idiomas = ["pt", "en"]

    for lang in idiomas:
        print(f"Gerando para: {lang}")
        renderizado = template.render(dados=dados_cv, lang=lang)

        output_filename = os.path.join(SAIDA_DIR, f"curriculo_ats_{lang}.tex")
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(renderizado)
        print(f"Arquivo gerado: {output_filename}")


if __name__ == "__main__":
    gerar_curriculos()
