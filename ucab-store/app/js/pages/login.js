import { bootstrap } from '../shell.js';
import {
  currentUser,
  DEMO_CREDENTIALS,
  isOnline,
  loginUser,
  resetPassword,
} from '../state.js';
import {
  openModal,
  successModal,
  toast,
} from '../ui.js';

await bootstrap();

if (currentUser()) {
  location.href = 'index.html';
} else {
  render();
}

function render() {
  const mount = document.getElementById('view');
  mount.innerHTML = `
    <form class="form-card" id="loginForm">
      <h2>Iniciar sesión</h2>
      <p class="muted">Bienvenido de vuelta a UCAB Store.</p>

      <div class="field">
        <label for="email">Correo</label>
        <input class="input" id="email" name="email" type="email" required autocomplete="email"
               placeholder="${DEMO_CREDENTIALS.admin.email}"/>
      </div>
      <div class="field">
        <label for="password">Contraseña</label>
        <input class="input" id="password" name="password" type="password" required autocomplete="current-password"
               placeholder="${DEMO_CREDENTIALS.admin.password}"/>
      </div>

      <button class="btn btn-primary btn-block" type="submit">Entrar</button>

      <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap">
        <button type="button" class="btn btn-sm btn-ghost" id="fillAdmin">Login Administrador</button>
        <button type="button" class="btn btn-sm btn-ghost" id="fillClient">Login Cliente</button>
      </div>

      <p class="muted-link" style="margin-top:1rem;text-align:center">
        ¿No tienes cuenta? <a href="register.html">Regístrate</a> ·
        <a href="#" id="forgotLink">Olvidé mi contraseña</a>
      </p>

     
    </form>
  `;

  const form = mount.querySelector('#loginForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar si el usuario está intentando ingresar sin conexión
    if (!isOnline()) {
      toast('No puedes iniciar sesión en modo offline. Verifica tu conexión.');
      return;
    }

    const data = new FormData(form);
    try {
      await loginUser(data.get('email'), data.get('password'));
      toast('Sesión iniciada.');
      location.href = 'index.html';
    } catch (err) {
      toast(err.message);
    }
  });

  mount.querySelector('#fillAdmin').addEventListener('click', () => {
    form.email.value = DEMO_CREDENTIALS.admin.email;
    form.password.value = DEMO_CREDENTIALS.admin.password;
  });
  mount.querySelector('#fillClient').addEventListener('click', () => {
    form.email.value = DEMO_CREDENTIALS.client.email;
    form.password.value = DEMO_CREDENTIALS.client.password;
  });

  mount.querySelector('#forgotLink').addEventListener('click', (e) => {
    e.preventDefault();
    openForgotModal();
  });
}

function openForgotModal() {
  const body = `
    <p class="muted">Ingresa tu correo y la nueva contraseña que quieras usar.</p>
    <form id="forgotForm">
      <div class="field">
        <label for="fEmail">Correo</label>
        <input class="input" id="fEmail" name="email" type="email" required/>
      </div>
      <div class="field">
        <label for="fPass">Nueva contraseña</label>
        <input class="input" id="fPass" name="password" type="password" minlength="6" required/>
      </div>
    </form>
  `;
  openModal({
    title: 'Recuperar contraseña',
    body,
    icon: '🔑',
    actions: [
      { label: 'Cancelar', variant: 'btn-ghost' },
      {
        label: 'Restablecer',
        variant: 'btn-primary',
        close: false,
        onClick: async ({ modal, close }) => {
          const form = modal.querySelector('#forgotForm');
          if (!form.reportValidity()) return;
          const data = Object.fromEntries(new FormData(form));
          try {
            await resetPassword(data.email, data.password);
            close(true);
            await successModal({
              title: 'Contraseña actualizada',
              message: 'Ya puedes iniciar sesión con tu nueva contraseña.',
              icon: '✓',
            });
          } catch (err) {
            toast(err.message);
          }
        },
      },
    ],
  });
  // Soportar Enter dentro del form embebido
  setTimeout(() => {
    const f = document.querySelector('#forgotForm');
    if (f) f.addEventListener('submit', (e) => {
      e.preventDefault();
      document.querySelector('.modal .modal-actions .btn-primary')?.click();
    });
  }, 60);
}