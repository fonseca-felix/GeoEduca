/* Camada visual. Sorteio, coordenadas, distância e pontuação ficam em script.js. */
const interfaceJogo = {
  enquadrarMapa: true,
  tela(nome) {
    document.body.dataset.tela = nome;
    const ids = { inicio: 'tela-inicio', regiao: 'tela-regiao', partida: 'main-game', resultado: 'tela-resultado', mapa: 'main-game' };
    for (const id of ['tela-inicio', 'tela-regiao', 'main-game', 'tela-resultado']) {
      document.getElementById(id).classList.toggle('hidden', id !== ids[nome]);
    }
    const titulo = { inicio: 'titulo-inicio', regiao: 'titulo-regiao', resultado: 'titulo-resultado' }[nome];
    if (titulo) document.getElementById(titulo).focus({ preventScroll: true });
    document.getElementById('ajuda').close();
  },
  painel(nome) {
    document.body.dataset.painel = nome;
    document.getElementById('tab-paisagem').setAttribute('aria-pressed', String(nome === 'paisagem'));
    document.getElementById('tab-mapa').setAttribute('aria-pressed', String(nome === 'mapa'));
    if (window.brazilGuessrMap) setTimeout(() => {
      window.brazilGuessrMap.invalidateSize({ animate: false });
      if (nome === 'mapa' && this.enquadrarMapa) {
        window.brazilGuessrMap.fitBounds(limitesBrasil, { padding: [18, 18], animate: false });
        this.enquadrarMapa = false;
      }
    }, 30);
  },
  palpite(pronto) {
    document.getElementById('painel-mapa').classList.toggle('guess-ready', pronto);
    document.getElementById('btn-enviar').disabled = !pronto;
    document.getElementById('btn-ampliar-palpite').disabled = !pronto;
    document.getElementById('status-palpite').innerHTML = '<span class="status-dot" aria-hidden="true"></span>' + (pronto ? 'Palpite marcado. Você pode ajustá-lo antes de confirmar.' : 'Amplie o mapa até as ruas e marque seu palpite.');
  },
  anunciar(texto) { document.getElementById('anuncio').textContent = texto; }
};

document.querySelectorAll('[data-ajuda]').forEach(botao => botao.addEventListener('click', () => document.getElementById('ajuda').showModal()));
for (const id of ['btn-fechar-ajuda', 'btn-entendi']) document.getElementById(id).addEventListener('click', () => document.getElementById('ajuda').close());
document.getElementById('ajuda').addEventListener('click', evento => {
  if (evento.target !== evento.currentTarget) return;
  const caixa = evento.currentTarget.getBoundingClientRect();
  if (evento.clientX < caixa.left || evento.clientX > caixa.right || evento.clientY < caixa.top || evento.clientY > caixa.bottom) evento.currentTarget.close();
});
document.getElementById('tab-paisagem').addEventListener('click', () => interfaceJogo.painel('paisagem'));
document.getElementById('tab-mapa').addEventListener('click', () => interfaceJogo.painel('mapa'));
window.addEventListener('resize', () => { if (window.brazilGuessrMap) window.brazilGuessrMap.invalidateSize({ animate: false }); });
