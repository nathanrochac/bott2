const axios = require('axios');

const BASE_URL =
  process.env.SYNCPAY_BASE_URL ||
  'https://api.syncpayments.com.br';

function validarCredenciais() {
  if (!process.env.SYNCPAY_CLIENT_ID) {
    throw new Error(
      'SYNCPAY_CLIENT_ID não foi configurado no Railway.'
    );
  }

  if (!process.env.SYNCPAY_CLIENT_SECRET) {
    throw new Error(
      'SYNCPAY_CLIENT_SECRET não foi configurado no Railway.'
    );
  }
}

async function obterToken() {
  validarCredenciais();

  try {
    const response = await axios.post(
      `${BASE_URL}/api/partner/v1/auth-token`,
      {
        client_id: process.env.SYNCPAY_CLIENT_ID,
        client_secret: process.env.SYNCPAY_CLIENT_SECRET
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    const token =
      response.data?.access_token ||
      response.data?.token ||
      response.data?.data?.access_token ||
      response.data?.data?.token;

    if (!token) {
      console.error(
        'Retorno completo da autenticação:',
        JSON.stringify(response.data, null, 2)
      );

      throw new Error(
        'A SyncPay não retornou o token de autenticação.'
      );
    }

    return token;
  } catch (error) {
    console.error(
      'Erro ao autenticar na SyncPay:',
      error.response?.data || error.message
    );

    throw error;
  }
}

async function gerarPix(valor, dadosExtras = {}) {
  const valorNumerico = Number(valor);

  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    throw new Error('O valor do PIX deve ser maior que zero.');
  }

  const token = await obterToken();

  const payload = {
    amount: valorNumerico,
    description:
      dadosExtras.produto || 'Pagamento via Telegram',
    external_id:
      dadosExtras.chatId ||
      `telegram-${Date.now()}`
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/api/partner/v1/cash-in`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      'Erro ao gerar PIX na SyncPay:',
      error.response?.data || error.message
    );

    throw error;
  }
}

async function verificarPagamento(identifier) {
  if (!identifier) {
    throw new Error(
      'Identificador do pagamento não informado.'
    );
  }

  const token = await obterToken();

  try {
    const response = await axios.get(
      `${BASE_URL}/api/partner/v1/cash-in/${encodeURIComponent(
        identifier
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        timeout: 20000
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      'Erro ao verificar PIX na SyncPay:',
      error.response?.data || error.message
    );

    throw error;
  }
}

module.exports = {
  gerarPix,
  verificarPagamento
};
