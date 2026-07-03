# Caracteres com significado especial no LaTeX. A ordem importa: a barra
# invertida precisa ser tratada primeiro para não escapar duplicado o que
# as outras substituições geram.
_LATEX_ESCAPE_MAP = {
    '\\': r'\textbackslash{}',
    '{': r'\{',
    '}': r'\}',
    '$': r'\$',
    '&': r'\&',
    '#': r'\#',
    '_': r'\_',
    '%': r'\%',
    '~': r'\textasciitilde{}',
    '^': r'\textasciicircum{}',
}


def escapar_latex(texto):
    """Escapa caracteres especiais do LaTeX em texto vindo do usuário.

    Sem isso, valores como 'P&D', '100%' ou 'C#' quebram a compilação do
    PDF (ou, em teoria, poderiam injetar comandos LaTeX arbitrários).
    """
    if texto is None:
        return ''
    return ''.join(_LATEX_ESCAPE_MAP.get(ch, ch) for ch in str(texto))
