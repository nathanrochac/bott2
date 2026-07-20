require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const QRCode = require('qrcode');
const path = require('path');

const { gerarPix, verificarPagamento } = require('./syncpay');

/*
|--------------------------------------------------------------------------
| Validação inicial
|--------------------------------------------------------------------------
*/

if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN não configurado nas variáveis do Railway.');
  process.exit(1);
}

/*
|--------------------------------------------------------------------------
| Inicialização do Telegram
|--------------------------------------------------------------------------
*/

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

/*
|--------------------------------------------------------------------------
| Armazenamento temporário
|--------------------------------------------------------------------------
|
| Os pagamentos ficam salvos na memória.
| Se o Railway reiniciar, eles serão apagados.
|
*/

const pagamentos = new Map();

console.log('✅ Bot iniciado com sucesso!');

/*
|--------------------------------------------------------------------------
| Produtos
|--------------------------------------------------------------------------
*/

const PRODUTOS = {
  vip: {
    nome: '🎁 VIP Premium',
    valor: 9.0,
    descricao: `
🎁 VIP PREMIUM

✅ Mais de 700 mídias
✅ Conteúdo exclusivo para maiores de 18 anos
✅ Atualizações frequentes
✅ Download disponível
✅ Liberação após confirmação do pagamento

💰 Valor promocional: R$ 9,00
    `.trim(),

    animation:
      'https://raw.githubusercontent.com/ognathan7/telegram-bot/main/imagem/4s.gif'
  },

  vitalicio: {
    nome: '🎥 VIP Vitalício',
    valor: 7.0,
    descricao: `
🎥 VIP VITALÍCIO

✅ Acesso vitalício
✅ Fotos e vídeos exclusivos
✅ Novos conteúdos periodicamente
✅ Download disponível
✅ Liberação após confirmação do pagamento

💰 Valor promocional: R$ 7,00
    `.trim(),

    animation:
      'https://raw.githubusercontent.com/ognathan7/telegram-bot/main/imagem/5s.gif'
  },

  acesso: {
    nome: '📅 Acesso por 30 dias',
    valor: 5.0,
    descricao: `
📅 ACESSO POR 30 DIAS

✅ Acesso ao grupo exclusivo
✅ Fotos e vídeos
✅ Atualizações durante o período
✅ Liberação após confirmação do pagamento

💰 Valor promocional: R$ 5,00
    `.trim(),

    animation:
      'https://raw.githubusercontent.com/ognathan7/telegram-bot/main/imagem/8s.gif'
  },

  elite: {
    nome: '💎 VIP Elite',
    valor: 12.0,
    descricao: `
💎 VIP ELITE

✅ Acesso completo
✅ Todos os bônus disponíveis
✅ Conteúdos exclusivos
✅ Download disponível
✅ Atualizações frequentes
✅ Liberação após confirmação do pagamento

💰 Valor promocional: R$ 12,00
    `.trim(),

    animation:
      'https://raw.githubusercontent.com/ognathan7/telegram-bot/main/imagem/4s.gif'
  }
};

/*
|--------------------------------------------------------------------------
| Comando /start
|--------------------------------------------------------------------------
*/

bot.onText(/^\/start(?:@\w+)?$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const imagemLocal = path.join(
      __dirname,
      'imagem',
      'IMG_096.jpg'
    );

    try {
      await bot.sendPhoto(chatId, imagemLocal);
    } catch (errorImagem) {
      console.error(
        '⚠️ Não foi possível enviar a imagem inicial:',
        errorImagem.message
      );
    }

    await bot.sendMessage(
      chatId,
      `
➡️ 𝐋𝐢𝐛𝐞𝐫𝐞 𝐀𝐠𝐨𝐫𝐚 𝐨 𝐦𝐚𝐢𝐨𝐫 𝐞 𝐦𝐚𝐢𝐬 𝐜𝐨𝐦𝐩𝐥𝐞𝐭𝐨 𝐚𝐜𝐞𝐫𝐯𝐨 𝐕𝐈𝐏 𝐝𝐚 𝐢𝐧𝐭𝐞𝐫𝐧𝐞𝐭 🌟

 🎥📼 | 𝗖𝟰𝗺𝗲𝗿𝗮𝘀 𝗘𝘀𝗰𝗼𝗻𝗱𝗶𝗱𝟰 +𝟭𝟴
 🇧🇷 𝗕𝗿𝗮𝘀𝗶𝗹𝗲𝗶𝗿𝗮𝘀 𝗱𝗮 𝗙𝗮𝘃𝗲𝗹𝗮 | 𝗡𝗼𝗶𝗮𝗱𝗶𝗻𝗵𝗮𝘀 +𝟭𝟴

👩‍🎓 - 𝐔𝐧𝐢𝐯𝟑𝐫𝐬𝐢𝐭𝐚𝐫𝐢𝐚𝐬 +𝟏𝟖
👻 - 𝐔𝐅𝐂 𝐝𝐚 𝐏𝐮𝐭𝐚𝐫𝐢𝟒 
👸 - 𝐐𝐮𝐚𝐝𝐫𝐢𝐧𝐡𝐨𝐬 + ( 𝐏𝐫𝐢𝐧𝐜𝐞𝐬𝐚𝐬 𝐝𝐚 𝐃𝐢𝐬𝐧𝐞𝐲 ) 
🔞 - 𝐏𝐫𝐢𝐦𝟒𝐬 𝐜𝐚𝐢𝐮 𝐧𝐚 𝐧𝐞𝐭 
🚫 - 𝐕𝐚𝐳𝟒𝐝𝐨𝐬 𝐝𝐞 𝐜𝐞𝐥𝐮𝐥𝐚𝐫𝐞𝐬 𝐫𝐨𝐮𝐛𝐚𝐝𝐨𝐬 
🚫 - 𝐂𝐚𝐦𝐞𝐫𝐚𝐬 𝐡𝐚𝐜𝐤𝐞𝐚𝐝𝟒𝐬 
🪓 - 𝐈𝐧𝐜𝟑𝐬𝐭𝟎 𝐫𝐚𝐫𝐨𝐬 
🔞 - 𝐜𝐨𝐦𝐞𝐧𝐝𝟎 𝐚 𝐭𝐢𝐚 
🔞 - 𝐄𝐥𝐚𝐬 𝐧𝐨 𝐀𝐧𝟒𝐥 𝐇𝐚𝐫𝐝 
🔞 - 𝐄𝐥𝐚𝐬 𝐧𝐚𝐬 𝐋𝐢𝐯𝐞𝐬 𝐦𝐚𝐢𝐬 
💦 - 𝐍𝟎𝐯𝐢𝐧𝐡𝟒𝐬+𝟏𝟖 𝐝𝐚 𝐍𝟑𝐓+𝟏𝟖 
👹 - 𝐈𝐧𝐜𝟑𝐬𝐭𝐨 𝐒𝐞𝐜𝐫𝟑𝐭𝐨 𝐑𝐄𝐀𝐋+𝟏𝟖 
🔥 - 𝐓𝐈𝐎 𝐄 𝐒𝐎𝐁𝐑𝐈𝐍𝐇𝟒 +𝟏𝟖 
😱 - 𝐏𝐚𝐝𝐫𝐚𝐬𝐭𝐫𝐨 𝐜𝐨𝐦𝐞𝐧𝐝𝟎 𝐍𝐨𝐯𝐢𝐧𝐡𝟒+𝟏𝟖 
🥛 - 𝐋𝟑𝐢𝐭𝐢𝐧𝐡𝟎 𝐧𝐚 𝐛𝐨𝐜𝐚 𝐝𝐚 𝐓𝐢𝐭𝐢𝐚+𝟏𝟖 
🔞 - 𝟎𝐜𝐮𝐥𝐭𝐨𝐬 𝐁𝐫𝐮𝐭𝐚𝐥 
😊 - 𝐍𝐨𝐯𝟏𝐧𝐡𝟒+𝟏𝟖 
🔞 - 𝐕𝐢𝐝𝐞𝐨𝐬 𝐯𝐚𝐳𝟒𝐝𝐨𝐬 𝐫𝐚𝐫𝐨𝐬 
𝐭𝐨𝐝𝐨 𝐜𝐨𝐧𝐭𝐞𝐮́𝐝𝟎 +𝟏𝟖 👉

 🎁 𝐁𝐨𝐧𝐮𝐬 𝐄𝐱𝐜𝐥𝐮𝐬𝐢𝐯𝐨 𝐝𝐨 𝙀𝙓𝘾𝙇𝙐𝙎𝙄𝙑𝘼 𝘾𝙇𝙐𝘽: 
➡️ 𝐒𝐔𝐑𝐔𝐁4 𝐞𝐧𝐭𝐫𝐞 𝐏𝐑𝟏𝐌𝟎𝐒+𝟏𝟖 
➡️ 𝐌𝟒𝐞 𝐌4𝐒𝐓𝐔𝐑𝐁𝐀𝐍𝐃0 𝐅𝟏𝐋𝐇𝐎+𝟏𝟖 
➡️ 𝐀𝐌4𝐃𝐎𝐑𝐄𝐒 𝐑𝐄𝐀𝐈𝐒+𝟏𝟖 
➡️ 𝐆0𝐭𝐢𝐜𝐚𝐬 𝐑𝐚𝐛𝐮𝐝4𝐬 
➡️ 𝐊𝐚𝐦𝐲𝐥𝐢𝐧𝐡𝐚 ( 𝐄𝐗𝐂𝐋𝐔𝐒𝐈𝐕𝐎 ) 
SOMENTE CONTEÚDO +18 !!! 

🚨 𝐔𝐥𝐭𝐢𝐦𝐚𝐬 𝐕𝐚𝐠𝐚𝐬! 
𝐕𝐨𝐜ê 𝐞𝐬𝐭á 𝐚 𝐮𝐦 𝐜𝐥𝐢𝐪𝐮𝐞 𝐝𝐞 𝐞𝐧𝐭𝐫𝐚𝐫 𝐧𝐨 𝐦𝐚𝐢𝐨𝐫 𝐆𝐫𝐮𝐩𝐨 𝐕𝐈𝐏 𝐝𝐨 𝐁𝐫𝐚𝐬𝐢𝐥 𝐜𝐨𝐦 𝐨𝐬 𝐜𝐨𝐧𝐭𝐞ú𝐝0𝐬 𝐦𝐚𝐢𝐬 𝐞𝐱𝐜𝐥𝐮𝐬𝐢𝐯𝐨𝐬 𝐝𝐚 𝐢𝐧𝐭𝐞𝐫𝐧𝐞𝐭!
      `.trim(),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '👀 Ver planos disponíveis',
                callback_data: 'ver_planos'
              }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('❌ Erro no comando /start:', error);

    await enviarMensagemSegura(
      chatId,
      '❌ Não foi possível iniciar. Digite /start e tente novamente.'
    );
  }
});

/*
|--------------------------------------------------------------------------
| Botões
|--------------------------------------------------------------------------
*/

bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat?.id;
  const callbackData = query.data;

  if (!chatId) {
    return;
  }

  try {
    await bot.answerCallbackQuery(query.id);

    switch (callbackData) {
      case 'ver_planos':
        await mostrarPlanos(chatId);
        break;

      case 'produto_vip':
        await mostrarProduto(chatId, 'vip');
        break;

      case 'produto_vitalicio':
        await mostrarProduto(chatId, 'vitalicio');
        break;

      case 'produto_acesso':
        await mostrarProduto(chatId, 'acesso');
        break;

      case 'produto_elite':
        await mostrarProduto(chatId, 'elite');
        break;

      case 'comprar_vip':
        await iniciarCompra(chatId, 'vip');
        break;

      case 'comprar_vitalicio':
        await iniciarCompra(chatId, 'vitalicio');
        break;

      case 'comprar_acesso':
        await iniciarCompra(chatId, 'acesso');
        break;

      case 'comprar_elite':
        await iniciarCompra(chatId, 'elite');
        break;

      case 'copiar_codigo':
        await enviarCodigoPix(chatId);
        break;

      case 'ver_qrcode':
        await enviarQrCode(chatId);
        break;

      case 'verificar_pagamento':
        await processarVerificacaoPagamento(chatId);
        break;

      case 'voltar_planos':
        await mostrarPlanos(chatId);
        break;

      default:
        await bot.sendMessage(
          chatId,
          '❌ Opção não reconhecida. Digite /start para começar novamente.'
        );
        break;
    }
  } catch (error) {
    console.error('❌ Erro completo no callback:');
    console.error(error);

    const mensagemErro = obterMensagemErro(error);

    await enviarMensagemSegura(
      chatId,
      `❌ Ocorreu um erro:\n\n${mensagemErro}`
    );
  }
});

/*
|--------------------------------------------------------------------------
| Exibir planos
|--------------------------------------------------------------------------
*/

async function mostrarPlanos(chatId) {
  await bot.sendMessage(
    chatId,
    `
⚡️ Isso não é pra todo mundo.
💎 Conteúdo exclusivo, sem filtro, sem limite e bem safado.
🔥 Edição limitada — pode acabar a qualquer momento.

Não perca tempo. Escolha seu plano, assine agora e libere seu acesso antes que seja tarde demais.
    `.trim(),
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎁 VIP Premium — R$ 9,00',
              callback_data: 'produto_vip'
            }
          ],
          [
            {
              text: '🎥 VIP Vitalício — R$ 7,00',
              callback_data: 'produto_vitalicio'
            }
          ],
          [
            {
              text: '📅 Acesso 30 dias — R$ 5,00',
              callback_data: 'produto_acesso'
            }
          ],
          [
            {
              text: '💎 VIP Elite — R$ 12,00',
              callback_data: 'produto_elite'
            }
          ]
        ]
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| Exibir produto
|--------------------------------------------------------------------------
*/

async function mostrarProduto(chatId, produtoId) {
  const produto = PRODUTOS[produtoId];

  if (!produto) {
    throw new Error('Produto não encontrado.');
  }

  if (produto.animation) {
    try {
      await bot.sendAnimation(chatId, produto.animation);
    } catch (error) {
      console.error(
        `⚠️ Não foi possível enviar a animação do produto ${produtoId}:`,
        error.message
      );
    }
  }

  await bot.sendMessage(chatId, produto.descricao, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `💳 Comprar por ${formatarMoeda(produto.valor)}`,
            callback_data: `comprar_${produtoId}`
          }
        ],
        [
          {
            text: '⬅️ Voltar aos planos',
            callback_data: 'voltar_planos'
          }
        ]
      ]
    }
  });
}

/*
|--------------------------------------------------------------------------
| Iniciar compra
|--------------------------------------------------------------------------
*/

async function iniciarCompra(chatId, produtoId) {
  const produto = PRODUTOS[produtoId];

  if (!produto) {
    throw new Error('Produto inválido.');
  }

  await criarPagamento(
    chatId,
    produto.valor,
    produto.nome,
    produtoId
  );
}

/*
|--------------------------------------------------------------------------
| Criar cobrança PIX
|--------------------------------------------------------------------------
*/

async function criarPagamento(
  chatId,
  valor,
  produto,
  produtoId
) {
  await bot.sendMessage(chatId, '⏳ Gerando seu PIX...');

  let pix;

  try {
    pix = await gerarPix(valor, {
      produto,
      chatId: String(chatId)
    });
  } catch (error) {
    console.error(
      '❌ Erro ao gerar PIX:',
      error.response?.data || error
    );

    throw new Error(
      obterMensagemErroApi(
        error,
        'Não foi possível gerar o PIX.'
      )
    );
  }

  console.log(
    '📦 Retorno completo da geração do PIX:',
    JSON.stringify(pix, null, 2)
  );

  const pixCode = obterCodigoPix(pix);
  const identifier = obterIdentificadorPix(pix);

  if (!pixCode) {
    throw new Error(
      'A API não retornou o código PIX Copia e Cola. Verifique o retorno da API nos logs do Railway.'
    );
  }

  if (!identifier) {
    throw new Error(
      'A API não retornou o identificador do pagamento. Verifique o retorno da API nos logs do Railway.'
    );
  }

  const pagamento = {
    pixCode: String(pixCode),
    identifier: String(identifier),
    valor: Number(valor),
    produto,
    produtoId,
    aprovado: false,
    criadoEm: Date.now()
  };

  pagamentos.set(String(chatId), pagamento);

  console.log('✅ Pagamento armazenado:', {
    chatId,
    identifier: pagamento.identifier,
    produto: pagamento.produto,
    valor: pagamento.valor
  });

  await bot.sendMessage(
    chatId,
    `
✅ PIX GERADO COM SUCESSO

📦 Produto: ${produto}
💰 Valor: ${formatarMoeda(valor)}

Como pagar:

1. Abra o aplicativo do seu banco.
2. Entre na área PIX.
3. Escolha "PIX Copia e Cola".
4. Copie o código enviado abaixo.
5. Cole no aplicativo do banco.
6. Confira o valor e finalize o pagamento.
    `.trim()
  );

  await bot.sendMessage(
    chatId,
    `<b>📋 Código PIX Copia e Cola:</b>

<code>${escapeHtml(pixCode)}</code>`,
    {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }
  );

  await bot.sendMessage(
    chatId,
    'Após realizar o pagamento, clique no botão abaixo.',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ Verificar pagamento',
              callback_data: 'verificar_pagamento'
            }
          ],
          [
            {
              text: '📋 Mostrar código PIX',
              callback_data: 'copiar_codigo'
            },
            {
              text: '📱 Mostrar QR Code',
              callback_data: 'ver_qrcode'
            }
          ],
          [
            {
              text: '⬅️ Voltar aos planos',
              callback_data: 'voltar_planos'
            }
          ]
        ]
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| Mostrar código PIX
|--------------------------------------------------------------------------
*/

async function enviarCodigoPix(chatId) {
  const pagamento = pagamentos.get(String(chatId));

  if (!pagamento?.pixCode) {
    await bot.sendMessage(
      chatId,
      '❌ Nenhum PIX ativo foi encontrado. Escolha um plano e gere um novo pagamento.'
    );

    return;
  }

  await bot.sendMessage(
    chatId,
    `<b>📋 Código PIX Copia e Cola:</b>

<code>${escapeHtml(pagamento.pixCode)}</code>`,
    {
      parse_mode: 'HTML'
    }
  );
}

/*
|--------------------------------------------------------------------------
| Mostrar QR Code
|--------------------------------------------------------------------------
*/

async function enviarQrCode(chatId) {
  const pagamento = pagamentos.get(String(chatId));

  if (!pagamento?.pixCode) {
    await bot.sendMessage(
      chatId,
      '❌ Nenhum PIX ativo foi encontrado. Escolha um plano e gere um novo pagamento.'
    );

    return;
  }

  const qrBuffer = await QRCode.toBuffer(
    pagamento.pixCode,
    {
      type: 'png',
      width: 600,
      margin: 2,
      errorCorrectionLevel: 'M'
    }
  );

  await bot.sendPhoto(chatId, qrBuffer, {
    caption: `
📱 Escaneie o QR Code para realizar o pagamento.

📦 ${pagamento.produto}
💰 ${formatarMoeda(pagamento.valor)}
    `.trim()
  });
}

/*
|--------------------------------------------------------------------------
| Verificar pagamento
|--------------------------------------------------------------------------
*/

async function processarVerificacaoPagamento(chatId) {
  const pagamento = pagamentos.get(String(chatId));

  if (!pagamento) {
    await bot.sendMessage(
      chatId,
      '❌ Nenhum pagamento foi encontrado. Escolha um produto novamente.'
    );

    return;
  }

  if (pagamento.aprovado) {
    await enviarMensagemPagamentoAprovado(
      chatId,
      pagamento,
      true
    );

    return;
  }

  await bot.sendMessage(
    chatId,
    '⏳ Verificando o pagamento...'
  );

  let resultado;

  try {
    resultado = await verificarPagamento(
      pagamento.identifier
    );
  } catch (error) {
    console.error(
      '❌ Erro ao verificar pagamento:',
      error.response?.data || error
    );

    throw new Error(
      obterMensagemErroApi(
        error,
        'Não foi possível verificar o pagamento.'
      )
    );
  }

  console.log(
    '🔎 Retorno completo da verificação:',
    JSON.stringify(resultado, null, 2)
  );

  const statusOriginal = obterStatusPagamento(resultado);
  const statusNormalizado = normalizarStatus(statusOriginal);

  console.log('🔎 Status original:', statusOriginal);
  console.log('🔎 Status normalizado:', statusNormalizado);

  if (pagamentoFoiAprovado(statusNormalizado)) {
    pagamento.aprovado = true;
    pagamento.aprovadoEm = Date.now();

    pagamentos.set(String(chatId), pagamento);

    await enviarMensagemPagamentoAprovado(
      chatId,
      pagamento,
      false
    );

    return;
  }

  if (pagamentoFoiCancelado(statusNormalizado)) {
    await bot.sendMessage(
      chatId,
      `
❌ PAGAMENTO CANCELADO OU EXPIRADO

📦 Produto: ${pagamento.produto}
💰 Valor: ${formatarMoeda(pagamento.valor)}
📊 Status: ${formatarStatus(statusOriginal)}

Escolha o produto novamente para gerar uma nova cobrança.
      `.trim(),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⬅️ Voltar aos planos',
                callback_data: 'voltar_planos'
              }
            ]
          ]
        }
      }
    );

    return;
  }

  await bot.sendMessage(
    chatId,
    `
⏳ PAGAMENTO AINDA NÃO IDENTIFICADO

📦 Produto: ${pagamento.produto}
💰 Valor: ${formatarMoeda(pagamento.valor)}
📊 Status atual: ${formatarStatus(statusOriginal)}

Caso já tenha realizado o pagamento, aguarde alguns segundos e clique novamente.
    `.trim(),
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔄 Verificar novamente',
              callback_data: 'verificar_pagamento'
            }
          ],
          [
            {
              text: '📋 Mostrar código PIX',
              callback_data: 'copiar_codigo'
            },
            {
              text: '📱 Mostrar QR Code',
              callback_data: 'ver_qrcode'
            }
          ]
        ]
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| Pagamento aprovado
|--------------------------------------------------------------------------
*/

async function enviarMensagemPagamentoAprovado(
  chatId,
  pagamento,
  jaEstavaAprovado
) {
  const observacao = jaEstavaAprovado
    ? '\n\nℹ️ Este pagamento já havia sido confirmado anteriormente.'
    : '';

  await bot.sendMessage(
    chatId,
    `
✅ PAGAMENTO APROVADO!

📦 Produto: ${pagamento.produto}
💰 Valor pago: ${formatarMoeda(pagamento.valor)}

Seu pagamento foi confirmado com sucesso.${observacao}
    `.trim()
  );

  if (process.env.LINK_GRUPO_VIP) {
    await bot.sendMessage(
      chatId,
      '🔓 Clique no botão abaixo para acessar:',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Acessar conteúdo',
                url: process.env.LINK_GRUPO_VIP
              }
            ]
          ]
        }
      }
    );
  } else {
    await bot.sendMessage(
      chatId,
      '⚠️ Pagamento confirmado, mas o LINK_GRUPO_VIP ainda não foi configurado no Railway.'
    );
  }
}

/*
|--------------------------------------------------------------------------
| Localizar código PIX na resposta
|--------------------------------------------------------------------------
*/

function obterCodigoPix(resultado) {
  return primeiroValorValido([
    resultado?.pix_code,
    resultado?.pixCode,
    resultado?.qr_code,
    resultado?.qrCode,
    resultado?.copy_paste,
    resultado?.copyPaste,
    resultado?.brcode,
    resultado?.emv,

    resultado?.data?.pix_code,
    resultado?.data?.pixCode,
    resultado?.data?.qr_code,
    resultado?.data?.qrCode,
    resultado?.data?.copy_paste,
    resultado?.data?.copyPaste,
    resultado?.data?.brcode,
    resultado?.data?.emv,

    resultado?.data?.pix?.code,
    resultado?.data?.pix?.copy_paste,
    resultado?.data?.pix?.copyPaste,

    resultado?.payment?.pix_code,
    resultado?.payment?.qr_code,
    resultado?.payment?.copy_paste,

    resultado?.transaction?.pix_code,
    resultado?.transaction?.qr_code,
    resultado?.transaction?.copy_paste
  ]);
}

/*
|--------------------------------------------------------------------------
| Localizar identificador
|--------------------------------------------------------------------------
*/

function obterIdentificadorPix(resultado) {
  return primeiroValorValido([
    resultado?.identifier,
    resultado?.transaction_id,
    resultado?.transactionId,
    resultado?.reference_id,
    resultado?.referenceId,
    resultado?.payment_id,
    resultado?.paymentId,
    resultado?.external_id,
    resultado?.externalId,
    resultado?.id,

    resultado?.data?.identifier,
    resultado?.data?.transaction_id,
    resultado?.data?.transactionId,
    resultado?.data?.reference_id,
    resultado?.data?.referenceId,
    resultado?.data?.payment_id,
    resultado?.data?.paymentId,
    resultado?.data?.external_id,
    resultado?.data?.externalId,
    resultado?.data?.id,

    resultado?.data?.transaction?.id,
    resultado?.data?.transaction?.identifier,

    resultado?.payment?.id,
    resultado?.payment?.identifier,

    resultado?.transaction?.id,
    resultado?.transaction?.identifier
  ]);
}

/*
|--------------------------------------------------------------------------
| Localizar status
|--------------------------------------------------------------------------
*/

function obterStatusPagamento(resultado) {
  return primeiroValorValido([
    resultado?.status,
    resultado?.payment_status,
    resultado?.paymentStatus,
    resultado?.transaction_status,
    resultado?.transactionStatus,

    resultado?.data?.status,
    resultado?.data?.payment_status,
    resultado?.data?.paymentStatus,
    resultado?.data?.transaction_status,
    resultado?.data?.transactionStatus,

    resultado?.data?.transaction?.status,
    resultado?.data?.payment?.status,

    resultado?.transaction?.status,
    resultado?.payment?.status
  ]);
}

function primeiroValorValido(valores) {
  return valores.find((valor) => {
    return (
      valor !== undefined &&
      valor !== null &&
      String(valor).trim() !== ''
    );
  });
}

/*
|--------------------------------------------------------------------------
| Status dos pagamentos
|--------------------------------------------------------------------------
*/

function normalizarStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

function pagamentoFoiAprovado(status) {
  const statusAprovados = [
    'paid',
    'approved',
    'completed',
    'complete',
    'confirmed',
    'success',
    'successful',
    'succeeded',
    'received',
    'settled',
    'aprovado',
    'pago',
    'concluido'
  ];

  return statusAprovados.includes(status);
}

function pagamentoFoiCancelado(status) {
  const statusCancelados = [
    'cancelled',
    'canceled',
    'expired',
    'failed',
    'refused',
    'rejected',
    'voided',
    'cancelado',
    'expirado',
    'falhou',
    'recusado'
  ];

  return statusCancelados.includes(status);
}

/*
|--------------------------------------------------------------------------
| Utilitários
|--------------------------------------------------------------------------
*/

function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarStatus(status) {
  if (!status) {
    return 'Pendente';
  }

  return String(status);
}

function escapeHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function obterMensagemErro(error) {
  const mensagem =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data ||
    error?.message ||
    'Erro desconhecido.';

  return formatarErro(mensagem);
}

function obterMensagemErroApi(error, mensagemPadrao) {
  const dados = error?.response?.data;

  if (dados?.message) {
    return String(dados.message);
  }

  if (dados?.error) {
    return String(dados.error);
  }

  if (typeof dados === 'string') {
    return dados;
  }

  if (error?.message) {
    return error.message;
  }

  return mensagemPadrao;
}

function formatarErro(error) {
  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return 'Erro inesperado.';
  }
}

async function enviarMensagemSegura(chatId, mensagem) {
  try {
    await bot.sendMessage(chatId, mensagem);
  } catch (error) {
    console.error(
      '❌ Não foi possível enviar a mensagem ao Telegram:',
      error.message
    );
  }
}

/*
|--------------------------------------------------------------------------
| Limpeza de pagamentos antigos
|--------------------------------------------------------------------------
*/

setInterval(() => {
  const agora = Date.now();
  const limite = 24 * 60 * 60 * 1000;

  for (const [chatId, pagamento] of pagamentos.entries()) {
    if (agora - pagamento.criadoEm > limite) {
      pagamentos.delete(chatId);
    }
  }
}, 60 * 60 * 1000);

/*
|--------------------------------------------------------------------------
| Erros gerais
|--------------------------------------------------------------------------
*/

bot.on('polling_error', (error) => {
  console.error(
    '❌ Erro no polling do Telegram:',
    error.message
  );
});

process.on('unhandledRejection', (error) => {
  console.error(
    '❌ Promise rejeitada não tratada:',
    error
  );
});

process.on('uncaughtException', (error) => {
  console.error(
    '❌ Exceção não tratada:',
    error
  );
});
