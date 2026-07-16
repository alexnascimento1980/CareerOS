import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  limparUrlPerfil,
  formatarDataMesAno,
  blobParaBase64,
  aplicarObrigatoriedade,
  criarDebouncer,
  toggleDataFim,
} from "./utils.js";

describe("limparUrlPerfil", () => {
  it.each([
    ["linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["https://linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["http://linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["https://www.linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["www.linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["HTTPS://WWW.LINKEDIN.COM/in/fulano", "LINKEDIN.COM/in/fulano"],
    ["", ""],
  ])("limpa %s -> %s", (entrada, esperado) => {
    expect(limparUrlPerfil(entrada)).toBe(esperado);
  });
});

describe("formatarDataMesAno", () => {
  it("converte formato ISO (AAAA-MM) para MM/AAAA", () => {
    expect(formatarDataMesAno("2024-03")).toBe("03/2024");
  });

  it("retorna vazio para valor vazio/nulo/indefinido", () => {
    expect(formatarDataMesAno("")).toBe("");
    expect(formatarDataMesAno(null)).toBe("");
    expect(formatarDataMesAno(undefined)).toBe("");
  });

  it("retorna o valor original se não estiver no formato AAAA-MM (ex: 'Presente')", () => {
    expect(formatarDataMesAno("Presente")).toBe("Presente");
  });
});

describe("blobParaBase64", () => {
  it("converte um Blob para uma string base64 que decodifica pro conteúdo original", async () => {
    const blob = new Blob(["conteúdo de teste"], { type: "text/plain" });
    const base64 = await blobParaBase64(blob);
    expect(typeof base64).toBe("string");
    expect(base64.length).toBeGreaterThan(0);
    const decodificado = Buffer.from(base64, "base64").toString("utf-8");
    expect(decodificado).toBe("conteúdo de teste");
  });
});

describe("aplicarObrigatoriedade", () => {
  function montarContainer() {
    document.body.innerHTML = `
      <div id="container">
        <input type="text" class="campo-texto">
        <textarea class="campo-textarea"></textarea>
        <input type="checkbox" class="campo-checkbox">
      </div>
    `;
    return document.getElementById("container");
  }

  it("adiciona required nos campos de texto/textarea quando incluir=true", () => {
    const container = montarContainer();
    aplicarObrigatoriedade(container, true);
    expect(container.querySelector(".campo-texto").hasAttribute("required")).toBe(true);
    expect(container.querySelector(".campo-textarea").hasAttribute("required")).toBe(true);
  });

  it("NUNCA adiciona required no checkbox, mesmo com incluir=true (bug real corrigido anteriormente)", () => {
    const container = montarContainer();
    aplicarObrigatoriedade(container, true);
    expect(container.querySelector(".campo-checkbox").hasAttribute("required")).toBe(false);
  });

  it("remove required de todos os campos de texto quando incluir=false", () => {
    const container = montarContainer();
    aplicarObrigatoriedade(container, true);
    aplicarObrigatoriedade(container, false);
    expect(container.querySelector(".campo-texto").hasAttribute("required")).toBe(false);
    expect(container.querySelector(".campo-textarea").hasAttribute("required")).toBe(false);
  });
});

describe("toggleDataFim", () => {
  function montarFixture({ incluirSecao = true } = {}) {
    document.body.innerHTML = `
      <input type="checkbox" id="include-experience" ${incluirSecao ? "checked" : ""}>
      <div id="experiencias-container">
        <div class="row">
          <input type="month" class="input-data-fim" value="2024-01">
          <input type="checkbox" class="exp-current" id="chk-exp-0">
        </div>
      </div>
    `;
  }

  it("desabilita e limpa a data quando a caixinha 'atualmente' é marcada", () => {
    montarFixture();
    const checkbox = document.querySelector(".exp-current");
    checkbox.checked = true;
    toggleDataFim(checkbox, document);
    const input = document.querySelector(".input-data-fim");
    expect(input.disabled).toBe(true);
    expect(input.hasAttribute("required")).toBe(false);
    expect(input.value).toBe("");
  });

  it("reativa a obrigatoriedade quando desmarcada E a seção está incluída no PDF", () => {
    montarFixture({ incluirSecao: true });
    const checkbox = document.querySelector(".exp-current");
    checkbox.checked = false;
    toggleDataFim(checkbox, document);
    const input = document.querySelector(".input-data-fim");
    expect(input.disabled).toBe(false);
    expect(input.hasAttribute("required")).toBe(true);
  });

  it("NÃO reativa a obrigatoriedade se a seção estiver com 'Incluir no PDF?' desligado (bug real corrigido anteriormente)", () => {
    montarFixture({ incluirSecao: false });
    const checkbox = document.querySelector(".exp-current");
    checkbox.checked = false;
    toggleDataFim(checkbox, document);
    const input = document.querySelector(".input-data-fim");
    expect(input.hasAttribute("required")).toBe(false);
  });
});

describe("criarDebouncer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("agrupa chamadas rápidas numa só execução, depois do delay", () => {
    const fn = vi.fn();
    const d = criarDebouncer(fn, 1500);
    d.agendar();
    d.agendar();
    d.agendar();
    vi.advanceTimersByTime(1499);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("flush executa imediatamente e cancela o timer pendente (bug real: trocar de currículo rápido demais)", async () => {
    const fn = vi.fn();
    const d = criarDebouncer(fn, 1500);
    d.agendar();
    await d.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    // avança o tempo que o timer original levaria: NÃO pode disparar de novo
    vi.advanceTimersByTime(2000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("flush não faz nada se não houver nenhum salvamento agendado", async () => {
    const fn = vi.fn();
    const d = criarDebouncer(fn, 1500);
    await d.flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it("cancelar descarta o agendamento sem executar a função", () => {
    const fn = vi.fn();
    const d = criarDebouncer(fn, 1500);
    d.agendar();
    d.cancelar();
    vi.advanceTimersByTime(2000);
    expect(fn).not.toHaveBeenCalled();
  });
});
