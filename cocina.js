// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBMbS03YXelxtImddYi954A2CIT_IRlnUE",
  authDomain: "programa-27166.firebaseapp.com",
  databaseURL: "https://programa-27166-default-rtdb.firebaseio.com",
  projectId: "programa-27166",
  storageBucket: "programa-27166.appspot.com",
  messagingSenderId: "672184644976",
  appId: "1:672184644976:web:f4eb4b9ab4e49cc4138bb5",
  measurementId: "G-5ZG0TRNC2E"  // Opcional si usas Analytics
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics(); // Opcional si usas Analytics

const db = firebase.database();
const lista = document.getElementById("listaCocina");

let listenerPedidos = null; // Para guardar referencia y poder limpiar si quieres

// Cargar productos no preparados
function cargarPedidosPorPreparar() {
  // Si quieres evitar múltiples listeners, primero quitar el anterior
  if (listenerPedidos) {
    db.ref("pedidos").off("value", listenerPedidos);
  }

  listenerPedidos = db.ref("pedidos").on("value", snapshot => {
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
        .filter(prod => !prod.preparado); // Solo productos no preparados

      if (noPreparados.length > 0) {
        hayPendientes = true;

        // Decodificamos cliente para mostrarlo bonito (si fue codificado)
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

// Marcar producto como preparado con manejo de errores
function marcarPreparado(clienteKey, index) {
  const ref = db.ref(`pedidos/${clienteKey}/productos/${index}/preparado`);
  ref.set(true).catch(error => {
    alert("Error al marcar como preparado: " + error.message);
  });
}

// Inicializar
cargarPedidosPorPreparar();
