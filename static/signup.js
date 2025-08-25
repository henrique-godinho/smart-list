document.addEventListener('DOMContentLoaded', () => {
  const pwdInput = document.getElementById('password');
  const submit = document.getElementById('submit-btn');
  if (!pwdInput || !submit) return;

  const update = () => {
    const ok = (pwdInput.value || '').length >= 8;
    submit.disabled = !ok;
    submit.style.backgroundColor = ok ? '#4dabf7' : 'grey';
  };

  update();
  pwdInput.addEventListener('input', update);

});

