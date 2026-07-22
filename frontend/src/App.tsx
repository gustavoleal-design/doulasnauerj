import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Lock, Mail, Eye, EyeOff, Activity, Calendar, Clock, Plus, LogOut, Trash2, MessageCircle, Send, X, Menu, HeartPulse } from 'lucide-react';

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
}

interface MessageData {
  id: number;
  content: string;
  sender: 'MOTHER' | 'STAFF';
  createdAt: string;
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

  // Estados para Novo Agendamento
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Estados do Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatMotherId, setChatMotherId] = useState<number | null>(null);
  const [chatDoulaId, setChatDoulaId] = useState<number | null>(null);

  // Estado Menu Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) fetchActivities();
  }, [user]);

  useEffect(() => {
    let interval: number;
    if (isChatOpen && chatMotherId && chatDoulaId) {
      fetchMessages(chatMotherId, chatDoulaId);
      interval = setInterval(() => {
        fetchMessages(chatMotherId, chatDoulaId);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isChatOpen, chatMotherId, chatDoulaId]);

  async function fetchActivities() {
    try {
      const response = await axios.get('http://localhost:3333/activities');
      if (accessType === 'GESTANTE') {
        setActivities(response.data.filter((act: any) => act.motherId === user?.id));
      } else {
        setActivities(response.data);
      }
    } catch (err) {
      console.error('Erro ao buscar atendimentos:', err);
    }
  }

  async function fetchMessages(mId: number, dId: number) {
    try {
      const response = await axios.get(`http://localhost:3333/messages/${mId}/${dId}`);
      setChatMessages(response.data);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3333/login', { email, password });
      const { accessType: type, user: loggedUser } = response.data;
      setUser(loggedUser);
      setAccessType(type);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateActivity(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const startDateTime = new Date(`${date}T${time}:00.000Z`).toISOString();
      const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

      await axios.post('http://localhost:3333/activities', {
        title,
        date: startDateTime,
        endTime: endDateTime,
        notes,
        motherId: user.id,
        doulaId: 1, 
      });

      setTitle(''); setDate(''); setTime(''); setNotes('');
      setShowModal(false);
      fetchActivities();
    } catch (err) {
      alert('Erro ao criar agendamento.');
    }
  }

  async function handleDeleteActivity(id: number) {
    if (!confirm('Tem certeza de que deseja cancelar este agendamento?')) return;
    try {
      await axios.delete(`http://localhost:3333/activities/${id}`);
      fetchActivities();
    } catch (err) {
      alert('Erro ao cancelar agendamento.');
    }
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatMotherId || !chatDoulaId) return;

    try {
      const translatedSender = accessType === 'GESTANTE' ? 'MOTHER' : 'STAFF';

      await axios.post('http://localhost:3333/messages', {
        content: newMessage,
        sender: translatedSender,
        motherId: chatMotherId,
        userId: chatDoulaId,
      });
      setNewMessage('');
      fetchMessages(chatMotherId, chatDoulaId);
    } catch (err: any) {
      alert('Erro ao enviar mensagem.');
    }
  }

  function handleOpenChatAsMother() {
    if (!user) return;
    setChatMotherId(user.id);
    const activeDoulaId = activities.length > 0 ? activities[0].doulaId : 1;
    setChatDoulaId(activeDoulaId); 
    setIsChatOpen(true);
  }

  function handleOpenChatAsStaff(mId: number, dId: number) {
    if (!user) return;
    setChatMotherId(mId);
    setChatDoulaId(dId);
    setIsChatOpen(true);
  }

  function handleLogout() {
    setUser(null); setAccessType(null); setEmail(''); setPassword('');
    setActivities([]); setIsChatOpen(false);
  }

  // --- COMPONENTES AUXILIARES DE UI ---

  const renderChatWindow = () => {
    if (!isChatOpen) return null;

    const mySenderType = accessType === 'GESTANTE' ? 'MOTHER' : 'STAFF';

    return (
      <div className="fixed bottom-4 right-4 w-80 sm:w-96 bg-[#faf9f8] rounded-2xl shadow-2xl border border-rose-100 z-50 flex flex-col overflow-hidden transition-all duration-300" style={{ height: '500px', maxHeight: '80vh' }}>
        <div className={`px-4 py-4 flex items-center justify-between text-white shadow-md z-10 ${accessType === 'STAFF' ? 'bg-indigo-600' : 'bg-rose-500'}`}>
          <div className="flex items-center gap-2">
            <HeartPulse size={20} />
            <span className="font-semibold text-sm">
              {accessType === 'STAFF' ? `Chat com Gestante #${chatMotherId}` : 'Minha Doula'}
            </span>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="hover:bg-black/20 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto bg-stone-100 flex flex-col gap-3">
          {chatMessages.length === 0 ? (
            <div className="bg-white p-3 rounded-xl text-center text-sm text-stone-500 shadow-sm mx-4 mt-4">
              Diga um "Oi", sua doula está pronta para te ouvir. 🌸
            </div>
          ) : (
            chatMessages.map(msg => {
              const isMine = msg.sender === mySenderType;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative ${
                    isMine 
                      ? 'bg-rose-200 text-stone-800 rounded-br-sm' 
                      : 'bg-white text-stone-800 rounded-bl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <span className="block text-[10px] mt-1 text-right opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200 flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Digite aqui..." 
            autoFocus
            className="flex-1 bg-stone-50 text-stone-800 border border-stone-200 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-rose-400 focus:outline-none"
          />
          <button type="submit" disabled={!newMessage.trim()} className="bg-rose-500 text-white p-2.5 rounded-full hover:bg-rose-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer flex items-center justify-center">
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </div>
    );
  };

  const Sidebar = () => (
    <>
      {/* Botão Mobile para abrir menu */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md text-stone-700 border border-stone-200"
      >
        {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>

      {/* Sidebar de fato */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-rose-100 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        {/* Logo/Header */}
        <div className="p-6 flex items-center gap-3 border-b border-rose-50">
          <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
            <HeartPulse size={24} />
          </div>
          <span className="font-bold text-xl text-stone-800">DoulasnaUERJ</span>
        </div>

        {/* Info do Usuário */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-rose-300 to-fuchsia-300 flex items-center justify-center font-bold text-white text-lg shadow-sm">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-stone-800 truncate">{user?.name}</p>
            <p className="text-xs text-rose-500 font-medium">
              {accessType === 'GESTANTE' ? 'Gestante' : 'Profissional'}
            </p>
          </div>
        </div>

        {/* Menu de Navegação */}
        <div className="flex-1 px-4 space-y-2 mt-2">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-rose-50 text-rose-600 rounded-lg font-medium">
            <Calendar size={18} />
            <span className="text-sm">Agendamentos</span>
          </div>
        </div>

        {/* Botões do Rodapé (Sair) */}
        <div className="p-4 border-t border-rose-50 space-y-2">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer font-medium"
          >
            <LogOut size={18} /> Sair do sistema
          </button>
        </div>
      </aside>

      {/* Fundo escuro para mobile quando o menu está aberto */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );

  // --- RENDERIZAÇÃO PRINCIPAL ---

  return (
    <div>
      <div className="min-h-screen bg-[#faf9f8] text-stone-800 transition-colors duration-300 font-sans flex">
        
        {/* Renderiza a Sidebar se estiver logado */}
        {user && <Sidebar />}

        {/* Conteúdo Principal */}
        <main className={`flex-1 ${user ? 'md:ml-64' : ''} p-6 md:p-10 transition-all duration-300 min-h-screen relative`}>
          
          {/* TELA DE LOGIN */}
          {!user && (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
              <div className="w-full max-w-md text-center mb-8">
                <div className="mx-auto h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mb-6 shadow-sm"><HeartPulse size={36} /></div>
                <h2 className="text-3xl font-extrabold text-stone-800 tracking-tight">DoulasnaUERJ</h2>
                <p className="text-stone-500 mt-2 text-sm">Cuidado, carinho e acolhimento.</p>
              </div>

              <div className="w-full max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl shadow-rose-100/50 border border-rose-50 rounded-3xl sm:px-10">
                  {error && <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>}
                  <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">E-mail</label>
                      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center"><Mail size={18} className="text-stone-400"/></div><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full pl-10 px-4 py-3 border border-stone-200 bg-stone-50 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-shadow" placeholder="voce@exemplo.com" /></div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Senha</label>
                      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center"><Lock size={18} className="text-stone-400"/></div><input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 border border-stone-200 bg-stone-50 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-shadow" placeholder="••••••••" /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-rose-500 hover:bg-rose-600 transition-all shadow-md shadow-rose-200 cursor-pointer">{loading ? 'Entrando...' : 'Acessar Plataforma'}</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* PAINEL (COMUM PARA AMBOS, MUDA SÓ OS DADOS) */}
          {user && (
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pt-10 md:pt-0">
                <div>
                  <h1 className="text-3xl font-bold text-stone-800">
                    {accessType === 'GESTANTE' ? 'Meus Agendamentos' : 'Painel de Atendimentos'}
                  </h1>
                  <p className="text-stone-500 mt-1 text-sm">
                    {accessType === 'GESTANTE' ? 'Acompanhe suas consultas e converse com sua equipe.' : 'Gerencie as consultas e dê suporte às gestantes.'}
                  </p>
                </div>
                
                {accessType === 'GESTANTE' && (
                  <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-medium px-5 py-3 rounded-xl shadow-md shadow-rose-200 transition-transform hover:scale-105 cursor-pointer">
                    <Plus size={18} /> Solicitar Agendamento
                  </button>
                )}
              </div>

              {activities.length === 0 ? (
                <div className="bg-white rounded-3xl border border-rose-50 p-16 text-center shadow-sm">
                  <Calendar className="mx-auto text-stone-300 mb-4" size={56} />
                  <h3 className="text-lg font-bold text-stone-700">Ainda não há nada por aqui</h3>
                  <p className="text-sm text-stone-500 mt-1">Os agendamentos aparecerão nesta tela.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activities.map((act) => (
                    <div key={act.id} className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col group">
                      
                      {/* Cabecalho do Card (Avatar + Titulo) */}
                      <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-rose-200 to-fuchsia-200 flex items-center justify-center text-rose-700 font-bold text-lg shadow-inner">
                            {act.title.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-stone-800 text-base leading-tight mb-1">{act.title}</h3>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-wider">
                              ID #{act.motherId}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteActivity(act.id)} className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer" title="Cancelar">
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Info de Data/Hora */}
                      <div className="space-y-3 text-sm text-stone-600 flex-1 mb-6">
                        <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl">
                          <Calendar size={18} className="text-rose-400 shrink-0" /> 
                          <span className="font-medium">{new Date(act.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl">
                          <Clock size={18} className="text-rose-400 shrink-0" /> 
                          <span className="font-medium">{new Date(act.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</span>
                        </div>
                      </div>

                      {/* Botão de Chat (Varia para Doula ou Gestante) */}
                      {accessType === 'STAFF' ? (
                        <button onClick={() => handleOpenChatAsStaff(act.motherId, act.doulaId)} className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm">
                          <MessageCircle size={18} /> Abrir Chat
                        </button>
                      ) : (
                        <div className="w-full text-center py-2">
                           <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Agendado</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botão flutuante de Chat para Gestante (Fica no canto inferior direito) */}
          {user && accessType === 'GESTANTE' && !isChatOpen && (
            <button
              onClick={handleOpenChatAsMother}
              className="fixed bottom-6 right-6 bg-rose-500 text-white p-4 rounded-full shadow-xl shadow-rose-200 hover:bg-rose-600 transition-transform hover:scale-105 cursor-pointer z-40 flex items-center gap-3"
            >
              <MessageCircle size={24} />
              <span className="font-bold hidden sm:inline pr-2">Falar com a Equipe</span>
            </button>
          )}

          {renderChatWindow()}

          {/* Modal de Novo Agendamento */}
          {showModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-stone-800">Nova Consulta</h3>
                  <button onClick={()=>setShowModal(false)} className="text-stone-400 hover:text-stone-600 bg-stone-100 p-2 rounded-full transition-colors"><X size={16}/></button>
                </div>
                <form onSubmit={handleCreateActivity} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Motivo / Título</label>
                    <input type="text" required value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-sm font-medium text-stone-700 mb-1 block">Data</label>
                       <input type="date" required value={date} onChange={(e)=>setDate(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none" />
                    </div>
                    <div>
                       <label className="text-sm font-medium text-stone-700 mb-1 block">Hora</label>
                       <input type="time" required value={time} onChange={(e)=>setTime(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Observações (Opcional)</label>
                    <textarea rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none resize-none" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-3 font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md cursor-pointer transition-colors">Confirmar</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}