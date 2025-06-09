// Config Firebase (compat)
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

const btnCerrarDia = document.getElementById("btnCerrarDia");
const listaCierres = document.getElementById("listaCierres");
const modalBg = document.getElementById("modalDetalle");
const cerrarModalBtn = document.getElementById("cerrarModal");
const detalleTabla = document.getElementById("detalleTabla");
const modalFecha = document.getElementById("modalFecha");
const totalModal = document.getElementById("totalModal");
const fechaBuscar = document.getElementById("fechaBuscar");

let listenerActived = false;  // Para controlar el listener en tiempo real

// Cargar todos los cierres y mostrar con listener en tiempo real
function cargarCierres() {
  // Remover listener previo para evitar duplicados
  if (listenerActived) {
    db.ref('cierresDiarios').off('value');
  }

  listaCierres.innerHTML = "<p>Cargando cierres...</p>";

  db.ref('cierresDiarios').on('value', snapshot => {
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
  }, err => {
    listaCierres.innerHTML = "<p>Error cargando cierres.</p>";
    console.error(err);
  });

  listenerActived = true;
}

function mostrarListaCierresFiltrados(cierresFiltrados, fechaSeleccionada) {
  listaCierres.innerHTML = `<p>Cierres para la fecha: ${fechaSeleccionada}</p>`;

  cierresFiltrados.forEach((cierre, index) => {
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
}

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

cerrarModalBtn.addEventListener("click", () => {
  modalBg.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === modalBg) {
    modalBg.style.display = "none";
  }
});

btnCerrarDia.addEventListener("click", () => {
  db.ref('ventasDelDia').once('value')
    .then(snapshot => {
      const ventasDelDiaObj = snapshot.val();

      if (!ventasDelDiaObj || Object.keys(ventasDelDiaObj).length === 0) {
        alert("No hay ventas para cerrar el día.");
        return;
      }

      const ventasDelDia = Object.values(ventasDelDiaObj);

      return db.ref('cierresDiarios').once('value')
        .then(cierresSnap => {
          const cierresObj = cierresSnap.val() || {};

          const nuevoCierre = {
            fecha: new Date().toISOString(),
            ventas: ventasDelDia
          };

          return db.ref('cierresDiarios').push(nuevoCierre)
            .then(() => db.ref('ventasDelDia').remove())
            .then(() => {
              alert("Cierre del día realizado correctamente.");
              // No llamar cargarCierres() aquí porque ya hay listener real
            });
        });

    })
    .catch(err => {
      alert("Error al realizar cierre.");
      console.error(err);
    });
});

// Filtrar cierres por fecha
fechaBuscar.addEventListener("change", function () {
  const fechaSeleccionada = this.value; // YYYY-MM-DD

  // Si se limpia el filtro, volvemos a activar el listener en tiempo real
  if (!fechaSeleccionada) {
    cargarCierres();
    return;
  }

  // Desactivar listener en tiempo real para evitar conflicto
  if (listenerActived) {
    db.ref('cierresDiarios').off('value');
    listenerActived = false;
  }

  listaCierres.innerHTML = "<p>Cargando cierres filtrados...</p>";

  db.ref('cierresDiarios').once('value').then(snapshot => {
    const cierresObj = snapshot.val();
    if (!cierresObj) {
      listaCierres.innerHTML = `<p>No hay cierres almacenados.</p>`;
      return;
    }

    const cierresFiltrados = Object.values(cierresObj).filter(cierre => {
      const fechaCierre = new Date(cierre.fecha);

      const yyyy = fechaCierre.getFullYear();
      const mm = String(fechaCierre.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaCierre.getDate()).padStart(2, '0');

      const fechaFormateada = `${yyyy}-${mm}-${dd}`;

      return fechaFormateada === fechaSeleccionada;
    });

    if (cierresFiltrados.length > 0) {
      mostrarListaCierresFiltrados(cierresFiltrados, fechaSeleccionada);
    } else {
      listaCierres.innerHTML = `<p>No se encontró un cierre para la fecha ${fechaSeleccionada}.</p>`;
    }
  });
});

// Al iniciar página, cargar cierres con listener real
cargarCierres();
