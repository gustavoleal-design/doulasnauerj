import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Rota de Teste
app.get('/ping', async (req, res) => {
  return res.json({ message: 'API Doulasnauerj está Online! 🚀' });
});

// 
// 1. ROTA DE CADASTRO DE USUÁRIOS (ADMIN OU DOULA)
// 
app.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Campos nome, email e senha são obrigatórios.' });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'DOULA'
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar o usuário.' });
  }
});

// 
// 2. ROTA DE CADASTRO DE GESTANTES (MOTHERS COM ACESSO)
// 
app.post('/mothers', async (req, res) => {
  try {
    const { name, email, password, cpf, phone, dueDate, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios para a gestante.' });
    }

    const emailExists = await prisma.mother.findUnique({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    if (cpf) {
      const cpfExists = await prisma.mother.findUnique({ where: { cpf } });
      if (cpfExists) {
        return res.status(400).json({ error: 'Já existe uma gestante com este CPF.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newMother = await prisma.mother.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf,
        phone,
        dueDate: dueDate ? new Date(dueDate) : null,
        city
      }
    });

    const { password: _, ...motherWithoutPassword } = newMother;
    return res.status(201).json(motherWithoutPassword);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar a gestante.' });
  }
});

// Listar todas as gestantes
app.get('/mothers', async (req, res) => {
  const mothers = await prisma.mother.findMany();
  return res.json(mothers);
});

// Listar todos os usuários da equipe (Doulas)
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  return res.json(users);
});

// 
// 3. ROTA DE LOGIN UNIFICADA (PROCURA EM USER OU MOTHER)
// 
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    // 1º Passo: Busca na tabela de Usuários (Admin/Doula)
    let account: any = await prisma.user.findUnique({ where: { email } });
    let type = 'STAFF'; 

    // 2º Passo: Se não achar, busca na tabela de Gestantes (Mother)
    if (!account) {
      account = await prisma.mother.findUnique({ where: { email } });
      type = 'GESTANTE'; 
    }

    if (!account) {
      return res.status(400).json({ error: 'E-mail ou senha inválidos.' });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'E-mail ou senha inválidos.' });
    }

    const { password: _, ...accountWithoutPassword } = account;

    return res.json({
      message: 'Login realizado com sucesso!',
      accessType: type, 
      user: accountWithoutPassword
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao realizar o login.' });
  }
});

// 
// 4. ROTAS DE AGENDAMENTO DE ATENDIMENTOS (ACTIVITIES)
// 
app.post('/activities', async (req, res) => {
  try {
    const { title, date, endTime, notes, motherId, doulaId } = req.body;

    if (!title || !date || !endTime || !motherId || !doulaId) {
      return res.status(400).json({ 
        error: 'Os campos title, date, endTime, motherId e doulaId são obrigatórios.' 
      });
    }

    const newActivity = await prisma.activity.create({
      data: {
        title,
        date: new Date(date),
        endTime: new Date(endTime),
        notes,
        motherId: Number(motherId), 
        doulaId: Number(doulaId)   
      }
    });

    return res.status(201).json(newActivity);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao criar o agendamento.' });
  }
});

app.get('/activities', async (req, res) => {
  const activities = await prisma.activity.findMany({
    include: {
      mother: true,
      doula: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });
  return res.json(activities);
});

app.delete('/activities/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.activity.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({ message: 'Agendamento cancelado com sucesso.' });
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao cancelar agendamento.' });
  }
});

//
// 5. ROTAS DE MENSAGENS (CHAT)
//
app.get('/messages/:motherId/:userId', async (req, res) => {
  try {
    const { motherId, userId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        motherId: Number(motherId),
        userId: Number(userId),
      },
      orderBy: {
        createdAt: 'asc', // Ordena da mensagem mais antiga para a mais nova
      },
    });

    return res.json(messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar as mensagens.' });
  }
});

app.post('/messages', async (req, res) => {
  try {
    const { content, sender, motherId, userId } = req.body;

    if (!content || !sender || !motherId || !userId) {
      return res.status(400).json({ error: 'Todos os campos da mensagem são obrigatórios.' });
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        sender, // Pode ser 'MOTHER' ou 'STAFF'
        motherId: Number(motherId),
        userId: Number(userId),
      },
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao enviar a mensagem.' });
  }
});

app.listen(3333, () => console.log('Servidor rodando em http://localhost:3333'));