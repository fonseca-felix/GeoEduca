const SOUND_KEY = "geobr_sound_enabled";
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "false";
let audioContext = null;

function obterAudioContext() {
    if (!soundEnabled) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
}

function tocarNota(frequencia, inicio, duracao, tipo = "sine", volume = 0.07) {
    const ctx = obterAudioContext();
    if (!ctx) return;
    const oscilador = ctx.createOscillator();
    const ganho = ctx.createGain();
    const comeco = ctx.currentTime + inicio;
    oscilador.type = tipo;
    oscilador.frequency.value = frequencia;
    ganho.gain.setValueAtTime(0.0001, comeco);
    ganho.gain.exponentialRampToValueAtTime(volume, comeco + 0.015);
    ganho.gain.exponentialRampToValueAtTime(0.0001, comeco + duracao);
    oscilador.connect(ganho);
    ganho.connect(ctx.destination);
    oscilador.start(comeco);
    oscilador.stop(comeco + duracao + 0.02);
}

function tocarSom(tipo) {
    if (!soundEnabled) return;
    const efeitos = {
        acerto: [[523, 0, .12], [659, .1, .13], [784, .2, .18]],
        erro: [[220, 0, .16, "triangle"], [175, .13, .22, "triangle"]],
        dica: [[880, 0, .08], [988, .1, .12]],
        vitoria: [[523, 0, .12], [659, .1, .12], [784, .2, .12], [1047, .3, .3]],
        fim: [[294, 0, .18, "triangle"], [247, .16, .18, "triangle"], [196, .32, .3, "triangle"]]
    };
    (efeitos[tipo] || []).forEach(([f, i, d, onda]) => tocarNota(f, i, d, onda));
}

function atualizarBotaoSom() {
    const botao = document.getElementById("btnSom");
    if (!botao) return;
    botao.classList.toggle("muted", !soundEnabled);
    botao.setAttribute("aria-pressed", String(soundEnabled));
    botao.setAttribute("aria-label", soundEnabled ? "Desativar sons" : "Ativar sons");
    botao.innerHTML = `<i class="fas fa-volume-${soundEnabled ? "high" : "xmark"}"></i><span>${soundEnabled ? "SOM" : "MUDO"}</span>`;
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarBotaoSom();
    document.getElementById("btnSom")?.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem(SOUND_KEY, String(soundEnabled));
        atualizarBotaoSom();
    });
});
