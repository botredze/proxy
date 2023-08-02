import express from 'express';
import { getArticles } from '../controllers/ArticleController';

const router = express.Router();

router.get('/', getArticles);

export default router;
