// Firebase Configuración
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

const inputSemana = document.getElementById("inputSemana");
const inputMes = document.getElementById("inputMes");
const totalSemana = document.getElementById("totalSemana");
const totalMes = document.getElementById("totalMes");

let listenerActived = false;

// Al iniciar, mostrar mensaje para que el usuario seleccione fecha
listaCierres.innerHTML = "<p>Seleccione una fecha para ver cierres.</p>";

// Mostrar modal con detalle, con tipo de pago incluido (modificar fecha igual)
function mostrarDetalle(cierre) {
  const fechaFormateada = new Date(cierre.fecha + "T00:00:00").toLocaleDateString('es-CR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  modalFecha.textContent = `Detalle del cierre - ${fechaFormateada}`;
  detalleTabla.innerHTML = "";

  let totalGeneral = 0;
  let totalEfectivo = 0;
  let totalTarjeta = 0;

  cierre.ventas.forEach(venta => {
    const tipo = (venta.tipoPago || 'Desconocido').toLowerCase();

    venta.productos.forEach(producto => {
      const subtotal = producto.cantidad * producto.precio;
      totalGeneral += subtotal;

      if (tipo.includes("efectivo")) {
        totalEfectivo += subtotal;
      } else if (tipo.includes("tarjeta")) {
        totalTarjeta += subtotal;
      }

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${venta.cliente}</td>
        <td>${producto.nombre}</td>
        <td>${producto.cantidad}</td>
        <td>₡${producto.precio.toFixed(2)}</td>
        <td>₡${subtotal.toFixed(2)}</td>
        <td>${venta.tipoPago || 'N/A'}</td>
      `;
      detalleTabla.appendChild(fila);
    });
  });

  // Mostrar resumen debajo de la tabla
totalModal.innerHTML = `
  <div style="
    width: 100%;
    min-width: 225px;
  ">
    <table style="
      width: 100%;
      border-collapse: collapse;
      font-size: 1em;
      table-layout: fixed;
    ">
      <tr>
        <td style="
          text-align: right;
          padding: 10px;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        ">
          <strong>Total:</strong> ₡${totalGeneral.toFixed(2)}
        </td>
      </tr>
      <tr>
        <td style="
          text-align: right;
          padding: 10px;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        ">
          <strong>Total en efectivo:</strong> ₡${totalEfectivo.toFixed(2)}
        </td>
      </tr>
      <tr>
        <td style="
          text-align: right;
          padding: 10px;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        ">
          <strong>Total con tarjeta:</strong> ₡${totalTarjeta.toFixed(2)}
        </td>
      </tr>
    </table>
  </div>
`;




  modalBg.style.display = "flex";
}


// Ocultar modal
cerrarModalBtn.addEventListener("click", () => modalBg.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === modalBg) modalBg.style.display = "none";
});

// Esta función queda para uso interno si quieres cargar todo (no se llama al inicio)
function cargarCierres() {
  if (listenerActived) db.ref('cierresDiarios').off('value');
  listenerActived = true;

  listaCierres.innerHTML = "<p>Cargando cierres...</p>";

  db.ref('cierresDiarios').on('value', snapshot => {
    const cierres = snapshot.val();
    listaCierres.innerHTML = "";

    if (!cierres) {
      listaCierres.innerHTML = "<p>No hay cierres.</p>";
      return;
    }

    const arr = Object.values(cierres).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    arr.forEach(cierre => {
      const div = document.createElement("div");
      div.classList.add("cierre-item");
      div.innerHTML = `
        <span>${new Date(cierre.fecha).toLocaleString()}</span>
        <button>Ver detalle</button>
      `;
      div.querySelector("button").addEventListener("click", () => mostrarDetalle(cierre));
      listaCierres.appendChild(div);
    });
  });
}

// Filtrar cierres por fecha al cambiar fechaBuscar
// Filtrar cierres por fecha al cambiar fechaBuscar
fechaBuscar.addEventListener("change", function () {
  const fecha = this.value; // fecha en formato "YYYY-MM-DD"
  if (!fecha) {
    listaCierres.innerHTML = "<p>Seleccione una fecha para ver cierres.</p>";
    return;
  }

  db.ref('cierresDiarios').once('value').then(snapshot => {
    const cierres = snapshot.val();
    listaCierres.innerHTML = "";

    if (!cierres) {
      listaCierres.innerHTML = "<p>No hay cierres.</p>";
      return;
    }

    // Filtrar por comparación directa de strings, ya que fecha se guarda como "YYYY-MM-DD"
    const filtrados = Object.values(cierres).filter(c => c.fecha === fecha);

    if (filtrados.length === 0) {
      listaCierres.innerHTML = "<p>No hay cierres en esa fecha.</p>";
      return;
    }

    filtrados.forEach(cierre => {
      const div = document.createElement("div");
      div.classList.add("cierre-item");

      // Mostrar fecha legible sin zona horaria, solo fecha
      const fechaFormateada = new Date(cierre.fecha + "T00:00:00").toLocaleDateString('es-CR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      div.innerHTML = `
        <span>${fechaFormateada}</span>
        <button>Ver detalle</button>
      `;
      div.querySelector("button").addEventListener("click", () => mostrarDetalle(cierre));
      listaCierres.appendChild(div);
    });
  });
});

// Hacer cierre
btnCerrarDia.addEventListener("click", () => {
  db.ref('ventasDelDia').once('value')
    .then(snapshot => {
      const ventas = snapshot.val();
      if (!ventas) return alert("No hay ventas para cerrar.");

      const fechaLocal = new Date().toLocaleDateString('sv-SE'); // ← CORREGIDO

      const nuevoCierre = {
        fecha: fechaLocal,
        ventas: Object.values(ventas)
      };

      return db.ref('cierresDiarios').push(nuevoCierre)
        .then(() => db.ref('ventasDelDia').remove())
        .then(() => alert("Cierre del día realizado correctamente."));
    })
    .catch(console.error);
});

// Calcular resumen semanal
inputSemana.addEventListener("change", () => {
  const [year, week] = inputSemana.value.split("-W");
  if (!year || !week) return;

  db.ref("cierresDiarios").once("value").then(snapshot => {
    const cierres = Object.values(snapshot.val() || {});
    let total = 0;

    cierres.forEach(cierre => {
      const fecha = new Date(cierre.fecha);
      const fechaSem = getISOWeek(fecha);
      if (fechaSem.year == year && fechaSem.week == parseInt(week)) {
        cierre.ventas.forEach(v => v.productos.forEach(p => {
          total += p.cantidad * p.precio;
        }));
      }
    });

    totalSemana.textContent = `₡${total.toFixed(2)}`;
  });
});

// Calcular resumen mensual
inputMes.addEventListener("change", () => {
  const [anio, mes] = inputMes.value.split("-");
  if (!anio || !mes) return;

  db.ref("cierresDiarios").once("value").then(snapshot => {
    const cierres = Object.values(snapshot.val() || {});
    let total = 0;

    cierres.forEach(cierre => {
      const fecha = new Date(cierre.fecha);
      if (fecha.getFullYear() == anio && (fecha.getMonth() + 1) == parseInt(mes)) {
        cierre.ventas.forEach(v => v.productos.forEach(p => {
          total += p.cantidad * p.precio;
        }));
      }
    });

    totalMes.textContent = `₡${total.toFixed(2)}`;
  });
});

// Utilidad para semana ISO
function getISOWeek(date) {
  const f = new Date(date.getTime());
  f.setHours(0, 0, 0, 0);
  f.setDate(f.getDate() + 3 - (f.getDay() + 6) % 7);
  const week1 = new Date(f.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((f - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return { year: f.getFullYear(), week: weekNumber };
}

// NO LLAMAMOS cargarCierres() al inicio para evitar mostrar cierres sin filtro
