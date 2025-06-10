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

// Cargar productos preparados pero no entregados
function cargarProductosPreparadosPendientes() {
  // Evitar múltiples listeners
  if (listenerPedidos) {
    db.ref("pedidos").off("value", listenerPedidos);
  }

  listenerPedidos = db.ref("pedidos").on("value", snapshot => {
    lista.innerHTML = "";
    const pedidos = snapshot.val();

    if (!pedidos) {
      lista.innerHTML = "<p>No hay productos preparados.</p>";
      return;
    }

    let hayParaEntregar = false;

    Object.entries(pedidos).forEach(([clienteKey, pedido]) => {
      const productosParaEntregar = pedido.productos
        .map((prod, index) => ({ ...prod, index }))
        .filter(prod => prod.preparado && !prod.entregado); // Preparado pero no entregado

      if (productosParaEntregar.length > 0) {
        hayParaEntregar = true;

        const cliente = decodeURIComponent(clienteKey);

        const div = document.createElement("div");
        div.innerHTML = `<h3>${cliente}</h3><ul>${
          productosParaEntregar.map(prod => `
            <li>
              ✅ ${prod.cantidad} x ${prod.nombre}
              <button onclick="marcarEntregado('${clienteKey}', ${prod.index})">Entregado</button>
            </li>`).join("")
        }</ul>`;
        lista.appendChild(div);
      }
    });

    if (!hayParaEntregar) {
      lista.innerHTML = "<p>No hay productos preparados pendientes de entrega.</p>";
    }
  });
}

// Marcar producto como entregado
function marcarEntregado(clienteKey, index) {
  const ref = db.ref(`pedidos/${clienteKey}/productos/${index}/entregado`);
  ref.set(true).catch(error => {
    alert("Error al marcar como entregado: " + error.message);
  });
}

// Inicializar
cargarProductosPreparadosPendientes();
