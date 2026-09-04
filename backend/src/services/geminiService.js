const { GoogleGenerativeAI } = require("@google/generative-ai");

// Chaves de API disponíveis (tenta na ordem até uma funcionar)
const CHAVES_API = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
].filter(Boolean); // Remove undefined/null

// Modelos em ordem de preferência
const MODELOS = [
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
];

function traduzirErro(error) {
    const msg = (error?.message || "").toLowerCase();

    if (msg.includes("429") || msg.includes("too many requests") || msg.includes("quota") || msg.includes("rate limit")) {
        return "⏳ O assistente de IA está muito ocupado agora. Aguarde 1 minutinho e tente novamente!";
    }
    if (msg.includes("404") || msg.includes("not found") || msg.includes("not supported")) {
        return "🔄 O sistema está atualizando. Tente novamente em alguns instantes.";
    }
    if (msg.includes("403") || msg.includes("api_key") || msg.includes("invalid key") || msg.includes("permission") || msg.includes("unauthorized")) {
        return "🔑 A chave de acesso ao assistente de IA está inválida. Avise o professor ou administrador do sistema.";
    }
    if (msg.includes("safety") || msg.includes("blocked")) {
        return "🛡️ A IA não conseguiu responder sobre esse tema por questões de segurança. Tente pesquisar com palavras diferentes.";
    }
    if (msg.includes("syntaxerror") || msg.includes("json") || msg.includes("parse")) {
        return "🤔 A IA deu uma resposta confusa desta vez. Tente novamente — costuma funcionar na segunda tentativa!";
    }
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("econnrefused") || msg.includes("failed to fetch")) {
        return "📶 Sem conexão com o servidor. Verifique se a internet está funcionando e tente novamente.";
    }
    if (msg.includes("etimedout") || msg.includes("timeout")) {
        return "⏰ O servidor demorou muito para responder. Tente novamente em instantes.";
    }
    return "😕 Algo deu errado no assistente de IA. Tente novamente em alguns segundos!";
}

async function _chamarGeminiJson(prompt) {
    if (CHAVES_API.length === 0) {
        return { sucesso: false, erro: "Nenhuma chave de acesso à IA foi configurada. Contate o administrador." };
    }

    let ultimoErro = null;

    // Tenta cada chave disponível
    for (const chave of CHAVES_API) {
        // Tenta cada modelo disponível para essa chave
        for (const nomeModelo of MODELOS) {
            try {
                const genAI = new GoogleGenerativeAI(chave);
                const model = genAI.getGenerativeModel({ model: nomeModelo });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                let texto = response.text().trim();

                // Limpeza de blocos de código Markdown gerados acidentalmente
                if (texto.startsWith("```")) {
                    const lines = texto.split('\n');
                    if (lines[0].startsWith("```")) lines.shift();
                    if (lines[lines.length - 1].trim().startsWith("```")) lines.pop();
                    texto = lines.join('\n').trim();
                }

                const dados = JSON.parse(texto);
                
                // Intercepta recusa de temas não-geográficos
                if (dados.erro_geografia) {
                    console.warn(`⚠️ IA Recusou o tema (Não é geografia):`, dados.erro_geografia);
                    return { sucesso: false, erro: dados.erro_geografia };
                }

                console.log(`✅ Gemini OK: modelo=${nomeModelo}`);
                return { sucesso: true, dados };

            } catch (error) {
                ultimoErro = error;
                const msg = error.message || "";

                // Se for cota esgotada ou modelo inválido, tenta o próximo
                if (msg.includes("429") || msg.includes("404") || msg.includes("not found") || msg.includes("quota") || msg.includes("not supported") || msg.includes("unsupported")) {
                    console.warn(`⚠️ Tentando próximo modelo/chave (${nomeModelo}): ${msg.substring(0, 80)}`);
                    continue;
                }

                // Para outros erros (403, JSON inválido), retorna imediatamente
                console.error(`❌ Erro Gemini (${nomeModelo}):`, msg);
                return { sucesso: false, erro: traduzirErro(error) };
            }
        }
    }

    // Todos os modelos e chaves falharam
    console.error("❌ Todos os modelos/chaves falharam:", ultimoErro?.message);
    return { sucesso: false, erro: traduzirErro(ultimoErro) };
}

async function gerarConteudoEstudo(tema) {
    const prompt = `
    Atue como a professora Jesiane, especialista em Geografia para o Ensino Fundamental II (11 a 15 anos).
    
    REGRA CRÍTICA DE SEGURANÇA: Você foi programada para responder EXCLUSIVAMENTE sobre Geografia, Ciências da Terra, Geopolítica e Meio Ambiente.
    Se o tema "${tema}" NÃO tiver relação estrita com Geografia (ex: desenhos animados, filmes, Ben 10, programação, matemática, jogos, etc.), você DEVE ABORTAR a geração e retornar APENAS este JSON exato:
    { "erro_geografia": "O tema '${tema}' não faz parte da minha especialidade. Por favor, me pergunte algo sobre Geografia, como mapas, relevo ou clima!" }
    
    Caso seja Geografia válida, gere um plano de estudos super didático sobre o tema "${tema}".
    O retorno deve ser estritamente em formato JSON, obedecendo a seguinte estrutura:
    {
        "tema": "${tema}",
        "introducao": "Texto simples",
        "explicacao_topicos": [
            {"titulo": "Nome do Tópico", "conteudo": "Explicação em tópicos com exemplos cotidianos, pulando uma linha e coloque numeração ao pular uma linha, retirando elemetentos como (*)."}
        ],
        "curiosidades": ["Curiosidade 1", "Curiosidade 2"],
        "resumo": "Breve resumo com os pontos mais importantes para memorização."
    }
    Responda apenas com o JSON. Não inclua markdown \`\`\`json ou explicações externas.
    `;
    return await _chamarGeminiJson(prompt);
}

async function gerarFlashcardsService(tema) {
    const prompt = `
    REGRA CRÍTICA DE SEGURANÇA: Você só responde sobre Geografia, Ciências da Terra, Geopolítica e Meio Ambiente. 
    Se "${tema}" NÃO for de Geografia (ex: Ben 10, filmes, etc.), retorne APENAS:
    { "erro_geografia": "Ops! Eu não crio flashcards sobre isso. Tente perguntar sobre um tema de Geografia!" }
    
    Gere exatamente 12 flashcards de revisão sobre o tema de Geografia: "${tema}".
    Foco em alunos de 11 a 15 anos.
    O retorno deve ser estritamente em formato JSON, obedecendo a seguinte estrutura:
    {
        "flashcards": [
            {"frente": "Pergunta ou conceito chave direto", "verso": "Resposta clara, direta e objetiva"}
        ]
    }
    Responda apenas com o JSON. Não inclua markdown \`\`\`json ou explicações externas.
    `;
    return await _chamarGeminiJson(prompt);
}

async function gerarQuizService(tema) {
    const prompt = `
    REGRA CRÍTICA DE SEGURANÇA: Você só pode gerar quizzes de Geografia, Ciências da Terra, Geopolítica e Meio Ambiente.
    Se "${tema}" NÃO for de Geografia, ABORTE e retorne APENAS o JSON de erro:
    { "erro_geografia": "Não posso gerar quiz sobre '${tema}'. Escolha um assunto geográfico!" }
    
    Gere exatamente 5 perguntas de múltipla escolha (Quiz) desafiadoras mas adequadas sobre o tema de Geografia: "${tema}".
    O retorno deve ser estritamente em formato JSON, obedecendo a seguinte estrutura:
    {
        "quiz": [
            {
                "pergunta": "Enunciado da pergunta",
                "opcoes": {
                    "A": "Texto da opção A",
                    "B": "Texto da opção B",
                    "C": "Texto da opção C",
                    "D": "Texto da opção D"
                },
                "resposta_correta": "A",
                "explicacao": "Explicação curta do porquê esta alternativa está correta."
            }
        ]
    }
    Responda apenas com o JSON. Não inclua markdown \`\`\`json ou explicações externas.
    `;
    return await _chamarGeminiJson(prompt);
}

async function gerarMidiaMapasService(tema) {
    const prompt = `
    REGRA CRÍTICA DE SEGURANÇA: Se "${tema}" NÃO for um tema de Geografia, ABORTE e retorne APENAS:
    { "erro_geografia": "Só consigo sugerir mapas para temas geográficos!" }
    
    Você deve sugerir termos de busca altamente precisos e URLs conceituais para Mapas, Infográficos ou Imagens Reais sobre o tema geográfico "${tema}".
    Monte uma estrutura JSON com termos de busca ideais para o Google Imagens e sugestões estáveis (ex: Wikimedia Commons, IBGE).
    Estrutura do JSON:
    {
        "midias": [
            {
                "tipo": "Mapa Principal / Infográfico / Imagem Ilustrativa",
                "titulo": "Título descritivo da imagem",
                "termo_busca_google": "O termo exato que o aluno deve jogar no Google Imagens",
                "sugestao_fonte": "Ex: IBGE, NASA, Wikimedia"
            }
        ]
    }
    Gere pelo menos 3 mídias recomendadas. Responda apenas com o JSON.
    `;
    return await _chamarGeminiJson(prompt);
}

async function gerarVideosYoutubeService(tema) {
    const prompt = `
    REGRA CRÍTICA DE SEGURANÇA: Se "${tema}" NÃO for um tema de Geografia, ABORTE e retorne APENAS:
    { "erro_geografia": "Só consigo recomendar vídeos sobre Geografia e Ciências!" }
    
    Atue como curador de conteúdo educativo de Geografia. Sugira títulos de vídeos e canais recomendados no YouTube para o tema "${tema}".
    Gere links de buscas prontos ou canais consolidados (Ex: Nostalgia Ciência, Manual do Mundo, Khan Academy, GeoBrasil).
    Estrutura do JSON:
    {
        "videos_recommendedados": [
            {
                "titulo_sugerido": "Título provável do vídeo educativo",
                "canal": "Nome do canal recomendado",
                "url_busca_pronta": "https://www.youtube.com/results?search_query=termo+de+busca"
            }
        ]
    }
    Gere 3 recomendações. Responda apenas com o JSON.
    `;
    return await _chamarGeminiJson(prompt);
}

async function gerarCasoDetetive() {
    const prompt = `
Você é roteirista de um jogo educativo brasileiro estilo Carmen Sandiego chamado "Detetive do Brasil".
Crie um caso policial onde o criminoso roubou um patrimônio histórico/cultural e fugiu por 5 estados brasileiros.

REGRAS OBRIGATÓRIAS:
1. A rota tem EXATAMENTE 5 objetos no array "rota" (estado inicial + 3 intermediários + estado final)
2. Apenas o último objeto tem "ehEstadoFinal": true
3. O último objeto tem "proximoEstado": null
4. Cada NPC deve falar com SOTAQUE/GÍRIAS AUTÊNTICAS do estado onde está (carioca, gaúcho, nordestino, etc.)
5. As dicas devem ser COMPLETAMENTE INDIRETAS: mencionar culinária local, clima, cultura, economia, natureza — NUNCA mencionar o nome ou sigla do próximo estado
6. Cada estado deve ter EXATAMENTE 3 NPCs
7. Use estados de REGIÕES DIFERENTES para tornar o jogo interessante geograficamente
8. O campo iconClass dos NPCs deve conter UMA classe da biblioteca FontAwesome v6 referente a pessoas ou profissões (ex: "fa-solid fa-user-tie", "fa-solid fa-user-nurse", "fa-solid fa-user-graduate", "fa-solid fa-user-astronaut"). NUNCA USE EMOJIS.

Retorne ESTRITAMENTE este JSON (sem markdown, sem texto adicional, sem \`\`\`):
{
  "patrimonioRoubado": "Nome específico do patrimônio histórico ou cultural roubado (ex: O Maracatu Nação Elefante de Ouro)",
  "descricaoRoubo": "Uma frase descrevendo o crime cometido",
  "ultimaLocalizacaoConhecida": "Nome completo do primeiro estado",
  "ultimaLocalizacaoSigla": "sigla do primeiro estado em maiúsculas",
  "criminoso": {
    "nome": "Nome fictício completo",
    "apelido": "Apelido marcante e criativo",
    "descricao": "Descrição física em uma frase (roupa, traço marcante)",
    "motivacao": "Por que roubou o patrimônio, em uma frase"
  },
  "rota": [
    {
      "estadoAtual": "SIGLA_UF",
      "nomeEstado": "Nome completo do estado",
      "proximoEstado": "SIGLA_UF_PROXIMO",
      "ehEstadoFinal": false,
      "npcs": [
        {
          "nome": "Nome do NPC",
          "profissao": "Profissão típica da região",
          "dica": "Dica indireta de pelo menos 3 frases com sotaque regional autêntico. Mencione algo específico da culinária, clima ou cultura do próximo estado SEM dizer o nome.",
          "iconClass": "fa-solid fa-user-tie"
        },
        {
          "nome": "Nome do NPC 2",
          "profissao": "Outra profissão típica",
          "dica": "Dica indireta com referência diferente (clima, economia, natureza) do próximo estado, com sotaque local.",
          "iconClass": "fa-solid fa-user-nurse"
        },
        {
          "nome": "Nome do NPC 3",
          "profissao": "Terceira profissão típica",
          "dica": "Dica indireta com referência histórica ou cultural do próximo estado, com sotaque local.",
          "iconClass": "fa-solid fa-user-graduate"
        }
      ]
    },
    {
      "estadoAtual": "SIGLA_INTERMEDIARIO_1",
      "nomeEstado": "Nome completo",
      "proximoEstado": "SIGLA_PROXIMO",
      "ehEstadoFinal": false,
      "npcs": [{"nome":"","profissao":"","dica":"","emojiFace":""}]
    },
    {
      "estadoAtual": "SIGLA_INTERMEDIARIO_2",
      "nomeEstado": "Nome completo",
      "proximoEstado": "SIGLA_PROXIMO",
      "ehEstadoFinal": false,
      "npcs": [{"nome":"","profissao":"","dica":"","emojiFace":""}]
    },
    {
      "estadoAtual": "SIGLA_INTERMEDIARIO_3",
      "nomeEstado": "Nome completo",
      "proximoEstado": "SIGLA_FINAL",
      "ehEstadoFinal": false,
      "npcs": [{"nome":"","profissao":"","dica":"","emojiFace":""}]
    },
    {
      "estadoAtual": "SIGLA_FINAL",
      "nomeEstado": "Nome completo",
      "proximoEstado": null,
      "ehEstadoFinal": true,
      "npcs": [
        {
          "nome": "Testemunha ocular",
          "profissao": "Profissão",
          "dica": "Testemunha confirma que viu o suspeito escondido neste estado, descreve onde ele está se escondendo (bairro/ponto turístico específico do estado).",
          "emojiFace": "👁️"
        },
        {
          "nome": "NPC 2 do estado final",
          "profissao": "Profissão",
          "dica": "Dica adicional confirmando presença do criminoso, com sotaque local.",
          "emojiFace": "👮"
        },
        {
          "nome": "NPC 3 do estado final",
          "profissao": "Profissão",
          "dica": "Informação sobre o esconderijo com detalhes regionais.",
          "emojiFace": "🏪"
        }
      ]
    }
  ]
}
Responda apenas com o JSON válido. Sem markdown, sem explicações externas.
    `;
    return await _chamarGeminiJson(prompt);
}

module.exports = {
    gerarConteudoEstudo,
    gerarFlashcardsService,
    gerarQuizService,
    gerarMidiaMapasService,
    gerarVideosYoutubeService,
    gerarCasoDetetive
};
