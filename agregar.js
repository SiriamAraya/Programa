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
  const productosNoPreparar = new Set([
  // bebidas - gaseosas
  "Coca Cola",
  "Fanta Uva",
  "Fanta Naranja",

  // bebidas - naturales
  "Te Frio",
  "Tropical de Melocoton",
  "Tropical de Frutas",

  // bebidas - cervezas
  "Imperial",
  "Bavaria",
  "Corona",

  // bebidas - preparadas
  "Sangria",
  "Mamaditas",

  // tragos - whisky
  "Old Parr 18",
  "Old Parr 12",
  "Johnnie Blue",
  "Double Black",
  "John Black",
  "Chivas 18",
  "Chivas 12",
  "Buchanan's",
  "Jack Daniels",
  "Jack Miel",
  "Jameson",
  "Black and White",
  "J&B",
  "Johnnie Rojo",

  // tragos - ron
  "Flor de Caña 18",
  "Flor de Caña 12 años",
  "Flor de Caña 7 y 4 años",
  "Flor de Caña Coco",
  "Centenario 12",
  "Centenario 7 años",
  "Zacapa 23",
  "Cacique",

  // tragos - tequila
  "Don Julio 70",
  "Don Julio Añejo",
  "Tequila Blanco",
  "Tequila Reposado",
  "Tequila Añejo",
  "Jose Cuervo",
  "Gran Malo",

  // tragos - vodka
  "Smirnoff",

  // tragos - licores
  "Tequila Rose",
  "Malibu",
  "Frangelico",
  "Jagger",
  "Fireball",
  "Baileys",
  "Hpnotiq",
  "Valdespino",
  "Anis",
  "Campari",

  // tragos - otros
  "Aguardiente"
]);


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
// Productos disponibles
const productosPorTipo = {
  bocaClasica: [
    { nombre: "Palitos de Queso", precio: 2500 },
    { nombre: "Papas Fritas", precio: 2500 },
    { nombre: "Chicharrones", precio: 2500 },
    { nombre: "Alitas", precio: 2500 },
    { nombre: "Alitas con Papas", precio: 3500 },
    { nombre: "Salchipapas", precio: 3000 }
  ],
  bocaTipica: [
    { nombre: "Frijoles a las Trancas", precio: 2500 },
    { nombre: "Higado Encebollado", precio: 2500 },
    { nombre: "Bistec Ensebollado", precio: 2500 },
    { nombre: "Ceviche", precio: 2500 },
    { nombre: "Chifrijo", precio: 3500 }
  ],
  bebidas: {
  gaseosas: [
    { nombre: "Coca Cola", precio: 30 },
    { nombre: "Fanta Uva", precio: 35 },
    { nombre: "Fanta Naranja", precio: 2 }
  ],
  naturales: [
    { nombre: "Te Frio", precio: 1500 },
    { nombre: "Tropical de Melocoton", precio: 35 },
    { nombre: "Tropical de Frutas", precio: 2 }
  ],
  cervezas: [
    { nombre: "Imperial", precio: 30 },
    { nombre: "Bavaria", precio: 35 },
    { nombre: "Corona", precio: 2 }
  ],
  preparadas: [
    { nombre: "Sangria", precio: 2500 },
    { nombre: "Mamaditas", precio: 1000 }
  ]
},
  tragos: {
    whisky: [
      { nombre: "Old Parr 18", precio: 4500 },
      { nombre: "Old Parr 12", precio: 2500 },
      { nombre: "Johnnie Blue", precio: 13500 },
      { nombre: "Double Black", precio: 3500 },
      { nombre: "John Black", precio: 2500 },
      { nombre: "Chivas 18", precio: 4000 },
      { nombre: "Chivas 12", precio: 2500 },
      { nombre: "Buchanan's", precio: 3500 },
      { nombre: "Jack Daniels", precio: 2500 },
      { nombre: "Jack Miel", precio: 2500 },
      { nombre: "Jameson", precio: 1800 },
      { nombre: "Black and White", precio: 2000 },
      { nombre: "J&B", precio: 2000 },
      { nombre: "Johnnie Rojo", precio: 1500 }
    ],
    ron: [
      { nombre: "Flor de Caña 18", precio: 3500 },
      { nombre: "Flor de Caña 12 años", precio: 2500 },
      { nombre: "Flor de Caña 7 y 4 años", precio: 2000 },
      { nombre: "Flor de Caña Coco", precio: 2000 },
      { nombre: "Centenario 12", precio: 2500 },
      { nombre: "Centenario 7 años", precio: 2000 },
      { nombre: "Zacapa 23", precio: 4500 },
      { nombre: "Cacique", precio: 1500 }
    ],
    tequila: [
      { nombre: "Don Julio 70", precio: 6500 },
      { nombre: "Don Julio Añejo", precio: 4500 },
      { nombre: "Tequila Blanco", precio: 3000 },
      { nombre: "Tequila Reposado", precio: 2500 },
      { nombre: "Tequila Añejo", precio: 2000 },
      { nombre: "Jose Cuervo", precio: 1500 },
      { nombre: "Gran Malo", precio: 2000 }
    ],
    vodka: [
      { nombre: "Smirnoff", precio: 2000 }
    ],
    licores: [
      { nombre: "Tequila Rose", precio: 2000 },
      { nombre: "Malibu", precio: 2000 },
      { nombre: "Frangelico", precio: 2000 },
      { nombre: "Jagger", precio: 1500 },
      { nombre: "Fireball", precio: 2000 },
      { nombre: "Baileys", precio: 2000 },
      { nombre: "Hpnotiq", precio: 2500 },
      { nombre: "Valdespino", precio: 2000 },
      { nombre: "Anis", precio: 1500 },
      { nombre: "Campari", precio: 1500 }
    ],
    otros: [
      { nombre: "Aguardiente", precio: 1500 }
    ]
  }
};

function actualizarProductosPorTipo() {
  const tipo = document.getElementById("tipo").value;
  const subtipoSelect = document.getElementById("subtipo");
  const filaSubtipo = document.getElementById("fila-subtipo");
  const productoSelect = document.getElementById("producto");

  productoSelect.innerHTML = "";
  subtipoSelect.innerHTML = "";
  filaSubtipo.style.display = "none";

  if (tipo === "tragos" || tipo === "bebidas") {
    filaSubtipo.style.display = "flex";
    const subtipos = Object.keys(productosPorTipo[tipo]);
    subtipos.forEach(subtipo => {
      const option = document.createElement("option");
      option.value = subtipo;
      option.textContent = subtipo.charAt(0).toUpperCase() + subtipo.slice(1);
      subtipoSelect.appendChild(option);
    });
    actualizarProductosPorSubtipo();
  } else if (productosPorTipo[tipo]) {
    productosPorTipo[tipo].forEach(producto => {
      const option = document.createElement("option");
      option.value = producto.precio;
      option.textContent = `${producto.nombre} - ₡${producto.precio}`;
      productoSelect.appendChild(option);
    });
  }
}

function actualizarProductosPorSubtipo() {
  const tipo = document.getElementById("tipo").value;
  const subtipo = document.getElementById("subtipo").value;
  const productoSelect = document.getElementById("producto");
  productoSelect.innerHTML = "";

  if (productosPorTipo[tipo] && productosPorTipo[tipo][subtipo]) {
    productosPorTipo[tipo][subtipo].forEach(producto => {
      const option = document.createElement("option");
      option.value = producto.precio;
      option.textContent = `${producto.nombre} - ₡${producto.precio}`;
      productoSelect.appendChild(option);
    });
  }
}


cargarPedidosPorPreparar();
actualizarProductosPorTipo();
