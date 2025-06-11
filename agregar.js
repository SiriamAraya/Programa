// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBMbS03YXelxtImddYi954A2CIT_IRlnUE",
  authDomain: "programa-27166.firebaseapp.com",
  databaseURL: "https://programa-27166-default-rtdb.firebaseio.com",
  projectId: "programa-27166",
  storageBucket: "programa-27166.appspot.com",
  messagingSenderId: "672184644976",
  appId: "1:672184644976:web:f4eb4b9ab4e49cc4138bb5",
  measurementId: "G-5ZG0TRNC2E"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const lista = document.getElementById("listaCocina");

// Escuchar pedidos pendientes
function cargarPedidosPorPreparar() {
  db.ref("pedidos").on("value", snapshot => {
    lista.innerHTML = "";
    const pedidos = snapshot.val();

    if (!pedidos) {
      lista.innerHTML = "<p>No hay pedidos pendientes.</p>";
      return;
    }

    let hayPendientes = false;

    Object.entries(pedidos).forEach(([clienteKey, pedido]) => {
      const noPreparados = pedido.productos
        .map((prod, index) => ({ ...prod, index }))
        .filter(prod => !prod.preparado);

      if (noPreparados.length > 0) {
        hayPendientes = true;
        const cliente = decodeURIComponent(clienteKey);
        const div = document.createElement("div");
        div.innerHTML = `<h3>${cliente}</h3><ul>${
          noPreparados.map(prod => `
            <li>
              ${prod.cantidad} x ${prod.nombre}
              <button onclick="marcarPreparado('${clienteKey}', ${prod.index})">Listo</button>
            </li>`).join("")
        }</ul>`;
        lista.appendChild(div);
      }
    });

    if (!hayPendientes) {
      lista.innerHTML = "<p>No hay pedidos pendientes.</p>";
    }
  });
}

function marcarPreparado(clienteKey, index) {
  db.ref(`pedidos/${clienteKey}/productos/${index}/preparado`).set(true).catch(error => {
    alert("Error al marcar como preparado: " + error.message);
  });
}

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
          subtotal: p.precio * p.cantidad,
          editable: false,
          preparado: p.preparado || false
        }));

        mostrarPedidoTemp();
      }
    } else {
      pedido = [];
      mostrarPedidoTemp();
      inputCliente.disabled = false;
      inputCliente.value = "";
    }
  });
};

function agregarPedidoTemp() {
  const cliente = inputCliente.value.trim();
  const cantidad = parseInt(inputCantidad.value);
  const nombreProducto = selectProducto.options[selectProducto.selectedIndex]?.text;
  const precio = parseFloat(selectProducto.value);

  if (cliente === "" || isNaN(cantidad) || cantidad <= 0 || !nombreProducto) {
    alert("Por favor, ingrese un nombre válido, cantidad y seleccione un producto.");
    return;
  }

  const subtotal = precio * cantidad;
  const existeIndex = pedido.findIndex(p => p.producto === nombreProducto && p.editable === true);

  if (existeIndex >= 0) {
    pedido[existeIndex].cantidad += cantidad;
    pedido[existeIndex].subtotal += subtotal;
  } else {
    pedido.push({
      cliente,
      producto: nombreProducto,
      cantidad,
      subtotal,
      editable: true,
      preparado: false
    });
  }

  mostrarPedidoTemp();
}

function mostrarPedidoTemp() {
  divPedidoTemp.innerHTML = "<h4>Pedido Temporal:</h4>";
  let total = 0;

  pedido.forEach((item, index) => {
    divPedidoTemp.innerHTML += `
      <p>
        ${item.cantidad} x ${item.producto} = $${item.subtotal.toFixed(2)}
        ${item.editable ? `<button onclick="eliminarProducto(${index})">Eliminar</button>` : ` <span style="color:gray;">(Confirmado)</span>`}
      </p>`;
    total += item.subtotal;
  });

  divPedidoTemp.innerHTML += `<strong>Total: $${total.toFixed(2)}</strong>`;
}

function eliminarProducto(index) {
  if (!pedido[index].editable) {
    alert("Este producto ya fue confirmado y no se puede eliminar.");
    return;
  }

  if (confirm("¿Desea eliminar este producto del pedido?")) {
    pedido.splice(index, 1);
    mostrarPedidoTemp();
  }
}

function confirmarPedido() {
  if (pedido.length === 0) {
    alert("No hay productos en el pedido.");
    return;
  }

  const clienteActual = pedido[0].cliente;

  // Lista de productos que se marcan como preparados automáticamente (bebidas)
  const productosNoPreparar = new Set(["Refresco", "Jugo", "Agua", "Imperial"]);

  db.ref('pedidos/' + clienteActual).once('value').then(snapshot => {
    let productosPrevios = [];
    if (snapshot.exists()) {
      productosPrevios = snapshot.val().productos || [];
    }

    // Nuevo arreglo para manejar productos combinados según preparado
    const productosCombinados = [...productosPrevios];

    pedido.filter(item => item.editable).forEach(item => {
      const nombre = item.producto.split(" - ₡")[0];
      const precio = parseFloat(item.producto.split(" - ₡")[1]);

      const esNoPreparar = productosNoPreparar.has(nombre);

      // Buscar producto existente con el mismo nombre y mismo estado preparado
      const productoExistente = productosCombinados.find(p => p.nombre === nombre && p.preparado === esNoPreparar);

      if (productoExistente) {
        productoExistente.cantidad += item.cantidad;
      } else {
        productosCombinados.push({
          nombre,
          cantidad: item.cantidad,
          precio,
          preparado: esNoPreparar // true si es bebida, false si no
        });
      }
    });

    const subtotal = productosCombinados.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

    return db.ref('pedidos/' + clienteActual).set({
      cliente: clienteActual,
      productos: productosCombinados,
      subtotal,
      fechaPago: null
    });
  }).then(() => {
    alert("Pedido confirmado y guardado. Gracias!");
    pedido.length = 0;
    divPedidoTemp.innerHTML = "";
    inputCliente.value = "";
    inputCliente.disabled = false;
    inputCantidad.value = 1;
  }).catch(error => {
    alert("Error al guardar el pedido: " + error.message);
  });
}

// Productos disponibles
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
      option.textContent = `${producto.nombre} - ₡${producto.precio}`;
      productoSelect.appendChild(option);
    });
  }
}

cargarPedidosPorPreparar();
actualizarProductosPorTipo();
