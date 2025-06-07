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

const btnCerrarDia = document.getElementById("btnCerrarDia");
const listaCierres = document.getElementById("listaCierres");
const modalBg = document.getElementById("modalDetalle");
const cerrarModalBtn = document.getElementById("cerrarModal");
const detalleTabla = document.getElementById("detalleTabla");
const modalFecha = document.getElementById("modalFecha");
const totalModal = document.getElementById("totalModal");

// Cargar cierres almacenados desde Firebase
function cargarCierres() {
  listaCierres.innerHTML = "<p>Cargando cierres...</p>";

  firebase.database().ref('cierresDiarios').once('value')
    .then(snapshot => {
      const cierresObj = snapshot.val();
      listaCierres.innerHTML = "";

      if (!cierresObj) {
        listaCierres.innerHTML = "<p>No hay cierres anteriores.</p>";
        return;
      }

      const cierres = Object.values(cierresObj).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      cierres.forEach((cierre, index) => {
        const div = document.createElement("div");
        div.classList.add("cierre-item");

        const fechaStr = new Date(cierre.fecha).toLocaleString();

        div.innerHTML = `
          <span>${fechaStr}</span>
          <button data-index="${index}">Ver detalle</button>
        `;

        div.querySelector("button").addEventListener("click", () => {
          mostrarDetalle(cierre);
        });

        listaCierres.appendChild(div);
      });
    })
    .catch(err => {
      listaCierres.innerHTML = "<p>Error cargando cierres.</p>";
      console.error(err);
    });
}

// Mostrar modal con detalle de un cierre
function mostrarDetalle(cierre) {
  modalFecha.textContent = `Detalle del cierre - ${new Date(cierre.fecha).toLocaleString()}`;

  detalleTabla.innerHTML = "";
  let total = 0;

  cierre.ventas.forEach(venta => {
    venta.productos.forEach(producto => {
      const subtotalProd = producto.cantidad * producto.precio;
      total += subtotalProd;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${venta.cliente}</td>
        <td>${producto.nombre}</td>
        <td>${producto.cantidad}</td>
        <td>₡${producto.precio.toFixed(2)}</td>
        <td>₡${subtotalProd.toFixed(2)}</td>
      `;
      detalleTabla.appendChild(tr);
    });
  });

  totalModal.textContent = `₡${total.toFixed(2)}`;

  modalBg.style.display = "flex";
}

// Cerrar modal al hacer click en botón cerrar
cerrarModalBtn.addEventListener("click", () => {
  modalBg.style.display = "none";
});

// Cerrar modal al hacer click fuera del contenido modal
window.addEventListener("click", (event) => {
  if (event.target === modalBg) {
    modalBg.style.display = "none";
  }
});

// Función para hacer cierre, guardando en Firebase
btnCerrarDia.addEventListener("click", () => {
  firebase.database().ref('ventasDelDia').once('value')
    .then(snapshot => {
      const ventasDelDiaObj = snapshot.val();

      if (!ventasDelDiaObj || Object.keys(ventasDelDiaObj).length === 0) {
        alert("No hay ventas para cerrar el día.");
        return;
      }

      // Convertir objeto ventasDelDia a arreglo
      const ventasDelDia = Object.values(ventasDelDiaObj);

      return firebase.database().ref('cierresDiarios').once('value')
        .then(cierresSnap => {
          const cierresObj = cierresSnap.val() || {};
          const cierres = Object.values(cierresObj);

          const nuevoCierre = {
            fecha: new Date().toISOString(),
            ventas: ventasDelDia
          };

          // Guardar nuevo cierre con push()
          return firebase.database().ref('cierresDiarios').push(nuevoCierre)
            .then(() => {
              // Limpiar ventasDelDia
              return firebase.database().ref('ventasDelDia').remove();
            })
            .then(() => {
              alert("Cierre del día realizado correctamente.");
              cargarCierres();
            });
        });

    })
    .catch(err => {
      alert("Error al realizar cierre.");
      console.error(err);
    });
});

// Al cargar la página
cargarCierres();