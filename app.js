const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database(), now()');

    res.json({
      status: 'ok',
      database: result.rows[0].current_database,
      timestamp: result.rows[0].now
    });

  } catch (error) {
    res.status(500).json({
      status: 'erro',
      mensagem: error.message
    });
  }
});
//Trazer os produtos com o primeiro endpoint da API
app.post('/produtos/consultar', async (req, res) => {
  try {
    const { codigos } = req.body;

    if (!Array.isArray(codigos) || codigos.length === 0) {
      return res.status(400).json({
        erro: 'Informe uma lista de codigos em "codigos".'
      });
    }

    const query = `
      SELECT
        p.codigo AS codigo_produto,
        p.nome AS nome_produto,
        p.tipo_material,
        p.unidade_medida,
        p.disponibilidade,
        p.estoque,
        f.nome AS nome_fornecedor,
        pf.valor,
        pf.ativo AS produto_fornecedor_ativo,
        pc.diametro,
        pc.secao,
        pc.espiras,
        pc.kg_por_km,
        pc.resistencia,
        pc.capacidade
      FROM produto p
      JOIN produto_fornecedor pf ON pf.produto_id = p.id
      JOIN fornecedor f ON f.id = pf.fornecedor_id
      LEFT JOIN produto_cobre pc ON pc.produto_id = p.id
      WHERE p.codigo = ANY($1)
        AND p.disponibilidade = TRUE
        AND pf.ativo = TRUE
        AND f.ativo = TRUE
      ORDER BY p.codigo, pf.valor
    `;

    const result = await pool.query(query, [codigos]);

    res.json({
      quantidade: result.rows.length,
      itens: result.rows
    });
  } catch (error) {
    res.status(500).json({
      erro: 'Erro ao consultar produtos.',
      detalhe: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});