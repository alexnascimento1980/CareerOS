import re


def escapar_latex(texto):
    if texto is None:
        return ""

    s = str(texto)
    substituicoes = {
        '\\': r'\textbackslash{}',
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
    }

    padrao = re.compile(r'([\\&%$#_{}~^])')
    return padrao.sub(lambda m: substituicoes[m.group(1)], s)
