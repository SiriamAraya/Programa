const menus = {
  vendedor: [
    { href: 'agregar.html', text: 'Agregar Pedido' },
    { href: 'pedidos.html', text: 'Agregar al Pedido' }
  ],
  caja: [
    { href: 'pagos.html', text: 'Registrar Pago' },
    { href: 'cierre.html', text: 'Hacer Cierre' }
  ],
  cocina: [
    { href: 'cocina.html', text: 'Cocina' },
    { href: 'entregado.html', text: 'Listo Para Entregar' }
  ]
};

// Obtener usuario y rol requerido
const usuario = localStorage.getItem('usuario');
const body = document.querySelector('body');
const rolRequerido = body.getAttribute('data-role');

// Validar sesión
if (!usuario) {
  alert('Por favor inicia sesión primero');
  window.location.href = 'login.html';
}

// Validar rol de acceso a la página
if (rolRequerido && usuario !== rolRequerido) {
  document.body.innerHTML = `<h2 style="text-align:center; color:red;">Acceso denegado</h2>`;
  throw new Error('Acceso denegado'); // para detener ejecución
}

function mostrarMenu() {
  const menuContainer = document.getElementById('menu');

  const opciones = menus[usuario];
  if (!opciones) {
    menuContainer.innerHTML = '<p>No tienes permisos asignados.</p>';
    return;
  }

  opciones.forEach(item => {
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.text;
    link.classList.add('menu-link');
    menuContainer.appendChild(link);
  });

  // Agregar botón de cerrar sesión
  const logout = document.createElement('a');
  logout.href = '#';
  logout.textContent = 'Cerrar Sesión';
  logout.classList.add('menu-link');
  logout.addEventListener('click', () => {
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
  });
  menuContainer.appendChild(logout);
}

mostrarMenu();
