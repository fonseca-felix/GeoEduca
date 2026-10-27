"use strict";
const atlasHelp = document.getElementById("atlasHelp");
document.getElementById("atlasAjuda").addEventListener("click", () => atlasHelp.showModal());
atlasHelp.querySelectorAll("[data-atlas-close]").forEach(button => button.addEventListener("click", () => atlasHelp.close()));
document.getElementById("atlasStart").addEventListener("click", () => {
  const mode = player.modoAtual;
  prepararNovoJogador(); player.modoAtual = mode;
  document.getElementById("filtroRegiao").value = document.getElementById("atlasRegion").value;
  modoPendenteAbertura = mode; abrirModalAluno(); atualizarPreviewAtlas();
});
document.getElementById("alunoNome").addEventListener("keydown", event => {
  if (event.key === "Enter") { event.preventDefault(); salvarAluno(); }
});
document.addEventListener("keydown", event => {
 const modal = document.getElementById("modalAluno");
 if (!modal.classList.contains("active")) return;
 if (event.key === "Escape") { fecharModalAluno(); document.getElementById("atlasStart").focus(); }
 if (event.key !== "Tab") return;
 const items = [...modal.querySelectorAll("button:not(.hidden),input")].filter(node => !node.disabled && node.offsetParent !== null);
 const first = items[0], last = items[items.length - 1];
 if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
 if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

// Match the restored mode on the cover before a new session starts.
document.querySelectorAll(".geo-mode-card").forEach(card => {
 const active = card.dataset.modo === player.modoAtual;
 card.classList.toggle("primary", active); card.setAttribute("aria-pressed", String(active));
});
document.getElementById("atlasRegion").disabled = player.modoAtual === "biomas";
