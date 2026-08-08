import React, { useState, useEffect, useRef } from 'react';

const API_BASE = '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('discord'); // 'discord' | 'trello' | 'stats'
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newMessageText, setNewMessageText] = useState('');
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Member');
  const [showCardModal, setShowCardModal] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');
  const [newCardList, setNewCardList] = useState('todo');
  const [newCardPriority, setNewCardPriority] = useState('medium');
  const [newCardAssignee, setNewCardAssignee] = useState('');
  const [cardFilterPriority, setCardFilterPriority] = useState('all');

  const messagesEndRef = useRef(null);

  // Initial Fetch
  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchStatsAndHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when active channel changes
  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId);
    }
  }, [activeChannelId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [chRes, memRes, cardRes, statsRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/channels`),
        fetch(`${API_BASE}/members`),
        fetch(`${API_BASE}/cards`),
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/health`)
      ]);

      const chData = await chRes.json();
      const memData = await memRes.json();
      const cardData = await cardRes.json();
      const stData = await statsRes.json();
      const hlData = await healthRes.json();

      setChannels(chData);
      setMembers(memData);
      setCards(cardData);
      setStats(stData);
      setHealth(hlData);

      if (chData.length > 0) {
        setActiveChannelId(chData[0].id);
      }
      if (memData.length > 0) {
        setSelectedSenderId(memData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAndHealth = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/health`)
      ]);
      setStats(await statsRes.json());
      setHealth(await healthRes.json());
    } catch (err) {
      console.error('Error polling stats:', err);
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      const res = await fetch(`${API_BASE}/messages?channelId=${channelId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Channel Handlers
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName,
          description: newChannelDesc,
          category: 'Text Channels'
        })
      });
      if (res.ok) {
        const created = await res.json();
        setChannels([...channels, created]);
        setActiveChannelId(created.id);
        setNewChannelName('');
        setNewChannelDesc('');
        setShowChannelModal(false);
      }
    } catch (err) {
      console.error('Error creating channel:', err);
    }
  };

  const handleDeleteChannel = async (id, isDefault) => {
    if (isDefault) {
      alert('Cannot delete the default #general channel');
      return;
    }
    if (!confirm('Are you sure you want to delete this channel?')) return;
    try {
      const res = await fetch(`${API_BASE}/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = channels.filter(c => c.id !== id);
        setChannels(remaining);
        if (activeChannelId === id && remaining.length > 0) {
          setActiveChannelId(remaining[0].id);
        }
      }
    } catch (err) {
      console.error('Error deleting channel:', err);
    }
  };

  // Member Handlers
  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberUsername.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMemberName,
          username: newMemberUsername,
          role: newMemberRole,
          status: 'online'
        })
      });
      if (res.ok) {
        const created = await res.json();
        setMembers([...members, created]);
        setNewMemberName('');
        setNewMemberUsername('');
        setShowMemberModal(false);
      }
    } catch (err) {
      console.error('Error creating member:', err);
    }
  };

  // Message Handlers
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChannelId || !selectedSenderId) return;
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: activeChannelId,
          senderId: selectedSenderId,
          text: newMessageText
        })
      });
      if (res.ok) {
        const created = await res.json();
        setMessages([...messages, created]);
        setNewMessageText('');
        fetchStatsAndHealth();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(messages.filter(m => m.id !== id));
        fetchStatsAndHealth();
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Card (Kanban) Handlers
  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCardTitle,
          description: newCardDesc,
          list: newCardList,
          priority: newCardPriority,
          assignedTo: newCardAssignee || null
        })
      });
      if (res.ok) {
        const created = await res.json();
        setCards([...cards, created]);
        setNewCardTitle('');
        setNewCardDesc('');
        setShowCardModal(false);
        fetchStatsAndHealth();
      }
    } catch (err) {
      console.error('Error creating card:', err);
    }
  };

  const handleMoveCard = async (cardId, currentList, direction) => {
    const listOrder = ['todo', 'in-progress', 'review', 'done'];
    const currentIndex = listOrder.indexOf(currentList);
    const targetIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= listOrder.length) return;

    const targetList = listOrder[targetIndex];
    try {
      const res = await fetch(`${API_BASE}/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list: targetList })
      });
      if (res.ok) {
        const updated = await res.json();
        setCards(cards.map(c => c.id === cardId ? updated : c));
      }
    } catch (err) {
      console.error('Error moving card:', err);
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/cards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCards(cards.filter(c => c.id !== id));
        fetchStatsAndHealth();
      }
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  const activeChannel = channels.find(c => c.id === activeChannelId) || { name: 'general', description: '' };

  const filteredCards = cardFilterPriority === 'all' 
    ? cards 
    : cards.filter(c => c.priority === cardFilterPriority);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: '#ef444422', border: '#ef4444', text: '#f87171' };
      case 'high': return { bg: '#f59e0b22', border: '#f59e0b', text: '#fbbf24' };
      case 'medium': return { bg: '#3b82f622', border: '#3b82f6', text: '#60a5fa' };
      default: return { bg: '#10b98122', border: '#10b981', text: '#34d399' };
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'idle': return '#f59e0b';
      case 'dnd': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* TOP GLOBAL NAVBAR */}
      <header style={{
        height: '60px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              color: '#ffffff'
            }}>R</div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Rosetta</h1>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Discord + Trello Hybrid Hub</span>
            </div>
          </div>

          {/* VIEW SWITCHER TABS */}
          <nav style={{ display: 'flex', gap: '6px', marginLeft: '24px' }}>
            <button
              onClick={() => setActiveTab('discord')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: activeTab === 'discord' ? 'var(--accent-discord)' : 'transparent',
                color: activeTab === 'discord' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              💬 Discord Hub
            </button>
            <button
              onClick={() => setActiveTab('trello')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: activeTab === 'trello' ? 'var(--accent-trello)' : 'transparent',
                color: activeTab === 'trello' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              📋 Trello Board
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: activeTab === 'stats' ? 'var(--bg-tertiary)' : 'transparent',
                color: activeTab === 'stats' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              📊 System Diagnostics
            </button>
          </nav>
        </div>

        {/* SERVER STATUS BADGE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}>
            <span className="pulse-dot" style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: health?.status === 'ok' ? '#10b981' : '#ef4444'
            }}></span>
            <span>API Online</span>
            <span style={{ color: 'var(--text-dim)' }}>|</span>
            <span>Uptime: {health?.uptimeSeconds || 0}s</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT PANELS */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ============================================================ */}
        {/* VIEW 1: DISCORD HUB (Channels + Text Chat + Members Sidebar) */}
        {/* ============================================================ */}
        {activeTab === 'discord' && (
          <div style={{ display: 'flex', width: '100%', height: '100%' }} className="animate-fade-in">
            
            {/* LEFT SIDEBAR: CHANNELS */}
            <aside style={{
              width: '240px',
              backgroundColor: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                  Text Channels
                </span>
                <button
                  onClick={() => setShowChannelModal(true)}
                  title="Create Channel"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 700
                  }}
                >+</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {channels.map(channel => (
                  <div
                    key={channel.id}
                    onClick={() => setActiveChannelId(channel.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      backgroundColor: activeChannelId === channel.id ? 'var(--bg-tertiary)' : 'transparent',
                      color: activeChannelId === channel.id ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '14px',
                      fontWeight: activeChannelId === channel.id ? 600 : 400,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span style={{ color: 'var(--text-dim)' }}>#</span>
                      <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{channel.name}</span>
                    </div>
                    {!channel.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChannel(channel.id, channel.isDefault);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 4px'
                        }}
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>

              {/* CURRENT USER FOOTER */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="User Avatar"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    border: '2px solid var(--bg-primary)'
                  }}></span>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Tanjim Hossen</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>@tanjim (Admin)</div>
                </div>
              </div>
            </aside>

            {/* MIDDLE: CHAT STREAM */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
              
              {/* CHANNEL HEADER */}
              <div style={{
                height: '52px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: '12px',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '20px', color: 'var(--text-dim)', fontWeight: 700 }}>#</span>
                <span style={{ fontSize: '15px', fontWeight: 700 }}>{activeChannel.name}</span>
                <span style={{ color: 'var(--border-subtle)' }}>|</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{activeChannel.description || 'Welcome to this channel!'}</span>
              </div>

              {/* MESSAGES LIST */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
                    <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Welcome to #{activeChannel.name}!</p>
                    <p style={{ fontSize: '13px' }}>This is the start of the #{activeChannel.name} channel. Be the first to send a message.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', group: 'msg' }}>
                      <img
                        src={msg.senderAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderName}`}
                        alt={msg.senderName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{msg.senderName}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        title="Delete Message"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          opacity: 0.6
                        }}
                      >✕</button>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* MESSAGE COMPOSER INPUT */}
              <div style={{ padding: '0 20px 20px 20px', flexShrink: 0 }}>
                <form onSubmit={handleSendMessage} style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  padding: '6px 12px',
                  gap: '12px'
                }}>
                  {/* SENDER PICKER */}
                  <select
                    value={selectedSenderId}
                    onChange={(e) => setSelectedSenderId(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-main)',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder={`Message #${activeChannel.name}...`}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      padding: '8px 0'
                    }}
                  />

                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--accent-discord)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >Send</button>
                </form>
              </div>
            </main>

            {/* RIGHT SIDEBAR: MEMBER DIRECTORY */}
            <aside style={{
              width: '240px',
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border-subtle)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                  Members ({members.length})
                </span>
                <button
                  onClick={() => setShowMemberModal(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 700
                  }}
                >+</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.map(member => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.username}`}
                        alt={member.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: getStatusDotColor(member.status),
                        border: '2px solid var(--bg-secondary)'
                      }}></span>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{member.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {member.role} {member.customStatus ? `• ${member.customStatus}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: TRELLO KANBAN BOARD (Sprint Columns & Movable Cards) */}
        {/* ============================================================ */}
        {activeTab === 'trello' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }} className="animate-fade-in">
            
            {/* KANBAN CONTROLS BAR */}
            <div style={{
              height: '56px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Sprint Kanban Board</span>
                <span style={{ color: 'var(--border-subtle)' }}>|</span>
                
                {/* FILTER BY PRIORITY */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span>Filter:</span>
                  <select
                    value={cardFilterPriority}
                    onChange={(e) => setCardFilterPriority(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowCardModal(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--accent-trello)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                + Add Card
              </button>
            </div>

            {/* KANBAN 4-COLUMN BOARD */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              padding: '24px',
              overflowX: 'auto'
            }}>
              {[
                { id: 'todo', title: '📌 To Do', color: '#64748b' },
                { id: 'in-progress', title: '⚡ In Progress', color: '#0284c7' },
                { id: 'review', title: '🔍 Review', color: '#f59e0b' },
                { id: 'done', title: '✅ Done', color: '#10b981' }
              ].map(col => {
                const colCards = filteredCards.filter(c => c.list === col.id);
                return (
                  <div key={col.id} style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '100%',
                    overflow: 'hidden'
                  }}>
                    {/* COLUMN HEADER */}
                    <div style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{col.title}</span>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-muted)'
                        }}>{colCards.length}</span>
                      </div>
                    </div>

                    {/* CARDS LIST */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {colCards.map(card => {
                        const pBadge = getPriorityBadge(card.priority);
                        return (
                          <div key={card.id} style={{
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            {/* TOP ROW: PRIORITY BADGE & DELETE */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: pBadge.bg,
                                border: `1px solid ${pBadge.border}`,
                                color: pBadge.text
                              }}>{card.priority}</span>

                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-dim)',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >✕</button>
                            </div>

                            {/* CARD CONTENT */}
                            <div>
                              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>{card.title}</h4>
                              {card.description && (
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{card.description}</p>
                              )}
                            </div>

                            {/* ASSIGNEE & MOVE ACTIONS */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '8px',
                              borderTop: '1px solid var(--border-subtle)',
                              fontSize: '12px'
                            }}>
                              <span style={{ color: 'var(--text-dim)' }}>👤 {card.assigneeName || 'Unassigned'}</span>

                              {/* QUICK COLUMN SHIFT BUTTONS */}
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {col.id !== 'todo' && (
                                  <button
                                    onClick={() => handleMoveCard(card.id, card.list, 'left')}
                                    title="Move Left"
                                    style={{
                                      padding: '2px 6px',
                                      backgroundColor: 'var(--bg-tertiary)',
                                      color: 'var(--text-main)',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '11px'
                                    }}
                                  >◀</button>
                                )}
                                {col.id !== 'done' && (
                                  <button
                                    onClick={() => handleMoveCard(card.id, card.list, 'right')}
                                    title="Move Right"
                                    style={{
                                      padding: '2px 6px',
                                      backgroundColor: 'var(--bg-tertiary)',
                                      color: 'var(--text-main)',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '11px'
                                    }}
                                  >▶</button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: SYSTEM STATS & API DIAGNOSTICS */}
        {/* ============================================================ */}
        {activeTab === 'stats' && (
          <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)', padding: '32px', overflowY: 'auto' }} className="animate-fade-in">
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>System Diagnostics & API Metrics</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Live operational overview of the Rosetta platform and testing framework.</p>
              </div>

              {/* STAT METRICS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Total Channels</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-discord)', marginTop: '8px' }}>{stats?.totalChannels || 0}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Active Members</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>{stats?.totalMembers || 0}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Total Messages</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }}>{stats?.totalMessages || 0}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Kanban Cards</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-trello)', marginTop: '8px' }}>{stats?.totalCards || 0}</div>
                </div>
              </div>

              {/* AUTOMATION & QUALITY ASSURANCE SPECS */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>🧪 Quality Assurance & Test Architecture</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <li>✅ <strong>Postman Test Assertions:</strong> 100 Automated assertions (covering Channels, Members, Messages, and Cards).</li>
                  <li>✅ <strong>Newman CLI Runner:</strong> Headless execution with rich HTML reporting artifact generation.</li>
                  <li>✅ <strong>CI/CD Workflow:</strong> Automated GitHub Actions workflow on code push to main.</li>
                  <li>✅ <strong>Apache JMeter Performance Test:</strong> Multi-threaded concurrency load testing against Azure VPS.</li>
                </ul>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* CREATE CHANNEL MODAL */}
      {showChannelModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', width: '420px', padding: '24px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Create Text Channel</h3>
            <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>CHANNEL NAME</label>
                <input
                  type="text"
                  placeholder="e.g. backend-sprint"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>DESCRIPTION (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="What is this channel for?"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowChannelModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', backgroundColor: 'var(--accent-discord)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MEMBER MODAL */}
      {showMemberModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', width: '420px', padding: '24px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Add Team Member</h3>
            <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>FULL NAME</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>USERNAME</label>
                <input
                  type="text"
                  placeholder="e.g. jdoe"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>ROLE</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff' }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Lead Developer">Lead Developer</option>
                  <option value="Product Designer">Product Designer</option>
                  <option value="QA Engineer">QA Engineer</option>
                  <option value="Member">Member</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowMemberModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CARD MODAL */}
      {showCardModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', width: '460px', padding: '24px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Create Kanban Task Card</h3>
            <form onSubmit={handleCreateCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>CARD TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Implement JMeter Test Script"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
                <textarea
                  placeholder="Add details, acceptance criteria, or notes..."
                  value={newCardDesc}
                  onChange={(e) => setNewCardDesc(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>COLUMN</label>
                  <select
                    value={newCardList}
                    onChange={(e) => setNewCardList(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff' }}
                  >
                    <option value="todo">📌 To Do</option>
                    <option value="in-progress">⚡ In Progress</option>
                    <option value="review">🔍 Review</option>
                    <option value="done">✅ Done</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>PRIORITY</label>
                  <select
                    value={newCardPriority}
                    onChange={(e) => setNewCardPriority(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff' }}
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟡 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>ASSIGN TO</label>
                <select
                  value={newCardAssignee}
                  onChange={(e) => setNewCardAssignee(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#ffffff' }}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCardModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', backgroundColor: 'var(--accent-trello)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Create Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
