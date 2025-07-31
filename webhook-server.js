const express = require('express');
const dotenv = require('dotenv');
const { getPullRequestDiffs, commentOnPullRequest } = require('./utils/github.js');
const { callOllama } = require('./utils/ollama');

dotenv.config();
const app = express();
app.use(express.json());

const aiModel = process.env.AIMODEL || 'modelo-desconhecido';

async function analyzePullRequest(diffs) {
  const codeDiff = diffs
    .filter(file => file.patch)
    .map(file => `Arquivo: ${file.filename}\n${file.patch}`)
    .join('\n\n');

  const prompt = `
Você é um revisor de código sênior.
A resposta, deve vir formatada em Markdown
Caso não tenha certeza, ou não encontre pontos relevantes, apenas informe que não encontrou pontos relevantes para o tópico.

A revisão deve ser organizada seguindo estritamente os tópicos abaixo:
- 🐞 Possíveis bugs
- 🆙 Melhorias
- 🛡️ Problemas de segurança
- 🔥 Qualidade geral do código

Pull Request para ser avaliada:
${codeDiff}
`;

  const aiResponse = await callOllama(prompt);
  return aiResponse;
}

app.post('/webhook', async (req, res) => {
  const event = req.headers['x-github-event'];
  const action = req.body.action;

  if (event === 'pull_request' && ['opened', 'synchronize', 'reopened'].includes(action)) {
    const { number: prNumber } = req.body.pull_request;
    const { full_name } = req.body.repository;
    const [owner, repo] = full_name.split('/');

    console.log(`🚀 Revisando PR #${prNumber} do repositório ${repo} (${action})`);

    try {
      const diffs = await getPullRequestDiffs(owner, repo, prNumber);
      // console.log(`📄 ${diffs.length} arquivo(s) com diff encontrado(s)`);

      const feedbackAi = await analyzePullRequest(diffs);
      console.log('🤖 Resposta da IA:\n', feedbackAi);

      const disclaimer = `> ⚠️ Esta revisão foi gerada por uma IA (**${aiModel}**) com o objetivo de auxiliar no processo de revisão de código.
>
> Ela **não substitui** a revisão manual feita por colegas de equipe.`;

      const finalComment = `${disclaimer}\n\n${feedbackIA}`;

      await commentOnPullRequest(owner, repo, prNumber, finalComment);
    } catch (err) {
      console.error('❌ Erro ao processar a revisão:', err.message);
    }
  }

  res.status(200).send('ok');
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${process.env.PORT}/webhook`);
});
