# review-ai-api
Revisor automatizado de Pull Requests usando IA local via Ollama. Analisa diffs de código e gera comentários com sugestões, melhorias e alertas direto na PR. Ideal como assistente de revisão para equipes de desenvolvimento.

# Pré requisitos
1. node / npm (este repositório)
2. ollama na máquina
3. ngrok (para utilizar em ambiente local)
4. github tokens e webhook (para comunicação entre github/api/github)

# Iniciando
1. Após o clone, usar `npm i` para instalar as dependências do projeto
2. Fazer uma cópia do .env.example e editar o `GITHUB_TOKEN` com um token gerado na sua conta
   1. Importante que esse token tenha permissão de ler as Pull Requests e comenta-las também
3. Configurar o github para disparar eventos de pull request via WebHooks
   1. Em caso de estar rodando em ambiente local, antes instalar e criar conta no ngrok para que o webhook do github consiga encontrar a sua máquina local.
4. Em um terminal, executar a api com o comando `node webhook-server.js`
5. Em outro terminal, executar o Ollama com o comando `ollama serve`
   1. Caso não tenha instalado nenhum modelo, para este teste instale o codellama `ollama run codellama`
   2. Você pode verificar se o ollama está funcionando acessando esta URL no seu navegador http://localhost:11434
6. Abra um link com ngrok mapeando a porta da api: `ngrok http 3000`
7. Pronto, agora é só realizar qualquer alteração em uma PR do projeto em questão e o fluxo já deve estar funcionando.

# Resultados obtidos:
Tamanho da Diff de PR: aproximadamente 30 linhas:
Modelo utilizado:codellhama
Tempo de resposta da IA: 2min12seg (média de 10 execuções)
Especificações da máquina utilizada no experimento:
Memória RAM: 32GB
CPU: i7-12650H (2.30 GHz)
Placa VGA: NVIDIA GeForce RTX 3050 Laptop GPU
Sistema Operacional: Windows 11 Home Single Language(com WSL2)