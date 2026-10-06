// =====================================
// NÍVEIS E COSMÉTICOS
// =====================================

// Mock de Cosméticos (Idealmente viria do backend, mas podemos configurar no front por enquanto)
const COSMETICOS = {
    titulos: [
        { id: 't_iniciante', nome: 'Iniciante', nivel: 1, cor: '#888888' },
        { id: 't_explorador', nome: 'Explorador', nivel: 3, cor: '#3b82f6' },
        { id: 't_viajante', nome: 'Viajante', nivel: 5, cor: '#10b981' },
        { id: 't_mestre', nome: 'Mestre Geográfico', nivel: 10, cor: '#8b5cf6' },
        { id: 't_lenda', nome: 'Lenda do Mapa', nivel: 20, cor: '#cca43b' }
    ],
    bordas: [
        { id: 'b_padrao', nome: 'Padrão (Sem Borda)', nivel: 1, css: 'transparent' },
        { id: 'b_bronze', nome: 'Borda de Bronze', nivel: 5, css: '#cd7f32' },
        { id: 'b_prata', nome: 'Borda de Prata', nivel: 10, css: '#c0c0c0' },
        { id: 'b_ouro', nome: 'Borda de Ouro', nivel: 15, css: '#cca43b' },
        { id: 'b_diamante', nome: 'Borda de Diamante', nivel: 25, css: '#00ffff' }
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    Auth.requireAuth('aluno');
    initPage('aluno');

    await carregarNivelAluno();
});

async function carregarNivelAluno() {
    try {
        const res = await api.get('/alunos/me/resumo');
        
        // Calcular nivel (mesma lógica do dashboard)
        // Precisamos dos pontos de jogos que talvez estejam locais, mas vamos focar no XP que o backend retornar
        let xpTotal = res.xpTotal || 0;
        
        // Puxar pontos locais (BrazilGuessr etc) para espelhar a exata XP do dashboard
        const bgData = localStorage.getItem('bg_estatisticas');
        if (bgData) {
            const parsed = JSON.parse(bgData);
            xpTotal += parsed.total || 0;
        }

        const xpPorNivel = res.xpProximoNivel || 200;
        const nivel = Math.max(1, Math.floor(xpTotal / xpPorNivel) + 1);
        const xpNoNivel = xpTotal % xpPorNivel;
        const pct = Math.round((xpNoNivel / xpPorNivel) * 100);

        // Atualiza UI Hero
        document.getElementById('hero-nivel').textContent = nivel;
        document.getElementById('hero-xp-atual').textContent = `${xpNoNivel} XP`;
        document.getElementById('hero-xp-prox').textContent = `${xpPorNivel} XP para o Nível ${nivel + 1}`;
        setTimeout(() => {
            document.getElementById('hero-xp-bar').style.width = `${pct}%`;
        }, 100);

        renderizarCosmeticos(nivel);

    } catch (e) {
        console.error('Erro ao carregar resumo de nivel', e);
    }
}

function renderizarCosmeticos(nivelAtual) {
    const user = Auth.getUser();
    const myTitle = user.tituloAtual || '';
    const myBorder = user.bordaAtual || '';

    // Render Títulos
    const gridTitulos = document.getElementById('grid-titulos');
    gridTitulos.innerHTML = '';
    
    COSMETICOS.titulos.forEach(t => {
        const locked = nivelAtual < t.nivel;
        const equipado = myTitle === t.nome;
        
        let btnHTML = '';
        if (locked) {
            btnHTML = `<div class="req-nivel">Requer Nível ${t.nivel}</div>`;
        } else if (equipado) {
            btnHTML = `<button class="btn btn-outline" disabled style="width:100%; border-color:var(--success); color:var(--success);">Equipado</button>`;
        } else {
            btnHTML = `<button class="btn btn-primary" style="width:100%;" onclick="equiparCosmetico('titulo', '${t.nome}')">Equipar</button>`;
        }

        const card = document.createElement('div');
        card.className = `cosmetico-card ${locked ? 'locked' : ''}`;
        card.innerHTML = `
            ${locked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
            <i class="fa-solid fa-tag cosmetico-icon" style="color: ${t.cor}"></i>
            <h3 style="margin:0 0 0.5rem 0; font-size:1.1rem; color: ${t.cor};">${t.nome}</h3>
            <p style="font-size:0.8rem; color:var(--color-text-muted); margin-bottom:1.5rem;">Título exclusivo no perfil</p>
            ${btnHTML}
        `;
        gridTitulos.appendChild(card);
    });

    // Render Bordas
    const gridBordas = document.getElementById('grid-bordas');
    gridBordas.innerHTML = '';

    COSMETICOS.bordas.forEach(b => {
        const locked = nivelAtual < b.nivel;
        const equipado = myBorder === b.css;
        
        let btnHTML = '';
        if (locked) {
            btnHTML = `<div class="req-nivel">Requer Nível ${b.nivel}</div>`;
        } else if (equipado) {
            btnHTML = `<button class="btn btn-outline" disabled style="width:100%; border-color:var(--success); color:var(--success);">Equipada</button>`;
        } else {
            btnHTML = `<button class="btn btn-primary" style="width:100%;" onclick="equiparCosmetico('borda', '${b.css}')">Equipar</button>`;
        }

        const card = document.createElement('div');
        card.className = `cosmetico-card ${locked ? 'locked' : ''}`;
        card.innerHTML = `
            ${locked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
            <div class="borda-preview" style="border-color: ${b.css};">
                <i class="fa-solid fa-user"></i>
            </div>
            <h3 style="margin:0 0 0.5rem 0; font-size:1.1rem;">${b.nome}</h3>
            <p style="font-size:0.8rem; color:var(--color-text-muted); margin-bottom:1.5rem;">Destaque em rankings</p>
            ${btnHTML}
        `;
        gridBordas.appendChild(card);
    });
}

async function equiparCosmetico(tipo, valor) {
    try {
        await api.post('/alunos/equipar', { tipo, valor });
        
        // Atualiza local
        const user = Auth.getUser();
        if (tipo === 'titulo') user.tituloAtual = valor;
        if (tipo === 'borda') user.bordaAtual = valor;
        localStorage.setItem('geo_user', JSON.stringify(user));
        
        // Recarrega interface global (foto) e vitrine
        // location.reload was called
        location.reload();
        
    } catch (e) {
        alert(e.message || 'Erro ao equipar cosmético');
    }
}
