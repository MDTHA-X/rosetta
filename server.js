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

// Initial Seed Data for Rosetta
const getInitialData = () => ({
  channels: [
    { id: "c-1", name: "general", description: "General community and team discussions", category: "Text Channels", isDefault: true, createdAt: new Date().toISOString() },
    { id: "c-2", name: "dev-talk", description: "Engineering, architecture, and code reviews", category: "Text Channels", isDefault: false, createdAt: new Date().toISOString() },
    { id: "c-3", name: "announcements", description: "Official updates and release notices", category: "Information", isDefault: false, createdAt: new Date().toISOString() }
  ],
  members: [
    { id: "m-1", name: "Tanjim Hossen", username: "tanjim", role: "Admin", status: "online", customStatus: "Building Rosetta 🚀", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() },
    { id: "m-2", name: "Alex Rivera", username: "arivera", role: "Lead Developer", status: "online", customStatus: "Refactoring APIs", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() },
    { id: "m-3", name: "Sarah Chen", username: "schen", role: "Product Designer", status: "idle", customStatus: "Designing Kanban UI", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() },
    { id: "m-4", name: "Marcus Vance", username: "mvance", role: "QA Engineer", status: "dnd", customStatus: "Running JMeter load tests", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", createdAt: new Date().toISOString() }
  ],
  messages: [
    { id: "msg-1", channelId: "c-1", senderId: "m-1", senderName: "Tanjim Hossen", senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", text: "Welcome to Rosetta! Combining Discord chat with Trello task workflows.", timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: "msg-2", channelId: "c-1", senderId: "m-2", senderName: "Alex Rivera", senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", text: "Checked out the Kanban board. The API endpoints are looking super crisp!", timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: "msg-3", channelId: "c-2", senderId: "m-4", senderName: "Marcus Vance", senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", text: "Running the 100 Postman test suite now. All assertions are passing 100%.", timestamp: new Date(Date.now() - 900000).toISOString() }
  ],
  cards: [
    { id: "card-1", title: "Setup Azure VPS Deployment", description: "Configure Docker Compose, reverse proxy, and SSL on VM 40.83.100.54", list: "done", priority: "high", assignedTo: "m-1", assigneeName: "Tanjim Hossen", createdAt: new Date().toISOString() },
    { id: "card-2", title: "Create 100 Postman Assertions", description: "Cover CRUD on channels, members, messages, and cards with Newman reporting", list: "done", priority: "high", assignedTo: "m-4", assigneeName: "Marcus Vance", createdAt: new Date().toISOString() },
    { id: "card-3", title: "Build Discord + Trello React Interface", description: "Dual-pane dashboard with channel switcher, chat history, and Kanban drag-drop columns", list: "in-progress", priority: "urgent", assignedTo: "m-2", assigneeName: "Alex Rivera", createdAt: new Date().toISOString() },
    { id: "card-4", title: "JMeter Concurrency Load Testing", description: "Simulate 100 concurrent threads hitting /api/messages and /api/cards", list: "todo", priority: "medium", assignedTo: "m-4", assigneeName: "Marcus Vance", createdAt: new Date().toISOString() }
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
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading data:', err);
    return getInitialData();
  }
}

function saveData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

let db = loadData();

// ==========================================
// 1. HEALTH & SYSTEM METRICS
// ==========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Rosetta API Service',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stats', (req, res) => {
  res.status(200).json({
    totalChannels: db.channels.length,
    totalMembers: db.members.length,
    totalMessages: db.messages.length,
    totalCards: db.cards.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/reset', (req, res) => {
  db = getInitialData();
  saveData(db);
  res.status(200).json({ message: 'Rosetta database reset to default initial state', data: db });
});

// ==========================================
// 2. CHANNELS API (Discord feature)
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
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Channel name is required' });
  }

  const cleanName = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const existing = db.channels.find(c => c.name === cleanName);
  if (existing) {
    return res.status(409).json({ error: `Channel #${cleanName} already exists` });
  }

  const newChannel = {
    id: `c-${Date.now()}`,
    name: cleanName,
    description: description || 'No description provided',
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
  if (req.body.name) {
    channel.name = req.body.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  }
  if (req.body.description !== undefined) {
    channel.description = req.body.description;
  }
  if (req.body.category) {
    channel.category = req.body.category;
  }
  saveData(db);
  res.status(200).json(channel);
});

app.delete('/api/channels/:id', (req, res) => {
  const index = db.channels.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Channel not found' });
  }
  if (db.channels[index].isDefault) {
    return res.status(400).json({ error: 'Cannot delete the default #general channel' });
  }

  const deleted = db.channels.splice(index, 1)[0];
  // Remove messages in this channel
  db.messages = db.messages.filter(m => m.channelId !== req.params.id);
  saveData(db);
  res.status(200).json({ message: `Channel #${deleted.name} deleted successfully`, deletedId: deleted.id });
});

// ==========================================
// 3. MEMBERS API (Discord feature)
// ==========================================
app.get('/api/members', (req, res) => {
  const { status, role } = req.query;
  let result = db.members;
  if (status) {
    result = result.filter(m => m.status.toLowerCase() === status.toLowerCase());
  }
  if (role) {
    result = result.filter(m => m.role.toLowerCase() === role.toLowerCase());
  }
  res.status(200).json(result);
});

app.get('/api/members/:id', (req, res) => {
  const member = db.members.find(m => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found', memberId: req.params.id });
  }
  res.status(200).json(member);
});

app.post('/api/members', (req, res) => {
  const { name, username, role, status, customStatus, avatar } = req.body;
  if (!name || !username) {
    return res.status(400).json({ error: 'Both name and username are required' });
  }

  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const existing = db.members.find(m => m.username === cleanUsername);
  if (existing) {
    return res.status(409).json({ error: `Username @${cleanUsername} is already taken` });
  }

  const newMember = {
    id: `m-${Date.now()}`,
    name,
    username: cleanUsername,
    role: role || 'Member',
    status: status || 'online',
    customStatus: customStatus || '',
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
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

  if (req.body.name) member.name = req.body.name;
  if (req.body.role) member.role = req.body.role;
  if (req.body.status) member.status = req.body.status;
  if (req.body.customStatus !== undefined) member.customStatus = req.body.customStatus;
  if (req.body.avatar) member.avatar = req.body.avatar;

  saveData(db);
  res.status(200).json(member);
});

app.delete('/api/members/:id', (req, res) => {
  const index = db.members.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Member not found' });
  }
  const deleted = db.members.splice(index, 1)[0];
  saveData(db);
  res.status(200).json({ message: `Member @${deleted.username} removed successfully`, deletedId: deleted.id });
});

// ==========================================
// 4. MESSAGES API (Discord Text Chat)
// ==========================================
app.get('/api/messages', (req, res) => {
  const { channelId, limit } = req.query;
  let msgs = db.messages;
  if (channelId) {
    msgs = msgs.filter(m => m.channelId === channelId);
  }
  if (limit) {
    const num = parseInt(limit, 10);
    if (!isNaN(num) && num > 0) {
      msgs = msgs.slice(-num);
    }
  }
  res.status(200).json(msgs);
});

app.get('/api/messages/:id', (req, res) => {
  const message = db.messages.find(m => m.id === req.params.id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.status(200).json(message);
});

app.post('/api/messages', (req, res) => {
  const { channelId, senderId, text } = req.body;
  if (!channelId || !senderId || !text || text.trim().length === 0) {
    return res.status(400).json({ error: 'channelId, senderId, and text are required fields' });
  }

  const channel = db.channels.find(c => c.id === channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Channel does not exist' });
  }

  const sender = db.members.find(m => m.id === senderId) || {
    name: 'Anonymous User',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=anon'
  };

  const newMessage = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    channelId,
    senderId,
    senderName: sender.name,
    senderAvatar: sender.avatar,
    text: text.trim(),
    timestamp: new Date().toISOString()
  };

  db.messages.push(newMessage);
  saveData(db);
  res.status(201).json(newMessage);
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
// 5. CARDS API (Trello Kanban Feature)
// ==========================================
app.get('/api/cards', (req, res) => {
  const { list, priority, assignedTo } = req.query;
  let result = db.cards;
  if (list) {
    result = result.filter(c => c.list.toLowerCase() === list.toLowerCase());
  }
  if (priority) {
    result = result.filter(c => c.priority.toLowerCase() === priority.toLowerCase());
  }
  if (assignedTo) {
    result = result.filter(c => c.assignedTo === assignedTo);
  }
  res.status(200).json(result);
});

app.get('/api/cards/:id', (req, res) => {
  const card = db.cards.find(c => c.id === req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found', cardId: req.params.id });
  }
  res.status(200).json(card);
});

app.post('/api/cards', (req, res) => {
  const { title, description, list, priority, assignedTo } = req.body;
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Card title is required' });
  }

  const validLists = ['todo', 'in-progress', 'review', 'done'];
  const targetList = list && validLists.includes(list.toLowerCase()) ? list.toLowerCase() : 'todo';

  let assigneeName = 'Unassigned';
  if (assignedTo) {
    const member = db.members.find(m => m.id === assignedTo);
    if (member) assigneeName = member.name;
  }

  const newCard = {
    id: `card-${Date.now()}`,
    title: title.trim(),
    description: description || '',
    list: targetList,
    priority: priority || 'medium',
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

  if (req.body.title) card.title = req.body.title.trim();
  if (req.body.description !== undefined) card.description = req.body.description;
  if (req.body.list) {
    const validLists = ['todo', 'in-progress', 'review', 'done'];
    if (validLists.includes(req.body.list.toLowerCase())) {
      card.list = req.body.list.toLowerCase();
    }
  }
  if (req.body.priority) card.priority = req.body.priority;
  if (req.body.assignedTo !== undefined) {
    card.assignedTo = req.body.assignedTo;
    const member = db.members.find(m => m.id === req.body.assignedTo);
    card.assigneeName = member ? member.name : 'Unassigned';
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
// 6. FRONTEND STATIC ASSETS & FALLBACK
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
          <p>Discord + Trello Hybrid Hub is running on port ${PORT}.</p>
          <p>Please run <code>npm run build</code> to compile the React frontend.</p>
          <p><a href="/api/health" style="color:#38bdf8;">Check API Health</a> | <a href="/api/stats" style="color:#38bdf8;">View System Stats</a></p>
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
