import json
import os
from jinja2 import Environment, FileSystemLoader

ambiente_jinja = Environment(loader=FileSystemLoader('templates'))

template_nome = 'base_ats.tex'  # ou o nome que você estiver usando
# 1. Carregar os dados do arquivo JSON
template = ambiente_jinja.get_template(template_nome)


def carregar_dados(caminho_json):
    with open(caminho_json, 'r', encoding='utf-8') as arquivo:
        return json.load(arquivo)


def limpar_para_latex(texto):
    if isinstance(texto, str):
        # Escapa caracteres especiais do LaTeX
        return texto.replace('_', r'\_').replace('&', r'\&')
    return texto


# E então, ao passar os dados para o template:
template = ambiente_jinja.get_template(template_nome)
dados_limpos = {k: limpar_para_latex(v) for k, v in dados_cv.items()}
dados_cv['email'] = dados_cv['email'].replace('_', r'\_')
renderizado = template.render(dados_limpos)

# 2. Configurar o Jinja2 com delimitadores personalizados para não conflitar com o LaTeX


def configurar_jinja(caminho_templates):
    ambiente = Environment(
        loader=FileSystemLoader(caminho_templates),
        # Trocamos as chaves padrão do Jinja por delimitadores customizados
        block_start_string='<BLOCK>',
        block_end_string='</BLOCK>',
        variable_start_string='<<',
        variable_end_string='>>',
        comment_start_string='<#',
        comment_end_string='#>',
        trim_blocks=True,
        autoescape=False
    )
    return ambiente

# 3. Função principal para gerar o currículo


def gerar_curriculo(idioma, dados, ambiente_jinja, template_nome, arquivo_saida):
    template = ambiente_jinja.get_template(template_nome)

    # Passamos os dados e o idioma escolhido para o template
    conteudo_renderizado = template.render(
        dados=dados,
        lang=idioma
    )

    # Salva o arquivo .tex gerado na pasta de saída
    caminho_saida = os.path.join('saida', arquivo_saida)
    with open(caminho_saida, 'w', encoding='utf-8') as arquivo:
        arquivo.write(conteudo_renderizado)

    print(f"Currículo em {idioma.upper()} gerado com sucesso: {caminho_saida}")


if __name__ == "__main__":
    # Certificar que a pasta de saída existe
    os.makedirs('saida', exist_ok=True)

    # Executar a lógica
    dados_cv = carregar_dados('dados.json')
    ambiente = configurar_jinja('templates')

    # 1. Gerar versões ATS (Português e Inglês)
    gerar_curriculo('pt', dados_cv, ambiente,
                    'base_ats.tex', 'curriculo_ats_pt.tex')
    gerar_curriculo('en', dados_cv, ambiente,
                    'base_ats.tex', 'curriculo_ats_en.tex')

    # 2. Gerar versões de Design (Português e Inglês)
    gerar_curriculo('pt', dados_cv, ambiente,
                    'base_design.tex', 'curriculo_design_pt.tex')
    gerar_curriculo('en', dados_cv, ambiente,
                    'base_design.tex', 'curriculo_design_en.tex')
