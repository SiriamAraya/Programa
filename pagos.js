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

firebase.initializeApp(firebaseConfig);
firebase.analytics();
const db = firebase.database();

const tbody = document.getElementById("listaPedidos");

let pedidos = [];
let clienteActual = null;

// Modal
const modal = document.getElementById("modalPago");
const modalBg = document.getElementById("modalBg"); // el fondo del modal
const cerrarModalBtn = document.getElementById("cerrarModal");
const totalPagoInput = document.getElementById("totalPago");
const montoRecibidoInput = document.getElementById("montoRecibido");
const tipoPagoSelect = document.getElementById("tipoPago");
const resultadoPagoDiv = document.getElementById("resultadoPago");
const btnProcesarPago = document.getElementById("btnProcesarPago");

// Escucha cambios en pedidos
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
  tbody.innerHTML = "";

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
    let totalCompleto = 0;

    items.forEach((pedido) => {
      pedido.productos.forEach((prod) => {
        const subtotal = prod.precio * prod.cantidad;
        totalCompleto += subtotal;
        productosHTML += `
          <li>
            <label>
              <input type="checkbox" class="producto-check" 
                data-cliente="${cliente}" 
                data-pedido="${pedido.id}" 
                data-precio="${prod.precio}" 
                data-cantidad="${prod.cantidad}">
              ${prod.cantidad} x ${prod.nombre} = ₡${subtotal.toFixed(2)}
            </label>
          </li>`;
      });
    });

    productosHTML += "</ul>";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <label>
          <input type="checkbox" class="pagar-todo-check" data-cliente="${cliente}"> ${cliente}
        </label>
      </td>
      <td>${productosHTML}</td>
      <td id="total-${cliente}">₡${totalCompleto.toFixed(2)}</td>
      <td><button class="btnPagar" data-cliente="${cliente}" disabled>Pagar</button></td>
    `;
    tbody.appendChild(tr);
  }

  // Eventos para checkboxes
  document.querySelectorAll(".pagar-todo-check").forEach(chk => {
    chk.addEventListener("change", () => {
      const cliente = chk.dataset.cliente;
      const checks = document.querySelectorAll(`.producto-check[data-cliente="${cliente}"]`);
      checks.forEach(c => c.checked = chk.checked);
      actualizarTotalCliente(cliente);
    });
  });

  document.querySelectorAll(".producto-check").forEach(chk => {
    chk.addEventListener("change", () => {
      const cliente = chk.dataset.cliente;
      const todos = document.querySelectorAll(`.producto-check[data-cliente="${cliente}"]`);
      const seleccionados = document.querySelectorAll(`.producto-check[data-cliente="${cliente}"]:checked`);
      const pagarTodo = document.querySelector(`.pagar-todo-check[data-cliente="${cliente}"]`);
      pagarTodo.checked = seleccionados.length === todos.length;
      actualizarTotalCliente(cliente);
    });
  });
}

function actualizarTotalCliente(cliente) {
  const checksTodos = document.querySelectorAll(`.producto-check[data-cliente="${cliente}"]`);
  const seleccionados = document.querySelectorAll(`.producto-check[data-cliente="${cliente}"]:checked`);
  let total = 0;

  if (seleccionados.length === 0) {
    // Si no hay seleccionado, mostrar total completo
    checksTodos.forEach(chk => {
      const precio = parseFloat(chk.dataset.precio);
      const cantidad = parseFloat(chk.dataset.cantidad);
      total += precio * cantidad;
    });
  } else {
    // Sumar solo los seleccionados
    seleccionados.forEach(chk => {
      const precio = parseFloat(chk.dataset.precio);
      const cantidad = parseFloat(chk.dataset.cantidad);
      total += precio * cantidad;
    });
  }

  const totalEl = document.getElementById(`total-${cliente}`);
  if (totalEl) totalEl.textContent = `₡${total.toFixed(2)}`;

  // Habilitar o deshabilitar botón pagar según selección
  const btnPagar = document.querySelector(`.btnPagar[data-cliente="${cliente}"]`);
  if (btnPagar) btnPagar.disabled = seleccionados.length === 0;
}

// Botón pagar
tbody.addEventListener("click", (e) => {
  if (e.target.classList.contains("btnPagar")) {
    clienteActual = e.target.getAttribute("data-cliente");
    abrirModalPago(clienteActual);
  }
});

function abrirModalPago(cliente) {
  const seleccionados = document.querySelectorAll(`.producto-check[data-cliente="${cliente}"]:checked`);
  let total = 0;
  seleccionados.forEach(chk => {
    const precio = parseFloat(chk.dataset.precio);
    const cantidad = parseFloat(chk.dataset.cantidad);
    total += precio * cantidad;
  });

  totalPagoInput.value = total.toFixed(2);
  montoRecibidoInput.value = "";
  resultadoPagoDiv.innerHTML = "";
  tipoPagoSelect.value = "Efectivo";
  montoRecibidoInput.disabled = false;

  modalBg.style.display = "flex";  // Mostrar fondo
  modal.style.display = "block";   // Mostrar modal
}

function cerrarModal() {
  modalBg.style.display = "none";
  modal.style.display = "none";

  // Limpia inputs y mensajes para la próxima vez
  totalPagoInput.value = "";
  montoRecibidoInput.value = "";
  resultadoPagoDiv.innerHTML = "";
  tipoPagoSelect.value = "Efectivo";
  montoRecibidoInput.disabled = false;
}

cerrarModalBtn.onclick = cerrarModal;

window.onclick = (event) => {
  if (event.target === modalBg) {
    cerrarModal();
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
  const total = parseFloat(totalPagoInput.value);

  if (tipo === "Efectivo") {
    const recibido = parseFloat(montoRecibidoInput.value);
    if (isNaN(recibido) || recibido < total) {
      resultadoPagoDiv.innerHTML = "<p style='color:red'>Monto insuficiente para pago en efectivo.</p>";
      return;
    }
    const vuelto = recibido - total;
    resultadoPagoDiv.innerHTML = `
      <p>Pago registrado con ${tipo}.</p>
      <p>Vuelto: ₡${vuelto.toFixed(2)}</p>
    `;
  } else {
    resultadoPagoDiv.innerHTML = `<p>Pago registrado con Tarjeta.</p>`;
  }

  // Obtener productos seleccionados
  const seleccionados = document.querySelectorAll(`.producto-check[data-cliente="${clienteActual}"]:checked`);
  const productosSeleccionadosPorPedido = {};

  seleccionados.forEach(chk => {
    const pedidoId = chk.dataset.pedido;
    const pedido = pedidos.find(p => p.id === pedidoId);
    const prod = pedido.productos.find(prod => 
      prod.precio == chk.dataset.precio && prod.cantidad == chk.dataset.cantidad
    );
    if (!productosSeleccionadosPorPedido[pedidoId]) {
      productosSeleccionadosPorPedido[pedidoId] = [];
    }
    productosSeleccionadosPorPedido[pedidoId].push(prod);
  });

  // Registrar ventas y eliminar productos
  const ventas = Object.entries(productosSeleccionadosPorPedido).map(([pedidoId, productos]) => ({
    cliente: clienteActual,
    productos,
    tipoPago: tipo,
    timestamp: new Date().toISOString()
  }));

  const ventasRef = db.ref('ventasDelDia');
  ventasRef.once('value').then(snapshot => {
    const actuales = snapshot.val() || [];
    return ventasRef.set(actuales.concat(ventas));
  }).then(() => {
    const updates = {};
    for (const pedidoId in productosSeleccionadosPorPedido) {
      const pedido = pedidos.find(p => p.id === pedidoId);
      const nuevosProductos = pedido.productos.filter(p =>
        !productosSeleccionadosPorPedido[pedidoId].some(sel =>
          sel.nombre === p.nombre &&
          sel.precio === p.precio &&
          sel.cantidad === p.cantidad
        )
      );
      updates[`/pedidos/${pedidoId}`] = nuevosProductos.length === 0 ? null : { ...pedido, productos: nuevosProductos };
    }
    return db.ref().update(updates);
  }).catch(err => {
    console.error("Error procesando pago:", err);
  });

  // Cierra modal inmediatamente tras pago (o podrías hacerlo tras mostrar mensaje un tiempo)
  cerrarModal();
});
