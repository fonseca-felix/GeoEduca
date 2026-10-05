const { db } = require('../../firebase/firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const corrigirProvaFisica = async (req, res) => {
    try {
        const { provaId } = req.body;
        const imagem = req.file;

        if (!provaId) return res.status(400).json({ error: 'ID da prova não fornecido.' });
        if (!imagem) return res.status(400).json({ error: 'Imagem da prova não fornecida.' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada no servidor.' });
        }

        // 1. Buscar a prova e suas questões no Firestore
        const provaRef = await db.collection('provas').doc(provaId).get();
        if (!provaRef.exists) return res.status(404).json({ error: 'Prova não encontrada.' });
        
        const questoesSnap = await db.collection('prova_questoes').where('provaId', '==', provaId).get();
        const questoes = questoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (questoes.length === 0) {
            return res.status(400).json({ error: 'A prova não possui questões cadastradas.' });
        }

        // Construir um gabarito legível para a IA
        const gabaritoText = questoes.map((q, index) => {
            return `Questão ${index + 1}: ${q.texto}\nTipo: ${q.tipo}\nOpções: ${q.opcoes ? q.opcoes.join(' | ') : 'N/A'}\nResposta Correta Esperada: ${q.correta ? q.correta : 'Depende do texto'}\nValor: ${q.valor}`;
        }).join('\n\n');

        // 2. Preparar a imagem para o Gemini Multimodal
        const imagePart = {
            inlineData: {
                data: imagem.buffer.toString('base64'),
                mimeType: imagem.mimetype
            }
        };

        // 3. Inicializar a IA
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // flash é mais rapido, suficiente pra OCR estruturado

        const prompt = `
Você é um assistente de correção automática de provas. Eu estou te enviando a foto de uma prova física respondida por um aluno e o gabarito oficial.
O seu trabalho é ler as respostas que o aluno marcou (ou escreveu) na imagem, comparar com o gabarito oficial, e retornar a nota.

GABARITO OFICIAL:
${gabaritoText}

INSTRUÇÕES:
1. Para questões alternativas, verifique qual opção o aluno assinalou na imagem (ex: fez um X, circulou ou pintou).
2. Para questões descritivas, faça um OCR rápido da escrita do aluno e verifique se condiz com a resposta esperada. Dê nota parcial se necessário.
3. Se a imagem estiver ilegível, tente deduzir ou assinale que não foi possível ler.
4. RETORNE A SUA RESPOSTA ESTRITAMENTE NO FORMATO JSON ABAIXO, SEM NENHUM TEXTO ADICIONAL FORA DO JSON.

Formato esperado de saída:
{
  "notaTotal": <numero_nota_final>,
  "notaMaxima": <numero_soma_dos_valores_das_questoes>,
  "respostas": [
    {
      "questao": "Texto resumido da questão",
      "respostaAluno": "A alternativa que o aluno marcou ou o texto que ele escreveu",
      "correta": true ou false,
      "pontuacao": <nota_atribuida_nesta_questao>
    }
  ]
}
`;
        
        // 4. Executar e extrair o JSON
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // Tratar caso a IA responda com "```json ... ```"
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let correcaoObj;
        try {
            correcaoObj = JSON.parse(cleanJson);
        } catch (err) {
            console.error('Erro ao fazer parse do JSON do Gemini:', cleanJson);
            return res.status(500).json({ error: 'A IA não retornou um formato JSON válido.', rawResponse: cleanJson });
        }

        res.json(correcaoObj);
    } catch (error) {
        console.error('Erro ao corrigir prova:', error);
        res.status(500).json({ error: 'Erro ao processar imagem ou comunicar com a IA.', detalhes: error.message });
    }
};

module.exports = { corrigirProvaFisica };
