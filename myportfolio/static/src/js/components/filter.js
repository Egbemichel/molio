export function initFilter() {
  const buttons = document.querySelectorAll('[data-filter]')
  const cards = document.querySelectorAll('[data-tags]')

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter

      buttons.forEach(b => b.classList.remove('active-filter'))
      btn.classList.add('active-filter')

      cards.forEach(card => {
        const tags = card.dataset.tags.split(',')
        const show = filter === 'all' || tags.includes(filter)
        card.style.display = show ? '' : 'none'
      })
    })
  })
}
