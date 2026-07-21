import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Lock, Mail, Eye, EyeOff, Activity, Calendar, Clock, Plus, LogOut, FileText, UserCheck, Users } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface ActivityData {
  id: number;
  title: string;
  date: string;
  endTime: string;
  notes?: string;
  motherId: number;
  doulaId: number;
  mother?: {
    name: string;
    email: string;
  };
  doula?: {
    name: string;
  };
}

export default function App() {
  // Estados para Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para Controle de Sessão e Painel
  const [user, setUser] = useState<UserData | null>(null);
  const [accessType, setAccessType] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);

  // Estados para Novo Agendamento (Gestante)
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Buscar agendamentos quando o usuário fizer login
  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  async function fetchActivities() {
    try {
      const response = await axios.get('http://localhost:3333/activities');
      if (accessType === 'GESTANTE') {
        // Filtra apenas as atividades da gestante logada
        setActivities(response.data.filter((act: any) => act.motherId === user?.id));
      } else {
        // Doulas / Staff veem TODAS as solicitações do sistema
        setActivities(response.data);
      }
    } catch (err) {
      console.error('Erro ao buscar atendimentos:', err);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3333/login', {
        email,
        password,
      });

      const { accessType: type, user: loggedUser } = response.data;

      setUser(loggedUser);
      setAccessType(type);

    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateActivity(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setCreating(true);
    try {
      const startDateTime = new Date(`${date}T${time}:00.000Z`).toISOString();
      const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

      await axios.post('http://localhost:3333/activities', {
        title,
        date: startDateTime,
        endTime: endDateTime,
        notes,
        motherId: user.id,
        doulaId: 1, // Doula responsável inicial
      });

      setTitle('');
      setDate('');
      setTime('');
      setNotes('');
      setShowModal(false);

      fetchActivities();
    } catch (err) {
      alert('Erro ao criar agendamento. Verifique os dados.');
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    setUser(null);
    setAccessType(null);
    setEmail('');
    setPassword('');
    setActivities([]);
  }

  // =========================================================
  // RENDERIZAÇÃO 1: TELA DAS DOULAS / ADMINS (STAFF)
  // =========================================================
  if (user && accessType === 'STAFF') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Navbar */}
        <header className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900 font-bold">
                <Users size={20} />
              </div>
              <div>
                <span className="font-bold text-lg block leading-none">DoulasnaUERJ</span>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Painel Administrativo</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300 hidden sm:inline">
                Profissional: <strong className="text-white">{user.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-red-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo do Painel da Doula */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gerenciamento de Solicitados</h1>
              <p className="text-sm text-slate-500">Acompanhe todas as consultas e atendimentos agendados pelas gestantes.</p>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-emerald-800 text-sm font-medium flex items-center gap-2">
              <UserCheck size={18} />
              <span>Total de Agendamentos: <strong>{activities.length}</strong></span>
            </div>
          </div>

          {/* Cards de Soluções/Atendimentos */}
          {activities.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
              <h3 className="text-lg font-semibold text-gray-900">Nenhum agendamento no sistema</h3>
              <p className="text-sm text-gray-500 mt-1">Quando uma gestante marcar uma consulta, ela aparecerá listada aqui para você.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activities.map((act) => (
                <div key={act.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-3">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                        Gestante ID #{act.motherId}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{act.title}</h3>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-emerald-600 shrink-0" />
                      <span>{new Date(act.date).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-emerald-600 shrink-0" />
                      <span>
                        {new Date(act.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                      </span>
                    </div>

                    {act.notes && (
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <span className="text-xs font-semibold text-slate-400 block mb-1">Observações da Gestante:</span>
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {act.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================
  // RENDERIZAÇÃO 2: TELA DA GESTANTE
  // =========================================================
  if (user && accessType === 'GESTANTE') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Activity size={20} />
              </div>
              <span className="font-bold text-gray-900 text-lg">DoulasnaUERJ</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:inline">
                Mãe: <strong className="text-gray-900">{user.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
              <p className="text-sm text-gray-500">Acompanhe suas consultas e acompanhamentos marcados.</p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={18} />
              Solicitar Novo Agendamento
            </button>
          </div>

          {activities.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Calendar className="mx-auto text-gray-400 mb-3" size={40} />
              <h3 className="text-base font-semibold text-gray-900">Nenhum atendimento agendado</h3>
              <p className="text-sm text-gray-500 mt-1">Você ainda não possui consultas marcadas. Clique no botão acima para agendar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((act) => (
                <div key={act.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 text-lg">{act.title}</h3>
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-100">
                      Confirmado
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-emerald-600" />
                      <span>{new Date(act.date).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-emerald-600" />
                      <span>
                        {new Date(act.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                      </span>
                    </div>

                    {act.notes && (
                      <div className="flex items-start gap-2 pt-2 border-t border-gray-100 mt-3 text-xs text-gray-500">
                        <FileText size={14} className="mt-0.5 text-gray-400 shrink-0" />
                        <span>{act.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900">Novo Agendamento</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Atendimento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Consulta Pré-Natal / Dúvidas"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações / Notas</label>
                  <textarea
                    rows={3}
                    placeholder="Escreva algo importante para a doula saber..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {creating ? 'Agendando...' : 'Confirmar Agendamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // RENDERIZAÇÃO 3: TELA DE LOGIN (PADRÃO)
  // =========================================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
          <Activity size={28} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          DoulasnaUERJ
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Portal unificado para Gestantes e Equipe Técnica
        </p>
      </div>

      <div className="sm:mx-auto w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-gray-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  placeholder="seu.email@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Entrando...' : 'Entrar no sistema'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}