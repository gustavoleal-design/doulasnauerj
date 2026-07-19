import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const app = express();
const prisma = new PrismaClient();

app.use(cors()); 
app.use(express.json()); 

//
// Rota de Teste
//
app.get('/ping', async (req, res) => {
  res.json({ message: 'API Doulasnauerj está Online! 🚀' });
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

// 
// ROTA: CADASTRAR ADMINISTRADOR ÚNICO (POST)
// 
app.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Verifica se o e-mail do administrador já está cadastrado
    const userAlreadyExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userAlreadyExists) {
      return res.status(400).json({ error: 'Este e-mail de administrador já está em uso.' });
    }

    // 2. Criptografa a senha antes de salvar (Segurança!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Cria o administrador único no banco
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN' // Define como ADMIN por padrão para o gestor do sistema
      }
    });

    // 4. Remove a senha do retorno por segurança
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao cadastrar o administrador.' });
  }
});

// 
// ROTA: ALTERAR ATENDIMENTO/ATIVIDADE (PUT)
// 
app.put('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, endTime, status, notes, motherId, doulaId } = req.body;

    // 1. Validar se a atividade informada existe no banco
    const activityExists = await prisma.activity.findUnique({
      where: { id: Number(id) }
    });

    if (!activityExists) {
      return res.status(404).json({ error: 'Atendimento não encontrado.' });
    }

    // 2. Se o usuário estiver mudando a mãe, valida se a nova mãe existe
    if (motherId) {
      const motherExists = await prisma.mother.findUnique({
        where: { id: Number(motherId) }
      });
      if (!motherExists) {
        return res.status(404).json({ error: 'Gestante informada não encontrada.' });
      }
    }

    // 3. Se o usuário estiver mudando o administrador/doula, valida se ele existe
    if (doulaId) {
      const doulaExists = await prisma.user.findUnique({
        where: { id: Number(doulaId) }
      });
      if (!doulaExists) {
        return res.status(404).json({ error: 'Administrador informado não encontrado.' });
      }
    }

    // 4. Executa a atualização com as datas devidamente formatadas
    const updatedActivity = await prisma.activity.update({
      where: { id: Number(id) },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        status,
        notes,
        motherId: motherId ? Number(motherId) : undefined,
        doulaId: doulaId ? Number(doulaId) : undefined
      }
    });

    return res.json(updatedActivity);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar o atendimento.' });
  }
});

// 
// ROTA: DELETAR ATENDIMENTO/ATIVIDADE (DELETE)
// 
app.delete('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validar se a atividade informada existe
    const activityExists = await prisma.activity.findUnique({
      where: { id: Number(id) }
    });

    if (!activityExists) {
      return res.status(404).json({ error: 'Atendimento não encontrado.' });
    }

    // 2. Deleta o registro do banco de dados
    await prisma.activity.delete({
      where: { id: Number(id) }
    });

    return res.status(204).send(); // Retorna 204 No Content (sucesso sem corpo de resposta)
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar o atendimento.' });
  }
});

// 
// ROTA: LISTAR TODOS OS ATENDIMENTOS/ATIVIDADES (GET)
// 
app.get('/activities', async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { 
        date: 'asc' // Organiza a agenda da mais próxima para a mais distante
      },
      include: {
        mother: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        doula: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.json(activities);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar a listagem de atendimentos.' });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});