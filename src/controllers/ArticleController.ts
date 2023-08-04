import axios from 'axios';
import { Request, Response } from 'express';
import { getProxies, updateProxyRetryCount } from '../models/Proxy';

const REQUESTS_PER_PROXY = 30;
const PROXY_SWITCH_TIMEOUT = 15000;
const MAX_RETRY_COUNT = 3;

const proxyRequestCounts: { [proxyId: number]: { count: number; lastRequestTime: number } } = {};

async function makeRequestWithProxy(url: string, proxy: any) {
  const proxyId = proxy.id;

  if (!proxyRequestCounts[proxyId]) {
    proxyRequestCounts[proxyId] = { count: 0, lastRequestTime: 0 };
  }

  try {
    if (proxyRequestCounts[proxyId].count >= REQUESTS_PER_PROXY) {
      const currentTime = Date.now();
      const timeDiff = currentTime - proxyRequestCounts[proxyId].lastRequestTime;
      if (timeDiff < PROXY_SWITCH_TIMEOUT) {
        await new Promise((resolve) => setTimeout(resolve, PROXY_SWITCH_TIMEOUT - timeDiff));
      }
      proxyRequestCounts[proxyId].count = 0;
    }

    const response = await axios.get(url, {
      proxy: {
        host: proxy.ip,
        port: proxy.port,
        auth: {
          username: proxy.login,
          password: proxy.password,
        },
      },
      timeout: 7000,
    });

    proxyRequestCounts[proxyId].count++;
    proxyRequestCounts[proxyId].lastRequestTime = Date.now();

    return response.data;
  } catch (error: Error | any) {
    proxy.retryCount = proxy.retryCount || 0;
    proxy.retryCount++;

    if (proxy.retryCount > MAX_RETRY_COUNT) {
      return null;
    }

    if (error.code === 'ECONNABORTED' && error.message.startsWith('timeout')) {
      await updateProxyRetryCount(proxyId, proxy.retryCount);
      return makeRequestWithProxy(url, proxy);
    }

    throw error;
  }
}

export async function getArticles(req: Request, res: Response) {
  try {
    const articlesCount = 5000;
    const batchSize = 500;
    const articlesArray = Array.from({ length: articlesCount }, (_, i) => i + 1);
    const proxyList = await getProxies();

    const successfulResponses: any[] = [];

    for (let i = 0; i < articlesCount; i += batchSize) {
      const batchArticles = articlesArray.slice(i, i + batchSize);

      const batchResponses = [];

      for await (const article of batchArticles) {
        const proxyIndex = (article - 1) % proxyList.length;
        const proxy = proxyList[proxyIndex];

        try {
          const data = await makeRequestWithProxy(`https://kaspi.kz/yml/offer-view/offers/${article}`, proxy);
          if (data) {
            batchResponses.push(data);
          }
        } catch (error) {
          console.error(`Failed to get data for article ${article} using proxy ${proxy.ip}:${proxy.port}`);
        }
      }

      successfulResponses.push(...batchResponses);
    }

    res.status(200).json({ message: 'All requests completed successfully.', responses: successfulResponses });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
}
