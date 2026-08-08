import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

app.use(cors());
app.use(express.json());

// Initial Seed Data
const getInitialData = () => ({
  boardConfig: {
    title: "Sprint Alpha Board",
    columns: [
      { id: "todo", title: "To Do" },
      { id: "in-progress", title: "In Progress" },
      { id: "review", title: "Review" },
      { id: "done", title: "Done" }
    ]
  },
  users: [
    { id: "u-1", name: "Tanjim Hossen", email: "tanjim@example.com", username: "tanjim", password: "password123", role: "Admin", status: "online", customStatus: "Building Rosetta 🚀", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() },
    { id: "u-2", name: "Alex Rivera", email: "alex@example.com", username: "arivera", password: "password123", role: "Lead Developer", status: "online", customStatus: "Refactoring APIs", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() },
    { id: "u-3", name: "Sarah Chen", email: "sarah@example.com", username: "schen", password: "password123", role: "Product Designer", status: "idle", customStatus: "Designing Kanban UI", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() },
    { id: "u-4", name: "Marcus Vance", email: "marcus@example.com", username: "mvance", password: "password123", role: "QA Engineer", status: "dnd", customStatus: "Testing Known Network", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() }
  ],
  connections: [
    { id: "conn-1", senderId: "u-1", receiverId: "u-2", status: "accepted", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "conn-2", senderId: "u-1", receiverId: "u-3", status: "accepted", createdAt: new Date(Date.now() - 43200000).toISOString() },
    { id: "conn-3", senderId: "u-4", receiverId: "u-1", status: "pending", createdAt: new Date().toISOString() }
  ],
  channels: [
    { id: "c-1", name: "general", description: "General community and team discussions", category: "Text Channels", isDefault: true, createdAt: new Date().toISOString() },
    { id: "c-2", name: "dev-talk", description: "Engineering, architecture, and code reviews", category: "Text Channels", isDefault: false, createdAt: new Date().toISOString() },
    { id: "c-3", name: "announcements", description: "Official updates and release notices", category: "Information", isDefault: false, createdAt: new Date().toISOString() }
  ],
  members: [
    { id: "m-1", name: "Tanjim Hossen", email: "tanjim@example.com", username: "tanjim", role: "Admin", status: "online", customStatus: "Building Rosetta 🚀", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() },
    { id: "m-2", name: "Alex Rivera", email: "alex@example.com", username: "arivera", role: "Lead Developer", status: "online", customStatus: "Refactoring APIs", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() },
    { id: "m-3", name: "Sarah Chen", email: "sarah@example.com", username: "schen", role: "Product Designer", status: "idle", customStatus: "Designing Kanban UI", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() },
    { id: "m-4", name: "Marcus Vance", email: "marcus@example.com", username: "mvance", role: "QA Engineer", status: "dnd", customStatus: "Testing Known Network", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() }
  ],
  messages: [
    { id: "msg-1", channelId: "c-1", senderId: "u-1", senderName: "Tanjim Hossen", senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", text: "Welcome to Rosetta! Messages and Board stand side-by-side.", edited: false, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: "msg-2", channelId: "c-1", senderId: "u-2", senderName: "Alex Rivera", senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", text: "You can edit your messages and customize board names at any time.", edited: false, timestamp: new Date(Date.now() - 1800000).toISOString() }
  ],
  cards: [
    { id: "card-1", title: "Setup Azure VPS Deployment", description: "Configure Docker Compose, reverse proxy, and SSL on VM 40.83.100.54", list: "done", priority: "high", assignedTo: "u-1", assigneeName: "Tanjim Hossen", createdAt: new Date().toISOString() },
    { id: "card-2", title: "Build Side-by-Side Dual Pane", description: "Place Messages & Board side by side with collapsible controls", list: "done", priority: "urgent", assignedTo: "u-2", assigneeName: "Alex Rivera", createdAt: new Date().toISOString() },
    { id: "card-3", title: "Implement User Auth & Known Network", description: "Allow users to register with email, login, and send friend/known requests", list: "in-progress", priority: "high", assignedTo: "u-1", assigneeName: "Tanjim Hossen", createdAt: new Date().toISOString() },
    { id: "card-4", title: "Automated API Regression Gates", description: "Maintain 100 Postman assertions across all endpoints", list: "todo", priority: "medium", assignedTo: "u-4", assigneeName: "Marcus Vance", createdAt: new Date().toISOString() }
  ]
});

// Helper functions for data persistence
function loadData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.boardConfig) parsed.boardConfig = getInitialData().boardConfig;
    if (!parsed.users) parsed.users = getInitialData().users;
    if (!parsed.connections) parsed.connections = getInitialData().connections;
    return parsed;
  } catch (err) {
    console.error('Error loading data:', err);
    return getInitialData();
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

let db = loadData();

// ==========================================
// 1. HEALTH & METRICS
// ==========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Rosetta Unified Hub',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.3.0'
  });
});

app.get('/api/stats', (req, res) => {
  res.status(200).json({
    totalUsers: db.users?.length || 0,
    totalChannels: db.channels.length,
    totalMembers: db.members.length,
    totalMessages: db.messages.length,
    totalCards: db.cards.length,
    totalConnections: db.connections?.length || 0
  });
});

// ==========================================
// 2. BOARD CONFIG (CUSTOMIZE COLUMN / BOARD NAMES)
// ==========================================
app.get('/api/board/config', (req, res) => {
  res.status(200).json(db.boardConfig || getInitialData().boardConfig);
});

app.patch('/api/board/config', (req, res) => {
  const { title, columns } = req.body;
  if (!db.boardConfig) db.boardConfig = getInitialData().boardConfig;
  
  if (title !== undefined) db.boardConfig.title = title.trim();
  if (Array.isArray(columns)) {
    db.boardConfig.columns = columns;
  }

  saveData(db);
  res.status(200).json(db.boardConfig);
});

// ==========================================
// 3. USER AUTH & REGISTRATION (WITH EMAIL)
// ==========================================
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, name, role, avatar } = req.body;
  if (!username || !password || !name || !email) {
    return res.status(400).json({ error: 'Username, email, password, and name are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const existingEmail = db.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return res.status(400).json({ error: 'Email is already registered' });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    username: cleanUsername,
    password: password.trim(),
    role: role || 'Member',
    status: 'online',
    customStatus: 'Exploring Rosetta 🚀',
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.members.push({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    username: newUser.username,
    role: newUser.role,
    status: newUser.status,
    customStatus: newUser.customStatus,
    avatar: newUser.avatar,
    createdAt: newUser.createdAt
  });

  saveData(db);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const loginIdentifier = username.trim().toLowerCase();
  // Support login by either username or email
  const user = db.users.find(u => 
    u.username.toLowerCase() === loginIdentifier || 
    (u.email && u.email.toLowerCase() === loginIdentifier)
  );

  if (!user || user.password !== password.trim()) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  user.status = 'online';
  saveData(db);

  const { password: _, ...safeUser } = user;
  res.status(200).json(safeUser);
});

app.get('/api/users', (req, res) => {
  const { q } = req.query;
  let list = db.users.map(({ password, ...safe }) => safe);
  if (q) {
    const term = q.toLowerCase();
    list = list.filter(u => 
      u.name.toLowerCase().includes(term) || 
      u.username.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  }
  res.status(200).json(list);
});

// ==========================================
// 4. "KNOWN" CONNECTION NETWORK (Friend Requests)
// ==========================================
app.get('/api/connections', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId query param is required' });
  }

  const accepted = db.connections.filter(
    c => (c.senderId === userId || c.receiverId === userId) && c.status === 'accepted'
  );

  const knownUserIds = accepted.map(c => c.senderId === userId ? c.receiverId : c.senderId);
  const knownUsers = db.users
    .filter(u => knownUserIds.includes(u.id))
    .map(({ password, ...u }) => u);

  const pendingIncoming = db.connections
    .filter(c => c.receiverId === userId && c.status === 'pending')
    .map(c => {
      const sender = db.users.find(u => u.id === c.senderId);
      const { password, ...safeSender } = sender || {};
      return { ...c, sender: safeSender };
    });

  const pendingOutgoing = db.connections
    .filter(c => c.senderId === userId && c.status === 'pending')
    .map(c => {
      const receiver = db.users.find(u => u.id === c.receiverId);
      const { password, ...safeReceiver } = receiver || {};
      return { ...c, receiver: safeReceiver };
    });

  res.status(200).json({
    known: knownUsers,
    pendingIncoming,
    pendingOutgoing
  });
});

app.post('/api/connections/request', (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'senderId and receiverId are required' });
  }
  if (senderId === receiverId) {
    return res.status(400).json({ error: 'Cannot send connection request to yourself' });
  }

  const existing = db.connections.find(
    c => (c.senderId === senderId && c.receiverId === receiverId) ||
         (c.senderId === receiverId && c.receiverId === senderId)
  );

  if (existing) {
    return res.status(400).json({ error: 'A connection or request already exists between these users', connection: existing });
  }

  const newConn = {
    id: `conn-${Date.now()}`,
    senderId,
    receiverId,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.connections.push(newConn);
  saveData(db);
  res.status(201).json(newConn);
});

app.patch('/api/connections/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'accepted' | 'rejected'

  const conn = db.connections.find(c => c.id === id);
  if (!conn) {
    return res.status(404).json({ error: 'Connection request not found' });
  }

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be either accepted or rejected' });
  }

  conn.status = status;
  conn.updatedAt = new Date().toISOString();
  saveData(db);
  res.status(200).json(conn);
});

// ==========================================
// 5. CHANNELS ENDPOINTS
// ==========================================
app.get('/api/channels', (req, res) => {
  res.status(200).json(db.channels);
});

app.get('/api/channels/:id', (req, res) => {
  const channel = db.channels.find(c => c.id === req.params.id);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found', channelId: req.params.id });
  }
  res.status(200).json(channel);
});

app.post('/api/channels', (req, res) => {
  const { name, description, category } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Channel name is required' });
  }

  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
  const newChannel = {
    id: `c-${Date.now()}`,
    name: cleanName,
    description: description ? description.trim() : 'Channel for team discussions',
    category: category || 'Text Channels',
    isDefault: false,
    createdAt: new Date().toISOString()
  };

  db.channels.push(newChannel);
  saveData(db);
  res.status(201).json(newChannel);
});

app.patch('/api/channels/:id', (req, res) => {
  const channel = db.channels.find(c => c.id === req.params.id);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const { name, description, category } = req.body;
  if (name !== undefined) channel.name = name.trim().toLowerCase().replace(/\s+/g, '-');
  if (description !== undefined) channel.description = description.trim();
  if (category !== undefined) channel.category = category.trim();

  saveData(db);
  res.status(200).json(channel);
});

app.delete('/api/channels/:id', (req, res) => {
  const index = db.channels.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  if (db.channels[index].isDefault) {
    return res.status(403).json({ error: 'Cannot delete default general channel' });
  }

  const deleted = db.channels.splice(index, 1)[0];
  db.messages = db.messages.filter(m => m.channelId !== deleted.id);
  saveData(db);
  res.status(200).json({ message: `Channel #${deleted.name} deleted successfully`, deletedId: deleted.id });
});

// ==========================================
// 6. MESSAGES ENDPOINTS (WITH EDIT / PATCH)
// ==========================================
app.get('/api/messages', (req, res) => {
  const { channelId } = req.query;
  let results = db.messages;
  if (channelId) {
    results = results.filter(m => m.channelId === channelId);
  }
  res.status(200).json(results);
});

app.get('/api/messages/:id', (req, res) => {
  const msg = db.messages.find(m => m.id === req.params.id);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.status(200).json(msg);
});

app.post('/api/messages', (req, res) => {
  const { channelId, senderId, text } = req.body;
  if (!channelId || !senderId || !text || text.trim() === '') {
    return res.status(400).json({ error: 'channelId, senderId, and text are required' });
  }

  const user = db.users?.find(u => u.id === senderId) || db.members.find(m => m.id === senderId);
  const senderName = user ? user.name : 'Unknown User';
  const senderAvatar = user ? user.avatar : 'https://api.dicebear.com/7.x/bottts/svg?seed=guest';

  const newMsg = {
    id: `msg-${Date.now()}`,
    channelId,
    senderId,
    senderName,
    senderAvatar,
    text: text.trim(),
    edited: false,
    timestamp: new Date().toISOString()
  };

  db.messages.push(newMsg);
  saveData(db);
  res.status(201).json(newMsg);
});

// EDIT / MODIFY MESSAGE
app.patch('/api/messages/:id', (req, res) => {
  const msg = db.messages.find(m => m.id === req.params.id);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const { text, senderId } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Message text cannot be empty' });
  }

  // Verify ownership if senderId provided
  if (senderId && msg.senderId !== senderId) {
    return res.status(403).json({ error: 'You can only edit your own messages' });
  }

  msg.text = text.trim();
  msg.edited = true;
  msg.updatedAt = new Date().toISOString();

  saveData(db);
  res.status(200).json(msg);
});

app.delete('/api/messages/:id', (req, res) => {
  const index = db.messages.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }
  const deleted = db.messages.splice(index, 1)[0];
  saveData(db);
  res.status(200).json({ message: 'Message deleted successfully', deletedId: deleted.id });
});

// ==========================================
// 7. CARDS (KANBAN BOARD) ENDPOINTS
// ==========================================
app.get('/api/cards', (req, res) => {
  const { list, priority } = req.query;
  let results = db.cards;
  if (list) results = results.filter(c => c.list === list);
  if (priority) results = results.filter(c => c.priority === priority);
  res.status(200).json(results);
});

app.get('/api/cards/:id', (req, res) => {
  const card = db.cards.find(c => c.id === req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.status(200).json(card);
});

app.post('/api/cards', (req, res) => {
  const { title, description, list, priority, assignedTo } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Card title is required' });
  }

  let assigneeName = 'Unassigned';
  if (assignedTo) {
    const user = db.users?.find(u => u.id === assignedTo) || db.members.find(m => m.id === assignedTo);
    if (user) assigneeName = user.name;
  }

  const newCard = {
    id: `card-${Date.now()}`,
    title: title.trim(),
    description: description ? description.trim() : '',
    list: ['todo', 'in-progress', 'review', 'done'].includes(list) ? list : 'todo',
    priority: ['urgent', 'high', 'medium', 'low'].includes(priority) ? priority : 'medium',
    assignedTo: assignedTo || null,
    assigneeName,
    createdAt: new Date().toISOString()
  };

  db.cards.push(newCard);
  saveData(db);
  res.status(201).json(newCard);
});

app.patch('/api/cards/:id', (req, res) => {
  const card = db.cards.find(c => c.id === req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  const { title, description, list, priority, assignedTo } = req.body;
  if (title !== undefined) card.title = title.trim();
  if (description !== undefined) card.description = description.trim();
  if (list !== undefined) card.list = list;
  if (priority !== undefined && ['urgent', 'high', 'medium', 'low'].includes(priority)) card.priority = priority;
  if (assignedTo !== undefined) {
    card.assignedTo = assignedTo;
    const user = db.users?.find(u => u.id === assignedTo) || db.members.find(m => m.id === assignedTo);
    card.assigneeName = user ? user.name : 'Unassigned';
  }

  saveData(db);
  res.status(200).json(card);
});

app.delete('/api/cards/:id', (req, res) => {
  const index = db.cards.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }
  const deleted = db.cards.splice(index, 1)[0];
  saveData(db);
  res.status(200).json({ message: `Card "${deleted.title}" deleted successfully`, deletedId: deleted.id });
});

// ==========================================
// 8. MEMBERS ENDPOINTS (Compatibility)
// ==========================================
app.get('/api/members', (req, res) => {
  res.status(200).json(db.members);
});

app.get('/api/members/:id', (req, res) => {
  const member = db.members.find(m => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.status(200).json(member);
});

app.post('/api/members', (req, res) => {
  const { name, username, role, customStatus, avatar } = req.body;
  if (!name || !username) {
    return res.status(400).json({ error: 'Name and username are required' });
  }

  const newMember = {
    id: `m-${Date.now()}`,
    name: name.trim(),
    username: username.trim().toLowerCase(),
    role: role || 'Member',
    status: 'online',
    customStatus: customStatus || 'Working on Rosetta',
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
    createdAt: new Date().toISOString()
  };

  db.members.push(newMember);
  saveData(db);
  res.status(201).json(newMember);
});

app.patch('/api/members/:id', (req, res) => {
  const member = db.members.find(m => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const { status, role, customStatus } = req.body;
  if (status) member.status = status;
  if (role) member.role = role;
  if (customStatus !== undefined) member.customStatus = customStatus;

  saveData(db);
  res.status(200).json(member);
});

// ==========================================
// 9. FRONTEND STATIC ASSETS & FALLBACK
// ==========================================
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Rosetta Hub API</title></head>
        <body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; padding:2rem; text-align:center;">
          <h1>🚀 Rosetta API Service</h1>
          <p>Rosetta Hub is running on port ${PORT}.</p>
          <p><a href="/api/health" style="color:#38bdf8;">Check API Health</a></p>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`🚀 Rosetta Hub Server running at http://localhost:${PORT}`);
  console.log(`📦 Health Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`📊 Stats Endpoint: http://localhost:${PORT}/api/stats`);
  console.log(`=============================================`);
});
