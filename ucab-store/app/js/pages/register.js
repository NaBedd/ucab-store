import { bootstrap } from '../shell.js';
import {
  loginUser,
  registerUser,
} from '../state.js';
import {
  successModal,
  toast,
} from '../ui.js';

await bootstrap();
render();

function render() {
  const mount = document.getElementById('view');
  mount.innerHTML = `
    <form class="form-card" id="regForm">
      <h2>Crear cuenta</h2>
      <p class="muted">Únete y empieza a comprar en segundos.</p>
      <div class="field">
        <label for="name">Nombre completo</label>
        <input class="input" id="name" name="name" required placeholder="María Pérez"/>
      </div>
      <div class="field">
        <label for="email">Correo</label>
        <input class="input" id="email" name="email" type="email" required placeholder="tu@correo.com"/>
      </div>
      <div class="field">
        <label for="password">Contraseña</label>
        <input class="input" id="password" name="password" type="password" minlength="6" required placeholder="Mínimo 6 caracteres"/>
      </div>
      <button class="btn btn-primary btn-block" type="submit">Registrarme</button>
      <p class="muted-link" style="margin-top:1rem;text-align:center">
        ¿Ya tienes cuenta? <a href="login.html">Inicia sesión</a>
      </p>
    </form>
  `;

  mount.querySelector('#regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await registerUser(data);
      await loginUser(data.email, data.password);
      await successModal({
        title: '¡Cuenta creada!',
        message: `Bienvenido a UCAB Store, ${data.name.split(' ')[0]}.`,
        icon: '🎉',
      });
      location.href = 'index.html';
    } catch (err) {
      toast(err.message);
    }
  });
}
