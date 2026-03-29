import { initNavbar } from './components/navbar.js'
import { initFilter } from './components/filter.js'
import { initContact } from './components/contact.js'

document.addEventListener('DOMContentLoaded', () => {
  initNavbar()
  initFilter()
  initContact()
})
