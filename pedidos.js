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

    db.ref("pedidos").once("value").then(snapshot => {
      const pedidos = snapshot.val();

      if (!pedidos) {
        tbody.innerHTML = '<tr><td colspan="4">No hay pedidos registrados.</td></tr>';
        return;
      }

      Object.keys(pedidos).forEach(cliente => {
        const pedido = pedidos[cliente];
        let productosHTML = "<ul>";
        let total = 0;

        pedido.productos.forEach(prod => {
          const subtotal = prod.cantidad * prod.precio;
          productosHTML += `<li>${prod.cantidad} x ${prod.nombre} = $${subtotal.toFixed(2)}</li>`;
          total += subtotal;
        });

        productosHTML += "</ul>";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${cliente}</td>
          <td>${productosHTML}</td>
          <td>$${total.toFixed(2)}</td>
          <td><button onclick="editarPedido('${cliente}')">Agregar al Pedido</button></td>
        `;
        tbody.appendChild(tr);
      });
    });

    function editarPedido(cliente) {
      // Redirigir con cliente en la URL
      window.location.href = `agregar.html?cliente=${encodeURIComponent(cliente)}`;
    }