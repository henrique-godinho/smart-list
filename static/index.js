(function () {
  const params  = new URLSearchParams(window.location.search);
  const session = params.get('session');
  if (session === 'expired') {
    alert('Please log in again');
    history.replaceState(null, '', window.location.pathname);
  }
})();