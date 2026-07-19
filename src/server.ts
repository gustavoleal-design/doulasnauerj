import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors()); 
app.use(express.json()); 

// Rota de Teste
app.get('/ping', async (req, res) => {
  res.json({ message: 'API do Doulasnauerj está Online! 🚀' });
});

// ==========================================
// ROTA: CADASTRAR MÃE (POST)
// ==========================================
app.post('/mothers', async (req, res) => {
  try {
    const { name, cpf, phone, dueDate, city } = req.body;

    // 1. Verifica duplicidade
    const motherAlreadyExists = await prisma.mother.findFirst({
      where: { cpf: cpf }
    });

    if (motherAlreadyExists) {
      return res.status(400).json({ 
        error: 'Atenção: Já existe uma gestante cadastrada com este CPF!' 
      });
    }

    // 2. Cria a gestante
    const newMother = await prisma.mother.create({
      data: {
        name,
        cpf,
        phone,
        dueDate: dueDate ? new Date(dueDate) : null,
        city
      }
    });

    return res.status(201).json(newMother);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao tentar cadastrar.' });
  }
});

// ==========================================
// ROTA: LISTAR MÃES (GET)
// ==========================================
app.get('/mothers', async (req, res) => {
  try {
    const mothers = await prisma.mother.findMany({
      orderBy: { createdAt: 'desc' } 
    });
    return res.json(mothers);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar gestantes.' });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});