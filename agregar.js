// Configuración Firebase (compat)
const firebaseConfig = {
  apiKey: "AIzaSyBMbS03YXelxtImddYi954A2CIT_IRlnUE",
  authDomain: "programa-27166.firebaseapp.com",
  databaseURL: "https://programa-27166-default-rtdb.firebaseio.com",
  projectId: "programa-27166",
  storageBucket: "programa-27166.firebasestorage.app",
  messagingSenderId: "672184644976",
  appId: "1:672184644976:web:f4eb4b9ab4e49cc4138bb5",
  measurementId: "G-5ZG0TRNC2E"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const db = firebase.database();

let pedido = [];

const inputCliente = document.getElementById("cliente");
const selectProducto = document.getElementById("producto");
const inputCantidad = document.getElementById("cantidad");
const divPedidoTemp = document.getElementById("pedidoTemp");

function getClienteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cliente");
}

window.onload = function() {
  const clienteEditar = getClienteFromUrl();
  if (!clienteEditar) return;

  // Escuchar cambios en tiempo real en Firebase
  db.ref('pedidos/' + clienteEditar).on('value', snapshot => {
    if (snapshot.exists()) {
      const pedidoObj = snapshot.val();
      if (pedidoObj && pedidoObj.productos) {
        inputCliente.value = pedidoObj.cliente;
        inputCliente.disabled = true;

        pedido = pedidoObj.productos.map(p => ({
          cliente: pedidoObj.cliente,
          producto: `${p.nombre} - $${parseFloat(p.precio).toFixed(2)}`,
          cantidad: p.cantidad,
          subtotal: p.precio * p.cantidad
        }));

        mostrarPedidoTemp();
      }
    } else {
      console.log("No existe pedido para el cliente:", clienteEditar);
      pedido = [];
      mostrarPedidoTemp();
      inputCliente.disabled = false;
      inputCliente.value = "";
    }
  });
}

function agregarPedidoTemp() {
  const cliente = inputCliente.value.trim();
  const cantidad = parseInt(inputCantidad.value);
  const nombreProducto = selectProducto.options[selectProducto.selectedIndex].text;
  const precio = parseFloat(selectProducto.value);
  const subtotal = precio * cantidad;

  if (cliente === "" || isNaN(cantidad) || cantidad <= 0) {
    alert("Por favor, ingrese un nombre de cliente válido y una cantidad.");
    return;
  }

  pedido.push({ cliente, producto: nombreProducto, cantidad, subtotal });
  mostrarPedidoTemp();
}

function mostrarPedidoTemp() {
  divPedidoTemp.innerHTML = "<h4>Pedido Temporal:</h4>";
  let total = 0;
  pedido.forEach(item => {
    divPedidoTemp.innerHTML += `<p>${item.cantidad} x ${item.producto} = $${item.subtotal.toFixed(2)}</p>`;
    total += item.subtotal;
  });
  divPedidoTemp.innerHTML += `<strong>Total: $${total.toFixed(2)}</strong>`;
}

function confirmarPedido() {
  if (pedido.length === 0) {
    alert("No hay productos en el pedido.");
    return;
  }

  const clienteActual = pedido[0].cliente;

  const productos = pedido.map(item => {
    const nombre = item.producto.split(" - $")[0];
    const precio = parseFloat(item.producto.split(" - $")[1]);
    return {
      nombre,
      cantidad: item.cantidad,
      precio
    };
  });

  const subtotal = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

  db.ref('pedidos/' + clienteActual).set({
    cliente: clienteActual,
    productos: productos,
    subtotal: subtotal,
    fechaPago: null
  })
  .then(() => {
    alert("Pedido confirmado y guardado. Gracias!");
    pedido.length = 0;
    divPedidoTemp.innerHTML = "";
    inputCliente.value = "";
    inputCliente.disabled = false;
    inputCantidad.value = 1;
  })
  .catch(error => {
    alert("Error al guardar el pedido: " + error.message);
  });
}

const productosPorTipo = {
  cervezas: [
    { nombre: "Imperial", precio: 2 },
    { nombre: "Pilsen", precio: 2.5 },
    { nombre: "Bavaria", precio: 3 }
  ],
  comida: [
    { nombre: "Hamburguesa", precio: 5 },
    { nombre: "Pizza", precio: 7 },
    { nombre: "Papas", precio: 4 }
  ],
  bebidas: [
    { nombre: "Refresco", precio: 3 },
    { nombre: "Jugo", precio: 3.5 },
    { nombre: "Agua", precio: 2 }
  ]
};

function actualizarProductosPorTipo() {
  const tipoSeleccionado = document.getElementById("tipo").value;
  const productoSelect = document.getElementById("producto");

  productoSelect.innerHTML = "";

  if (productosPorTipo[tipoSeleccionado]) {
    productosPorTipo[tipoSeleccionado].forEach(producto => {
      const option = document.createElement("option");
      option.value = producto.precio;
      option.textContent = `${producto.nombre} - $${producto.precio}`;
      productoSelect.appendChild(option);
    });
  }
}
