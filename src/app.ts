import express from 'express';
import indexRouter from './views/index';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/', indexRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
