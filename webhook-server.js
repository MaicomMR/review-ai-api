const express = require('express');
const dotenv = require('dotenv');
const { getPullRequestDiffs, commentOnPullRequest } = require('./utils/github.js');
const { callOllama } = require('./utils/ollama');

dotenv.config();
const app = express();
app.use(express.json());

const aiModel = process.env.AIMODEL || 'modelo-desconhecido';

async function analisarPullRequest(diffs) {
  const codeDiff = diffs
    .filter(file => file.patch)
    .map(file => `Arquivo: ${file.filename}\n${file.patch}`)
    .join('\n\n');

  const prompt = `
Você é um revisor de código especialista.
A resposta, deve vir formatada em Markdown
Caso não tenha certeza, ou não encontre pontos relevantes, apenas informe que não encontrou pontos relevantes para o tópico.

Eu quero que você revise as alterações de código dessa diff e responda estritamente em tópicos:
- Possíveis bugs
- Melhorias
- Problemas de segurança
- Qualidade geral do código

Pull Request para ser avaliada:
${codeDiff}
`;

  const resposta = await callOllama(prompt);
  return resposta;
}

// Middleware para validar o token
function checkToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou inválido' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.API_TOKEN) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  next();
}

app.post('/webhook', checkToken, async (req, res) => {

    const prNumber = req.body.pr_number;
    const repo = req.body.repo;
    const owner = req.body.owner;

    console.log(`🚀 Revisando PR #${prNumber} do repositório ${repo}  | solicitante: ${commenter}`);

    try {
      const diffs = await getPullRequestDiffs(repo, prNumber);
      console.log(`📄 ${diffs.length} arquivo(s) com diff encontrado(s)`);

      const feedbackIA = await analisarPullRequest(diffs);
      // console.log('🤖 Resposta da IA:\n', feedbackIA);
      console.log('🤖 Resposta da IA publicada');

      const disclaimer = `> ⚠️ Esta revisão foi gerada por uma IA (**${aiModel}**) com o objetivo de auxiliar no processo de revisão de código.
>
> Ela **não substitui** a revisão manual feita por colegas de equipe.`;

      const comentarioFinal = `${disclaimer}\n\n${feedbackIA}`;

      await commentOnPullRequest(repo, prNumber, comentarioFinal);
    } catch (err) {
      console.error('❌ Erro ao processar a revisão:', err.message);
    }

  res.status(200).send('ok');
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${process.env.PORT}/webhook`);
});
