// Password screen for the home page and case studies.
//
// The page text and images are stored ENCRYPTED (AES-256-GCM, key derived
// from the password with PBKDF2-SHA256). Nothing readable is published: this
// script decrypts the page in the visitor's browser once they enter the right
// password. The key is kept in sessionStorage so the other case studies open
// (and the other protected pages) without asking again until the tab is closed.
//
// To change the password, re-run the encryption step (see README).
(function () {
  var gate = document.querySelector('.gate');
  if (!gate) return;
  var main = document.getElementById('main');
  var form = gate.querySelector('form');
  var input = gate.querySelector('input[type="password"]');
  var status = gate.querySelector('.gate-status');
  var button = gate.querySelector('button');
  var SALT = b64(gate.getAttribute('data-salt'));
  var ITER = parseInt(gate.getAttribute('data-iterations'), 10);
  var CONTENT = gate.getAttribute('data-content');
  var STORE = 'vg-portfolio-key';

  function b64(s) { var bin = atob(s), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
  function toB64(buf) { var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }

  if (!window.crypto || !crypto.subtle) {
    status.textContent = 'Your browser can’t open protected pages. Please try a current version of Chrome, Safari, Firefox or Edge.';
    button.disabled = true;
    return;
  }

  function deriveKey(password) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: SALT, iterations: ITER, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
      });
  }

  function decrypt(key, url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('fetch');
      return r.arrayBuffer();
    }).then(function (buf) {
      var bytes = new Uint8Array(buf);
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
    });
  }

  function unlock(key) {
    return decrypt(key, CONTENT).then(function (plain) {
      var html = new TextDecoder().decode(plain);
      main.innerHTML = html;
      main.classList.remove('locked');
      document.title = gate.getAttribute('data-title');
      // Decrypt images in the background; each one fades in when ready.
      Array.prototype.forEach.call(main.querySelectorAll('img[data-enc]'), function (img) {
        decrypt(key, img.getAttribute('data-enc')).then(function (data) {
          var type = img.getAttribute('data-type') || 'image/webp';
          img.src = URL.createObjectURL(new Blob([data], { type: type }));
          img.removeAttribute('data-enc');
        }).catch(function () {});
      });
      if (window.initContactForm) window.initContactForm();
      if (window.revealInit) window.revealInit(main);
      var target = location.hash && document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
    });
  }

  // Already unlocked earlier in this tab?
  var saved = null;
  try { saved = sessionStorage.getItem(STORE); } catch (e) {}
  if (saved) {
    main.classList.add('locked');
    crypto.subtle.importKey('raw', b64(saved), { name: 'AES-GCM' }, true, ['decrypt'])
      .then(unlock)
      .catch(function () {
        try { sessionStorage.removeItem(STORE); } catch (e) {}
        main.classList.remove('locked');
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = input.value;
    if (!pw) return;
    button.disabled = true;
    status.textContent = 'Opening…';
    var keyRef;
    deriveKey(pw).then(function (key) {
      keyRef = key;
      return unlock(key);
    }).then(function () {
      return crypto.subtle.exportKey('raw', keyRef).then(function (raw) {
        try { sessionStorage.setItem(STORE, toB64(raw)); } catch (e) {}
      });
    }).catch(function () {
      button.disabled = false;
      status.textContent = 'That password isn’t right. Please try again.';
      input.select();
    });
  });
})();
