import re

# Emojis e símbolos pictográficos (e seus modificadores, como o seletor de
# variação U+FE0F) não têm glifo nas fontes padrão do LaTeX/pdflatex e
# quebram a compilação com "Unicode character ... not set up for use with
# LaTeX". Como é comum colar textos com emoji (LinkedIn, WhatsApp), removemos
# esses caracteres em vez de deixar a compilação falhar.
_EMOJI_PATTERN = re.compile(
    "["
    "\U0001f300-\U0001faff"  # símbolos e pictogramas diversos, emoticons, transporte, etc.
    "\U00002600-\U000027bf"  # símbolos diversos e dingbats (☀, ✅, ➡ etc.)
    "\U0001f1e6-\U0001f1ff"  # bandeiras (pares de indicadores regionais)
    "\U00002190-\U000021ff"  # setas
    "\U00002b00-\U00002bff"  # setas e formas diversas
    "\U0000fe00-\U0000fe0f"  # seletores de variação (ex.: o que forma o 🛠️)
    "\U0000200d"  # zero-width joiner (usado em emojis compostos)
    "]+",
    flags=re.UNICODE,
)


def remover_emojis(texto):
    """Remove emojis e pictogramas que o LaTeX não consegue renderizar."""
    if texto is None:
        return ""
    return _EMOJI_PATTERN.sub("", str(texto))


# Caracteres com significado especial no LaTeX. A ordem importa: a barra
# invertida precisa ser tratada primeiro para não escapar duplicado o que
# as outras substituições geram.
_LATEX_ESCAPE_MAP = {
    "\\": r"\textbackslash{}",
    "{": r"\{",
    "}": r"\}",
    "$": r"\$",
    "&": r"\&",
    "#": r"\#",
    "_": r"\_",
    "%": r"\%",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}


def escapar_latex(texto):
    """Escapa caracteres especiais do LaTeX em texto vindo do usuário.

    Sem isso, valores como 'P&D', '100%' ou 'C#' quebram a compilação do
    PDF (ou, em teoria, poderiam injetar comandos LaTeX arbitrários).
    """
    if texto is None:
        return ""
    texto = remover_emojis(texto)
    return "".join(_LATEX_ESCAPE_MAP.get(ch, ch) for ch in str(texto))


# Caracteres que quebrariam o parsing do argumento de \hypersetup (não
# precisam de escape "visual" como no corpo do documento, já que viram
# metadado do PDF — não são tipografados).
_PDFMETA_CARACTERES_INSEGUROS = ["\\", "{", "}", "%", "#", "&", "_", "~", "^", "$"]


def escapar_pdfmeta(texto):
    """Sanitiza texto para uso em metadados do PDF (pdftitle, pdfauthor).

    Usado para preencher os metadados do PDF (título/autor), o que ajuda
    leitores de tela e o próprio visualizador de PDF a identificar o
    documento corretamente — parte da acessibilidade do arquivo gerado,
    não só do formulário que o gera.
    """
    if texto is None:
        return ""
    texto = remover_emojis(str(texto))
    for ch in _PDFMETA_CARACTERES_INSEGUROS:
        texto = texto.replace(ch, "")
    return texto.strip()
