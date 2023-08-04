"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ArticleController_1 = require("../controllers/ArticleController");
const router = express_1.default.Router();
router.get('/', ArticleController_1.getArticles);
exports.default = router;
