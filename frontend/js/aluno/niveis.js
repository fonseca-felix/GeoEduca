// Dados dos Cosméticos

const TITULOS = [
    { id: 'Novato', nome: 'Novato', nivel: 1 },
    { id: 'Viajante', nome: 'Viajante', nivel: 2 },
    { id: 'Explorador', nome: 'Explorador', nivel: 3 },
    { id: 'Aventureiro', nome: 'Aventureiro', nivel: 4 },
    { id: 'Cartógrafo', nome: 'Cartógrafo', nivel: 5 },
    { id: 'Navegador', nome: 'Navegador', nivel: 6 },
    { id: 'Desbravador', nome: 'Desbravador', nivel: 7 },
    { id: 'Geógrafo Amador', nome: 'Geógrafo Amador', nivel: 8 },
    { id: 'Estudioso da Terra', nome: 'Estudioso da Terra', nivel: 9 },
    { id: 'Especialista Global', nome: 'Especialista Global', nivel: 10 },
    { id: 'Guardião do Mapa', nome: 'Guardião do Mapa', nivel: 11 },
    { id: 'Viajante do Mundo', nome: 'Viajante do Mundo', nivel: 12 },
    { id: 'Mestre das Bússolas', nome: 'Mestre das Bússolas', nivel: 13 },
    { id: 'Conquistador de Terras', nome: 'Conquistador de Terras', nivel: 14 },
    { id: 'Explorador Épico', nome: 'Explorador Épico', nivel: 15 },
    { id: 'Titã da Geografia', nome: 'Titã da Geografia', nivel: 16 },
    { id: 'Lenda Continental', nome: 'Lenda Continental', nivel: 17 },
    { id: 'Sábio do Planeta', nome: 'Sábio do Planeta', nivel: 18 },
    { id: 'Mestre Mundial', nome: 'Mestre Mundial', nivel: 19 },
    { id: 'Deus da Geografia', nome: 'Deus da Geografia', nivel: 20 },
];

const BORDAS = [
    { id: 'transparent', nome: 'Nenhuma', nivel: 1, cor: 'transparent' },
    { id: '#cccccc', nome: 'Ferro', nivel: 2, cor: '#cccccc' },
    { id: '#10b981', nome: 'Esmeralda', nivel: 3, cor: '#10b981' },
    { id: '#3b82f6', nome: 'Safira', nivel: 4, cor: '#3b82f6' },
    { id: '#8b5cf6', nome: 'Ametista', nivel: 5, cor: '#8b5cf6' },
    { id: '#f59e0b', nome: 'Ouro', nivel: 6, cor: '#f59e0b' },
    { id: '#ef4444', nome: 'Rubi', nivel: 7, cor: '#ef4444' },
    { id: '#ec4899', nome: 'Quartzo Rosa', nivel: 8, cor: '#ec4899' },
    { id: '#14b8a6', nome: 'Turquesa', nivel: 9, cor: '#14b8a6' },
    { id: '#0ea5e9', nome: 'Céu', nivel: 10, cor: '#0ea5e9' },
    { id: '#00ff00', nome: 'Neon Verde', nivel: 11, cor: '#00ff00' },
    { id: 'anim-borderPulseGeo', nome: 'Pulsar Geo', nivel: 12, anim: 'anim-borderPulseGeo' },
    { id: '#ff00ff', nome: 'Neon Magenta', nivel: 13, cor: '#ff00ff' },
    { id: 'anim-borderPulseGold', nome: 'Pulsar Ouro', nivel: 14, anim: 'anim-borderPulseGold' },
    { id: '#00ffff', nome: 'Neon Ciano', nivel: 15, cor: '#00ffff' },
    { id: 'anim-borderRainbow', nome: 'Arco-Íris RGB', nivel: 16, anim: 'anim-borderRainbow' },
    { id: 'anim-borderNeonCyan', nome: 'Plasma Ciano', nivel: 18, anim: 'anim-borderNeonCyan' },
    { id: 'anim-borderFire', nome: 'Fogo Infernal', nivel: 20, anim: 'anim-borderFire' },
];

const ICONES = [
    { id: 'nenhum', nome: 'Padrão (Letra)', nivel: 1, icone: '' },
    { id: 'fa-solid fa-user', nome: 'Usuário', nivel: 1, icone: 'fa-solid fa-user' },
    { id: 'fa-solid fa-earth-americas', nome: 'Mundo', nivel: 2, icone: 'fa-solid fa-earth-americas' },
    { id: 'fa-solid fa-map-location-dot', nome: 'Mapa', nivel: 3, icone: 'fa-solid fa-map-location-dot' },
    { id: 'fa-solid fa-compass', nome: 'Bússola', nivel: 4, icone: 'fa-solid fa-compass' },
    { id: 'fa-solid fa-mountain-sun', nome: 'Montanhas', nivel: 5, icone: 'fa-solid fa-mountain-sun' },
    { id: 'fa-solid fa-tree', nome: 'Árvore', nivel: 6, icone: 'fa-solid fa-tree' },
    { id: 'fa-solid fa-water', nome: 'Oceano', nivel: 7, icone: 'fa-solid fa-water' },
    { id: 'fa-solid fa-city', nome: 'Cidade', nivel: 8, icone: 'fa-solid fa-city' },
    { id: 'fa-solid fa-plane', nome: 'Avião', nivel: 9, icone: 'fa-solid fa-plane' },
    { id: 'fa-solid fa-rocket', nome: 'Foguete', nivel: 10, icone: 'fa-solid fa-rocket' },
    { id: 'fa-solid fa-meteor', nome: 'Meteoro', nivel: 11, icone: 'fa-solid fa-meteor' },
    { id: 'fa-solid fa-star', nome: 'Estrela', nivel: 12, icone: 'fa-solid fa-star' },
    { id: 'fa-solid fa-sun', nome: 'Sol', nivel: 13, icone: 'fa-solid fa-sun' },
    { id: 'fa-solid fa-moon', nome: 'Lua', nivel: 14, icone: 'fa-solid fa-moon' },
    { id: 'fa-solid fa-crown', nome: 'Coroa', nivel: 15, icone: 'fa-solid fa-crown' },
    { id: 'fa-solid fa-gem', nome: 'Gema', nivel: 16, icone: 'fa-solid fa-gem' },
    { id: 'fa-solid fa-fire', nome: 'Fogo', nivel: 17, icone: 'fa-solid fa-fire' },
    { id: 'fa-solid fa-bolt', nome: 'Raio', nivel: 18, icone: 'fa-solid fa-bolt' },
    { id: 'fa-brands fa-space-awesome', nome: 'Espaço', nivel: 19, icone: 'fa-brands fa-space-awesome' },
    { id: 'fa-solid fa-dragon', nome: 'Dragão', nivel: 20, icone: 'fa-solid fa-dragon' },
];

let currentUser = null;
let currentLevel = 1;

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    currentUser = Auth.requireAuth('aluno');
    if (!currentUser) return;
    
    initPage('aluno');
    await loadLevelInfo();
    
    renderTitulos();
    renderBordas();
    renderIcones();
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');
    
    document.getElementById('tab-titulos').style.display = 'none';
    document.getElementById('tab-bordas').style.display = 'none';
    document.getElementById('tab-icones').style.display = 'none';
    
    document.getElementById(`tab-${tabId}`).style.display = 'grid';
}

async function loadLevelInfo() {
    try {
        const stats = await api.get('/alunos/me/resumo');
        const xp = stats.pontos || 0;
        
        currentLevel = 1;
        let xpProximo = 100;
        let currentLevelBase = 0;
        
        for (let i = 1; i <= 20; i++) {
            const req = i * 100; // 100 XP por nível
            if (xp >= req) {
                currentLevel = i + 1;
                currentLevelBase = req;
                xpProximo = req + 100;
            } else {
                break;
            }
        }
        
        const progresso = Math.min(100, Math.max(0, ((xp - currentLevelBase) / (xpProximo - currentLevelBase)) * 100));
        
        document.getElementById('nivel-display').textContent = currentLevel;
        document.getElementById('xp-atual').textContent = xp;
        document.getElementById('xp-prox').textContent = xpProximo;
        document.getElementById('xp-bar').style.width = `${progresso}%`;
        
        // Acha o título de maior nível desbloqueado que pode ser o "Nome do Nível"
        let nivelNome = 'Novato';
        for (let t of TITULOS) {
            if (t.nivel <= currentLevel) nivelNome = t.nome;
        }
        document.getElementById('nivel-nome').textContent = `Nível ${currentLevel} - ${nivelNome}`;
        
    } catch (error) {
        console.error('Erro ao carregar XP:', error);
    }
}

function renderTitulos() {
    const container = document.getElementById('tab-titulos');
    container.innerHTML = '';
    
    TITULOS.forEach(t => {
        const locked = currentLevel < t.nivel;
        const equipado = currentUser.tituloAtual === t.id;
        
        const btnHtml = locked 
            ? `<div class="req-nivel"><i class="fa-solid fa-lock"></i> Requer Nível ${t.nivel}</div>`
            : equipado 
                ? `<button class="btn btn-success" disabled>Equipado</button>`
                : `<button class="btn btn-primary" onclick="equipar('titulo', '${t.id}')">Equipar</button>`;
        
        const card = document.createElement('div');
        card.className = `cosmetico-card ${locked ? 'locked' : ''}`;
        card.innerHTML = `
            ${locked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
            <div class="titulo-preview" style="color: var(--gold)">${t.nome}</div>
            <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Título de Perfil</p>
            ${btnHtml}
        `;
        container.appendChild(card);
    });
}

function renderBordas() {
    const container = document.getElementById('tab-bordas');
    container.innerHTML = '';
    
    BORDAS.forEach(b => {
        const locked = currentLevel < b.nivel;
        const equipado = currentUser.bordaAtual === b.id;
        
        const btnHtml = locked 
            ? `<div class="req-nivel"><i class="fa-solid fa-lock"></i> Requer Nível ${b.nivel}</div>`
            : equipado 
                ? `<button class="btn btn-success" disabled>Equipada</button>`
                : `<button class="btn btn-primary" onclick="equipar('borda', '${b.id}')">Equipar</button>`;
        
        let style = '';
        let cls = 'avatar-preview';
        if (b.anim) {
            cls += ` ${b.anim}`;
        } else if (b.cor !== 'transparent') {
            style = `border-color: ${b.cor}; box-shadow: 0 0 10px ${b.cor};`;
        }

        const initial = currentUser.nome.charAt(0).toUpperCase();
        
        const card = document.createElement('div');
        card.className = `cosmetico-card ${locked ? 'locked' : ''}`;
        card.innerHTML = `
            ${locked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
            <div class="${cls}" style="${style}">${initial}</div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--color-text-primary);">${b.nome}</h3>
            <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Borda de Avatar</p>
            ${btnHtml}
        `;
        container.appendChild(card);
    });
}

function renderIcones() {
    const container = document.getElementById('tab-icones');
    container.innerHTML = '';
    
    ICONES.forEach(i => {
        const locked = currentLevel < i.nivel;
        const equipado = (currentUser.iconeAtual === i.icone) || (!currentUser.iconeAtual && i.icone === '');
        
        const btnHtml = locked 
            ? `<div class="req-nivel"><i class="fa-solid fa-lock"></i> Requer Nível ${i.nivel}</div>`
            : equipado 
                ? `<button class="btn btn-success" disabled>Equipado</button>`
                : `<button class="btn btn-primary" onclick="equipar('icone', '${i.icone}')">Equipar</button>`;
        
        const iconHtml = i.icone ? `<i class="${i.icone}"></i>` : currentUser.nome.charAt(0).toUpperCase();

        const card = document.createElement('div');
        card.className = `cosmetico-card ${locked ? 'locked' : ''}`;
        card.innerHTML = `
            ${locked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
            <div class="avatar-preview">${iconHtml}</div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--color-text-primary);">${i.nome}</h3>
            <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Ícone de Avatar</p>
            ${btnHtml}
        `;
        container.appendChild(card);
    });
}

async function equipar(tipo, valor) {
    try {
        await api.post('/alunos/equipar', { tipo, valor });
        Toast.show('Cosmético equipado com sucesso!', 'success');
        
        // Update local user object
        if (tipo === 'titulo') currentUser.tituloAtual = valor;
        if (tipo === 'borda') currentUser.bordaAtual = valor;
        if (tipo === 'icone') currentUser.iconeAtual = valor;
        
        localStorage.setItem('geo_user', JSON.stringify(currentUser));
        
        // Re-render UI
        renderTitulos();
        renderBordas();
        renderIcones();
        
        // Update sidebar/header
        initPage('aluno');
    } catch (e) {
        Toast.show(e.message || 'Erro ao equipar', 'error');
    }
}
