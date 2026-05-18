const http = require('http');
const https = require('https');
const { URL } = require('url');
const db = require('../config/db');

const sendWebhookRequest = (webhookUrl, payload) => {
  return new Promise((resolve, reject) => {
    let parsedUrl;

    try {
      parsedUrl = new URL(webhookUrl);
    } catch (error) {
      return reject(new Error(`Invalid webhook URL: ${webhookUrl}`));
    }

    const body = JSON.stringify(payload);
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 5000,
    };

    const req = transport.request(parsedUrl, requestOptions, (res) => {
      const chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString();

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: responseBody });
        } else {
          const error = new Error(`Webhook request failed with status ${res.statusCode}`);
          error.statusCode = res.statusCode;
          error.responseBody = responseBody;
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Webhook request timed out'));
    });

    req.write(body);
    req.end();
  });
};

const triggerTenantWebhooks = async (tenantId, event, payload) => {
  const query = 'SELECT id, url, event FROM webhooks WHERE tenant_id = $1 AND event = $2';
  const { rows } = await db.query(query, [tenantId, event]);

  if (!rows.length) {
    return;
  }

  const results = await Promise.allSettled(
    rows.map((webhook) => sendWebhookRequest(webhook.url, payload))
  );

  results.forEach((result, index) => {
    const webhook = rows[index];
    if (result.status === 'rejected') {
      console.error(
        `Webhook [${webhook.id}] failed for event ${event} at ${webhook.url}:`,
        result.reason.message || result.reason
      );
    }
  });
};

module.exports = {
  triggerTenantWebhooks,
};
