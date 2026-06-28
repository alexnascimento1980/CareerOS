import os
import json
from jinja2 import Environment, FileSystemLoader


def gerar_curriculos():
    print("Iniciando geração...")
    ambiente_jinja = Environment(loader=FileSystemLoader('templates'))

    # Certifique-se de que o dados.json existe no ambiente do GitHub
    if not os.path.exists('dados.json'):
        print("ERRO: dados.json não encontrado!")
        return

    with open('dados.json', 'r', encoding='utf-8') as f:
        dados_cv = json.load(f)

    # Cria a pasta de forma absoluta
    caminho_saida = os.path.join(os.getcwd(), 'saida')
    if not os.path.exists(caminho_saida):
        os.makedirs(caminho_saida)
        print(f"Pasta criada: {caminho_saida}")

    output_filename = os.path.join(caminho_saida, 'curriculo_ats_pt.tex')

    # Renderiza
    template = ambiente_jinja.get_template('base_ats.tex')
    renderizado = template.render(dados=dados_cv)

    # Grava
    with open(output_filename, 'w', encoding='utf-8') as f:
        f.write(renderizado)

    # Verifica se criou
    if os.path.exists(output_filename):
        print(f"Arquivo gerado com SUCESSO em: {output_filename}")
    else:
        print("ERRO CRÍTICO: O arquivo não foi criado.")


if __name__ == "__main__":
    gerar_curriculos()
