import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors()); 
app.use(express.json()); 

//
// Rota de Teste
//
app.get('/ping', async (req, res) => {
  res.json({ message: 'API do Doulasnauerj está Online! 🚀' });
});

// 
// ROTA: CADASTRAR MÃE (POST)
// 
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

// 
// ROTA: LISTAR MÃES (GET)
// 
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

// 
// ROTA: ATUALIZAR MÃE (PUT)
// 
app.put('/mothers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cpf, phone, dueDate, city } = req.body;

    const motherExists = await prisma.mother.findUnique({
      where: { id: Number(id) }
    });

    if (!motherExists) {
      return res.status(404).json({ error: 'Gestante não encontrada.' });
    }

    const updatedMother = await prisma.mother.update({
      where: { id: Number(id) },
      data: {
        name,
        cpf,
        phone,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        city
      }
    });

    return res.json(updatedMother);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar a gestante.' });
  }
});

// 
// ROTA: DELETAR MÃE (DELETE)
//
app.delete('/mothers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const motherExists = await prisma.mother.findUnique({
      where: { id: Number(id) }
    });

    if (!motherExists) {
      return res.status(404).json({ error: 'Gestante não encontrada.' });
    }

    await prisma.mother.delete({
      where: { id: Number(id) }
    });

    return res.status(204).send(); 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar a gestante.' });
  }
});

// 
// ROTA: CADASTRAR ATENDIMENTO/ATIVIDADE (POST)
// 
app.post('/activities', async (req, res) => {
  try {
    const { title, date, endTime, status, notes, motherId, doulaId } = req.body;

    // 1. Validar se a mãe informada existe
    const motherExists = await prisma.mother.findUnique({
      where: { id: Number(motherId) }
    });

    if (!motherExists) {
      return res.status(404).json({ error: 'Gestante não encontrada.' });
    }

    // 2. Validar se a Doula (User) informada existe
    const doulaExists = await prisma.user.findUnique({
      where: { id: Number(doulaId) }
    });

    if (!doulaExists) {
      return res.status(404).json({ error: 'Doula/Usuário não encontrado.' });
    }

    // 3. Criar a atividade com todos os vínculos necessários
    const newActivity = await prisma.activity.create({
      data: {
        title,
        date: new Date(date), 
        endTime: new Date(endTime),
        status: status || 'SCHEDULED', 
        notes,
        motherId: Number(motherId),
        doulaId: Number(doulaId)
      }
    });

    return res.status(201).json(newActivity);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao registrar o atendimento.' });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});