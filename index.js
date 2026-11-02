const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();

// Middlewares
app.use(express.json());
// Configuración de sesiones (Criterio: Sesión)
app.use(session({
    secret: 'clave_secreta_rally_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // false porque estamos en localhost (http)
}));

const dbPath = path.join(__dirname, 'db.json');
const leerDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const guardarDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// --- RUTAS DE LA API (CRUD) ---

// 1. GET: Obtener todos los productos
app.get('/api/productos', (req, res) => {
    const db = leerDB();
    res.status(200).json({ exito: true, data: db.productos });
});

// 2. POST: Crear un nuevo producto (Con validación)
app.post('/api/productos', (req, res) => {
    const { nombre, precio, stock } = req.body;

    // Validación de entrada (Criterio: Validación)
    if (!nombre || precio === undefined || stock === undefined) {
        return res.status(400).json({ 
            exito: false, 
            error: "Faltan datos. Se requiere nombre, precio y stock." 
        });
    }

    const db = leerDB();
    const nuevoProducto = {
        id: db.productos.length > 0 ? db.productos[db.productos.length - 1].id + 1 : 1,
        nombre,
        precio,
        stock
    };

    db.productos.push(nuevoProducto);
    guardarDB(db);

    // Notificar a los clientes en tiempo real (Criterio: Tiempo real)
    notificarClientes(`Nuevo producto agregado: ${nombre}`);

    res.status(201).json({ exito: true, data: nuevoProducto });
});

// 3. PUT: Actualizar un producto existente
app.put('/api/productos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, precio, stock } = req.body;

    const db = leerDB();
    const index = db.productos.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ exito: false, error: "Producto no encontrado" });
    }

    db.productos[index] = { 
        ...db.productos[index], 
        ...(nombre && { nombre }), 
        ...(precio !== undefined && { precio }), 
        ...(stock !== undefined && { stock }) 
    };

    guardarDB(db);
    notificarClientes(`Producto actualizado: ${db.productos[index].nombre}`);
    res.status(200).json({ exito: true, data: db.productos[index] });
});

// 4. DELETE: Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const db = leerDB();
    
    const productosFiltrados = db.productos.filter(p => p.id !== id);

    if (productosFiltrados.length === db.productos.length) {
        return res.status(404).json({ exito: false, error: "Producto no encontrado" });
    }

    db.productos = productosFiltrados;
    guardarDB(db);
    notificarClientes(`Producto con ID ${id} eliminado`);
    res.status(200).json({ exito: true, message: "Producto eliminado correctamente" });
});

// --- RUTAS DE SESIÓN (Criterio: Sesiones) ---
app.post('/login', (req, res) => {
    // Simulamos un login exitoso
    req.session.usuario = { nombre: "Estudiante UPS", rol: "admin" };
    res.json({ exito: true, mensaje: "Sesión iniciada correctamente", sesion: req.session.usuario });
});

app.get('/perfil', (req, res) => {
    if (req.session.usuario) {
        res.json({ exito: true, data: req.session.usuario });
    } else {
        res.status(401).json({ exito: false, error: "No has iniciado sesión" });
    }
});

// --- TIEMPO REAL (Server-Sent Events) ---
let clientes = [];

app.get('/eventos', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    clientes.push(res);
    
    // Si el cliente cierra la conexión, lo removemos
    req.on('close', () => {
        clientes = clientes.filter(cliente => cliente !== res);
    });
});

function notificarClientes(mensaje) {
    clientes.forEach(cliente => {
        cliente.write(`data: ${mensaje}\n\n`);
    });
}

// --- LEVANTAR EL SERVIDOR ---
const PUERTO = 3000;
app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});