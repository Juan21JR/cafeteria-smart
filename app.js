


import {
  db,
  auth,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc
} from "./firebase.js";


const productos = [
  { id: 1, nombre: "Hamburguesa clásica", categoria: "Hamburguesas", precio: 50, emoji: "🍔", descripcion: "Hamburguesa para disfrutar en el descanso." },
  { id: 2, nombre: "Hamburguesa especial", categoria: "Hamburguesas", precio: 65, emoji: "🍔", descripcion: "Una opción más completa para tu hambre." },
  { id: 3, nombre: "Tacos dorados", categoria: "Tacos", precio: 35, emoji: "🌮", descripcion: "Crujientes y deliciosos." },
  { id: 4, nombre: "Tacos de bistec", categoria: "Tacos", precio: 45, emoji: "🌮", descripcion: "Tacos para disfrutar al máximo." },
  { id: 5, nombre: "Torta de jamón y queso", categoria: "Tortas", precio: 40, emoji: "🥪", descripcion: "Una combinación clásica." },
  { id: 6, nombre: "Torta de milanesa", categoria: "Tortas", precio: 45, emoji: "🥖", descripcion: "Una torta para un antojo grande." },
  { id: 7, nombre: "Licuado de plátano", categoria: "Bebidas", precio: 30, emoji: "🥤", descripcion: "Una bebida cremosa y refrescante." },
  { id: 8, nombre: "Agua fresca", categoria: "Bebidas", precio: 15, emoji: "🧃", descripcion: "Ideal para acompañar tu comida." },
  { id: 9, nombre: "Hot cakes con fruta", categoria: "Postres", precio: 35, emoji: "🥞", descripcion: "Un antojo dulce." },
  { id: 10, nombre: "Waffles con fruta", categoria: "Postres", precio: 40, emoji: "🧇", descripcion: "Waffles para darte un gusto." }
];
 
let carrito = [];
let categoriaActual = "Todos";
let clienteId = localStorage.getItem("cafeteriaClienteId");
let lector = null;




const $ = id => document.getElementById(id);
const dinero = cantidad => cantidad.toLocaleString("es-MX", {
  style: "currency",
  currency: "MXN"
});

function escapar(texto = "") {
  return String(texto).replace(/[&<>"']/g, letra => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  })[letra]);
}

function mostrarProductos() {
  const lista = productos.filter(p =>
    categoriaActual === "Todos" || p.categoria === categoriaActual
  );

  $("productos").innerHTML = lista.map(p => `
    <article class="producto">
      <div class="producto-foto" role="img" aria-label="${escapar(p.nombre)}">${p.emoji}</div>
      <div class="producto-contenido">
        <span class="etiqueta">${escapar(p.categoria)}</span>
        <h3>${escapar(p.nombre)}</h3>
        <p>${escapar(p.descripcion)}</p>
        <div class="producto-pie">
          <span class="precio">${dinero(p.precio)}</span>
          <button class="agregar" data-agregar="${p.id}">+ Agregar</button>
        </div>
      </div>
    </article>
  `).join("");
}

function dibujarCarrito() {
  const cantidad = carrito.reduce((suma, item) => suma + item.cantidad, 0);
  const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

  $("contador").textContent = cantidad;
  $("total").textContent = dinero(total);

  if (!carrito.length) {
    $("carrito").innerHTML = '<p class="vacio">Todavía no agregas productos.</p>';
    return;
  }

  $("carrito").innerHTML = carrito.map(item => `
    <div class="linea-carrito">
      <div>
        <b>${escapar(item.nombre)}</b>
        <small>${dinero(item.precio)} cada uno</small>
        <button class="quitar" data-quitar="${item.id}">Eliminar</button>
      </div>
      <div class="cantidad">
        <button data-restar="${item.id}" aria-label="Restar uno">−</button>
        <span>${item.cantidad}</span>
        <button data-sumar="${item.id}" aria-label="Sumar uno">+</button>
      </div>
    </div>
  `).join("");
}

$("productos").addEventListener("click", event => {
  const boton = event.target.closest("[data-agregar]");
  if (!boton) return;

  const producto = productos.find(p => p.id === Number(boton.dataset.agregar));
  const existente = carrito.find(item => item.id === producto.id);

  if (existente) existente.cantidad++;
  else carrito.push({ ...producto, cantidad: 1 });

  dibujarCarrito();
});

$("carrito").addEventListener("click", event => {
  const boton = event.target.closest("button");
  if (!boton) return;

  const id = Number(
    boton.dataset.quitar || boton.dataset.restar || boton.dataset.sumar
  );
  const item = carrito.find(p => p.id === id);
  if (!item) return;

  if (boton.dataset.quitar || boton.dataset.restar) item.cantidad--;
  else item.cantidad++;

  carrito = carrito.filter(p => p.cantidad > 0);
  dibujarCarrito();
});

$("categorias").addEventListener("click", event => {
  const boton = event.target.closest("[data-categoria]");
  if (!boton) return;

  categoriaActual = boton.dataset.categoria;
  document.querySelectorAll(".categoria").forEach(b =>
    b.classList.toggle("activa", b === boton)
  );
  mostrarProductos();
});

function totalCarrito() {
  return carrito.reduce((suma, p) => suma + p.precio * p.cantidad, 0);
}

$("formPedido").addEventListener("submit", async event => {
  event.preventDefault();

  if (!carrito.length) {
    $("mensajePedido").textContent = "Agrega al menos un producto.";
    return;
  }

  const boton = $("btnEnviar");
  boton.disabled = true;
  $("mensajePedido").textContent = "Guardando pedido...";

  const datos = {
    nombre: $("nombre").value.trim(),
    grupo: $("grupo").value.trim(),
    metodoPago: $("metodoPago").value,
    observaciones: $("observaciones").value.trim(),
    productos: carrito.map(p => ({
      id: p.id,
      nombre: p.nombre,
      cantidad: p.cantidad,
      precio: p.precio
    })),
    total: totalCarrito(),
    clienteId: clienteId || null,
    estado: "pendiente",
    fecha: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "pedidos"), datos);
    carrito = [];
    dibujarCarrito();
    $("formPedido").reset();
    $("mensajePedido").textContent =
      "¡Pedido enviado! La encargada deberá confirmar su recepción y el pago.";
  } catch (error) {
    console.error(error);
    $("mensajePedido").textContent =
      "No se pudo guardar. Revisa la conexión y las reglas de Firestore.";
  } finally {
    boton.disabled = false;
  }
});

function crearIdCliente() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}


function crearQRRegistro(texto) {
  const contenedor = $("qrRegistro");
  contenedor.innerHTML = "";

  if (typeof QRCode === "undefined") {
    contenedor.textContent = "No se pudo cargar el generador de QR.";
    return;
  }

  new QRCode(contenedor, {
    text: texto,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.M
  });
}

$("formRegistro").addEventListener("submit", async event => {
  event.preventDefault();

  const boton = event.currentTarget.querySelector('button[type="submit"]');
  const mensaje = $("mensajeRegistro");

  const nombre = $("nombreAlumno").value.trim();
  const grupo = $("grupoAlumno").value.trim();
  const matricula = $("matriculaAlumno").value.trim();

  if (!nombre || !grupo || !matricula) {
    mensaje.textContent = "Completa todos los campos.";
    return;
  }

  boton.disabled = true;
  mensaje.textContent = "Registrando alumno...";

  try {
    const resultado = await addDoc(collection(db, "alumnos"), {
      nombre,
      grupo,
      matricula,
      puntos: 0,
      fechaRegistro: serverTimestamp()
    });

    crearQRRegistro(resultado.id);

    clienteId = resultado.id;
    localStorage.setItem("cafeteriaClienteId", clienteId);

    $("numeroTarjeta").textContent =
      "Alumno " + resultado.id.slice(0, 8).toUpperCase();

    $("qrCliente").innerHTML = "";
    new QRCode($("qrCliente"), {
      text: resultado.id,
      width: 150,
      height: 150,
      correctLevel: QRCode.CorrectLevel.M
    });

    $("puntosCliente").textContent = "0";
    $("estadoTarjeta").textContent = "Alumno registrado.";
    mensaje.textContent = "¡Registro guardado! Guarda tu QR.";
    event.currentTarget.reset();
  } catch (error) {
    console.error("Error registrando alumno:", error);
    mensaje.textContent =
      "No se pudo registrar. Revisa las reglas de Firestore.";
  } finally {
    boton.disabled = false;
  }
});


function crearTarjeta() {
  if (!clienteId) {
    clienteId = crearIdCliente();
    localStorage.setItem("cafeteriaClienteId", clienteId);
  }

  $("numeroTarjeta").textContent = "Cliente " + clienteId.slice(0, 8).toUpperCase();
  $("qrCliente").innerHTML = "";

  if (typeof QRCode === "undefined") {
    $("qrCliente").textContent = "No se pudo cargar el generador de QR.";
    return;
  }

  new QRCode($("qrCliente"), {
    text: clienteId,
    width: 150,
    height: 150,
    correctLevel: QRCode.CorrectLevel.M
  });

  $("puntosCliente").textContent = "Por confirmar";
  $("estadoTarjeta").textContent =
    "Tarjeta creada en este dispositivo. Aún no hay puntos verificados.";
}

$("btnTarjeta").addEventListener("click", crearTarjeta);


$("btnAcceso").addEventListener("click", async () => {
  const correo = $("correoEncargada").value.trim();
  const contraseña = $("claveEncargada").value;
  const mensaje = $("resultadoQR");

  mensaje.textContent = "Verificando acceso...";

  try {
    await signInWithEmailAndPassword(auth, correo, contraseña);

    $("panelPrivado").hidden = false;
    await cargarPedidos();

    await iniciarLector();

    mensaje.textContent = "Sesión iniciada correctamente.";
  } catch (error) {
    console.error("Error de acceso:", error);
    mensaje.textContent =
      "No se pudo iniciar sesión. Revisa el correo y la contraseña.";
  }
});


$("btnActualizar").addEventListener("click", cargarPedidos);

async function cargarPedidos() {
  $("listaPedidos").textContent = "Cargando pedidos...";

  try {
    const consulta = query(
      collection(db, "pedidos"),
      orderBy("fecha", "desc")
    );
    const resultado = await getDocs(consulta);

    if (resultado.empty) {
      $("listaPedidos").textContent = "Todavía no hay pedidos.";
      return;
    }

    $("listaPedidos").innerHTML = resultado.docs.map(documento => {
      const p = documento.data();
      const detalle = (p.productos || []).map(item =>
        `${escapar(item.nombre)} × ${Number(item.cantidad)}`
      ).join(", ");

      return `
        <article class="pedido-admin">
          <b>${escapar(p.nombre)}</b> · ${escapar(p.grupo || "Sin grupo")}<br>
          ${detalle}<br>
          <b>Total: ${dinero(Number(p.total) || 0)}</b><br>
          Pago: ${escapar(p.metodoPago || "No indicado")} ·
          Estado: ${escapar(p.estado || "pendiente")}
        </article>
      `;
    }).join("");
  } catch (error) {
    console.error(error);
    $("listaPedidos").textContent =
      "No se pudieron leer los pedidos. Verifica el inicio de sesión y las reglas de Firestore.";
  }
}

$("btnAcceso").addEventListener("dblclick", () => {
  // No se concede acceso adicional mediante doble clic.
});


async function iniciarLector() {
  if (typeof Html5Qrcode === "undefined") {
    $("resultadoQR").textContent = "No se cargó el lector QR.";
    return;
  }

  try {
    if (!lector) {
      lector = new Html5Qrcode("lectorQR");
    }

    await lector.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },

      async texto => {
        $("resultadoQR").textContent = "Buscando alumno...";

        try {
          await lector.stop();

          const idAlumno = texto.trim();
          const referencia = doc(db, "alumnos", idAlumno);
          const resultado = await getDoc(referencia);

          if (!resultado.exists()) {
            $("resultadoQR").textContent =
              "No se encontró al alumno. El QR debe contener el ID de su documento en Firebase.";
            return;
          }

          const alumno = resultado.data();

          $("resultadoQR").textContent =
            "Alumno: " + alumno.nombre +
            " | Grupo: " + alumno.grupo +
            " | Puntos: " + (alumno.puntos ?? 0);

        } catch (error) {
          console.error("Error al consultar alumno:", error);
          $("resultadoQR").textContent =
            "No se pudieron consultar los datos. Revisa los permisos de Firebase.";
        }
      },

      () => {}
    );

    $("resultadoQR").textContent =
      "Cámara activa. Escanea el QR del alumno.";

  } catch (error) {
    console.error(error);
    $("resultadoQR").textContent =
      "No se pudo abrir la cámara. Comprueba los permisos y usa HTTPS.";
  }
}


mostrarProductos();
dibujarCarrito();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./service-worker.js")
    .catch(error => console.error("Error al registrar el Service Worker:", error));
}
