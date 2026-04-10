const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database
let resources = [];
let emergencies = [];
let users = [
    {
        id: 1,
        username: 'admin',
        password: '1234',
        role: 'administrator',
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        username: 'operator',
        password: '5678',
        role: 'disaster_operator',
        createdAt: new Date().toISOString()
    }
];

// ============ AUTHENTICATION ENDPOINTS ============

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Verify session endpoint
app.get('/api/verify', (req, res) => {
    const token = req.headers['authorization'];
    
    if (token === 'demo-token-123') {
        res.json({ valid: true });
    } else {
        res.json({ valid: false });
    }
});

// Get all users (admin only in production)
app.get('/api/users', (req, res) => {
    res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
});

// ============ RESOURCE MANAGEMENT ENDPOINTS ============

// Add resource
app.post('/resource', (req, res) => {
    const { name, qty, location, type, priority, status } = req.body;
    const id = resources.length + 1;
    const time = new Date().toLocaleString();
    const timestamp = new Date().toISOString();
    
    resources.push({
        id,
        name,
        qty: qty || 0,
        location,
        type: type || 'relief',
        priority: priority || 'medium',
        status: status || 'Available',
        time,
        timestamp
    });
    
    res.json({ 
        message: "Resource added successfully",
        resource: resources[resources.length - 1]
    });
});

// Get all resources with statistics
app.get('/resource', (req, res) => {
    const total = resources.length;
    const available = resources.filter(r => r.status === "Available").length;
    const limited = resources.filter(r => r.status === "Limited").length;
    const outOfStock = resources.filter(r => r.status === "Out of Stock").length;
    
    const totalQuantity = resources.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0);
    
    res.json({
        total,
        available,
        limited,
        outOfStock,
        totalQuantity,
        records: resources,
        lastUpdated: new Date().toISOString()
    });
});

// Get single resource by ID
app.get('/resource/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const resource = resources.find(r => r.id === id);
    
    if (resource) {
        res.json(resource);
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

// Update resource
app.put('/resource/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = resources.findIndex(r => r.id === id);
    
    if (index !== -1) {
        resources[index] = { ...resources[index], ...req.body, updatedAt: new Date().toISOString() };
        res.json({ message: "Resource updated", resource: resources[index] });
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

// Delete resource by index
app.delete('/delete/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (id >= 0 && id < resources.length) {
        const deleted = resources.splice(id, 1);
        res.json({ 
            message: "Resource deleted successfully",
            deleted: deleted[0]
        });
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

// Delete resource by ID
app.delete('/resource/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = resources.findIndex(r => r.id === id);
    
    if (index !== -1) {
        const deleted = resources.splice(index, 1);
        res.json({ message: "Resource deleted", deleted: deleted[0] });
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

// ============ EMERGENCY MANAGEMENT ENDPOINTS ============

// Add emergency report
app.post('/emergency', (req, res) => {
    const { type, location, description, severity } = req.body;
    const id = emergencies.length + 1;
    const time = new Date().toLocaleString();
    const timestamp = new Date().toISOString();
    
    emergencies.push({
        id,
        type,
        location,
        description: description || "No description provided",
        severity: severity || "high",
        status: "active",
        time,
        timestamp
    });
    
    res.json({ 
        message: "Emergency reported successfully",
        emergency: emergencies[emergencies.length - 1]
    });
});

// Get all emergencies
app.get('/emergency', (req, res) => {
    const sorted = [...emergencies].reverse();
    res.json(sorted);
});

// Get active emergencies
app.get('/emergency/active', (req, res) => {
    const active = emergencies.filter(e => e.status === "active");
    res.json(active);
});

// Resolve emergency
app.put('/emergency/:id/resolve', (req, res) => {
    const id = parseInt(req.params.id);
    const emergency = emergencies.find(e => e.id === id);
    
    if (emergency) {
        emergency.status = "resolved";
        emergency.resolvedAt = new Date().toISOString();
        res.json({ message: "Emergency resolved", emergency });
    } else {
        res.status(404).json({ message: "Emergency not found" });
    }
});

// Delete emergency
app.delete('/emergency/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = emergencies.findIndex(e => e.id === id);
    
    if (index !== -1) {
        emergencies.splice(index, 1);
        res.json({ message: "Emergency deleted" });
    } else {
        res.status(404).json({ message: "Emergency not found" });
    }
});

// ============ STATISTICS & DASHBOARD ENDPOINTS ============

// Get dashboard statistics
app.get('/api/stats', (req, res) => {
    const stats = {
        totalResources: resources.length,
        availableResources: resources.filter(r => r.status === "Available").length,
        activeEmergencies: emergencies.filter(e => e.status === "active").length,
        totalEmergencies: emergencies.length,
        resourcesByType: {
            medical: resources.filter(r => r.type === "medical").length,
            food: resources.filter(r => r.type === "food").length,
            shelter: resources.filter(r => r.type === "shelter").length,
            equipment: resources.filter(r => r.type === "equipment").length,
            other: resources.filter(r => !["medical", "food", "shelter", "equipment"].includes(r.type)).length
        },
        emergenciesByType: {
            flood: emergencies.filter(e => e.type === "Flood").length,
            earthquake: emergencies.filter(e => e.type === "Earthquake").length,
            fire: emergencies.filter(e => e.type === "Fire").length,
            cyclone: emergencies.filter(e => e.type === "Cyclone").length
        }
    };
    
    res.json(stats);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        resources: resources.length,
        emergencies: emergencies.length
    });
});

// ============ ROOT ENDPOINT (ADDED AS REQUESTED) ============
app.get("/", (req, res) => {
    res.send("🚀 Disaster Management Backend Running Successfully");
});

// ============ SAMPLE DATA (for testing) ============

// Add some sample data if empty
if (resources.length === 0) {
    resources.push(
        {
            id: 1,
            name: "Medical Kits",
            qty: 150,
            location: "Central Warehouse",
            type: "medical",
            priority: "high",
            status: "Available",
            time: new Date().toLocaleString(),
            timestamp: new Date().toISOString()
        },
        {
            id: 2,
            name: "Water Bottles",
            qty: 500,
            location: "Distribution Center A",
            type: "food",
            priority: "high",
            status: "Available",
            time: new Date().toLocaleString(),
            timestamp: new Date().toISOString()
        },
        {
            id: 3,
            name: "Blankets",
            qty: 200,
            location: "Warehouse B",
            type: "shelter",
            priority: "medium",
            status: "Limited",
            time: new Date().toLocaleString(),
            timestamp: new Date().toISOString()
        }
    );
}

if (emergencies.length === 0) {
    emergencies.push(
        {
            id: 1,
            type: "Flood",
            location: "Downtown Riverside",
            description: "Heavy flooding affecting residential areas",
            severity: "high",
            status: "active",
            time: new Date().toLocaleString(),
            timestamp: new Date().toISOString()
        },
        {
            id: 2,
            type: "Fire",
            location: "Industrial District",
            description: "Large fire at chemical plant",
            severity: "critical",
            status: "active",
            time: new Date().toLocaleString(),
            timestamp: new Date().toISOString()
        }
    );
}

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available:`);
    console.log(`   - GET    /`);
    console.log(`   - POST   /api/login`);
    console.log(`   - GET    /resource`);
    console.log(`   - POST   /resource`);
    console.log(`   - DELETE /delete/:id`);
    console.log(`   - GET    /emergency`);
    console.log(`   - POST   /emergency`);
    console.log(`   - GET    /api/stats`);
    console.log(`   - GET    /health`);
});