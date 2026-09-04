document.getElementById('form-login').addEventListener('submit', async function(e) {
    e.preventDefault();

    const correo = document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    const divError = document.getElementById('mensaje-error');

    divError.classList.add('d-none');

    try {
        const respuesta = await fetch('http://localhost:8081/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: correo, contrasena: contrasena })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            // Guardar datos del usuario autenticado
            localStorage.setItem('usuario', JSON.stringify(datos));
            // Redirigir al listado principal de pacientes
            window.location.href = 'index.html';
        } else {
            divError.textContent = datos.error || 'Credenciales inválidas';
            divError.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error de autenticación:', error);
        divError.textContent = 'Error al conectar con el servidor';
        divError.classList.remove('d-none');
    }
});