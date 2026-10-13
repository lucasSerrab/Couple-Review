# Couple Review

Diário de filmes, séries e animes para duas pessoas (Lucas e Giovanna): cada um guarda a própria nota e opinião, sozinho ou em casal, por texto ou por áudio. Sem conta, sem senha, sem custo e sem nada para configurar.

Na entrada, uma tela "Quem está assistindo?", como na Netflix. Cada um escolhe o seu perfil e coloca a própria foto (botão "Trocar foto"). A foto vira o seu ícone em todo o app: nas notas, na biblioteca, no menu e no ícone do app instalado, onde as duas fotos aparecem lado a lado como logo. Sem foto, aparece um desenho padrão.

## Como usar

1. Instale o **Node.js 22 ou mais novo** (nodejs.org), uma vez só.
2. Dê dois cliques em **`iniciar.bat`**. Na primeira vez ele instala e prepara tudo (precisa de internet).
3. O navegador abre em `http://localhost:3000`. Escolham o perfil.

**Para a Giovanna usar do celular:** ele precisa estar no mesmo Wi-Fi do computador. O `iniciar.bat` lista os endereços (algo como `http://192.168.0.10:3000`); é só abrir esse endereço no navegador do celular e usar "Adicionar à tela inicial". Se o Windows perguntar sobre o firewall, permita para redes privadas. O computador precisa estar ligado com a janela do `iniciar.bat` aberta.

Os dados ficam na pasta `data/` (banco, áudios e fotos). Ela não vai para o git; copiem essa pasta para fazer backup.

## Usar no celular com microfone (de qualquer rede)

Dê dois cliques em **`iniciar-celular.bat`**. Ele liga o app e um túnel gratuito da Cloudflare, e mostra um endereço `https://....trycloudflare.com`. Abra esse endereço no celular: funciona fora de casa e libera o microfone (HTTPS). O endereço muda a cada vez; o computador precisa ficar ligado com as duas janelas abertas.

Atenção: quem tiver esse endereço consegue abrir o app (não há senha), então não o divulgue. Ele é aleatório e some quando a janela fecha.

## O que tem

Perfis com foto, busca de títulos com pôster, biblioteca em grade, detalhe do título com as duas notas lado a lado, avaliação por texto e por áudio, data e lugar da sessão, watchlist por tipo e PWA instalável.

Regra de casal: numa sessão "os dois", a nota do outro só aparece depois que você salvar a sua.

Ficam para depois: sorteio da watchlist, perfil completo e retrospectiva anual (v2); bot de WhatsApp (v3).

## Detalhes que vale saber

- **Áudio sem chave nenhuma:** o app grava e guarda o áudio, e usa o reconhecimento de voz do próprio navegador (funciona no Chrome e no Edge; o navegador manda o áudio ao Google para transcrever) para gerar o texto e uma nota sugerida. Se a pessoa disser "nota nove e meio", ele pega. Sempre dá para editar o resumo antes de salvar.
- **Microfone:** o navegador só libera em `localhost` ou HTTPS. No celular, pelo endereço `http://192.168...`, o microfone fica bloqueado; use texto, ou grave pelo computador. Para o celular gravar, é preciso HTTPS (por exemplo, um túnel gratuito como o Cloudflare Tunnel).
- **Busca sem chave:** usa a sugestão pública do IMDb (traz pôster, ano e elenco). Não distingue anime, então há um "É anime" em cada resultado. É um endereço não oficial; se um dia parar, ou se quiserem sinopse em português e animes detectados, crie uma chave gratuita no TMDB e ponha em `.env.local` (veja `.env.example`).
- **IA opcional:** com `GEMINI_API_KEY` (plano gratuito) a transcrição e o resumo passam a ser feitos por IA em vez do navegador.
- **Sem senha:** qualquer pessoa na mesma rede que abrir o endereço pode escolher um perfil. Para uso em casa é suficiente.
- **Pasta no OneDrive:** instalar `node_modules` aí sincroniza milhares de arquivos. Se incomodar, mova o projeto para fora do OneDrive.

## Estrutura

```
iniciar.bat             liga o app com dois cliques
src/lib/db.ts           banco SQLite (embutido no Node, nada a instalar)
src/lib/server/         regras de negócio (busca, IA, sessões, avaliações, biblioteca, watchlist)
src/app/api/            a API interna (o site é só o primeiro cliente dela)
src/app/(app)/          telas com navegação
src/app/(foco)/         telas de foco (avaliar, revisar áudio)
src/app/perfis/         "Quem está assistindo?"
```

Comandos: `npm run dev` (desenvolvimento), `npm run build && npm start` (uso normal), `npm run typecheck`.
