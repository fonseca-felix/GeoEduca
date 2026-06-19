document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    const user = initPage('aluno');
    if (!user) return;

    // Active menu item
    document.querySelectorAll('.sidebar-nav a').forEach(item => {
        item.classList.toggle('active', item.getAttribute('href').includes('notificacoes.html'));
    });

    let allNotifications = [];
    let activeFilter = 'todas';

    // ── Helpers ──────────────────────────────────────────────
    const typeClass = (tipo) => {
        if (tipo === 'atividade') return 'tipo-atividade';
        if (tipo === 'prova')     return 'tipo-prova';
        if (tipo === 'quiz')      return 'tipo-quiz';
        return 'tipo-outro';
    };

    const typeIcon = (tipo) => {
        if (tipo === 'atividade') return '📝';
        if (tipo === 'prova')     return '📋';
        if (tipo === 'quiz')      return '🎮';
        return '🔔';
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffH   = Math.floor(diffMs / 3600000);
        const diffD   = Math.floor(diffMs / 86400000);

        if (diffMin < 1)  return 'agora mesmo';
        if (diffMin < 60) return `há ${diffMin} min`;
        if (diffH < 24)   return `há ${diffH}h`;
        if (diffD === 1)  return 'ontem';
        if (diffD < 7)    return `há ${diffD} dias`;
        return d.toLocaleDateString('pt-BR');
    };

    // ── Unread count badge ────────────────────────────────────
    const updateUnreadBadge = () => {
        const count = allNotifications.filter(n => !n.lida).length;
        const badge = document.getElementById('notif-unread-count');
        if (badge) badge.textContent = count;
    };

    // ── Show skeleton / list ──────────────────────────────────
    const showContent = () => {
        const skeleton = document.getElementById('notif-skeleton');
        const list     = document.getElementById('notifications-list');
        if (skeleton) skeleton.style.display = 'none';
        if (list)     list.style.display     = 'block';
    };

    // ── Render ────────────────────────────────────────────────
    const renderNotifications = () => {
        const list = document.getElementById('notifications-list');
        showContent();
        updateUnreadBadge();

        const filtered = activeFilter === 'todas'
            ? allNotifications
            : allNotifications.filter(n => n.tipo === activeFilter);

        if (filtered.length === 0) {
            list.innerHTML = `
                <li>
                    <div class="notif-empty">
                        <div class="notif-empty-icon">🎉</div>
                        <h3>Tudo em dia!</h3>
                        <p>${activeFilter === 'todas'
                            ? 'Você não tem notificações no momento.'
                            : `Nenhuma notificação do tipo "${activeFilter}".`}
                        </p>
                    </div>
                </li>`;
            return;
        }

        list.innerHTML = filtered.map(n => {
            const tc = typeClass(n.tipo);
            return `
            <li class="notif-item ${n.lida ? '' : 'unread'} ${tc}"
                onclick="markAsRead('${n.id}', ${n.lida})">
                <div class="notif-icon ${tc}">${typeIcon(n.tipo)}</div>
                <div class="notif-content">
                    <div class="notif-top">
                        <span class="notif-title">${n.titulo}</span>
                        <span class="notif-time">${formatDate(n.data)}</span>
                    </div>
                    <p class="notif-msg">${n.mensagem}</p>
                </div>
                <div class="notif-dot"></div>
            </li>`;
        }).join('');
    };

    // ── Mark as read (single) ─────────────────────────────────
    window.markAsRead = async (id, isRead) => {
        if (isRead) return;
        try {
            await api.put(`/notificacoes/${id}/lida`);
            const target = allNotifications.find(n => n.id === id);
            if (target) target.lida = true;
            renderNotifications();
            if (window.PushNotificacoes) window.PushNotificacoes.verificarNotificacoes();
        } catch (e) {
            console.error('Erro ao marcar como lida', e);
        }
    };

    // ── Mark all as read ──────────────────────────────────────
    document.getElementById('mark-all-read').addEventListener('click', async () => {
        if (allNotifications.every(n => n.lida)) {
            Toast.success('Todas as notificações já estão lidas.');
            return;
        }
        try {
            await api.put('/notificacoes/todas/lidas');
            allNotifications.forEach(n => n.lida = true);
            renderNotifications();
            if (window.PushNotificacoes) window.PushNotificacoes.verificarNotificacoes();
            Toast.success('Notificações marcadas como lidas.');
        } catch (e) {
            Toast.error('Erro ao marcar notificações', e.message);
        }
    });

    // ── Filter tabs ───────────────────────────────────────────
    document.querySelectorAll('.notif-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.notif-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderNotifications();
        });
    });

    // ── Load ──────────────────────────────────────────────────
    const loadNotifications = async () => {
        try {
            allNotifications = await api.get('/notificacoes').catch(() => []);
        } catch (e) {
            console.error('Erro ao carregar notificações', e);
            allNotifications = [];
        }
        renderNotifications();
    };

    loadNotifications();
});
