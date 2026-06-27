import json
import os
from jinja2 import Environment, FileSystemLoader

# 1. Carregar os dados do arquivo JSON
def carregar_dados(caminho_json):
    with open(caminho_json, 'r', encoding='utf-8') as arquivo:
        return json.load(arquivo)

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
    
    # Gerar versões ATS (Português e Inglês)
    gerar_curriculo('pt', dados_cv, ambiente, 'base_ats.tex', 'curriculo_ats_pt.tex')
    gerar_curriculo('en', dados_cv, ambiente, 'base_ats.tex', 'curriculo_ats_en.tex')