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

const tbody = document.getElementById("listaPedidos");

let pedidos = [];
let clienteActual = null;
let totalActual = 0;

// Variables modal y campos
const modal = document.getElementById("modalPago");
const cerrarModalBtn = document.getElementById("cerrarModal");
const totalPagoInput = document.getElementById("totalPago");
const montoRecibidoInput = document.getElementById("montoRecibido");
const tipoPagoSelect = document.getElementById("tipoPago");
const resultadoPagoDiv = document.getElementById("resultadoPago");
const btnProcesarPago = document.getElementById("btnProcesarPago");

// Escuchar cambios en tiempo real en la rama 'pedidos'
db.ref('pedidos').on('value', (snapshot) => {
  pedidos = [];
  snapshot.forEach(childSnapshot => {
    const pedido = childSnapshot.val();
    pedido.id = childSnapshot.key;
    pedidos.push(pedido);
  });
  agruparYMostrarPedidos();
});

function agruparYMostrarPedidos() {
  tbody.innerHTML = ""; // Limpiar la tabla

  const pedidosPorCliente = pedidos.reduce((acc, item) => {
    if (!acc[item.cliente]) acc[item.cliente] = [];
    acc[item.cliente].push(item);
    return acc;
  }, {});

  if (Object.keys(pedidosPorCliente).length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No hay pedidos registrados.</td></tr>';
    return;
  }

  for (const cliente in pedidosPorCliente) {
    const items = pedidosPorCliente[cliente];
    let productosHTML = "<ul>";
    let total = 0;

    items.forEach(i => {
      i.productos.forEach(prod => {
        const subtotal = prod.cantidad * prod.precio;
        productosHTML += `<li>${prod.cantidad} x ${prod.nombre} = ₡${subtotal.toFixed(2)}</li>`;
        total += subtotal;
      });
    });

    productosHTML += "</ul>";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cliente}</td>
      <td>${productosHTML}</td>
      <td>₡${total.toFixed(2)}</td>
      <td><button class="btnPagar" data-cliente="${cliente}" data-total="${total}">Pagar</button></td>
    `;
    tbody.appendChild(tr);
  }
}

// Manejador para botones "Pagar"
tbody.addEventListener("click", (e) => {
  if (e.target.classList.contains("btnPagar")) {
    const cliente = e.target.getAttribute("data-cliente");
    const total = parseFloat(e.target.getAttribute("data-total"));
    abrirModalPago(total, cliente);
  }
});

function abrirModalPago(total, cliente) {
  clienteActual = cliente;
  totalActual = total;
  totalPagoInput.value = total.toFixed(2);
  montoRecibidoInput.value = "";
  resultadoPagoDiv.innerHTML = "";
  tipoPagoSelect.value = "Efectivo";
  montoRecibidoInput.disabled = false;
  modal.style.display = "block";
}

cerrarModalBtn.onclick = () => {
  modal.style.display = "none";
};

window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

tipoPagoSelect.addEventListener("change", () => {
  if (tipoPagoSelect.value === "Tarjeta") {
    montoRecibidoInput.value = "";
    montoRecibidoInput.disabled = true;
  } else {
    montoRecibidoInput.disabled = false;
  }
  resultadoPagoDiv.innerHTML = "";
});

btnProcesarPago.addEventListener("click", () => {
  const tipo = tipoPagoSelect.value;

  if (tipo === "Efectivo") {
    const recibido = parseFloat(montoRecibidoInput.value);
    if (isNaN(recibido) || recibido < totalActual) {
      resultadoPagoDiv.innerHTML = "<p style='color:red'>Monto insuficiente para pago en efectivo.</p>";
      return;
    }
    const vuelto = recibido - totalActual;
    resultadoPagoDiv.innerHTML = `
      <p>Pago registrado con ${tipo}.</p>
      <p>Vuelto: ₡${vuelto.toFixed(2)}</p>
    `;
  } else {
    resultadoPagoDiv.innerHTML = `<p>Pago registrado con Tarjeta.</p>`;
  }

  // Filtrar los pedidos pagados del cliente actual
  const pedidosPagados = pedidos.filter(p => p.cliente === clienteActual);

  // Agregar el tipoPago a cada pedido antes de guardar
  const pedidosConTipoPago = pedidosPagados.map(pedido => ({
    ...pedido,
    tipoPago: tipo
  }));

  // Guardar ventas pagadas en Firebase (append)
  let ventasDelDiaRef = db.ref('ventasDelDia');
  ventasDelDiaRef.once('value').then(snapshot => {
    let ventasDelDia = snapshot.val() || [];
    ventasDelDia = ventasDelDia.concat(pedidosConTipoPago);
    return ventasDelDiaRef.set(ventasDelDia);
  }).then(() => {
    // Eliminar pedidos pagados de Firebase para que no aparezcan más
    return eliminarPedidosCliente(clienteActual);
  }).catch(error => {
    console.error("Error guardando la venta o eliminando pedidos:", error);
  });

  setTimeout(() => {
    modal.style.display = "none";
  }, 10000);
});

function eliminarPedidosCliente(cliente) {
  const updates = {};
  pedidos.forEach(p => {
    if (p.cliente === cliente) {
      updates['/pedidos/' + p.id] = null;
    }
  });
  return db.ref().update(updates);
}
