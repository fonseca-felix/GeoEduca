"use strict";
let personagemMundo = "escot";
function escapeAtlas(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function salvarSessaoMundo() {
 if (!estado.savedToRanking) { estado.savedToRanking = true; return salvarNoRanking(estado.progress); }
 return carregarRanking();
}
document.querySelectorAll('[name="mundo-personagem"]').forEach(input => input.addEventListener("change", () => {
 personagemMundo = input.value;
 el("mundoSetupAvatar").src = `assets/celebracao/${personagemMundo}.webp`;
 el("mundoSetupName").textContent = input.closest("label").querySelector("strong").textContent;
}));

el("input-nome-jogador").addEventListener("input", () => { el("mundoNomeErro").textContent = ""; el("input-nome-jogador").removeAttribute("aria-invalid"); });
document.addEventListener("keydown", event => {
 const setup = el("overlay-nome"); if (setup.classList.contains("hidden")) return;
 if (event.key === "Escape") { el("btn-cancelar-nome").click(); el("btn-jogar").focus(); }
 if (event.key !== "Tab") return;
 const items = [...setup.querySelectorAll("button,input")].filter(node => !node.disabled);
 const first = items[0], last = items[items.length - 1];
 if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
 if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
