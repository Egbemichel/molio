export function initNavbar() {
  const nav = document.getElementById('navbar')
  const toggle = document.getElementById('menu-toggle')
  const mobileMenu = document.getElementById('mobile-menu')

  // Sticky shadow on scroll
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('shadow-lg', window.scrollY > 20)
  })

  // Mobile toggle
  toggle?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden')
  })
}
