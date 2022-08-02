const log = localStorage.getItem("mozaic-player") === "true" ? console.log.bind(console) : () => {}

export default class MozaicPlayer extends HTMLElement {
  static get observedAttributes() { return ["src"] }

  /** @returns {string} */
  get src()      { return this.$("audio").src }
  /** @params {string} value */
  set src(value) { this.$("audio").src = value }

  /**
   * Fetch and Clonse HTML template
   * TODO: html-modules
   *
   * @returns {Promise<Node>}
   */
  async template() {
    /** @type{Response} */
    const res      = await fetch("/assets/template/mozaic-player.html")
    /** @type{string} */
    const text     = await res.text()
    /** @type{HTMLTemplateElement} */
    const template = document.createElement("template")
    /** @type {TrustedTypePolicy} */
    const htmlPolicy = trustedTypes.createPolicy('html-policy', {
      createHTML: (unsafeValue) => unsafeValue
    })
    template.innerHTML = htmlPolicy.createHTML(text)
    return template.content.cloneNode(true)
  }

  constructor() {
    super()
    log(this, "constructor")
  }

  ///////////////////////////
  // WebComponents Callback
  ///////////////////////////
  async connectedCallback() {
    log(this, "connectedCallback")

    // create shadow dom
    this.attachShadow({mode: "open"})
    this.shadowRoot.appendChild(await this.template())

    // get slotted <audio>
    /**@type{HTMLAudioElement}*/ this.audio = /**@type{HTMLAudioElement}*/ (this.shadowRoot.$("slot").assignedElements()[0])
    console.assert(this.audio.tagName.toLowerCase() === "audio", "<audio slot=audio> should assigned to <mozaic-player>")

    // get data
    this.title        = this.audio.dataset.title
    this.forwardDelta = parseFloat(this.audio.dataset.forward) || 30
    this.backDelta    = parseFloat(this.audio.dataset.back)    || -10

    // audio evnet bindings
    this.audio.on("abort",          this.onAudioAbort.bind(this))
    this.audio.on("canplay",        this.onAudioCanplay.bind(this))
    this.audio.on("canplaythrough", this.onAudioCanplaythrough.bind(this))
    this.audio.on("durationchange", this.onAudioDurationchange.bind(this))
    this.audio.on("emptied",        this.onAudioEmptied.bind(this))
    this.audio.on("ended",          this.onAudioEnded.bind(this))
    this.audio.on("error",          this.onAudioError.bind(this))
    this.audio.on("loadeddata",     this.onAudioLoadeddata.bind(this))
    this.audio.on("loadedmetadata", this.onAudioLoadedmetadata.bind(this))
    this.audio.on("timeupdate",     this.onAudioTimeupdate.bind(this))
    this.audio.on("loadstart",      this.onAudioLoadstart.bind(this))
    this.audio.on("pause",          this.onAudioPause.bind(this))
    this.audio.on("play",           this.onAudioPlay.bind(this))
    this.audio.on("playing",        this.onAudioPlaying.bind(this))
    this.audio.on("progress",       this.onAudioProgress.bind(this))
    this.audio.on("ratechange",     this.onAudioRatechange.bind(this))
    this.audio.on("seeked",         this.onAudioSeeked.bind(this))
    this.audio.on("seeking",        this.onAudioSeeking.bind(this))
    this.audio.on("stalled",        this.onAudioStalled.bind(this))
    this.audio.on("suspend",        this.onAudioSuspend.bind(this))
    this.audio.on("volumechange",   this.onAudioVolumechange.bind(this))
    this.audio.on("waiting",        this.onAudioWaiting.bind(this))

    /**
     * caching dom
     */
    /**@type{HTMLButtonElement}  */ this.$play         = this.shadowRoot.$("#play")
    /**@type{HTMLButtonElement}  */ this.$forward      = this.shadowRoot.$("#forward")
    /**@type{HTMLButtonElement}  */ this.$back         = this.shadowRoot.$("#back")
    /**@type{HTMLInputElement}   */ this.$volume       = this.shadowRoot.$("#volume")
    /**@type{HTMLButtonElement}  */ this.$volumeUp     = this.shadowRoot.$("#volumeUp")
    /**@type{HTMLButtonElement}  */ this.$volumeDown   = this.shadowRoot.$("#volumeDown")
    /**@type{HTMLInputElement}   */ this.$playbackRate = this.shadowRoot.$("#playbackRate")
    /**@type{HTMLTimeElement}    */ this.$current      = this.shadowRoot.$("#current")
    /**@type{HTMLProgressElement}*/ this.$progress     = this.shadowRoot.$("#slider")
    /**@type{HTMLTimeElement}    */ this.$duration     = this.shadowRoot.$("#duration")
    /**@type{HTMLOutputElement}  */ this.$outputRate   = this.shadowRoot.$("output#rate")
    /**@type{SVGSVGElement}      */ this.$svgPlay      = this.shadowRoot.$("#svg-play")
    /**@type{SVGSVGElement}      */ this.$svgPause     = this.shadowRoot.$("#svg-pause")

    // tooltip event bindings
    this.$play        .on("click", this.onPlay.bind(this))
    this.$forward     .on("click", this.onForward.bind(this))
    this.$back        .on("click", this.onBack.bind(this))
    this.$volume      .on("input", this.onVolume.bind(this))
    this.$volumeUp    .on("click", this.onVolumeUp.bind(this))
    this.$volumeDown  .on("click", this.onVolumeDown.bind(this))
    this.$playbackRate.on("input", this.onPlaybackrate.bind(this))

    // dragging progress bar
    this.dragging = false
    this.$progress.on("mousedown",   this.onMousedown.bind(this), {passive:true})
    this.$progress.on("mousemove",   this.onMousemove.bind(this), {passive:true})
    this.$progress.on("mouseup",     this.onMouseup.bind(this),   {passive:true})
    this.$progress.on("mouseout",    this.onMouseout.bind(this),  {passive:true})
    this.$progress.on("touchstart",  this.onMousedown.bind(this), {passive:true})
    this.$progress.on("touchmove",   this.onMousemove.bind(this), {passive:true})
    this.$progress.on("touchend",    this.onMouseup.bind(this),   {passive:true})
    this.$progress.on("touchcancel", this.onMouseout.bind(this),  {passive:true})

    // load the audio
    this.audio.load()

    // MediaSession API
    if (navigator.mediaSession) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title:  this.title,
        artist: "Jxck",
        album:  "mozaic.fm",
        artwork: [
          {
            src:   "https://mozaic.fm/assets/img/mozaic.png",
            sizes: "300x300",
            type:  "image/png"
          },
          {
            src:   "https://mozaic.fm/assets/img/mozaic.webp",
            sizes: "300x300",
            type:  "image/webp"
          },
          {
            src:   "https://mozaic.fm/assets/img/mozaic.jpeg",
            sizes: "3000x3000",
            type:  "image/jpeg"
          },
          {
            src:   "https://mozaic.fm/assets/img/mozaic.svg",
            sizes: "any",
            type:  "image/svg+xml"
          }
        ]
      })

      navigator.mediaSession.setActionHandler("play",         this.onPlay.bind(this))
      navigator.mediaSession.setActionHandler("pause",        this.onPlay.bind(this))
      navigator.mediaSession.setActionHandler("seekbackward", this.onBack.bind(this))
      navigator.mediaSession.setActionHandler("seekforward",  this.onForward.bind(this))
      // TODO: other action if supported
    }
  }

  disconnectedCallback() {
    log(this, "disconnected")
  }

  attributeChangedCallback(name, from, to) {
    log(this, `changed ${name}="${from}" to ${name}="${to}"`)
  }

  adoptedCallback() {
    log(this, "adopted")
  }


  ///////////////////////////
  // Public Interface
  ///////////////////////////
  play() {
    this.$play.dispatchEvent(new Event("click"))
  }

  forward() {
    this.$forward.dispatchEvent(new Event("click"))
  }

  back() {
    this.$back.dispatchEvent(new Event("click"))
  }

  volumeup() {
    this.$volume.stepUp()
    this.$volume.dispatchEvent(new Event("input"))
  }

  volumedown() {
    this.$volume.stepDown()
    this.$volume.dispatchEvent(new Event("input"))
  }


  ///////////////////////////
  // Logic
  ///////////////////////////
  /**
   * calculate percentage of dragging position
   *
   * @param {MouseEvent|TouchEvent} e
   * @returns {number}
   */
  percent(e) {
    /**@type{number}*/
    let clientX = 0;
    if (e instanceof MouseEvent) {
      clientX = e.clientX
    } else if (e instanceof TouchEvent) {
      clientX = e.touches[0].clientX
    }
    /**@type{{offsetLeft: number, clientWidth: number}}*/
    const {offsetLeft, clientWidth} = /**@type{HTMLProgressElement}*/(e.target)
    /**@type{number}*/
    const percent = (clientX - offsetLeft) / clientWidth
    return percent
  }

  /**
   * seek position
   *
   * @param {MouseEvent|TouchEvent} e
   * @returns {number}
   */
  seek(e) {
    /**@type{number}*/
    const percent  = this.percent(e)
    /**@type{number}*/
    const duration = this.audio.duration
    /**@type{number}*/
    const seekTime = duration * percent
    log("seekTime", seekTime)
    return seekTime
  }

  /**
   * format time
   *
   * @param {number} time
   * @returns {string}
   */
  timeFormat(time) {
    /**@type{string}*/
    const h = (~~(time / 3600)).toString().padStart(2, "0")
    /**@type{string}*/
    const m = (~~(time % 3600 / 60)).toString().padStart(2, "0")
    /**@type{string}*/
    const s = (~~(time % 60)).toString().padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  setDuration() {
    /**@type{number}*/
    const duration = this.audio.duration
    /**@type{string}*/
    const time     = this.timeFormat(duration)
    log("duration", duration)
    this.$progress.max         = duration
    this.$progress.setAttribute("aria-valuemax", duration.toString())
    this.$duration.textContent = time
    this.$duration.dateTime    = time
  }

  setTime() {
    /**@type{number}*/
    const currentTime = this.audio.currentTime
    /**@type{string}*/
    const time        = this.timeFormat(currentTime)
    log("currentTime", currentTime)
    this.$progress.value      = currentTime
    this.$progress.setAttribute("aria-valuenow", currentTime.toString())
    this.$progress.setAttribute("aria-valuetext", time)
    this.$current.textContent = time
    this.$current.dateTime    = time
  }

  setCanPlayButton() {
    this.$play.title = "play"
    this.$play.setAttribute("aria-busy", "false")
    this.$play.disabled = false

    /**@type{SVGPathElement}*/
    const $path = this.$svgPlay.$("path")
    $path.style.fill   = "#fff"
    $path.style.stroke = "#fff"
  }

  setPlayButton() {
    this.$svgPlay.style.display  = "inline-block"
    this.$svgPause.style.display = "none"
  }

  setPauseButton() {
    this.$svgPlay.style.display  = "none"
    this.$svgPause.style.display = "inline-block"
  }


  ///////////////////////////
  // Save Setting
  ///////////////////////////
  saveCurrentTime() {
    /**@type{number}*/
    const currentTime = this.audio.currentTime
    log("saveCurrentTime", currentTime)
    localStorage.setItem(`${this.src}:currentTime`, currentTime.toString())
  }

  saveVolume() {
    /**@type{number}*/
    const volume = this.audio.volume
    log("saveVolume", volume)
    localStorage.setItem(`mozaic.fm:volume`, volume.toString())
  }

  savePlaybackRate() {
    /**@type{number}*/
    const playbackRate = this.audio.playbackRate
    log("savePlaybackRate", playbackRate)
    localStorage.setItem(`mozaic.fm:playbackRate`, playbackRate.toString())
  }


  ///////////////////////////
  // Load Setting
  ///////////////////////////
  loadCurrentTime() {
    /**@type{number}*/
    const currentTime = parseFloat(localStorage.getItem(`${this.src}:currentTime`) || "0")
    log("loadCurrentTime", currentTime)
    this.audio.currentTime = currentTime
  }

  loadVolume() {
    /**@type{number}*/
    const volume = parseFloat(localStorage.getItem(`mozaic.fm:volume`) || "0.5")
    log("loadVolume", volume)
    this.audio.volume = volume
    this.$volume.value = (volume*100).toString()
  }

  loadPlaybackRate() {
    /**@type{number}*/
    const playbackRate = parseFloat(localStorage.getItem(`mozaic.fm:playbackRate`) || "1.0")
    log("loadPlabackRate", playbackRate)
    this.audio.playbackRate      = playbackRate
    this.$playbackRate.value     = playbackRate.toString()
    this.$outputRate.textContent = `x${playbackRate}`
  }


  ///////////////////////////
  // Audio Event Binding
  ///////////////////////////
  onAudioAbort(e) {
    log(e.type, e)
  }

  onAudioCanplay(e) {
    log(e.type, e)
    this.setCanPlayButton()
  }

  onAudioCanplaythrough(e) {
    log(e.type, e)
    this.setCanPlayButton()
  }

  onAudioDurationchange(e) {
    log(e.type, e)
    this.setDuration()
  }

  onAudioEmptied(e) {
    log(e.type, e)
  }

  onAudioEnded(e) {
    log(e.type, e)
  }

  onAudioError(e) {
    log(e.type, e)
  }

  onAudioLoadeddata(e) {
    log(e.type, e)
  }

  onAudioLoadedmetadata(e) {
    log(e.type, e)
    this.loadVolume()
    this.loadPlaybackRate()
    this.loadCurrentTime()
  }

  onAudioTimeupdate(e) {
    log(e.type, e)
    this.setTime()
    if (this.audio.currentTime === 0) return
    this.saveCurrentTime()
  }

  onAudioLoadstart(e) {
    log(e.type, e)
  }

  onAudioPause(e) {
    log(e.type, e)
    this.setPlayButton()
  }

  onAudioPlay(e) {
    log(e.type, e)
    this.setPauseButton()
  }

  onAudioPlaying(e) {
    log(e.type, e)
  }

  onAudioProgress(e) {
    log(e.type, e)
  }

  onAudioRatechange(e) {
    log(e.type, e)
  }

  onAudioSeeked(e) {
    log(e.type, e)
  }

  onAudioSeeking(e) {
    log(e.type, e)
  }

  onAudioStalled(e) {
    log(e.type, e)
  }

  onAudioSuspend(e) {
    log(e.type, e)
  }

  onAudioVolumechange(e) {
    log(e.type, e)
  }

  onAudioWaiting(e) {
    log(e.type, e)
  }


  ///////////////////////////
  // Event Bindings
  ///////////////////////////
  onPlay(e) {
    if (this.audio.paused) {
      log("play()")
      this.audio.play()
    } else {
      log("pause()")
      this.audio.pause()
    }
  }

  onForward(e) {
    log(this.audio.currentTime, this.forwardDelta)
    this.audio.currentTime += this.forwardDelta
  }

  onBack(e) {
    log(this.audio.currentTime, this.backDelta)
    this.audio.currentTime += this.backDelta
  }

  onVolume(e) {
    /**@type{number}*/
    const volume = parseFloat(e.target.value)/100
    log(e.type, volume)
    this.audio.volume = volume
    this.saveVolume()
  }

  onVolumeUp(e) {
    log(e.type, "volmeUp")
    this.volumeup()
  }

  onVolumeDown(e) {
    log(e.type, "volmeDown")
    this.volumedown()
  }

  onPlaybackrate(e) {
    /**@type{number}*/
    const playbackRate = parseFloat(e.target.value)
    log(e.target.value, playbackRate)
    this.audio.playbackRate = playbackRate
    //   1.toPrecision(2) => 1.0
    // 0.8.toPrecision(1) => 0.8
    /**@type{number}*/
    const precision = playbackRate < 1 ? 1 : 2
    this.$outputRate.textContent = `x${playbackRate.toPrecision(precision)}`
    this.savePlaybackRate()
  }

  // Mouse & Touch Events

  /** @param {MouseEvent|TouchEvent} e */
  onMousedown(e) {
    log(e.type, e)
    this.dragging = true
    this.audio.currentTime = this.seek(e)
  }

  /** @param {MouseEvent|TouchEvent} e */
  onMousemove(e) {
    log(e.type, e)
    if (!this.dragging) return
    this.audio.currentTime = this.seek(e) // seek if dragging
  }

  /** @param {MouseEvent|TouchEvent} e */
  onMouseup(e) {
    log(e.type, e)
    this.dragging = false
  }

  /** @param {MouseEvent|TouchEvent} e */
  onMouseout(e) {
    log(e.type, e)
    this.dragging = false
  }
}
