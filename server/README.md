# Ativar a IA localmente
Requer Node.js 22 ou superior instalado. Não há dependências npm.

1. Atualize a extensão e copie o ID mostrado em chrome://extensions.
2. Copie .env.example para .env nesta pasta.
3. No .env, preencha OPENAI_API_KEY com sua chave de API, OPENAI_MODEL com um modelo da sua conta compatível com Responses e JSON, EXTENSION_ID com o ID da extensão.
4. Gere o APP_TOKEN com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
5. Abra um terminal nesta pasta e execute: node --env-file=.env server.mjs
6. Mantenha o terminal aberto. No painel da extensão, coloque somente o APP_TOKEN no campo Código de conexão.
7. Importe uma conversa, salve e clique em Analisar conversa com IA.

A chave OpenAI nunca deve ser colocada na extensão ou no GitHub. A conta de API precisa ter acesso ao modelo e saldo próprio. O servidor só escuta em 127.0.0.1, exige código de conexão e permite somente a origem da extensão configurada.
A conversa salva e as ofertas são enviadas à OpenAI somente ao clicar em Analisar. O servidor não grava conversas em arquivos nem logs. O painel guarda os resultados localmente.
Não há envio automático, transcrição ou geração de voz. Áudio é roteiro em texto.
Validação: sintaxe conferida. Fluxo com Chrome e API real ainda não executado, depende da configuração local.

## Acompanhamento e voz
Depois de configurar o servidor, abra a conversa no WhatsApp e clique em Acompanhar esta conversa. Cria um atendimento novo a cada ativação. A extensão consulta a conversa carregada a cada 4 segundos, analisa somente mudanças e pausa ao detectar troca de aba, atendimento ou identidade do cabeçalho. Não use em segundo plano. Fechar o painel encerra o acompanhamento. Mudanças no layout do WhatsApp podem interromper a leitura; use importação por seleção como alternativa.
A análise pode levar até 70 segundos. Se chegarem mensagens nesse período, a sugestão antiga é descartada. O botão Pausar interrompe novas análises e ignora respostas em andamento; dados já enviados não podem ser recolhidos.
Gerar áudio com IA envia o roteiro à OpenAI e produz MP3 com voz sintética, disponível para ouvir e baixar. A opção de voz automática está desligada por padrão. As chamadas de texto e voz usam saldo de API. Não transcreve áudios recebidos, não lê imagens e não envia mensagens automaticamente.
Não há garantia de identificar todas as trocas entre contatos com nomes iguais no WhatsApp. Pause antes de trocar e confira o nome exibido. Apenas mensagens montadas na página são lidas, não todo o histórico.
