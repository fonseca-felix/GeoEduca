const PERSONAGENS = {
    classica: { nome: "Clássica", descricao: "A exploradora original", prefixo: "classic" },
    bone: { nome: "Boné", descricao: "Pronta para qualquer aventura", prefixo: "bone" },
    brasa: { nome: "Brasil", descricao: "Apaixonada pelo Brasil", prefixo: "brasa" },
    escot: { nome: "Exploradora", descricao: "Especialista em novas rotas", prefixo: "escot" },
    maloka: { nome: "Maloka", descricao: "Estilo e confiança", prefixo: "maloka" },
    terno: { nome: "Terno", descricao: "Elegante e estratégica", prefixo: "terno" }
};

function normalizarPersonagem(id) {
    return PERSONAGENS[id] ? id : "classica";
}

function caminhoPersonagem(id, reacao = 1) {
    const personagem = PERSONAGENS[normalizarPersonagem(id)];
    const numero = Math.max(1, Math.min(4, Number(reacao) || 1));
    return `assets/personagens/${personagem.prefixo}_${numero}.webp`;
}

function renderizarPersonagens(selecionado = "classica") {
    const container = document.getElementById("characterOptions");
    if (!container) return;
    container.innerHTML = "";

    ["classica","escot","bone","brasa","maloka","terno"].forEach(id => {
        const personagem=PERSONAGENS[id];
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = `character-option${id === selecionado ? " selected" : ""}`;
        botao.dataset.character = id;
        botao.setAttribute("aria-pressed", String(id === selecionado));
        botao.innerHTML = `
            <img src="${caminhoPersonagem(id, 2)}" alt="${personagem.nome}">
            <strong>${personagem.nome}</strong>
            <small>${personagem.descricao}</small>
        `;
        botao.addEventListener("click", () => selecionarPersonagem(id));
        container.appendChild(botao);
    });
}

function selecionarPersonagem(id) {
    player.personagem = normalizarPersonagem(id);
    document.querySelectorAll(".character-option").forEach((botao) => {
        const ativo = botao.dataset.character === player.personagem;
        botao.classList.toggle("selected", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
    });
    const erro = document.getElementById("characterError");
    if (erro) erro.textContent = "";
    atualizarAvatares();
    atualizarPreviewAtlas();
}

function atualizarAvatares() {
    const src = caminhoPersonagem(player.personagem, 1);
    ["avatarArara", "avatarJogo"].forEach((id) => {
        const imagem = document.getElementById(id);
        if (imagem) imagem.src = src;
    });
}

function caminhoCelebracao(id) { return `assets/celebracao/${PERSONAGENS[normalizarPersonagem(id)].prefixo}.webp`; }
function atualizarPreviewAtlas() {
    const image = document.getElementById("atlasCharacterPreview");
    if (image) image.src = caminhoCelebracao(player.personagem);
    const name = document.getElementById("atlasCharacterName");
    if (name) name.textContent = PERSONAGENS[normalizarPersonagem(player.personagem)].nome;
}
