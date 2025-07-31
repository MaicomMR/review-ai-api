const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function callOllama(prompt, model = process.env.AIMODEL) {
  const res = await axios.post('http://localhost:11434/api/generate', {
    model,
    prompt,
    stream: false
  },
    {
      timeout: 300_000, // ⏱️ 5 minutos em milissegundos
    }
);

  return res.data.response;
}

module.exports = { callOllama };
