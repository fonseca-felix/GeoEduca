"use strict";
function setView(view) {
  document.body.dataset.screen={home:"telaInicial",setup:"telaPersonagem",quiz:"telaJogo",result:"telaResultado"}[view];
  const options=document.getElementById("optionsMenu");if(options)options.open=false;
  window.scrollTo({top:0,behavior:"instant"});
}
document.addEventListener("DOMContentLoaded",()=>{
  const options=document.getElementById("optionsMenu");
  const showRanking=()=>{options.open=false;updateRankingDisplay();document.getElementById("worldRanking").showModal();};
  document.getElementById("openRanking").addEventListener("click",showRanking);
  document.getElementById("showEndRanking").addEventListener("click",showRanking);
  document.getElementById("worldBrandHome").addEventListener("click",event=>{event.preventDefault();if(document.body.dataset.screen==="telaJogo")document.getElementById("btn-voltar-menu").click();else if(document.body.dataset.screen==="telaPersonagem")document.getElementById("btn-cancelar-nome").click();else voltarAoMenu();});
  document.getElementById("cancelSave").addEventListener("click",()=>document.getElementById("overlay-salvar").classList.add("hidden"));
  document.querySelectorAll("dialog [data-close]").forEach(button=>button.addEventListener("click",()=>button.closest("dialog").close()));
  document.addEventListener("pointerdown",event=>{if(!event.target.closest("#optionsMenu"))options.open=false;});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&options.open){options.open=false;options.querySelector("summary").focus();}});
});

// GeoEduca Session Auto-Prefill
document.addEventListener('DOMContentLoaded', () => {
  try {
    const u = JSON.parse(localStorage.getItem('geo_user') || '{}');
    const n = localStorage.getItem('geoeduca_user_name') || u.nome || '';
    if (n) {
      const el = document.getElementById('alunoNome') || document.getElementById('input-nome-jogador');
      if (el && !el.value) el.value = n;
    }
  } catch (e) {}
});
