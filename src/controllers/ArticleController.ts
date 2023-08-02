import axios from 'axios';
import { Request, Response } from 'express';
import { getProxies, updateProxyRetryCount } from '../models/Proxy';

const REQUESTS_PER_PROXY = 30;
const PROXY_SWITCH_TIMEOUT = 15000;

async function makeRequestWithProxy(url: string, proxy: any) {
  try {
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

    return response.data;
  } catch (error: Error | any) {
    if (error.code === 'ECONNABORTED' && error.message.startsWith('timeout') && proxy.retryCount < 3) {
      await updateProxyRetryCount(proxy.id, proxy.retryCount + 1);
      return makeRequestWithProxy(url, proxy);
    }

    throw error;
    }
}

export async function getArticles(req: Request, res: Response) {
  try {
    const articlesCount = 5000;
    const articlesArray = Array.from({ length: articlesCount }, (_, i) => i + 1);
    const proxyList = await getProxies();

    let proxyIndex = 0;
    let requestsCount = 0;
    for (const article of articlesArray) {
      const proxy = proxyList[proxyIndex];

      try {
        const data = await makeRequestWithProxy(`https://kaspi.kz/yml/offer-view/offers/${article}`, proxy);
        console.log(`Article: ${article}, Data:`, data);

        requestsCount++;
        if (requestsCount >= REQUESTS_PER_PROXY) {
          requestsCount = 0;
          proxyIndex = (proxyIndex + 1) % proxyList.length;
          await new Promise((resolve) => setTimeout(resolve, PROXY_SWITCH_TIMEOUT));
        }
      } catch (error) {
        console.error(`Failed to get data for article ${article} using proxy ${proxy.ip}:${proxy.port}`);
      }
    }

    res.status(200).json({ message: 'All requests completed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
}
