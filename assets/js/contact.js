// Sends the contact form to Formspree without leaving the page.
// If JavaScript is off, the form still posts normally to Formspree.
// initContactForm() runs on page load, and again from unlock.js after the
// password-protected home page is decrypted.
(function () {
  window.initContactForm = function () {
    var form = document.getElementById('contact-form');
    if (!form || form.dataset.ready) return;
    form.dataset.ready = '1';
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
        status.textContent = 'Form not connected yet — add your Formspree form ID (see README).';
        return;
      }
      button.disabled = true;
      status.textContent = 'Sending…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          form.reset();
          status.textContent = 'Thank you! Your message has been sent.';
        })
        .catch(function () {
          status.textContent = 'Something went wrong. Please try again, or email me directly.';
        })
        .finally(function () {
          button.disabled = false;
        });
    });
  };
  window.initContactForm();
})();
