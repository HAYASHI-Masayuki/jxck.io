// add mozaic player
import MozaicPlayer from './mozaic-player.mjs'

// Enable debug log adding #debug into url
const log = location.hash === "#debug" ? console.log.bind(console) : () => {}

log(MozaicPlayer)
customElements.define('mozaic-player', MozaicPlayer);

// main
EventTarget.prototype.on = EventTarget.prototype.addEventListener
const $ = document.querySelector.bind(document)
document.on('keydown', ({key}) => {
  log(key, document.activeElement)

  if (document.activeElement.nodeName !== "BODY") return

  switch(key) {
    case ' ':
      log('play/pause')
      $('mozaic-player').play()
      break
    case 'ArrowLeft':
      log('back')
      $('mozaic-player').back()
      break
    case 'ArrowRight':
      log('forward')
      $('mozaic-player').forward()
      break
    case 'ArrowUp':
      log('volume up')
      $('mozaic-player').volumeup()
      break
    case 'ArrowDown':
      log('volume down')
      $('mozaic-player').volumedown()
      break
  }
})
