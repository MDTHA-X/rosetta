import React, { useState, useEffect, useRef } from 'react';

const API_BASE = '/api';

export default function App() {
  // Current Authenticated User & Auth Checked Flag (Task 1)
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Layout View Modes: 'split' (side-by-side) | 'messages' | 'board'
  const [layoutMode, setLayoutMode] = useState('split');
  const [showChannelsSidebar, setShowChannelsSidebar] = useState(true);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'

  // Auth Form State
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authRole, setAuthRole] = useState('Member');
  const [authError, setAuthError] = useState('');

  // Core Data
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [messages, setMessages] = useState([]);
  const [cards, setCards] = useState([]);
  const [boardConfig, setBoardConfig] = useState({
    title: "Sprint Alpha Board",
    columns: [
      { id: "todo", title: "To Do", limit: null },
      { id: "in-progress", title: "In Progress", limit: 3 },
      { id: "review", title: "Review", limit: 4 },
      { id: "done", title: "Done", limit: null }
    ]
  });

  // Unread Channel Map State (Task 3: { [channelId]: { unread: boolean, unreadCount: number } })
  const [unreadMap, setUnreadMap] = useState({});

  // Message Editing State
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');

  // Board / Column Editing State
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [tempBoardTitle, setTempBoardTitle] = useState('');
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [tempColumnTitle, setTempColumnTitle] = useState('');

  // Card Detail Modal State (Task 6)
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailDesc, setDetailDesc] = useState('');
  const [detailPriority, setDetailPriority] = useState('medium');
  const [detailList, setDetailList] = useState('todo');
  const [detailAssignee, setDetailAssignee] = useState('');

  // Network & Connections Data
  const [connections, setConnections] = useState({ known: [], pendingIncoming: [], pendingOutgoing: [] });
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Modals & Form States
  const [newMessageText, setNewMessageText] = useState('');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');
  const [newCardList, setNewCardList] = useState('todo');
  const [newCardPriority, setNewCardPriority] = useState('medium');
  const [newCardAssignee, setNewCardAssignee] = useState('');
  const [cardFilterPriority, setCardFilterPriority] = useState('all');

  const messagesEndRef = useRef(null);

  // Task 1: Mount-time Auth Check and Initial Data Fetch
  useEffect(() => {
    const initializeSessionAndData = async () => {
      try {
        const saved = localStorage.getItem('rosetta_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCurrentUser(parsed);
          } catch (e) {
            console.error('Failed to parse saved user:', e);
          }
        }
      } finally {
        setAuthChecked(true);
      }
      await fetchInitialData();
    };

    initializeSessionAndData();
  }, []);

  // Sync Current User to LocalStorage & load connections & unread badges
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('rosetta_user', JSON.stringify(currentUser));
      fetchConnections(currentUser.id);
      fetchUnreadStatus(currentUser.id);
    }
  }, [currentUser]);

  // Fetch messages and mark channel as read when channel switches
  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId);
      if (currentUser) {
        markChannelRead(activeChannelId, currentUser.id);
      }
    }
  }, [activeChannelId]);

  // Auto scroll messages
  useEffect(() => {
    if (!editingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, editingMessageId]);

  // Periodic polling for new messages & unread counts (every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeChannelId) {
        fetchMessages(activeChannelId);
      }
      if (currentUser) {
        fetchUnreadStatus(currentUser.id);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChannelId, currentUser]);

  // Sync Card Detail Modal state when expandedCard changes (Task 6)
  useEffect(() => {
    if (expandedCardId) {
      const targetCard = cards.find(c => c.id === expandedCardId);
      if (targetCard) {
        setDetailTitle(targetCard.title || '');
        setDetailDesc(targetCard.description || '');
        setDetailPriority(targetCard.priority || 'medium');
        setDetailList(targetCard.list || 'todo');
        setDetailAssignee(targetCard.assignedTo || '');
      }
    }
  }, [expandedCardId, cards]);

  const fetchInitialData = async () => {
    try {
      const [chRes, cardRes, boardRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/channels`),
        fetch(`${API_BASE}/cards`),
        fetch(`${API_BASE}/board/config`),
        fetch(`${API_BASE}/users`)
      ]);

      const chData = await chRes.json();
      const cardData = await cardRes.json();
      const boardData = await boardRes.json();
      const usersData = await usersRes.json();

      setChannels(Array.isArray(chData) ? chData : []);
      setCards(Array.isArray(cardData) ? cardData : []);
      if (boardData && boardData.columns) setBoardConfig(boardData);
      setAllUsers(Array.isArray(usersData) ? usersData : []);

      if (Array.isArray(chData) && chData.length > 0) {
        setActiveChannelId(chData[0].id);
      }

      // Default fallback session if no user is saved
      const saved = localStorage.getItem('rosetta_user');
      if (!saved && Array.isArray(usersData) && usersData.length > 0) {
        setCurrentUser(usersData[0]);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
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

  const fetchConnections = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/connections?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  // Task 3: Unread Status APIs
  const fetchUnreadStatus = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/channels/unread?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const map = {};
        if (Array.isArray(data)) {
          data.forEach(item => {
            map[item.channelId] = item;
          });
        }
        setUnreadMap(map);
      }
    } catch (err) {
      console.error('Error fetching unread channels:', err);
    }
  };

  const markChannelRead = async (channelId, userId) => {
    if (!channelId || !userId) return;
    // Optimistic clear in UI
    setUnreadMap(prev => ({
      ...prev,
      [channelId]: { channelId, unread: false, unreadCount: 0 }
    }));

    try {
      await fetch(`${API_BASE}/channels/${channelId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (err) {
      console.error('Error marking channel read:', err);
    }
  };

  const handleSelectChannel = (channelId) => {
    setActiveChannelId(channelId);
    if (currentUser) {
      markChannelRead(channelId, currentUser.id);
    }
  };

  // Auth Handlers (with Email)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authTab === 'login' 
      ? { username: authUsername, password: authPassword }
      : { username: authUsername, email: authEmail, password: authPassword, name: authFullName, role: authRole };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed');
        return;
      }
      setCurrentUser(data);
      setShowAuthModal(false);
      setAuthUsername('');
      setAuthEmail('');
      setAuthPassword('');
      setAuthFullName('');
      fetchInitialData();
    } catch (err) {
      setAuthError('Server error during authentication');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rosetta_user');
    setCurrentUser(null);
    setShowAuthModal(true);
    setAuthTab('login');
  };

  // Known Connection Handlers
  const handleSendKnownRequest = async (receiverId) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/connections/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, receiverId })
      });
      if (res.ok) {
        fetchConnections(currentUser.id);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Error sending request:', err);
    }
  };

  const handleUpdateConnection = async (connectionId, status) => {
    try {
      const res = await fetch(`${API_BASE}/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId: currentUser.id })
      });
      if (res.ok) {
        fetchConnections(currentUser.id);
      }
    } catch (err) {
      console.error('Error updating connection:', err);
    }
  };

  // Message Handlers (Send, Edit, Delete)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentUser) return; // Task 1 guard
    if (!newMessageText.trim() || !activeChannelId) return;

    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: activeChannelId,
          senderId: currentUser.id,
          text: newMessageText
        })
      });
      if (res.ok) {
        const created = await res.json();
        setMessages(prev => [...prev, created]);
        setNewMessageText('');
        // Mark current channel as read
        markChannelRead(activeChannelId, currentUser.id);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSaveEditedMessage = async (msgId) => {
    if (!editingMessageText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editingMessageText,
          senderId: currentUser?.id
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages(messages.map(m => m.id === msgId ? updated : m));
        setEditingMessageId(null);
        setEditingMessageText('');
      }
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(messages.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Board & Column Configuration Handlers
  const handleSaveBoardTitle = async () => {
    if (!tempBoardTitle.trim()) {
      setEditingBoardTitle(false);
      return;
    }
    const updated = { ...boardConfig, title: tempBoardTitle.trim() };
    setBoardConfig(updated);
    setEditingBoardTitle(false);
    try {
      await fetch(`${API_BASE}/board/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Error updating board title:', err);
    }
  };

  const handleSaveColumnTitle = async (colId) => {
    if (!tempColumnTitle.trim()) {
      setEditingColumnId(null);
      return;
    }
    const updatedCols = boardConfig.columns.map(c => 
      c.id === colId ? { ...c, title: tempColumnTitle.trim() } : c
    );
    const updated = { ...boardConfig, columns: updatedCols };
    setBoardConfig(updated);
    setEditingColumnId(null);
    try {
      await fetch(`${API_BASE}/board/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Error updating column name:', err);
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
          assignedTo: newCardAssignee || (currentUser ? currentUser.id : null)
        })
      });
      if (res.ok) {
        const created = await res.json();
        setCards([...cards, created]);
        setNewCardTitle('');
        setNewCardDesc('');
        setShowCardModal(false);
      }
    } catch (err) {
      console.error('Error creating card:', err);
    }
  };

  // Task 6: Card Detail Save Handler
  const handleSaveCardDetail = async (e) => {
    e.preventDefault();
    if (!expandedCardId) return;

    const assigneeUser = allUsers.find(u => u.id === detailAssignee);
    const assigneeName = assigneeUser ? assigneeUser.name : 'Unassigned';

    try {
      const res = await fetch(`${API_BASE}/cards/${expandedCardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: detailTitle.trim(),
          description: detailDesc.trim(),
          priority: detailPriority,
          list: detailList,
          assignedTo: detailAssignee || null,
          assigneeName
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setCards(cards.map(c => c.id === expandedCardId ? updated : c));
        setExpandedCardId(null);
      }
    } catch (err) {
      console.error('Error updating card details:', err);
    }
  };

  const handleMoveCard = async (cardId, currentList, direction) => {
    const listOrder = boardConfig.columns.map(c => c.id);
    const idx = listOrder.indexOf(currentList);
    const targetIdx = direction === 'right' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= listOrder.length) return;

    try {
      const res = await fetch(`${API_BASE}/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list: listOrder[targetIdx] })
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
        if (expandedCardId === id) setExpandedCardId(null);
      }
    } catch (err) {
      console.error('Error deleting card:', err);
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
        body: JSON.stringify({ name: newChannelName, description: newChannelDesc })
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
    if (isDefault) return alert('Cannot delete default general channel');
    if (!confirm('Delete this channel?')) return;
    try {
      const res = await fetch(`${API_BASE}/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = channels.filter(c => c.id !== id);
        setChannels(remaining);
        if (activeChannelId === id && remaining.length > 0) setActiveChannelId(remaining[0].id);
      }
    } catch (err) {
      console.error('Error deleting channel:', err);
    }
  };

  const activeChannel = channels.find(c => c.id === activeChannelId) || { name: 'general', description: '' };
  const filteredCards = cardFilterPriority === 'all' 
    ? cards 
    : cards.filter(c => c.priority === cardFilterPriority);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: '#ef4444', text: '#ffffff' };
      case 'high': return { bg: '#f59e0b', text: '#ffffff' };
      case 'medium': return { bg: '#3b82f6', text: '#ffffff' };
      default: return { bg: '#10b981', text: '#ffffff' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#0f172a', color: '#f8fafc', overflow: 'hidden' }}>
      
      {/* ============================================================ */}
      {/* TOP HEADER & LAYOUT NAVIGATION (Task 8: Standard 56px height) */}
      {/* ============================================================ */}
      <header className="pane-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setShowChannelsSidebar(!showChannelsSidebar)}
            title="Toggle Channels Sidebar"
            style={{
              padding: '6px 10px',
              backgroundColor: '#334155',
              border: 'none',
              borderRadius: '6px',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            {showChannelsSidebar ? '◀ Hide Sidebar' : '▶ Channels'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, background: 'linear-gradient(135deg, #6366f1, #0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ROSETTA
            </span>
            <span style={{ fontSize: '11px', backgroundColor: '#334155', color: '#94a3b8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>v1.3</span>
          </div>

          {/* VIEW SWITCHER */}
          <div style={{ display: 'flex', backgroundColor: '#0f172a', padding: '3px', borderRadius: '8px', border: '1px solid #334155' }}>
            <button
              onClick={() => setLayoutMode('split')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: layoutMode === 'split' ? '#6366f1' : 'transparent',
                color: layoutMode === 'split' ? '#ffffff' : '#94a3b8'
              }}
            >
              ◧ Side-by-Side
            </button>
            <button
              onClick={() => setLayoutMode('messages')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: layoutMode === 'messages' ? '#6366f1' : 'transparent',
                color: layoutMode === 'messages' ? '#ffffff' : '#94a3b8'
              }}
            >
              💬 Messages
            </button>
            <button
              onClick={() => setLayoutMode('board')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: layoutMode === 'board' ? '#6366f1' : 'transparent',
                color: layoutMode === 'board' ? '#ffffff' : '#94a3b8'
              }}
            >
              📋 Board
            </button>
          </div>
        </div>

        {/* PROFILE & KNOWN CONTACTS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              setShowNetworkModal(true);
              if (currentUser) fetchConnections(currentUser.id);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👥 Known Contacts ({connections.known?.length || 0})
            {connections.pendingIncoming?.length > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 800 }}>
                {connections.pendingIncoming.length}
              </span>
            )}
          </button>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={currentUser.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=tanjim"}
                  alt=""
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.1 }}>{currentUser.name}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>{currentUser.email || `@${currentUser.username}`}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
              >Logout</button>
            </div>
          ) : (
            <button
              onClick={() => { setShowAuthModal(true); setAuthTab('login'); }}
              style={{ padding: '6px 14px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* WORKSPACE BODY (CHANNELS + MESSAGES + BOARD) */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* 1. CHANNELS DRAWER */}
        {showChannelsSidebar && (
          <aside style={{
            width: '220px',
            backgroundColor: '#1e293b',
            borderRight: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}>
            {/* Task 8: Standard 56px header alignment */}
            <div className="pane-header" style={{ padding: '0 14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>Channels</span>
              <button onClick={() => setShowChannelModal(true)} title="Create Channel" style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', fontSize: '16px', fontWeight: 800 }}>+</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {channels.map(channel => {
                const isActive = activeChannelId === channel.id;
                // Task 3: Unread indicator
                const unreadData = unreadMap[channel.id];
                const isUnread = !isActive && unreadData?.unread;
                const unreadCount = unreadData?.unreadCount || 0;

                return (
                  <div
                    key={channel.id}
                    onClick={() => handleSelectChannel(channel.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      backgroundColor: isActive ? '#334155' : 'transparent',
                      color: isActive ? '#ffffff' : isUnread ? '#ffffff' : '#94a3b8',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : isUnread ? 700 : 500,
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span style={{ color: isActive ? '#818cf8' : isUnread ? '#f8fafc' : '#64748b' }}>#</span>
                      <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{channel.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Task 3 Unread Badge */}
                      {isUnread && (
                        <span className="unread-badge">{unreadCount}</span>
                      )}

                      {!channel.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChannel(channel.id, channel.isDefault);
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '11px' }}
                        >✕</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* 2. MESSAGES PANE (WITH MESSAGE GROUPING & EDITING) */}
        {(layoutMode === 'split' || layoutMode === 'messages') && (
          <section style={{
            flex: layoutMode === 'split' ? '1 1 50%' : '1 1 100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            borderRight: layoutMode === 'split' ? '2px solid #334155' : 'none',
            minWidth: '320px',
            overflow: 'hidden'
          }}>
            {/* MESSAGES HEADER (Task 8: Standard 56px header & Task 2: Grammar pluralization) */}
            <div className="pane-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#818cf8', fontWeight: 800 }}>#</span>
                <span style={{ fontWeight: 800, fontSize: '14px' }}>{activeChannel.name}</span>
                <span style={{ color: '#64748b', fontSize: '12px' }}>— {activeChannel.description || 'Channel chat'}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </span>
            </div>

            {/* MESSAGES STREAM (Task 4: Group consecutive messages within 5 mins) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <p>No messages yet in #{activeChannel.name}.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = currentUser && (msg.senderId === currentUser.id || currentUser.role === 'Admin');
                  const isEditing = editingMessageId === msg.id;

                  // Task 4: Grouping check
                  const prevMsg = i > 0 ? messages[i - 1] : null;
                  const isSameSender = prevMsg && (prevMsg.senderId === msg.senderId);
                  const timeDiff = prevMsg ? Math.abs(new Date(msg.timestamp) - new Date(prevMsg.timestamp)) : Infinity;
                  const isGrouped = isSameSender && (timeDiff < 300000); // 5 minutes threshold

                  const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  if (isGrouped) {
                    return (
                      <div key={msg.id} className="message-row grouped">
                        <span className="hover-time">{formattedTime}</span>
                        <div style={{ flex: 1 }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                              <input
                                type="text"
                                value={editingMessageText}
                                onChange={(e) => setEditingMessageText(e.target.value)}
                                autoFocus
                                style={{ padding: '6px 10px', borderRadius: '4px', backgroundColor: '#1e293b', border: '1px solid #6366f1', color: '#fff', fontSize: '13px' }}
                              />
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleSaveEditedMessage(msg.id)}
                                  style={{ padding: '4px 10px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                >Save</button>
                                <button
                                  onClick={() => setEditingMessageId(null)}
                                  style={{ padding: '4px 10px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                >Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
                              {msg.text}
                              {msg.edited && (
                                <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginLeft: '6px' }}>(edited)</span>
                              )}
                            </p>
                          )}
                        </div>

                        {!isEditing && isMine && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditingMessageText(msg.text);
                              }}
                              title="Edit message"
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                            >✎</button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Delete message"
                              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '11px' }}
                            >✕</button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Non-grouped full message block
                  return (
                    <div key={msg.id} className="message-row" style={{ marginTop: i === 0 ? 0 : '8px' }}>
                      <img
                        src={msg.senderAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderName}`}
                        alt=""
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{msg.senderName}</span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{formattedTime}</span>
                          {msg.edited && (
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>(edited)</span>
                          )}
                        </div>

                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                            <input
                              type="text"
                              value={editingMessageText}
                              onChange={(e) => setEditingMessageText(e.target.value)}
                              autoFocus
                              style={{ padding: '6px 10px', borderRadius: '4px', backgroundColor: '#1e293b', border: '1px solid #6366f1', color: '#fff', fontSize: '13px' }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleSaveEditedMessage(msg.id)}
                                style={{ padding: '4px 10px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                              >Save</button>
                              <button
                                onClick={() => setEditingMessageId(null)}
                                style={{ padding: '4px 10px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                              >Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>{msg.text}</p>
                        )}
                      </div>

                      {!isEditing && isMine && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditingMessageText(msg.text);
                            }}
                            title="Edit message"
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                          >✎</button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Delete message"
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '11px' }}
                          >✕</button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* MESSAGE COMPOSER (Task 1: Loading guard & Auth verification) */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', backgroundColor: '#1e293b' }}>
              {!authChecked ? (
                <div style={{ height: '38px', display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '12px' }}>
                  Connecting to Rosetta session...
                </div>
              ) : currentUser ? (
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={`Message #${activeChannel.name}...`}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >Send</button>
                </form>
              ) : (
                <div style={{
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 12px',
                  backgroundColor: '#0f172a',
                  borderRadius: '6px',
                  border: '1px solid #334155'
                }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Please sign in to send messages</span>
                  <button
                    onClick={() => { setShowAuthModal(true); setAuthTab('login'); }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. BOARD PANE (WITH CUSTOM BOARD / COLUMN NAMES & WIP LIMITS) */}
        {(layoutMode === 'split' || layoutMode === 'board') && (
          <section style={{
            flex: layoutMode === 'split' ? '1 1 50%' : '1 1 100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0b1120',
            minWidth: '340px',
            overflow: 'hidden'
          }}>
            {/* BOARD HEADER (Task 8: Standard 56px height) */}
            <div className="pane-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {editingBoardTitle ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="text"
                      value={tempBoardTitle}
                      onChange={(e) => setTempBoardTitle(e.target.value)}
                      style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #6366f1', color: '#fff', fontSize: '13px' }}
                      autoFocus
                    />
                    <button onClick={handleSaveBoardTitle} style={{ padding: '3px 8px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingBoardTitle(false)} style={{ padding: '3px 8px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>📋 {boardConfig.title}</span>
                    <button
                      onClick={() => { setTempBoardTitle(boardConfig.title); setEditingBoardTitle(true); }}
                      title="Rename Board"
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                    >✎</button>
                  </div>
                )}

                <select
                  value={cardFilterPriority}
                  onChange={(e) => setCardFilterPriority(e.target.value)}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
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

              <button
                onClick={() => setShowCardModal(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Add Card
              </button>
            </div>

            {/* KANBAN BOARD COLUMNS (Task 5: Empty states, Task 7: WIP limits) */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: `repeat(${boardConfig.columns.length}, minmax(180px, 1fr))`,
              gap: '12px',
              padding: '14px',
              overflowX: 'auto'
            }}>
              {boardConfig.columns.map(col => {
                const colCards = filteredCards.filter(c => c.list === col.id);
                const isEditingCol = editingColumnId === col.id;

                // Task 7: WIP Limit calculation & warning style
                const hasLimit = col.limit != null && col.limit > 0;
                const isOverLimit = hasLimit && colCards.length >= col.limit;

                return (
                  <div key={col.id} style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: isOverLimit ? '1px solid #ef4444' : '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '100%',
                    overflow: 'hidden'
                  }}>
                    {/* EDITABLE COLUMN HEADER WITH WIP LIMIT */}
                    <div style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                      fontSize: '12px'
                    }}>
                      {isEditingCol ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                          <input
                            type="text"
                            value={tempColumnTitle}
                            onChange={(e) => setTempColumnTitle(e.target.value)}
                            style={{ flex: 1, padding: '2px 6px', borderRadius: '3px', backgroundColor: '#0f172a', border: '1px solid #6366f1', color: '#fff', fontSize: '11px' }}
                            autoFocus
                          />
                          <button onClick={() => handleSaveColumnTitle(col.id)} style={{ padding: '2px 6px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setEditingColumnId(null)} style={{ padding: '2px 6px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{col.title}</span>
                          <button
                            onClick={() => { setTempColumnTitle(col.title); setEditingColumnId(col.id); }}
                            title="Rename Column"
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '11px' }}
                          >✎</button>
                        </div>
                      )}
                      
                      {!isEditingCol && (
                        <span style={{
                          backgroundColor: isOverLimit ? '#ef4444' : '#0f172a',
                          color: isOverLimit ? '#ffffff' : '#94a3b8',
                          padding: '2px 7px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          border: isOverLimit ? '1px solid #f87171' : '1px solid #334155'
                        }}>
                          {hasLimit ? `${colCards.length} / ${col.limit}` : colCards.length}
                        </span>
                      )}
                    </div>

                    {/* CARD LIST (Task 5: Empty Column Placeholder & Task 6: Click to Expand) */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {colCards.length === 0 ? (
                        <div className="empty-column-placeholder">
                          Drop a card here
                        </div>
                      ) : (
                        colCards.map(card => {
                          const pStyle = getPriorityStyle(card.priority);
                          return (
                            <div
                              key={card.id}
                              onClick={() => setExpandedCardId(card.id)}
                              style={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                cursor: 'pointer',
                                transition: 'transform 0.1s ease, border-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                  fontSize: '9px',
                                  textTransform: 'uppercase',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: pStyle.bg,
                                  color: pStyle.text
                                }}>
                                  {card.priority}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCard(card.id);
                                  }}
                                  title="Delete card"
                                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '11px' }}
                                >✕</button>
                              </div>

                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>{card.title}</div>
                              {card.description && (
                                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {card.description}
                                </div>
                              )}

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: '6px',
                                borderTop: '1px solid #1e293b',
                                fontSize: '11px'
                              }}>
                                <span style={{ color: '#64748b' }}>👤 {card.assigneeName || 'Unassigned'}</span>
                                <div style={{ display: 'flex', gap: '3px' }}>
                                  {col.id !== boardConfig.columns[0]?.id && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveCard(card.id, card.list, 'left');
                                      }}
                                      title="Move Left"
                                      style={{ padding: '2px 6px', backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                                    >◀</button>
                                  )}
                                  {col.id !== boardConfig.columns[boardConfig.columns.length - 1]?.id && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveCard(card.id, card.list, 'right');
                                      }}
                                      title="Move Right"
                                      style={{ padding: '2px 6px', backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                                    >▶</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {/* ============================================================ */}
      {/* TASK 6: CARD DETAIL MODAL (CLICK TO EXPAND & FULL EDIT) */}
      {/* ============================================================ */}
      {expandedCardId && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110
        }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', width: '520px', padding: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8' }}>📋 Card Details</span>
              <button onClick={() => setExpandedCardId(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleSaveCardDetail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>CARD TITLE</label>
                <input
                  type="text"
                  required
                  value={detailTitle}
                  onChange={(e) => setDetailTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>FULL DESCRIPTION</label>
                <textarea
                  rows={5}
                  value={detailDesc}
                  onChange={(e) => setDetailDesc(e.target.value)}
                  placeholder="Add detailed task notes, criteria, or comments..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>COLUMN / STATUS</label>
                  <select
                    value={detailList}
                    onChange={(e) => setDetailList(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px' }}
                  >
                    {boardConfig.columns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>PRIORITY</label>
                  <select
                    value={detailPriority}
                    onChange={(e) => setDetailPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px' }}
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟡 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ASSIGNEE</label>
                <select
                  value={detailAssignee}
                  onChange={(e) => setDetailAssignee(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px' }}
                >
                  <option value="">Unassigned</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email || `@${u.username}`})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteCard(expandedCardId)}
                  style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Delete Card
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setExpandedCardId(null)} style={{ padding: '8px 14px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 18px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* AUTH MODAL (WITH EMAIL INPUT) */}
      {/* ============================================================ */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', width: '400px', padding: '24px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '16px' }}>
              <button
                onClick={() => { setAuthTab('login'); setAuthError(''); }}
                style={{
                  flex: 1, padding: '10px', background: 'transparent', border: 'none',
                  borderBottom: authTab === 'login' ? '2px solid #6366f1' : 'none',
                  color: authTab === 'login' ? '#ffffff' : '#94a3b8',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >Sign In</button>
              <button
                onClick={() => { setAuthTab('register'); setAuthError(''); }}
                style={{
                  flex: 1, padding: '10px', background: 'transparent', border: 'none',
                  borderBottom: authTab === 'register' ? '2px solid #6366f1' : 'none',
                  color: authTab === 'register' ? '#ffffff' : '#94a3b8',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >Register</button>
            </div>

            {authError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authTab === 'register' && (
                <>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>FULL NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanjim Hossen"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. tanjim@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  {authTab === 'login' ? 'USERNAME OR EMAIL' : 'USERNAME'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={authTab === 'login' ? 'Username or email...' : 'e.g. tanjim'}
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>PASSWORD</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                />
              </div>

              {authTab === 'register' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ROLE</label>
                  <select
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Lead Developer">Lead Developer</option>
                    <option value="Product Designer">Product Designer</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAuthModal(false)} style={{ padding: '8px 12px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                  {authTab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* "KNOWN" CONTACTS & USER DIRECTORY MODAL */}
      {/* ============================================================ */}
      {showNetworkModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', width: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>👥 Known Contacts & User Network</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Connect with team members and manage connection requests</p>
              </div>
              <button onClick={() => setShowNetworkModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {connections.pendingIncoming?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b', marginBottom: '10px', textTransform: 'uppercase' }}>
                    📬 Pending Requests for You ({connections.pendingIncoming.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {connections.pendingIncoming.map(req => (
                      <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={req.sender?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{req.sender?.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{req.sender?.email || `@${req.sender?.username}`} ({req.sender?.role})</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleUpdateConnection(req.id, 'accepted')}
                            style={{ padding: '5px 10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >Accept</button>
                          <button
                            onClick={() => handleUpdateConnection(req.id, 'rejected')}
                            style={{ padding: '5px 10px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                          >Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' }}>
                  ⭐ Your Known Contacts ({connections.known?.length || 0})
                </h4>
                {connections.known?.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#64748b' }}>You have no confirmed known contacts yet. Send requests below!</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {connections.known.map(user => (
                      <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                        <img src={user.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.email || `@${user.username}`}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' }}>
                  🔍 Find & Add Registered Users
                </h4>
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '13px', marginBottom: '10px' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {allUsers
                    .filter(u => u.id !== currentUser?.id)
                    .filter(u => !userSearchQuery || 
                      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
                    )
                    .map(user => {
                      const isKnown = connections.known?.some(k => k.id === user.id);
                      const isPendingOut = connections.pendingOutgoing?.some(p => p.receiverId === user.id);

                      return (
                        <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={user.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700 }}>{user.name}</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{user.email || `@${user.username}`} ({user.role})</div>
                            </div>
                          </div>

                          {isKnown ? (
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>✓ Known</span>
                          ) : isPendingOut ? (
                            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>⏳ Request Sent</span>
                          ) : (
                            <button
                              onClick={() => handleSendKnownRequest(user.id)}
                              style={{ padding: '4px 10px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >+ Add as Known</button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CREATE CHANNEL MODAL */}
      {showChannelModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', width: '380px', padding: '20px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>Create Channel</h3>
            <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Channel name (e.g. backend-sprint)"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowChannelModal(false)} style={{ padding: '6px 12px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '6px 14px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CARD MODAL */}
      {showCardModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', width: '420px', padding: '20px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>Create Board Task Card</h3>
            <form onSubmit={handleCreateCard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                required
                placeholder="Card title..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
              />
              <textarea
                placeholder="Description or notes..."
                value={newCardDesc}
                onChange={(e) => setNewCardDesc(e.target.value)}
                rows={3}
                style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', resize: 'vertical' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select
                  value={newCardList}
                  onChange={(e) => setNewCardList(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                >
                  {boardConfig.columns.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <select
                  value={newCardPriority}
                  onChange={(e) => setNewCardPriority(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟡 High</option>
                  <option value="medium">🔵 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <select
                value={newCardAssignee}
                onChange={(e) => setNewCardAssignee(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
              >
                <option value="">Assign To...</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email || `@${u.username}`})</option>
                ))}
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowCardModal(false)} style={{ padding: '6px 12px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '6px 14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Add Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
