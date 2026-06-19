/* =============================================
   GeoEduca Push Notifications (Aluno)
   Faz polling na API e dispara notificação nativa do browser
   ============================================= */

const PushNotificacoes = {
  checkInterval: null,
  ultimaNotificacaoId: null, // Para não repetir o alerta da mesma notificação
  
  async init() {
    // Verificar se o usuário logado é aluno
    const user = Auth.getUser();
    if (!user || user.tipo !== 'aluno') return;

    // Pedir permissão ao browser se ainda não tiver
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        // Mostra um aviso leve ou pede direto
        try {
          await Notification.requestPermission();
        } catch (e) {
          console.error('Erro ao pedir permissão de notificação', e);
        }
      }
    }

    // Primeira checagem
    this.verificarNotificacoes();

    // Polling a cada 30 segundos
    this.checkInterval = setInterval(() => {
      this.verificarNotificacoes();
    }, 30000);
  },

  async verificarNotificacoes() {
    try {
      // Puxar as 5 notificações mais recentes para checar se tem novidade não lida
      const notificacoes = await api.get('/notificacoes');
      const naoLidas = notificacoes.filter(n => !n.lida);

      this.atualizarSininhoUI(naoLidas.length);

      if (naoLidas.length > 0) {
        const maisRecente = naoLidas[0]; // Como a API já ordena desc
        // Se for uma notificação que ainda não alertamos
        if (this.ultimaNotificacaoId !== maisRecente.id) {
          this.ultimaNotificacaoId = maisRecente.id;
          
          // Dispara pop-up nativo se tiver permissão
          this.dispararNotificacaoNativa(maisRecente);
        }
      }
    } catch (e) {
      console.error('Erro no polling de notificações', e);
    }
  },

  atualizarSininhoUI(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
        badge.classList.add('pulse-animation');
      } else {
        badge.style.display = 'none';
        badge.classList.remove('pulse-animation');
      }
    }
  },

  dispararNotificacaoNativa(notificacao) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      // Se não tiver permissão do chrome, fallback para toast do sistema
      if (window.Toast) {
        Toast.info(notificacao.titulo, notificacao.mensagem);
      }
      return;
    }

    const mapIcons = {
      'atividade': '📝',
      'prova': '📋',
      'quiz': '🎮',
      'sistema': '🔔'
    };

    const n = new Notification(notificacao.titulo, {
      body: notificacao.mensagem,
      icon: '/img/logo.png', // Fallback icon se existir
      badge: '/img/logo.png'
    });

    n.onclick = function() {
      window.focus();
      window.location.href = '/aluno/notificacoes.html';
      this.close();
    };
  }
};

// Iniciar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  PushNotificacoes.init();
});
