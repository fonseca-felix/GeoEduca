"use strict";
function setView(view) {
  document.body.dataset.screen={home:"telaInicial",setup:"telaPersonagem",quiz:"telaJogo",result:"telaResultado"}[view];
  const menu=document.getElementById("optionsMenu");if(menu)menu.open=false;
  if(view==="setup") {document.getElementById("geoBrOpening").classList.add("hidden");document.getElementById("appRoot").classList.add("hidden");}
  window.scrollTo({top:0,behavior:"instant"});
}
document.addEventListener("DOMContentLoaded",()=>{
  const options=document.getElementById("optionsMenu");
  function open(id){options.open=false;document.getElementById(id).showModal();}
  document.getElementById("atlasAjuda").addEventListener("click",()=>open("atlasHelp"));
  for(const id of ["openRanking","resultRanking"])document.getElementById(id).addEventListener("click",()=>{atualizarRankingUI();open("brRanking");});
  document.querySelectorAll("dialog [data-close]").forEach(button=>button.addEventListener("click",()=>button.closest("dialog").close()));
  document.addEventListener("pointerdown",event=>{if(!event.target.closest("#optionsMenu"))options.open=false;});
  document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;if(options.open){options.open=false;options.querySelector("summary").focus();}else if(document.body.dataset.screen==="telaPersonagem"){fecharModalAluno();document.getElementById("atlasStart").focus();}});
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
