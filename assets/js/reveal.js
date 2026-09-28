// Reveal-on-scroll: content fades up softly as the page loads, and each
// section does the same as it scrolls into view. Items that appear together
// are staggered slightly. People who have "reduce motion" turned on in their
// system settings see everything immediately, with no animation.
//
// To turn the effect off, delete the two <script> lines that mention "reveal"
// in the <head> of each page.
(function () {
  window.__reveal = true;
  var root = document.documentElement;

  var SELECTORS = [
    '.site-header',
    // home
    '.home-hero > *', '.work-head', '.card', '.contact > *',
    // case studies (and their password screen)
    '.gate > *', '.cs-head > *', '.meta > div', '.hero', '.section', '.band', '.stats > div',
    '.gallery > .label', '.gallery > img', '.gallery-grid > img',
    '.figure', '.part', '.split > *', '.note', '.pager',
    // about
    '.about-banner', '.about-intro', '.photos-head', '.photo-grid > a',
    // blog
    '.blog-head > *', '.post-row', '.post > .back', '.post > .eyebrow', '.post > h1',
    '.post > .dek', '.post-hero', '.post-body > p', '.tags', '.byline'
  ].join(',');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    root.classList.remove('js');
    window.revealInit = function () {};
    return;
  }

  var STEP = 90;      // ms between items that appear together
  var MAX_DELAY = 450;

  var observer = new IntersectionObserver(function (entries) {
    var visible = entries.filter(function (e) { return e.isIntersecting; })
      .map(function (e) { return e.target; })
      .sort(function (a, b) {
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    visible.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * STEP, MAX_DELAY) + 'ms';
      el.classList.add('is-in');
      observer.unobserve(el);
      // Clear the delay afterwards so hover transitions stay snappy.
      setTimeout(function () { el.style.transitionDelay = ''; }, 1400);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  // Animate everything matching SELECTORS inside `scope`. Called once for the
  // page, and again by unlock.js when a protected case study is decrypted.
  window.revealInit = function (scope) {
    var list = [];
    if (scope.matches && scope.matches(SELECTORS)) list.push(scope);
    list = list.concat(Array.prototype.slice.call(scope.querySelectorAll(SELECTORS)));
    list = list.filter(function (el) { return !el.classList.contains('reveal'); });
    list.forEach(function (el) { el.classList.add('reveal'); });
    // Wait a frame so the starting state paints before anything animates in.
    requestAnimationFrame(function () {
      list.forEach(function (el) { observer.observe(el); });
    });
  };

  window.revealInit(document);
})();
