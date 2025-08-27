const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function callOllama(prompt, model = process.env.AIMODEL) {
  const res = await axios.post(process.env.AI_ENGINE_ENDPOINT, {
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
