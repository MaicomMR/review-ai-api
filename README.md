# review-ai-api

**Resumo:** Revisor automatizado de Pull Requests usando IA local via Ollama. Quando uma pessoa comentar em uma pr com o comando `/review-ai`, rodará um circuit de código para analisar a diff da Pull Request em questão, gerando um feedback em comentário com sugestões, melhorias e alertas direto na PR. Ideal como assistente de revisão para equipes de desenvolvimento.

  

# Pré requisitos
1. Possuir o git instalado na máquina

3. node / npm *(Roadmap: transformar tudo em docker e automatizar)*

4. ollama na máquina (guia de como instalar abaixo)

5. ngrok (Caso vá utilizar hospedando na sua máquina local)

6. github tokens e webhook (para comunicação entre github/api/github)

  

# Iniciando
> Aviso: Este repositório é foi criado como prova de conceito, por isso, muitas etapas de configuração a instalação ainda serão manuais.

## Inicializando o projeto no ambiente local

1. Clone o repositório: `git clone https://github.com/MaicomMR/review-ai-api.git`
2. Após o clone, usar `npm i` para instalar as dependências do projeto
3. Fazer uma cópia do .env.example e editar os campos:

	3.1.  `GITHUB_TOKEN`: Token gerado na sua conta do github, será utilizado para puxar a Diff da PR

	3.2. `API_TOKEN`: Qualquer token, garantirá que somente seu github irá utilizar a sua API

	3.3. `AI_ENGINE_ENDPOINT`: Caso queira rodar o Ollama em outra máquina, editar o endpoint

	3.4. `AIMODEL`: Modelo que será utilizado na revisão, sugiro deixar com `codellama` até fazer funcionar
4. Importante que o token do github tenha permissão de ler as Pull Requests e comenta-las
5. Caso de deseje rodar o projeto em ambiente local, será necessário instalar e criar uma conta no ngrok, para que o github consiga acionar o seu ambiente local. (Tempo estimado 5 a 15 minutos - [Doc. Oficial](https://ngrok.com/docs/getting-started/))
	
    5.1. É possível utilizar outro serviço da sua preferência

	5.2. Com o ngrok instalado e com o token inserido, abra um terminal e rode `ngrok http 3000`
6. Abra outro terminal, agora vamos subir a API que recebeár a requisição do github: `node webhook-server.js`
7. Certifique-se de instalar o Ollama na sua máquina (Tempo estimado 5 minutos - [Doc. Oficial](https://ollama.readthedocs.io/en/quickstart/))
8. Em outro terminal, executar o Ollama com o comando `ollama serve`
9. Certifique-se que você possui o modelo `codellama`, você pode verificar abrindo outro terminal e rodando `ollama list`
	a. Caso não tenha instalado nenhum modelo, para este teste instale o codellama `ollama run codellama`
11. Você pode verificar se o ollama está funcionando acessando esta URL no seu navegador http://localhost:11434

## Adicionando o comando /review-ai no seu repositório
> A API de revisão e o modelo serão chamados sempre que alguém comentar uma Pull Request com `/review-ai`, para isso, vamos às configurações.
1. No repositório que você deseja adicionar o recurso, vamos precisar criar uma action, que ficará responsável por acionar a API.

    1.1. Na pasta raíz do seu projeto, crie o arquivo(e o diretório, se necessário) `.github/workflows/ai-review.yml`

    1.2. Neste arquivo, cole o código abaixo:

    1.3. Faça commit e garanta que este código seja incorporado na sua branch principal(main e/ou develop)
```
name: Requesting AI review

on:
  issue_comment:
    types: [created] 

jobs:
  call-ai-review-api:
    # Só roda se for PR e o comentário começar com /review-ai
    if: >
      (github.event_name == 'issue_comment' &&
       github.event.issue.pull_request != null &&
       startsWith(github.event.comment.body, '/review-ai'))
      ||
      (github.event_name == 'pull_request_review_comment' &&
       startsWith(github.event.comment.body, '/review-ai'))

    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read

    steps:
      - name: Extrair argumentos do comando
        id: parse
        shell: bash
        run: |
          body="${{ github.event.comment.body }}"
          body="${body//$'\r'/}"                       # normaliza
          args="${body#*/chama-api}"                   # tudo após o comando
          args="$(echo "$args" | sed -e 's/^[[:space:]]*//')"
          echo "args=$args" >> "$GITHUB_OUTPUT"

      - name: Montar payload
        id: payload
        shell: bash
        run: |
          
          pr_number="${{ github.event.issue.number }}"
          if [ -z "$pr_number" ]; then pr_number="${{ github.event.pull_request.number }}"; fi

          jq -n \
            --arg owner "${{ github.repository_owner }}" \
            --arg repo        "${{ github.repository }}" \
            --arg pr_number   "$pr_number" \
            --arg comment_id  "${{ github.event.comment.id }}" \
            --arg commenter   "${{ github.event.comment.user.login }}" \
            --arg args        "${{ steps.parse.outputs.args }}" \
            --arg sha         "${{ github.sha }}" \
            --arg comment_url "${{ github.event.comment.html_url }}" \
            '{
              owner: $owner,
              repo:        $repo,
              pr_number:   ($pr_number|tonumber),
              comment_id:  ($comment_id|tonumber),
              commenter:   $commenter,
              args:        $args,
              sha:         $sha,
              comment_url: $comment_url
            }' > payload.json

          echo "Payload:"
          cat payload.json

      - name: Chamando API
        env:
          API_URL:   ${{ secrets.API_URL }}
          API_TOKEN: ${{ secrets.API_TOKEN }}
        run: |
          curl -sS -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $API_TOKEN" \
            --data-binary @payload.json
```

2. Crie a secret com o endpoint do seu projeto(link gerado pelo ngrok  + rota), e o token que garantirá que somente você vai acessar a sua API

3. Na tela principal do seu repositório, vá em Settings > Secrets and variables > Actions

4. Crie as variáveis na secção **Repository secrets**. Criar `API_TOKEN` e `API_URL` e preencher com seu token(igual ao env) e a URL com a rota do ngrok + '/webhook' (para quando acessado, dar na rota da sua API local)

# Resultados obtidos:

Tamanho da Diff de PR: aproximadamente 30 linhas:

Modelo utilizado:codellhama

Tempo de resposta da IA: 2min12seg (média de 10 execuções)

Especificações da máquina utilizada no experimento:

Memória RAM: 32GB

CPU: i7-12650H (2.30 GHz)

Placa VGA: NVIDIA GeForce RTX 3050 Laptop GPU

Sistema Operacional: Windows 11 Home Single Language(com WSL2)