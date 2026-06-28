import json
from jinja2 import Environment, FileSystemLoader


def limpar_para_latex(texto):
    """Escapa caracteres especiais do LaTeX para evitar erros de compilação."""
    if isinstance(texto, str):
        return texto.replace('_', r'\_').replace('&', r'\&')
    return texto


def gerar_curriculos():
    # 1. Inicializa o ambiente do Jinja2 apontando para a pasta 'templates'
    ambiente_jinja = Environment(loader=FileSystemLoader('templates'))

    # 2. Carrega os dados do arquivo JSON
    with open('dados.json', 'r', encoding='utf-8') as f:
        dados_cv = json.load(f)

    # 3. Limpa os dados para evitar erros de caracteres especiais
    dados_limpos = {k: limpar_para_latex(v) for k, v in dados_cv.items()}

    # 4. Lista de currículos para gerar
    templates = [
        'base_ats.tex',
        # 'base_design.tex' # Descomente quando estiver pronto
    ]

    # 5. Renderiza e salva os arquivos .tex
    for nome_template in templates:
        template = ambiente_jinja.get_template(nome_template)
        renderizado = template.render(dados_limpos)

        # Define o nome do arquivo de saída (ex: saida/curriculo_ats_pt.tex)
        # Certifique-se de que a pasta 'saida' existe
        output_filename = f"saida/curriculo_{nome_template.replace('base_', '')}"

        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write(renderizado)
        print(f"Gerado: {output_filename}")


if __name__ == "__main__":
    gerar_curriculos()
