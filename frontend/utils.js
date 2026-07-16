// ==========================================
// UTILITÁRIOS (Currícula)
// ==========================================
// Funções sem dependência de Supabase/Capacitor, extraídas do script.js
// para poderem ser testadas isoladamente (ver frontend/utils.test.js).
//
// Funciona tanto como <script> comum no navegador (expõe tudo em `window`,
// exatamente como antes da extração) quanto importado via Node/Vitest nos
// testes — por isso o formato UMD abaixo em vez de `export`/`import` puro.
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    Object.assign(root, factory());
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  // Se a pessoa colar a URL completa (o normal ao copiar do navegador), tira
  // o https://www. automaticamente — o backend já monta esse prefixo
  // sozinho, então mantê-lo aqui faria o link final sair duplicado/quebrado.
  function limparUrlPerfil(valor) {
    return valor.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  }

  // Converte "2024-03" (formato nativo do <input type="month">) para
  // "03/2024" (formato exibido no PDF). Valores já no formato certo, ou
  // vazios, passam direto.
  function formatarDataMesAno(v) {
    if (!v) return "";
    const p = v.split("-");
    return p.length === 2 ? `${p[1]}/${p[0]}` : v;
  }

  // Converte um Blob (o PDF recebido do backend) para base64, formato que o
  // plugin Filesystem do Capacitor exige para gravar arquivos binários.
  function blobParaBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Liga/desliga "required" em todos os campos de texto/data de uma seção
  // (Experiência, Formação, Cursos, Projetos) quando o toggle "Incluir no
  // PDF?" muda — SEM mexer nas caixinhas de checkbox (ex: "Trabalho aqui
  // atualmente"), que nunca devem ser obrigatórias. Recebe o elemento
  // container diretamente (não um id), pra funcionar em qualquer seção e
  // ser fácil de testar isoladamente com um fragmento de DOM.
  function aplicarObrigatoriedade(container, incluir) {
    container
      .querySelectorAll("input:not([type=checkbox]), textarea")
      .forEach((campo) => {
        if (incluir) {
          campo.setAttribute("required", "required");
        } else {
          campo.removeAttribute("required");
        }
      });
  }

  // Debounce com "flush": agrupa várias chamadas rápidas numa só, mas
  // permite forçar a execução imediata antes do tempo (usado para salvar o
  // currículo atual antes de trocar para outro — sem isso, o timer antigo
  // dispararia depois da troca e salvaria dados errados no currículo novo,
  // já que a função salva sempre usa o estado "atual" no momento em que
  // roda, não no momento em que foi agendada).
  function criarDebouncer(fn, delayMs) {
    let timeoutId = null;
    return {
      agendar() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fn, delayMs);
      },
      async flush() {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
          await fn();
        }
      },
      cancelar() {
        clearTimeout(timeoutId);
        timeoutId = null;
      },
      // Só para os testes conferirem o estado interno sem expor timeoutId.
      _temPendente() {
        return timeoutId !== null;
      },
    };
  }

  // Controla a caixinha "Trabalho aqui atualmente" / "Cursando atualmente":
  // desabilita e limpa a data de término quando marcada; quando desmarcada,
  // só volta a exigir a data se a seção inteira (Experiência/Formação)
  // também estiver marcada para entrar no PDF — sem essa checagem extra,
  // mexer nessa caixinha reativava a obrigatoriedade à revelia do toggle
  // "Incluir no PDF?" da seção.
  function toggleDataFim(checkbox, doc) {
    const documento = doc || checkbox.ownerDocument;
    const input = checkbox.closest(".row").querySelector(".input-data-fim");
    if (checkbox.checked) {
      input.disabled = true;
      input.removeAttribute("required");
      input.value = "";
      return;
    }
    input.disabled = false;
    const secaoId = checkbox.closest("#experiencias-container")
      ? "include-experience"
      : checkbox.closest("#formacao-container")
        ? "include-education"
        : null;
    const secaoIncluida = secaoId
      ? documento.getElementById(secaoId).checked
      : true;
    if (secaoIncluida) {
      input.setAttribute("required", "required");
    }
  }

  return {
    limparUrlPerfil,
    formatarDataMesAno,
    blobParaBase64,
    aplicarObrigatoriedade,
    criarDebouncer,
    toggleDataFim,
  };
});
