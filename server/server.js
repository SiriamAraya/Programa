const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const pedidosFile = 'pedidos.json';

function leerPedidos() {
  if (!fs.existsSync(pedidosFile)) return [];
  const data = fs.readFileSync(pedidosFile, 'utf8');
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Error parseando pedidos.json:", err);
    return [];
  }
}

function guardarPedidos(pedidos) {
  try {
    fs.writeFileSync(pedidosFile, JSON.stringify(pedidos, null, 2), 'utf8');
  } catch (err) {
    console.error("Error escribiendo pedidos.json:", err);
  }
}

// Obtener todos los pedidos
app.get('/pedidos', (req, res) => {
  const pedidos = leerPedidos();
  res.json(pedidos);
});

// Agregar o actualizar un pedido para un cliente
app.post('/pedidos', (req, res) => {
  const nuevoPedido = req.body;

  console.log('Recibido pedido:', nuevoPedido);

  if (!nuevoPedido.cliente || !Array.isArray(nuevoPedido.productos) || nuevoPedido.productos.length === 0) {
    return res.status(400).json({ error: "Pedido inválido" });
  }

  const pedidos = leerPedidos();

  // Buscar si el cliente ya tiene un pedido
  const index = pedidos.findIndex(p => p.cliente === nuevoPedido.cliente);

  if (index >= 0) {
    // Actualizar productos del pedido existente (sumar cantidades si mismo producto)
    const pedidoExistente = pedidos[index];
    
    nuevoPedido.productos.forEach(np => {
      const prodExistente = pedidoExistente.productos.find(p => p.nombre === np.nombre);
      if (prodExistente) {
        prodExistente.cantidad += np.cantidad;
      } else {
        pedidoExistente.productos.push(np);
      }
    });

    // Recalcular subtotal
    pedidoExistente.subtotal = pedidoExistente.productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

    pedidos[index] = pedidoExistente;
  } else {
    // Nuevo pedido
    nuevoPedido.subtotal = nuevoPedido.productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
    nuevoPedido.fechaPago = null;
    pedidos.push(nuevoPedido);
  }

  guardarPedidos(pedidos);
  res.json({ message: "Pedido guardado" });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
