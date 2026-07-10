// Theme toggle (initial theme set inline in <head> before paint)
document.getElementById('theme-toggle').addEventListener('click', function () {
  var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// Reveal-on-scroll
var reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(function (el) { io.observe(el); });

  // Sidebar nav scrollspy — highlight the section in view
  var links = document.querySelectorAll('.nav-link');
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        links.forEach(function (l) {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('.section').forEach(function (s) { spy.observe(s); });
} else {
  reveals.forEach(function (el) { el.classList.add('visible'); });
}

// Cursor spotlight (skipped for touch devices and reduced motion)
if (window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  var spot = document.querySelector('.spotlight');
  document.addEventListener('mousemove', function (e) {
    spot.style.setProperty('--mx', e.clientX + 'px');
    spot.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });
}
