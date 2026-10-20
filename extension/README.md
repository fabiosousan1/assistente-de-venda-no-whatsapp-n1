# Extensão Chrome Venda em Dia 0.5

Instale a pasta extension em chrome://extensions > Modo do desenvolvedor > Carregar sem compactação.
Abra WhatsApp Web, clique no ícone da extensão. Configure o servidor conforme [instruções](../server/README.md).

Importar seleção continua disponível. Conectar e carregar conversa aberta importa os textos carregados por botão. Acompanhar esta conversa envia atualizações à OpenAI enquanto ativo e sugere resposta e roteiro; Gerar áudio com IA cria MP3. Use Pausar antes de trocar de conversa. Histórico parcial, sem envio automático. Não é integração oficial da Meta. A chave de API fica somente no servidor. Não coloque .env no GitHub.

Permissões: sidePanel abre painel; activeTab e scripting leem a aba ativada por você; host_permissions permite conexão exclusivamente com servidor local 127.0.0.1. Sem acesso permanente ao WhatsApp, sem acesso a todos os sites.

Dados locais sem backup e sem sincronização. Recarregar a mesma extensão na mesma pasta preserva normalmente o armazenamento; desinstalar ou mudar de pasta pode perder dados. Versão antiga por arquivo tem armazenamento separado.

Verificação: sintaxe JavaScript e JSON conferida; sem ambiente de execução Chrome ou chave disponível para teste real. A leitura depende do layout do WhatsApp e deve ser validada antes de uso real.
