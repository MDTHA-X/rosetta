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

      setChannels(Array.isArray(chData) ? chData : []);
      setMembers(Array.isArray(memData) ? memData : []);
      setCards(Array.isArray(cardData) ? cardData : []);
      setStats(stData);
      setHealth(hlData);

      if (Array.isArray(chData) && chData.length > 0) {
        setActiveChannelId(chData[0].id);
      }
      if (Array.isArray(memData) && memData.length > 0) {
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
      setMessages(Array.isArray(data) ? data : []);
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

  // Card Handlers
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
  const currentMember = members.find(m => m.id === selectedSenderId) || members[0] || { name: 'Tanjim Hossen', username: 'tanjim', role: 'Admin' };

  const filteredCards = cardFilterPriority === 'all' 
    ? cards 
    : cards.filter(c => c.priority === cardFilterPriority);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: 'rgba(242, 63, 67, 0.2)', border: '#f23f43', text: '#f23f43' };
      case 'high': return { bg: 'rgba(240, 178, 50, 0.2)', border: '#f0b232', text: '#f0b232' };
      case 'medium': return { bg: 'rgba(88, 101, 242, 0.2)', border: '#5865f2', text: '#5865f2' };
      default: return { bg: 'rgba(35, 165, 90, 0.2)', border: '#23a55a', text: '#23a55a' };
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'online': return '#23a55a';
      case 'idle': return '#f0b232';
      case 'dnd': return '#f23f43';
      default: return '#80848e';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#313338', overflow: 'hidden' }}>
      
      {/* ============================================================ */}
      {/* TOP APPLICATION BAR */}
      {/* ============================================================ */}
      <header style={{
        height: '56px',
        backgroundColor: '#1e1f22',
        borderBottom: '1px solid #1f2023',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {/* LOGO & BRAND */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #5865f2, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>R</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f2f3f5', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Rosetta</div>
              <div style={{ fontSize: '11px', color: '#949ba4', fontWeight: 500 }}>Discord & Trello Workspace</div>
            </div>
          </div>

          {/* VIEW SWITCHER BUTTONS */}
          <nav style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
            <button
              onClick={() => setActiveTab('discord')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: activeTab === 'discord' ? '#5865f2' : 'transparent',
                color: activeTab === 'discord' ? '#ffffff' : '#949ba4',
                transition: 'all 0.15s ease'
              }}
            >
              💬 Discord Hub
            </button>
            <button
              onClick={() => setActiveTab('trello')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: activeTab === 'trello' ? '#0284c7' : 'transparent',
                color: activeTab === 'trello' ? '#ffffff' : '#949ba4',
                transition: 'all 0.15s ease'
              }}
            >
              📋 Trello Board
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: activeTab === 'stats' ? '#35373c' : 'transparent',
                color: activeTab === 'stats' ? '#ffffff' : '#949ba4',
                transition: 'all 0.15s ease'
              }}
            >
              📊 Diagnostics
            </button>
          </nav>
        </div>

        {/* SERVER STATUS INDICATOR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '20px',
            backgroundColor: '#2b2d31',
            border: '1px solid #1f2023',
            fontSize: '12px',
            color: '#dbdee1'
          }}>
            <span className="status-pulse" style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: health?.status === 'ok' ? '#23a55a' : '#f23f43'
            }}></span>
            <span style={{ fontWeight: 600 }}>API Online</span>
            <span style={{ color: '#4e5058' }}>|</span>
            <span style={{ color: '#949ba4' }}>Uptime: {health?.uptimeSeconds || 0}s</span>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ============================================================ */}
        {/* VIEW 1: DISCORD HUB (Channels + Text Chat + Members Directory) */}
        {/* ============================================================ */}
        {activeTab === 'discord' && (
          <div style={{ display: 'flex', width: '100%', height: '100%' }} className="fade-in">
            
            {/* LEFT SIDEBAR: CHANNELS */}
            <aside style={{
              width: '240px',
              backgroundColor: '#2b2d31',
              borderRight: '1px solid #1f2023',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}>
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #1f2023',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#949ba4', letterSpacing: '0.04em' }}>
                  Text Channels
                </span>
                <button
                  onClick={() => setShowChannelModal(true)}
                  title="Create Channel"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dbdee1',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 700,
                    lineHeight: 1
                  }}
                >+</button>
              </div>

              {/* CHANNELS LIST */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {channels.map(channel => {
                  const isActive = activeChannelId === channel.id;
                  return (
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
                        backgroundColor: isActive ? '#35373c' : 'transparent',
                        color: isActive ? '#ffffff' : '#949ba4',
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 500,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ color: isActive ? '#dbdee1' : '#80848e', fontSize: '16px' }}>#</span>
                        <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{channel.name}</span>
                      </div>
                      {!channel.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChannel(channel.id, channel.isDefault);
                          }}
                          title="Delete channel"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#80848e',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px'
                          }}
                        >✕</button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* LOGGED IN MEMBER FOOTER */}
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid #1f2023',
                backgroundColor: '#232428',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={currentMember.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                    alt="Current user"
                    style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: getStatusDotColor(currentMember.status),
                    border: '2px solid #232428'
                  }}></span>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f2f3f5', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentMember.name}</div>
                  <div style={{ fontSize: '11px', color: '#949ba4' }}>@{currentMember.username} ({currentMember.role})</div>
                </div>
              </div>
            </aside>

            {/* MIDDLE PANE: CHAT STREAM */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#313338' }}>
              
              {/* CHANNEL TOP HEADER */}
              <div style={{
                height: '52px',
                borderBottom: '1px solid #1f2023',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: '12px',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '22px', color: '#80848e', fontWeight: 700 }}>#</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#f2f3f5' }}>{activeChannel.name}</span>
                <span style={{ color: '#3f4147' }}>|</span>
                <span style={{ fontSize: '13px', color: '#949ba4' }}>{activeChannel.description || 'Welcome to this channel!'}</span>
              </div>

              {/* MESSAGES LIST */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#949ba4' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#383a40',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      margin: '0 auto 16px auto',
                      color: '#dbdee1'
                    }}>#</div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f2f3f5', marginBottom: '6px' }}>Welcome to #{activeChannel.name}!</h3>
                    <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>This is the beginning of the #{activeChannel.name} channel. Send a message below to start the conversation!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <img
                        src={msg.senderAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderName}`}
                        alt={msg.senderName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f2f3f5' }}>{msg.senderName}</span>
                          <span style={{ fontSize: '11px', color: '#949ba4' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#dbdee1', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        title="Delete Message"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#80848e',
                          cursor: 'pointer',
                          fontSize: '13px',
                          padding: '4px'
                        }}
                      >✕</button>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* MESSAGE COMPOSER BAR */}
              <div style={{ padding: '0 20px 20px 20px', flexShrink: 0 }}>
                <form onSubmit={handleSendMessage} style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#383a40',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  gap: '12px'
                }}>
                  {/* SENDER PICKER */}
                  <select
                    value={selectedSenderId}
                    onChange={(e) => setSelectedSenderId(e.target.value)}
                    style={{
                      backgroundColor: '#2b2d31',
                      color: '#f2f3f5',
                      border: '1px solid #1f2023',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none'
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
                      color: '#f2f3f5',
                      fontSize: '14px',
                      outline: 'none',
                      padding: '8px 0'
                    }}
                  />

                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      backgroundColor: '#5865f2',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >Send</button>
                </form>
              </div>
            </main>

            {/* RIGHT SIDEBAR: MEMBER DIRECTORY */}
            <aside style={{
              width: '240px',
              backgroundColor: '#2b2d31',
              borderLeft: '1px solid #1f2023',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#949ba4', letterSpacing: '0.04em' }}>
                  Members ({members.length})
                </span>
                <button
                  onClick={() => setShowMemberModal(true)}
                  title="Add Member"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dbdee1',
                    cursor: 'pointer',
                    fontSize: '18px',
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
                        border: '2px solid #2b2d31'
                      }}></span>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f2f3f5' }}>{member.name}</div>
                      <div style={{ fontSize: '11px', color: '#949ba4', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
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
        {/* VIEW 2: TRELLO KANBAN BOARD */}
        {/* ============================================================ */}
        {activeTab === 'trello' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', overflow: 'hidden' }} className="fade-in">
            
            {/* KANBAN CONTROLS BAR */}
            <div style={{
              height: '56px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>Sprint Kanban Board</span>
                <span style={{ color: '#334155' }}>|</span>
                
                {/* FILTER BY PRIORITY */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                  <span>Filter:</span>
                  <select
                    value={cardFilterPriority}
                    onChange={(e) => setCardFilterPriority(e.target.value)}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟡 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowCardModal(true)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                + Add Card
              </button>
            </div>

            {/* 4-COLUMN KANBAN BOARD */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '18px',
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
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '100%',
                    overflow: 'hidden'
                  }}>
                    {/* COLUMN HEADER */}
                    <div style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: '#f8fafc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{col.title}</span>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#334155',
                          color: '#94a3b8'
                        }}>{colCards.length}</span>
                      </div>
                    </div>

                    {/* CARDS LIST */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {colCards.map(card => {
                        const pBadge = getPriorityBadge(card.priority);
                        return (
                          <div key={card.id} style={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '10px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                          }}>
                            {/* TOP: PRIORITY BADGE & DELETE */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: pBadge.bg,
                                border: `1px solid ${pBadge.border}`,
                                color: pBadge.text,
                                letterSpacing: '0.04em'
                              }}>{card.priority}</span>

                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#64748b',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >✕</button>
                            </div>

                            {/* CARD CONTENT */}
                            <div>
                              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px', lineHeight: 1.3 }}>{card.title}</h4>
                              {card.description && (
                                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>{card.description}</p>
                              )}
                            </div>

                            {/* ASSIGNEE & QUICK MOVE ACTIONS */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '8px',
                              borderTop: '1px solid #1e293b',
                              fontSize: '12px'
                            }}>
                              <span style={{ color: '#64748b', fontWeight: 600 }}>👤 {card.assigneeName || 'Unassigned'}</span>

                              {/* MOVE BUTTONS */}
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {col.id !== 'todo' && (
                                  <button
                                    onClick={() => handleMoveCard(card.id, card.list, 'left')}
                                    title="Move Left"
                                    style={{
                                      padding: '3px 8px',
                                      backgroundColor: '#334155',
                                      color: '#f8fafc',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      fontWeight: 700
                                    }}
                                  >◀</button>
                                )}
                                {col.id !== 'done' && (
                                  <button
                                    onClick={() => handleMoveCard(card.id, card.list, 'right')}
                                    title="Move Right"
                                    style={{
                                      padding: '3px 8px',
                                      backgroundColor: '#334155',
                                      color: '#f8fafc',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      fontWeight: 700
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
        {/* VIEW 3: SYSTEM DIAGNOSTICS */}
        {/* ============================================================ */}
        {activeTab === 'stats' && (
          <div style={{ flex: 1, backgroundColor: '#0f172a', padding: '32px', overflowY: 'auto' }} className="fade-in">
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>System Diagnostics & Platform Metrics</h2>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>Real-time telemetry and resource breakdown for Rosetta.</p>
              </div>

              {/* STATS METRIC GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Total Channels</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#5865f2', marginTop: '8px' }}>{stats?.totalChannels || 0}</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Active Members</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>{stats?.totalMembers || 0}</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Total Messages</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }}>{stats?.totalMessages || 0}</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Kanban Cards</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7', marginTop: '8px' }}>{stats?.totalCards || 0}</div>
                </div>
              </div>

              {/* ARCHITECTURE SUMMARY */}
              <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>⚙️ Infrastructure & Specifications</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#94a3b8' }}>
                  <li>🚀 <strong>Hosting Node:</strong> Azure Cloud VPS (`40.83.100.54`)</li>
                  <li>📦 <strong>Container Registry:</strong> GitHub Packages (`ghcr.io/mdtha-x/rosetta`)</li>
                  <li>⚡ <strong>Response Time:</strong> Sub-3ms on primary read/write endpoints</li>
                  <li>🛡️ <strong>Quality Gates:</strong> 100 Postman automated test assertions ready for regression audits</li>
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
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ backgroundColor: '#2b2d31', borderRadius: '12px', width: '420px', padding: '24px', border: '1px solid #1f2023', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f2f3f5', marginBottom: '16px' }}>Create Text Channel</h3>
            <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#949ba4', display: 'block', marginBottom: '6px' }}>CHANNEL NAME</label>
                <input
                  type="text"
                  placeholder="e.g. backend-sprint"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e1f22', border: '1px solid #1f2023', color: '#f2f3f5', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#949ba4', display: 'block', marginBottom: '6px' }}>DESCRIPTION (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="What is this channel for?"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e1f22', border: '1px solid #1f2023', color: '#f2f3f5', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowChannelModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#949ba4', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', backgroundColor: '#5865f2', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MEMBER MODAL */}
      {showMemberModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ backgroundColor: '#2b2d31', borderRadius: '12px', width: '420px', padding: '24px', border: '1px solid #1f2023', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f2f3f5', marginBottom: '16px' }}>Add Team Member</h3>
            <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#949ba4', display: 'block', marginBottom: '6px' }}>FULL NAME</label>
                <input
                  type="text"
                  placeholder="e.g. David Kim"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e1f22', border: '1px solid #1f2023', color: '#f2f3f5', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#949ba4', display: 'block', marginBottom: '6px' }}>USERNAME</label>
                <input
                  type="text"
                  placeholder="e.g. davidk"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e1f22', border: '1px solid #1f2023', color: '#f2f3f5', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#949ba4', display: 'block', marginBottom: '6px' }}>ROLE</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e1f22', border: '1px solid #1f2023', color: '#f2f3f5', outline: 'none' }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Lead Developer">Lead Developer</option>
                  <option value="Product Designer">Product Designer</option>
                  <option value="QA Engineer">QA Engineer</option>
                  <option value="Member">Member</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowMemberModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#949ba4', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', backgroundColor: '#23a55a', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE KANBAN CARD MODAL */}
      {showCardModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', width: '460px', padding: '24px', border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>Create Kanban Task Card</h3>
            <form onSubmit={handleCreateCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>CARD TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Implement Postman automated assertions"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
                <textarea
                  placeholder="Add details or notes..."
                  value={newCardDesc}
                  onChange={(e) => setNewCardDesc(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', resize: 'vertical', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>COLUMN</label>
                  <select
                    value={newCardList}
                    onChange={(e) => setNewCardList(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', outline: 'none' }}
                  >
                    <option value="todo">📌 To Do</option>
                    <option value="in-progress">⚡ In Progress</option>
                    <option value="review">🔍 Review</option>
                    <option value="done">✅ Done</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>PRIORITY</label>
                  <select
                    value={newCardPriority}
                    onChange={(e) => setNewCardPriority(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', outline: 'none' }}
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟡 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>ASSIGN TO</label>
                <select
                  value={newCardAssignee}
                  onChange={(e) => setNewCardAssignee(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', outline: 'none' }}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCardModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Create Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
