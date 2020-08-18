/**
 * Instance de l'API youtube iframe
 * @type {null|YT}
 */
let YT = null;
/**
 * Element représentant une video youtube `<youtube-player video="UEINCHBN">`.
 *
 * ## Attributes
 *
 * - video, ID de la vidéo Youtube
 * - poster, URL de la miniature
 * - autoplay
 * - playButton, ID du bouton play à connecter au player
 * - title, Titre à afficher sur le player
 *
 * @property {ShadowRoot} root
 * @property {?number} timer Timer permettant de suivre la progression de la lecture
 * @property {YT.Player} player
 */

class YoutubePlayer extends HTMLElement {
  static get observedAttributes() {
    return ['video', 'button'];
  }

  constructor(attributes = {}) {
    super(); // Initialisation

    Object.keys(attributes).forEach(k => this.setAttribute(k, attributes[k]));
    this.root = this.attachShadow({
      mode: 'open'
    });
    this.onYoutubePlayerStateChange = this.onYoutubePlayerStateChange.bind(this);
    this.onYoutubePlayerReady = this.onYoutubePlayerReady.bind(this);
    this.getAttribute('poster'); // Structure HTML

    let poster = this.getAttribute('poster');
    poster = poster === null ? '' : `<div class="poster">
      <img src="${poster}">
      <svg class="play" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 46"><path d="M23 0C10.32 0 0 10.32 0 23s10.32 23 23 23 23-10.32 23-23S35.68 0 23 0zm8.55 23.83l-12 8A1 1 0 0118 31V15a1 1 0 011.55-.83l12 8a1 1 0 010 1.66z"/></svg>
      <div class="title">${this.getAttribute('title')}</div>
    </div>`;
    this.root.innerHTML = `
      ${this.buildStyles()}
      <div class="ratio">
        <div class="player"></div>
        ${poster}
      </div>`; // Evènements

    if (poster !== '') {
      const onClick = () => {
        this.root.querySelector('.poster').setAttribute('aria-hidden', 'true');
        this.setAttribute('autoplay', 'autoplay');
        this.removeAttribute('poster');
        this.loadPlayer(this.getAttribute('video'));
        this.removeEventListener('click', onClick);
      };

      this.addEventListener('click', onClick);
    }
  }

  disconnectedCallback() {
    this.stopTimer();
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'video' && newValue !== null && this.getAttribute('poster') === null) {
      this.loadPlayer(newValue);
    }

    if (name === 'button' && newValue !== null) {
      /** @var {PlayButton} button **/
      const button = document.querySelector(newValue);

      if (button !== null) {
        button.setAttribute('video', `#${this.id}`);
      }
    }
  }
  /**
   * @param {string} youtubeID
   * @return {Promise<void>}
   */


  async loadPlayer(youtubeID) {
    await loadYoutubeApi();

    if (this.player) {
      this.player.cueVideoById(this.getAttribute('video'));
      this.player.playVideo();
      return;
    }

    this.player = new YT.Player(this.root.querySelector('.player'), {
      videoId: youtubeID,
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        autoplay: this.getAttribute('autoplay') ? 1 : 0,
        loop: 0,
        modestbranding: 1,
        controls: 1,
        showinfo: 0,
        rel: 0
      },
      events: {
        onStateChange: this.onYoutubePlayerStateChange,
        onReady: this.onYoutubePlayerReady
      }
    });
  }
  /**
   * @param {YT.OnStateChangeEvent} event
   */


  onYoutubePlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      this.startTimer();
      this.dispatchEvent(new global.Event('play'));
    } else if (event.data === YT.PlayerState.ENDED) {
      this.stopTimer();
      this.dispatchEvent(new global.Event('ended'));
    }
  }
  /**
   * @param {YT.PlayerEvent} event
   */


  onYoutubePlayerReady() {
    this.startTimer();
    this.dispatchEvent(new Event('play'));
  }
  /**
   * Génère le style associé au player
   * @returns {string}
   */


  buildStyles() {
    return `<style>
      :host {
        display: block;
      }
      .ratio {
        background-color:black;
        position: relative;
        padding-bottom: 56.25%;
      }
      .poster {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .poster:hover .play {
        transform: scale(1.1)
      }
      .poster:hover::before {
        opacity: .8;
      }
      .title {
        color: #FFF;
        font-size: 22px;
        position: relative;
        text-align: center;
        z-index: 3;
        transition: .3s;
      }
      .play {
        position: relative;
        width: 48px;
        height: 48px;
        z-index: 3;
        fill: #FFF;
        margin-bottom: 8px;
        filter:  drop-shadow(0 1px 20px #121C4280);
        transition: .3s;
      }
      .poster::before {
        content:'';
        background: linear-gradient(to top, var(--color) 0%, var(--color-transparent) 100%);
        z-index: 2;
      }
      .poster,
      iframe,
      .poster::before,
      img {
        position: absolute;
        top:0;
        left: 0;
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        transition: opacity .5s;
      }
      .poster[aria-hidden] {
        pointer-events: none;
        opacity: 0;
      }
    </style>`;
  }

  stopTimer() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  startTimer() {
    if (this.timer) {
      return null;
    }

    this.dispatchEvent(new global.Event('timeupdate'));
    this.timer = window.setInterval(() => this.dispatchEvent(new global.Event('timeupdate')), 1000);
  }
  /**
   * Durée de la vidéo
   * @return {number}
   */


  get duration() {
    return this.player ? this.player.getDuration() : null;
  }
  /**
   * Position de la lecture
   * @return {number}
   */


  get currentTime() {
    return this.player ? this.player.getCurrentTime() : null;
  }

}
/**
 * Charge l'API Youtube Player
 * @returns {Promise<YT>}
 */

async function loadYoutubeApi() {
  return new Promise(resolve => {
    if (YT) {
      resolve(YT);
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = function () {
      YT = window.YT;
      window.onYouTubeIframeAPIReady = undefined;
      resolve(YT);
    };
  });
}

class SpinningDots extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const styles = window.getComputedStyle(this);
    const width = this.intFromPx(styles.width, 28);
    const strokeWidth = this.intFromPx(styles.strokeWidth, (4 / 28) * width, 1);
    const circles = this.intFromPx(this.getAttribute('dots'), 8);
    this.root.innerHTML = `<div>
    ${this.buildStyles(width, circles, strokeWidth)}
    ${this.buildCircles(width, circles, strokeWidth / 2)}
    ${this.buildTrail(width, strokeWidth)}
    </div>`;
  }

  disconnectedCallback() {
    this.root.innerHTML = '';
  }

  /**
   * Builds a SVG with n circles equally spaced around a circle
   * @param {number} w canvas width
   * @param {number} n circles count
   * @param {number} r circles radius
   * @return {string}
   */
  buildCircles(w, n, r) {
    const circleRadius = w / 2 - r;
    let dom = `<svg class="circles" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" fill="none" xmlns="http://www.w3.org/2000/svg">`;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI / (n / 2)) * i;
      const x = circleRadius * Math.sin(a) + w / 2;
      const y = circleRadius * Math.cos(a) + w / 2;
      dom += `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor"/>`;
    }
    return dom + `</svg>`
  }

  /**
   * Builds a SVG circle
   * @param {number} w canvas width
   * @param {number} stroke stroke width
   * @return {string}
   */
  buildTrail(w, stroke) {
    return `<svg class="halo" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="${w / 2}" cy="${w / 2}" r="${w / 2 -
      stroke / 2}" stroke-width="${stroke}" stroke-linecap="round" stroke="currentColor"/>
</svg>`
  }

  /**
   * Build the style
   * @param {number} w canvas width
   * @param {number} n number of section for the trail
   * @param {number} stroke size of the stroke
   * @return {string}
   */
  buildStyles(w, n, stroke) {
    const offset = Math.PI * (w - stroke);
    return `<style>
      :host {
        display: inline-block;
      }
      div {
        animation: fadeIn .4s cubic-bezier(.1,.6,.3,1);
        position: relative;
        width: ${w}px;
        height: ${w}px;
      }
      svg {
        position: absolute;
        top: 0;
        left: 0;
      }
      .circles {
        animation: spin 16s linear infinite;
      }
      .halo {
        animation: spin2 1.6s cubic-bezier(.5,.15,.5,.85)  infinite;
      } 
      .halo circle {
        stroke-dasharray: ${offset};
        stroke-dashoffset: ${offset + offset / n};
        animation: trail 1.6s cubic-bezier(.5,.15,.5,.85)   infinite;
      }
      @keyframes spin {
          from {transform: rotate(0deg); }
          to {transform: rotate(360deg); }
      }
      @keyframes spin2 {
          from {transform: rotate(0deg); }
          to {transform: rotate(720deg); }
      }
      @keyframes trail {
        0% { stroke-dashoffset: ${offset + offset / n}; }
        50% { stroke-dashoffset: ${offset + (2.5 * offset) / n}; }
        100% { stroke-dashoffset: ${offset + offset / n}; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(.1) }
        to { opacity: 1; transform: scale(1) }
      }
    </style>`
  }

  /**
   * Extract an int from a string
   * @param {string} value "20px" "auto"
   * @param {number} initial default value
   * @param {number} min assign default value if the value is under this threshold
   */
  intFromPx(value, initial, min = 0) {
    if (value === null || value === undefined) {
      return initial
    }
    value = parseInt(value.replace('px', ''), 10);
    if (value > min) {
      return value
    }
    return initial
  }
}

/**
 * Element permettant de gérer la liste des derniers lives
 *
 * @property {boolean} isPlaying
 * @property {HTMLDivElement} videoContainer
 * @property {HTMLDivElement} liveList
 * @property {YoutubePlayer} player
 * @property {HTMLAnchorElement} currentLive
 * @property {string} path URL vers les lives
 */
class RecapLiveElement extends HTMLElement {
  connectedCallback() {
    this.path = this.getAttribute('path');
    this.play = this.play.bind(this);
    this.gotoYear = this.gotoYear.bind(this);
    this.liveList = this.querySelector('.live-list');
    this.querySelectorAll('.live').forEach(live => {
      live.addEventListener('click', this.play);
    });
    this.querySelectorAll('.live-years a').forEach(a => {
      a.addEventListener('click', this.gotoYear);
    });
  }
  /**
   *
   */


  async gotoYear(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget.classList.contains('is-active')) {
      return;
    }

    e.currentTarget.parentElement.querySelector('.is-active').classList.remove('is-active');
    this.showLoader();
    e.currentTarget.classList.add('is-active');
    const year = e.currentTarget.text;
    const url = `${this.path}/${year}`;
    const response = await fetch(`${url}?ajax=1`);

    if (response.status >= 200 && response.status < 300) {
      const data = await response.text();
      this.liveList.innerHTML = data;
      this.liveList.querySelectorAll('.live').forEach(live => {
        live.addEventListener('click', this.play);
      });
      window.history.replaceState({}, '', url);
    } else {
      console.error(response);
    }

    this.hideLoader();
  }
  /**
   * Lance la lecture d'une vidéo
   * @param {MouseEvent} e
   */


  play(e) {
    e.preventDefault();
    e.stopPropagation();
    const live = e.currentTarget;
    const id = live.dataset.youtube;

    if (live.classList.contains('is-playing')) {
      return;
    }

    if (this.player === undefined) {
      this.player = new YoutubePlayer({
        autoplay: 1
      });
      this.liveList.insertAdjacentElement('beforebegin', this.player);
    }

    live.classList.add('is-playing');
    live.querySelector('play-button').attachVideo(this.player);
    this.player.setAttribute('video', id);

    if (this.currentLive) {
      this.currentLive.querySelector('play-button').detachVideo();
      this.currentLive.classList.remove('is-playing');
    }

    this.currentLive = live;
    this.classList.add('has-player');
    live.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
      inline: 'nearest'
    });
    this.player.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
      inline: 'nearest'
    });
  }

  showLoader() {
    const loader = new SpinningDots();
    loader.style.width = '20px';
    loader.classList.add('loader');
    this.querySelector('.live-years').appendChild(loader);
  }

  hideLoader() {
    const loader = this.querySelector('.loader');

    if (loader) {
      loader.parentElement.removeChild(loader);
    }
  }

}

/**
 * Element permettant de représenter un bouton de lecture avec progression.
 *
 * ## Attributes
 *
 * - progress, Nombre représentant la progression entre 0 et 100
 * - playing, La vidéo est en cours de lecture
 * - video, Selecteur de la vidéo à connecter à ce bouton
 *
 * @property {ShadowRoot} root
 * @property {HTMLButtonElement} button
 * @property {SVGCircleElement} circle
 */
class PlayButton extends HTMLElement {
  static get observedAttributes() {
    return ['playing', 'progress', 'video'];
  }

  constructor() {
    super();
    this.root = this.attachShadow({
      mode: 'open'
    });
    this.root.innerHTML = `
      ${this.buildStyles()}
      <button>
        <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="15" fill="none" stroke-width="1" stroke="currentColor" />
          <path d="M20.3 12.3L14 18.58l-2.3-2.3a1 1 0 00-1.4 1.42l3 3a1 1 0 001.4 0l7-7a1 1 0 00-1.4-1.42z" fill="#fff"/>
        </svg>
      </button>
    `;
    this.button = this.root.querySelector('button');
    this.circle = this.root.querySelector('circle');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'playing' && newValue === null) {
      this.root.host.classList.remove('is-playing');
    } else if (name === 'playing') {
      this.root.host.classList.add('is-playing');
    }

    if (name === 'progress') {
      const progress = newValue ? parseInt(newValue, 10) : 0;

      if (this.circle) {
        this.circle.style.strokeDashoffset = `${94 - 94 * progress / 100}px`;
      }

      if (progress === 100) {
        this.root.host.classList.add('is-checked');
      } else {
        this.root.host.classList.remove('is-checked');
      }
    }

    if (name === 'video' && newValue !== null) {
      const video = document.querySelector(newValue);

      if (video !== null) {
        this.attachVideo(video);
      }
    }
  }
  /**
   * Build the style
   */


  buildStyles() {
    return `<style>
      button {
        cursor: inherit;
        outline: none;
        position: relative;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 32px;
        flex: none;
        background: var(--play);
        margin-right: 1.5em;
        transition: .3s;
        color: var(--contrast);
      }
      button svg {
        opacity: 1;
        position: absolute;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        transform: rotate(-90deg);
        transition: opacity .3s;
      }
      button circle {
        stroke-dasharray: 94px;
        stroke-dashoffset: 94px;
        transition: stroke-dashoffset .1s;
      }
      button path {
        opacity: 0;
      }
      button::before {
        position: absolute;
        top: 10px;
        left: 13px;
        content: '';
        height: 0;
        border-left: 9px solid var(--color);
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
      }
      :host-context(.is-playing) button {
        background-color: #4869EE33 !important;
      }
      :host-context(.is-playing) button::before,
      :host-context(.is-playing) button::after {
        content: '';
        position: absolute;
        border: none;
        top: 10px;
        left: 18px;
        background: var(--contrast);
        width: 4px;
        height: 12px;
      }
      :host-context(.is-playing) button::before {
        left: 10px;
      }
      :host-context(.is-checked) button circle {
        opacity: 0;
      }
      :host-context(.is-checked) button svg {
        transform: rotate(0deg);
      }
      :host-context(.is-checked) button {
        background: var(--green);
      }
      :host-context(.is-checked) button path {
        opacity: 1;
      }
      :host-context(.is-checked) button::before {
        display: none;
      }
    </style>`;
  }
  /**
   * Attache le bouton a un player
   *
   * @param {YoutubePlayer|HTMLVideoElement} video
   */


  attachVideo(video) {
    this.setAttribute('progress', 0);

    const onTimeUpdate = () => {
      this.setAttribute('progress', (100 * video.currentTime / video.duration).toString());
    };

    const onPlay = () => this.setAttribute('playing', 'playing');

    const onEnded = () => this.removeAttribute('playing');

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('ended', onEnded);

    this.detachVideo = () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('ended', onEnded);
      this.removeAttribute('playing');

      this.detachVideo = function () {};
    };
  }
  /**
   * Détache le lecteur (supprime les listeners) du bouton de lecture.
   */


  detachVideo() {}

}

function htm(n){for(var l,e,s=arguments,t=1,r="",u="",a=[0],c=function(n){1===t&&(n||(r=r.replace(/^\s*\n\s*|\s*\n\s*$/g,"")))?a.push(n?s[n]:r):3===t&&(n||r)?(a[1]=n?s[n]:r,t=2):2===t&&"..."===r&&n?a[2]=Object.assign(a[2]||{},s[n]):2===t&&r&&!n?(a[2]=a[2]||{})[r]=!0:t>=5&&(5===t?((a[2]=a[2]||{})[e]=n?r?r+s[n]:s[n]:r,t=6):(n||r)&&(a[2][e]+=n?r+s[n]:r)),r="";},h=0;h<n.length;h++){h&&(1===t&&c(),c(h));for(var i=0;i<n[h].length;i++)l=n[h][i],1===t?"<"===l?(c(),a=[a,"",null],t=3):r+=l:4===t?"--"===r&&">"===l?(t=1,r=""):r=l+r[0]:u?l===u?u="":r+=l:'"'===l||"'"===l?u=l:">"===l?(c(),t=1):t&&("="===l?(t=5,e=r,r=""):"/"===l&&(t<5||">"===n[h][i+1])?(c(),3===t&&(a=a[0]),t=a,(a=a[0]).push(this.apply(null,t.slice(1))),t=0):" "===l||"\t"===l||"\n"===l||"\r"===l?(c(),t=2):r+=l),3===t&&"!--"===r&&(t=4,a=a[0]);}return c(),a.length>2?a.slice(1):a[1]}

/**
 * Trouve la position de l'élément par rapport au haut de la page de manière recursive
 *
 * @param {HTMLElement} element
 */

function offsetTop(element) {
  let top = element.offsetTop;

  while (element = element.offsetParent) {
    top += element.offsetTop;
  }

  return top;
}
/**
 * Crée un élément HTML
 *
 * Cette fonction ne couvre que les besoins de l'application, jsx-dom pourrait remplacer cette fonction
 *
 * @param {string} tagName
 * @param {object} attributes
 * @param {...HTMLElement|string} children
 * @return HTMLElement
 */

function createElement(tagName, attributes = {}, ...children) {
  if (typeof tagName === 'function') {
    return tagName(attributes);
  }

  const svgTags = ['svg', 'use', 'path', 'circle', 'g']; // On construit l'élément

  const e = !svgTags.includes(tagName) ? document.createElement(tagName) : document.createElementNS('http://www.w3.org/2000/svg', tagName); // On lui associe les bons attributs

  for (const k of Object.keys(attributes || {})) {
    if (typeof attributes[k] === 'function' && k.startsWith('on')) {
      e.addEventListener(k.substr(2).toLowerCase(), attributes[k]);
    } else if (k === 'xlink:href') {
      e.setAttributeNS('http://www.w3.org/1999/xlink', 'href', attributes[k]);
    } else {
      e.setAttribute(k, attributes[k]);
    }
  } // On aplatit les enfants


  children = children.reduce((acc, child) => {
    return Array.isArray(child) ? [...acc, ...child] : [...acc, child];
  }, []); // On ajoute les enfants à l'élément

  for (const child of children) {
    if (typeof child === 'string' || typeof child === 'number') {
      e.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement || child instanceof SVGElement) {
      e.appendChild(child);
    } else {
      console.error("Impossible d'ajouter l'élément", child, typeof child);
    }
  }

  return e;
}
/**
 * CreateElement version Tagged templates
 * @type {(strings: TemplateStringsArray, ...values: any[]) => (HTMLElement[] | HTMLElement)}
 */

const html = htm.bind(createElement);
/**
 * Transform une chaine en élément DOM
 * @param {string} str
 * @return {DocumentFragment}
 */

function strToDom(str) {
  return document.createRange().createContextualFragment(str).firstChild;
}
/**
 *
 * @param {HTMLElement|Document|Node} element
 * @param {string} selector
 * @return {null|HTMLElement}
 */

function closest(element, selector) {
  for (; element && element !== document; element = element.parentNode) {
    if (element.matches(selector)) return element;
  }

  return null;
}
/**
 * Génère une classe à partir de différentes variables
 *
 * @param  {...string|null} classnames
 */

function classNames(...classnames) {
  return classnames.filter(classname => classname !== null && classname !== false).join(' ');
}

/**
 * Debounce un callback
 */
function debounce(func, wait, immediate) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    }, wait);
    if (immediate && !timeout) func.apply(this, args);
  };
}

// On mémorise si la page précédente avait la vague
let previousPageHadWaves = false;
/**
 * Custom element pour générer les vagues sous le header
 *
 * @property {ShadowRoot} root
 * @property {HTMLElement|null} target
 * @property {HTMLElement} container
 * @property {HTMLElement} waves
 * @property {string} position
 */

class Waves extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({
      mode: 'open'
    });
    this.matchTarget = this.matchTarget.bind(this);
    this.onResize = debounce(this.onResize.bind(this), 500);
  }

  connectedCallback() {
    const className = previousPageHadWaves === true ? 'no-animation' : '';
    const target = document.querySelector(this.getAttribute('target'));
    const image = this.backgroundImage();
    const opacity = image ? '.9' : '1';
    previousPageHadWaves = true;
    document.querySelector('.header').classList.add('is-inversed');
    this.target = target ? document.querySelector(this.getAttribute('target')) : null;
    this.position = this.getAttribute('position') || 'center';
    this.root.innerHTML = `
      <style>
      img {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 1;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        object-fit: cover;
        opacity: 0;
        transition: .3s;
      }
      .waves-container {
        opacity: 1!important;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        overflow: hidden;
        z-index: -1;
        height: 0;
        box-sizing: content-box;
        padding-bottom: var(--wave-height, 235px);
        animation: containerIn .4s;
      }
      .waves-container.no-animation * {
        animation: none!important;
      }
      .waves-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
        background: linear-gradient(to bottom, var(--contrast), var(--contrast));
        opacity: ${opacity};
      }
      .waves {
        position: absolute;
        left: 50%;
        right: 0;
        z-index: 3;
        bottom: 0;
        width: 100vw;
        height: auto;
        min-width: 1440px;
        transform: translateX(-50%);
        max-height: var(--wave-height, 235px);
      }
      .waves path {
        animation: waveIn .7s both;
      }
      .waves path:last-child {
        animation: none;
      }
      @keyframes waveIn {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0px);
        }
      }
      @keyframes containerIn {
        from {
            opacity: 0;
            transform: translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateY(0px);
        }
      }
      </style>
      <div class="waves-container ${className}">
        <div class="waves-background"></div>
        ${image}
        <svg class="waves" xmlns="http://www.w3.org/2000/svg" style="isolation:isolate" preserveAspectRatio="none" viewBox="5978 129.24 1440 259.76">
          <defs>
            <clipPath id="a">
              <path d="M5978 129.24h1440V389H5978z"/>
            </clipPath>
          </defs>
          <g fill="#FFF" clip-path="url(#a)">
            <path style="animation-delay: .2s" d="M5978 153.77c166.44 0 358.45 11.66 755.24 138.08 381.36 121.5 562.3 105.94 684.76 75.81 0-15.48-.02-54.72-.1-155.11-137.43 39.67-283.82 106.09-717.65 27.58-407.86-73.8-571.8-93.89-721.75-93.89l-.5 7.53z" fill-opacity=".1"/>
            <path style="animation-delay: .4s" d="M5978 153.77c166.44 0 358.45 11.66 755.24 138.08 381.36 121.5 562.3 105.94 684.76 75.81l-.04-53.2-1.54.37c-122.36 30.1-294.49 72.46-680.18-34.53C6334.99 169 6181.93 151.26 5978 151.26v2.51z" fill-opacity=".1"/>
            <path d="M7418 367.66V389H5978V153.77c166.44 0 358.45 11.66 755.24 138.08C6965.46 365.84 7123.37 389 7239 389c74.27 0 131.1-9.56 178.99-21.34q0-70.8 0 0z" style="fill: var(--background);"/>
          </g>
        </svg>
    </div>
    `;
    this.container = this.root.querySelector('.waves-container');
    this.waves = this.root.querySelector('.waves');

    if (image) {
      this.root.querySelector('img').addEventListener('load', e => {
        e.currentTarget.style.opacity = 1;
      });
    }

    window.requestAnimationFrame(this.matchTarget);
    window.addEventListener('resize', this.onResize);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.onResize);
  }
  /**
   * @return {string|null}
   */


  backgroundImage() {
    if (this.getAttribute('background')) {
      return `<img src="${this.getAttribute('background')}" alt=""/>`;
    }

    return null;
  }
  /**
   * Positionne la vague pour qu'elle arrive au milieu de l'élément qui est la cible
   */


  matchTarget() {
    if (this.target === null) {
      return;
    }

    let top = offsetTop(this.target);
    const height = this.target.offsetHeight;

    if (this.position === 'center') {
      top = top + height / 2 - 117;
    } else if (this.position === 'bottom') {
      top = top + height;
      this.container.style.boxSizing = 'border-box';
    }

    this.container.style.height = `${top}px`;
  }

  onResize() {
    this.matchTarget();
  }

}

/**
 * Renvoie la hauteur de la fenêtre
 *
 * @return {number}
 */
function windowHeight() {
  return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}

/**
 * Masque un élément avec un effet de repli
 * @param {HTMLElement} element
 * @param {Number} duration
 * @returns {Promise<boolean>}
 */

function slideUp(element, duration = 500) {
  return new Promise(resolve => {
    element.style.height = `${element.offsetHeight}px`;
    element.style.transitionProperty = 'height, margin, padding';
    element.style.transitionDuration = `${duration}ms`;
    element.offsetHeight; // eslint-disable-line no-unused-expressions

    element.style.overflow = 'hidden';
    element.style.height = 0;
    element.style.paddingTop = 0;
    element.style.paddingBottom = 0;
    element.style.marginTop = 0;
    element.style.marginBottom = 0;
    window.setTimeout(() => {
      element.style.display = 'none';
      element.style.removeProperty('height');
      element.style.removeProperty('padding-top');
      element.style.removeProperty('padding-bottom');
      element.style.removeProperty('margin-top');
      element.style.removeProperty('margin-bottom');
      element.style.removeProperty('overflow');
      element.style.removeProperty('transition-duration');
      element.style.removeProperty('transition-property');
      resolve(element);
    }, duration);
  });
}
/**
 * Masque un élément avec un effet de repli
 * @param {HTMLElement} element
 * @param {Number} duration
 * @returns {Promise<boolean>}
 */

async function slideUpAndRemove(element, duration = 500) {
  const r = await slideUp(element, duration);
  element.parentNode.removeChild(element);
  return r;
}
/**
 * Affiche un élément avec un effet de dépliement
 * @param {HTMLElement} element
 * @param {Number} duration
 * @returns {Promise<boolean>}
 */

function slideDown(element, duration = 500) {
  return new Promise(resolve => {
    element.style.removeProperty('display');
    let display = window.getComputedStyle(element).display;
    if (display === 'none') display = 'block';
    element.style.display = display;
    const height = element.offsetHeight;
    element.style.overflow = 'hidden';
    element.style.height = 0;
    element.style.paddingTop = 0;
    element.style.paddingBottom = 0;
    element.style.marginTop = 0;
    element.style.marginBottom = 0;
    element.offsetHeight; // eslint-disable-line no-unused-expressions

    element.style.transitionProperty = 'height, margin, padding';
    element.style.transitionDuration = `${duration}ms`;
    element.style.height = `${height}px`;
    element.style.removeProperty('padding-top');
    element.style.removeProperty('padding-bottom');
    element.style.removeProperty('margin-top');
    element.style.removeProperty('margin-bottom');
    window.setTimeout(() => {
      element.style.removeProperty('height');
      element.style.removeProperty('overflow');
      element.style.removeProperty('transition-duration');
      element.style.removeProperty('transition-property');
      resolve(element);
    }, duration);
  });
}
/**
 * Scroll vers l'éménet en le plaçant au centre de la fenêtre si il n'est pas trop grand
 *
 * @param {HTMLElement|null} element
 */

function scrollTo(element) {
  if (element === null) {
    return;
  }

  const elementOffset = offsetTop(element);
  const elementHeight = element.getBoundingClientRect().height;
  const viewHeight = windowHeight();
  let top = elementOffset - 100;

  if (elementHeight <= viewHeight) {
    top = elementOffset - (viewHeight - elementHeight) / 2;
  }

  window.scrollTo({
    top,
    left: 0,
    behavior: 'smooth'
  });
}

class Alert extends HTMLElement {
  constructor({
    type,
    message
  } = {}) {
    super();

    if (type !== undefined) {
      this.type = type;
    }

    if (this.type === 'error' || this.type === null) {
      this.type = 'danger';
    }

    this.message = message;
    this.close = this.close.bind(this);
  }

  connectedCallback() {
    this.type = this.type || this.getAttribute('type') || 'error';
    const text = this.innerHTML;
    const duration = this.getAttribute('duration');
    let progressBar = '';

    if (duration !== null) {
      progressBar = `<div class="alert__progress" style="animation-duration: ${duration}s">`;
      window.setTimeout(this.close, duration * 1000);
    }

    this.innerHTML = `<div class="alert alert-${this.type}">
        <svg class="icon icon-${this.icon}">
          <use xlink:href="/sprite.svg#${this.icon}"></use>
        </svg>
        <div>
          ${this.message || text}
        </div>
        <button class="alert-close">
          <svg class="icon">
            <use xlink:href="/sprite.svg#cross"></use>
          </svg>
        </button>
        ${progressBar}
      </div>`;
    this.querySelector('.alert-close').addEventListener('click', e => {
      e.preventDefault();
      this.close();
    });
  }

  close() {
    const element = this.querySelector('.alert');
    element.classList.add('out');
    window.setTimeout(async () => {
      await slideUp(element);
      this.parentElement.removeChild(this);
      this.dispatchEvent(new CustomEvent('close'));
    }, 500);
  }

  get icon() {
    if (this.type === 'danger') {
      return 'warning';
    } else if (this.type === 'success') {
      return 'check';
    }

    return this.type;
  }

}
class FloatingAlert extends Alert {
  constructor(options = {}) {
    super(options);
  }

  connectedCallback() {
    super.connectedCallback();
    this.classList.add('is-floating');
  }

}

/**
 * @property {HTMLSpanElement} switch
 */
class Switch extends HTMLInputElement {
  connectedCallback() {
    if (this.nextElementSibling === null || this.nextElementSibling.tagName !== 'LABEL') {
      console.error('Impossible de greffer le switch');
      return;
    }

    this.parentElement.classList.add('form-switch');
    this.parentElement.classList.remove('form-check');
    this.switch = document.createElement('span');
    this.switch.classList.add('switch');
    this.nextElementSibling.prepend(this.switch);
  }

  disconnectedCallback() {
    if (this.parentElement) {
      this.parentElement.classList.remove('form-switch');
    }

    this.switch.parentElement.remove(this.switch);
  }

}

class Modal extends HTMLElement {
  constructor() {
    super();
    this.onEscapeKey = this.onEscapeKey.bind(this);
    this.close = this.close.bind(this);
  }

  connectedCallback() {
    this.addEventListener('click', this.close.bind(this));

    if (this.children.length > 0) {
      this.children[0].addEventListener('click', e => {
        e.stopPropagation();
      });
    }

    window.addEventListener('keyup', this.onEscapeKey);
  }

  disconnectedCallback() {
    window.removeEventListener('keyup', this.onEscapeKey);
  }

  onEscapeKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  }

  close() {
    this.classList.add('is-closing');
    window.setTimeout(() => {
      this.parentElement.removeChild(this);
    }, 500);
  }

}

var n,u,i,t,r,o,f={},e=[],c=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;function s(n,l){for(var u in l)n[u]=l[u];return n}function a(n){var l=n.parentNode;l&&l.removeChild(n);}function v(n,l,u){var i,t=arguments,r={};for(i in l)"key"!==i&&"ref"!==i&&(r[i]=l[i]);if(arguments.length>3)for(u=[u],i=3;i<arguments.length;i++)u.push(t[i]);if(null!=u&&(r.children=u),"function"==typeof n&&null!=n.defaultProps)for(i in n.defaultProps)void 0===r[i]&&(r[i]=n.defaultProps[i]);return h(n,r,l&&l.key,l&&l.ref,null)}function h(l,u,i,t,r){var o={type:l,props:u,key:i,ref:t,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,constructor:void 0,__v:r};return null==r&&(o.__v=o),n.vnode&&n.vnode(o),o}function p(n){return n.children}function d(n,l){this.props=n,this.context=l;}function _(n,l){if(null==l)return n.__?_(n.__,n.__.__k.indexOf(n)+1):null;for(var u;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e)return u.__e;return "function"==typeof n.type?_(n):null}function k(n){var l,u;if(null!=(n=n.__)&&null!=n.__c){for(n.__e=n.__c.base=null,l=0;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e){n.__e=n.__c.base=u.__e;break}return k(n)}}function w(l){(!l.__d&&(l.__d=!0)&&u.push(l)&&!m.__r++||t!==n.debounceRendering)&&((t=n.debounceRendering)||i)(m);}function m(){for(var n;m.__r=u.length;)n=u.sort(function(n,l){return n.__v.__b-l.__v.__b}),u=[],n.some(function(n){var l,u,i,t,r,o,f;n.__d&&(o=(r=(l=n).__v).__e,(f=l.__P)&&(u=[],(i=s({},r)).__v=i,t=T(f,r,i,l.__n,void 0!==f.ownerSVGElement,null,u,null==o?_(r):o),$(u,r),t!=o&&k(r)));});}function g(n,l,u,i,t,r,o,c,s,v){var y,d,k,w,m,g,b,A=i&&i.__k||e,P=A.length;for(s==f&&(s=null!=o?o[0]:P?_(i,0):null),u.__k=[],y=0;y<l.length;y++)if(null!=(w=u.__k[y]=null==(w=l[y])||"boolean"==typeof w?null:"string"==typeof w||"number"==typeof w?h(null,w,null,null,w):Array.isArray(w)?h(p,{children:w},null,null,null):null!=w.__e||null!=w.__c?h(w.type,w.props,w.key,null,w.__v):w)){if(w.__=u,w.__b=u.__b+1,null===(k=A[y])||k&&w.key==k.key&&w.type===k.type)A[y]=void 0;else for(d=0;d<P;d++){if((k=A[d])&&w.key==k.key&&w.type===k.type){A[d]=void 0;break}k=null;}m=T(n,w,k=k||f,t,r,o,c,s,v),(d=w.ref)&&k.ref!=d&&(b||(b=[]),k.ref&&b.push(k.ref,null,w),b.push(d,w.__c||m,w)),null!=m?(null==g&&(g=m),s=x(n,w,k,A,o,m,s),"option"==u.type?n.value="":"function"==typeof u.type&&(u.__d=s)):s&&k.__e==s&&s.parentNode!=n&&(s=_(k));}if(u.__e=g,null!=o&&"function"!=typeof u.type)for(y=o.length;y--;)null!=o[y]&&a(o[y]);for(y=P;y--;)null!=A[y]&&I(A[y],A[y]);if(b)for(y=0;y<b.length;y++)H(b[y],b[++y],b[++y]);}function b(n){return null==n||"boolean"==typeof n?[]:Array.isArray(n)?e.concat.apply([],n.map(b)):[n]}function x(n,l,u,i,t,r,o){var f,e,c;if(void 0!==l.__d)f=l.__d,l.__d=void 0;else if(t==u||r!=o||null==r.parentNode)n:if(null==o||o.parentNode!==n)n.appendChild(r),f=null;else {for(e=o,c=0;(e=e.nextSibling)&&c<i.length;c+=2)if(e==r)break n;n.insertBefore(r,o),f=o;}return void 0!==f?f:r.nextSibling}function A(n,l,u,i,t){var r;for(r in u)"children"===r||"key"===r||r in l||C(n,r,null,u[r],i);for(r in l)t&&"function"!=typeof l[r]||"children"===r||"key"===r||"value"===r||"checked"===r||u[r]===l[r]||C(n,r,l[r],u[r],i);}function P(n,l,u){"-"===l[0]?n.setProperty(l,u):n[l]="number"==typeof u&&!1===c.test(l)?u+"px":null==u?"":u;}function C(n,l,u,i,t){var r,o,f,e,c;if(t?"className"===l&&(l="class"):"class"===l&&(l="className"),"style"===l)if(r=n.style,"string"==typeof u)r.cssText=u;else {if("string"==typeof i&&(r.cssText="",i=null),i)for(e in i)u&&e in u||P(r,e,"");if(u)for(c in u)i&&u[c]===i[c]||P(r,c,u[c]);}else "o"===l[0]&&"n"===l[1]?(o=l!==(l=l.replace(/Capture$/,"")),f=l.toLowerCase(),l=(f in n?f:l).slice(2),u?(i||n.addEventListener(l,N,o),(n.l||(n.l={}))[l]=u):n.removeEventListener(l,N,o)):"list"!==l&&"tagName"!==l&&"form"!==l&&"type"!==l&&"size"!==l&&!t&&l in n?n[l]=null==u?"":u:"function"!=typeof u&&"dangerouslySetInnerHTML"!==l&&(l!==(l=l.replace(/^xlink:?/,""))?null==u||!1===u?n.removeAttributeNS("http://www.w3.org/1999/xlink",l.toLowerCase()):n.setAttributeNS("http://www.w3.org/1999/xlink",l.toLowerCase(),u):null==u||!1===u&&!/^ar/.test(l)?n.removeAttribute(l):n.setAttribute(l,u));}function N(l){this.l[l.type](n.event?n.event(l):l);}function z(n,l,u){var i,t;for(i=0;i<n.__k.length;i++)(t=n.__k[i])&&(t.__=n,t.__e&&("function"==typeof t.type&&t.__k.length>1&&z(t,l,u),l=x(u,t,t,n.__k,null,t.__e,l),"function"==typeof n.type&&(n.__d=l)));}function T(l,u,i,t,r,o,f,e,c){var a,v,h,y,_,k,w,m,b,x,A,P=u.type;if(void 0!==u.constructor)return null;(a=n.__b)&&a(u);try{n:if("function"==typeof P){if(m=u.props,b=(a=P.contextType)&&t[a.__c],x=a?b?b.props.value:a.__:t,i.__c?w=(v=u.__c=i.__c).__=v.__E:("prototype"in P&&P.prototype.render?u.__c=v=new P(m,x):(u.__c=v=new d(m,x),v.constructor=P,v.render=L),b&&b.sub(v),v.props=m,v.state||(v.state={}),v.context=x,v.__n=t,h=v.__d=!0,v.__h=[]),null==v.__s&&(v.__s=v.state),null!=P.getDerivedStateFromProps&&(v.__s==v.state&&(v.__s=s({},v.__s)),s(v.__s,P.getDerivedStateFromProps(m,v.__s))),y=v.props,_=v.state,h)null==P.getDerivedStateFromProps&&null!=v.componentWillMount&&v.componentWillMount(),null!=v.componentDidMount&&v.__h.push(v.componentDidMount);else {if(null==P.getDerivedStateFromProps&&m!==y&&null!=v.componentWillReceiveProps&&v.componentWillReceiveProps(m,x),!v.__e&&null!=v.shouldComponentUpdate&&!1===v.shouldComponentUpdate(m,v.__s,x)||u.__v===i.__v){v.props=m,v.state=v.__s,u.__v!==i.__v&&(v.__d=!1),v.__v=u,u.__e=i.__e,u.__k=i.__k,v.__h.length&&f.push(v),z(u,e,l);break n}null!=v.componentWillUpdate&&v.componentWillUpdate(m,v.__s,x),null!=v.componentDidUpdate&&v.__h.push(function(){v.componentDidUpdate(y,_,k);});}v.context=x,v.props=m,v.state=v.__s,(a=n.__r)&&a(u),v.__d=!1,v.__v=u,v.__P=l,a=v.render(v.props,v.state,v.context),v.state=v.__s,null!=v.getChildContext&&(t=s(s({},t),v.getChildContext())),h||null==v.getSnapshotBeforeUpdate||(k=v.getSnapshotBeforeUpdate(y,_)),A=null!=a&&a.type==p&&null==a.key?a.props.children:a,g(l,Array.isArray(A)?A:[A],u,i,t,r,o,f,e,c),v.base=u.__e,v.__h.length&&f.push(v),w&&(v.__E=v.__=null),v.__e=!1;}else null==o&&u.__v===i.__v?(u.__k=i.__k,u.__e=i.__e):u.__e=j(i.__e,u,i,t,r,o,f,c);(a=n.diffed)&&a(u);}catch(l){u.__v=null,n.__e(l,u,i);}return u.__e}function $(l,u){n.__c&&n.__c(u,l),l.some(function(u){try{l=u.__h,u.__h=[],l.some(function(n){n.call(u);});}catch(l){n.__e(l,u.__v);}});}function j(n,l,u,i,t,r,o,c){var s,a,v,h,y,p=u.props,d=l.props;if(t="svg"===l.type||t,null!=r)for(s=0;s<r.length;s++)if(null!=(a=r[s])&&((null===l.type?3===a.nodeType:a.localName===l.type)||n==a)){n=a,r[s]=null;break}if(null==n){if(null===l.type)return document.createTextNode(d);n=t?document.createElementNS("http://www.w3.org/2000/svg",l.type):document.createElement(l.type,d.is&&{is:d.is}),r=null,c=!1;}if(null===l.type)p!==d&&n.data!=d&&(n.data=d);else {if(null!=r&&(r=e.slice.call(n.childNodes)),v=(p=u.props||f).dangerouslySetInnerHTML,h=d.dangerouslySetInnerHTML,!c){if(null!=r)for(p={},y=0;y<n.attributes.length;y++)p[n.attributes[y].name]=n.attributes[y].value;(h||v)&&(h&&v&&h.__html==v.__html||(n.innerHTML=h&&h.__html||""));}A(n,d,p,t,c),h?l.__k=[]:(s=l.props.children,g(n,Array.isArray(s)?s:[s],l,u,i,"foreignObject"!==l.type&&t,r,o,f,c)),c||("value"in d&&void 0!==(s=d.value)&&s!==n.value&&C(n,"value",s,p.value,!1),"checked"in d&&void 0!==(s=d.checked)&&s!==n.checked&&C(n,"checked",s,p.checked,!1));}return n}function H(l,u,i){try{"function"==typeof l?l(u):l.current=u;}catch(l){n.__e(l,i);}}function I(l,u,i){var t,r,o;if(n.unmount&&n.unmount(l),(t=l.ref)&&(t.current&&t.current!==l.__e||H(t,null,u)),i||"function"==typeof l.type||(i=null!=(r=l.__e)),l.__e=l.__d=void 0,null!=(t=l.__c)){if(t.componentWillUnmount)try{t.componentWillUnmount();}catch(l){n.__e(l,u);}t.base=t.__P=null;}if(t=l.__k)for(o=0;o<t.length;o++)t[o]&&I(t[o],u,i);null!=r&&a(r);}function L(n,l,u){return this.constructor(n,u)}function M(l,u,i){var t,o,c;n.__&&n.__(l,u),o=(t=i===r)?null:i&&i.__k||u.__k,l=v(p,null,[l]),c=[],T(u,(t?u:i||u).__k=l,o||f,f,void 0!==u.ownerSVGElement,i&&!t?[i]:o?null:u.childNodes.length?e.slice.call(u.childNodes):null,c,i||f,t),$(c,l);}function O(n,l){M(n,l,r);}function S(n,l){var u,i;for(i in l=s(s({},n.props),l),arguments.length>2&&(l.children=e.slice.call(arguments,2)),u={},l)"key"!==i&&"ref"!==i&&(u[i]=l[i]);return h(n.type,u,l.key||n.key,l.ref||n.ref,null)}function q(n){var l={},u={__c:"__cC"+o++,__:n,Consumer:function(n,l){return n.children(l)},Provider:function(n){var i,t=this;return this.getChildContext||(i=[],this.getChildContext=function(){return l[u.__c]=t,l},this.shouldComponentUpdate=function(n){t.props.value!==n.value&&i.some(function(l){l.context=n.value,w(l);});},this.sub=function(n){i.push(n);var l=n.componentWillUnmount;n.componentWillUnmount=function(){i.splice(i.indexOf(n),1),l&&l.call(n);};}),n.children}};return u.Consumer.contextType=u,u.Provider.__=u,u}n={__e:function(n,l){for(var u,i;l=l.__;)if((u=l.__c)&&!u.__)try{if(u.constructor&&null!=u.constructor.getDerivedStateFromError&&(i=!0,u.setState(u.constructor.getDerivedStateFromError(n))),null!=u.componentDidCatch&&(i=!0,u.componentDidCatch(n)),i)return w(u.__E=u)}catch(l){n=l;}throw n}},d.prototype.setState=function(n,l){var u;u=this.__s!==this.state?this.__s:this.__s=s({},this.state),"function"==typeof n&&(n=n(u,this.props)),n&&s(u,n),null!=n&&this.__v&&(l&&this.__h.push(l),w(this));},d.prototype.forceUpdate=function(n){this.__v&&(this.__e=!0,n&&this.__h.push(n),w(this));},d.prototype.render=p,u=[],i="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,m.__r=0,r=f,o=0;

/**
 * Vérifie si l'utilisateur est admin
 *
 * @return {boolean}
 */
function isAdmin() {
  return window.grafikart.ADMIN === true;
}
/**
 * Vérifie si l'utilisateur est connecté
 *
 * @return {boolean}
 */

function isAuthenticated() {
  return window.grafikart.USER !== null;
}
/**
 * Vérifie si l'utilisateur est connecté
 *
 * @return {boolean}
 */

function lastNotificationRead() {
  return window.grafikart.NOTIFICATION;
}
/**
 * Vérifie si l'utilisateur connecté correspond à l'id passé en paramètre
 *
 * @param {number} userId
 * @return {boolean}
 */

function canManage(userId) {
  if (isAdmin()) {
    return true;
  }

  if (!userId) {
    return false;
  }

  return window.grafikart.USER === userId;
}

/**
 * Icône basé sur la sprite SVG
 * @param {{name: string}} props
 */
function Icon({
  name
}) {
  const className = `icon icon-${name}`;
  const href = `/sprite.svg#${name}`;
  return v("svg", {
    className: className
  }, v("use", {
    xlinkHref: href
  }));
}

var t$1,u$1,r$1,o$1=0,i$1=[],c$1=n.__r,f$1=n.diffed,e$1=n.__c,a$1=n.unmount;function v$1(t,r){n.__h&&n.__h(u$1,t,o$1||r),o$1=0;var i=u$1.__H||(u$1.__H={__:[],__h:[]});return t>=i.__.length&&i.__.push({}),i.__[t]}function m$1(n){return o$1=1,p$1(k$1,n)}function p$1(n,r,o){var i=v$1(t$1++,2);return i.t=n,i.__c||(i.__c=u$1,i.__=[o?o(r):k$1(void 0,r),function(n){var t=i.t(i.__[0],n);i.__[0]!==t&&(i.__=[t,i.__[1]],i.__c.setState({}));}]),i.__}function y(r,o){var i=v$1(t$1++,3);!n.__s&&j$1(i.__H,o)&&(i.__=r,i.__H=o,u$1.__H.__h.push(i));}function l(r,o){var i=v$1(t$1++,4);!n.__s&&j$1(i.__H,o)&&(i.__=r,i.__H=o,u$1.__h.push(i));}function h$1(n){return o$1=5,_$1(function(){return {current:n}},[])}function _$1(n,u){var r=v$1(t$1++,7);return j$1(r.__H,u)?(r.__H=u,r.__h=n,r.__=n()):r.__}function A$1(n,t){return o$1=8,_$1(function(){return n},t)}function F(n){var r=u$1.context[n.__c],o=v$1(t$1++,9);return o.__c=n,r?(null==o.__&&(o.__=!0,r.sub(u$1)),r.props.value):n.__}function q$1(){i$1.some(function(t){if(t.__P)try{t.__H.__h.forEach(b$1),t.__H.__h.forEach(g$1),t.__H.__h=[];}catch(u){return t.__H.__h=[],n.__e(u,t.__v),!0}}),i$1=[];}n.__r=function(n){c$1&&c$1(n),t$1=0;var r=(u$1=n.__c).__H;r&&(r.__h.forEach(b$1),r.__h.forEach(g$1),r.__h=[]);},n.diffed=function(t){f$1&&f$1(t);var u=t.__c;u&&u.__H&&u.__H.__h.length&&(1!==i$1.push(u)&&r$1===n.requestAnimationFrame||((r$1=n.requestAnimationFrame)||function(n){var t,u=function(){clearTimeout(r),x$1&&cancelAnimationFrame(t),setTimeout(n);},r=setTimeout(u,100);x$1&&(t=requestAnimationFrame(u));})(q$1));},n.__c=function(t,u){u.some(function(t){try{t.__h.forEach(b$1),t.__h=t.__h.filter(function(n){return !n.__||g$1(n)});}catch(r){u.some(function(n){n.__h&&(n.__h=[]);}),u=[],n.__e(r,t.__v);}}),e$1&&e$1(t,u);},n.unmount=function(t){a$1&&a$1(t);var u=t.__c;if(u&&u.__H)try{u.__H.__.forEach(b$1);}catch(t){n.__e(t,u.__v);}};var x$1="function"==typeof requestAnimationFrame;function b$1(n){"function"==typeof n.u&&n.u();}function g$1(n){n.u=n.__();}function j$1(n,t){return !n||t.some(function(t,u){return t!==n[u]})}function k$1(n,t){return "function"==typeof t?t(n):t}

function w$1(n,t){for(var e in t)n[e]=t[e];return n}function x$2(n,t){for(var e in n)if("__source"!==e&&!(e in t))return !0;for(var r in t)if("__source"!==r&&n[r]!==t[r])return !0;return !1}var E=function(n){var t,e;function r(t){var e;return (e=n.call(this,t)||this).isPureReactComponent=!0,e}return e=n,(t=r).prototype=Object.create(e.prototype),t.prototype.constructor=t,t.__proto__=e,r.prototype.shouldComponentUpdate=function(n,t){return x$2(this.props,n)||x$2(this.state,t)},r}(d);function C$1(n,t){function e(n){var e=this.props.ref,r=e==n.ref;return !r&&e&&(e.call?e(null):e.current=null),t?!t(this.props,n)||!r:x$2(this.props,n)}function r(t){return this.shouldComponentUpdate=e,v(n,t)}return r.prototype.isReactComponent=!0,r.displayName="Memo("+(n.displayName||n.name)+")",r.t=!0,r}var _$2=n.__b;n.__b=function(n){n.type&&n.type.t&&n.ref&&(n.props.ref=n.ref,n.ref=null),_$2&&_$2(n);};var N$1=n.__e;function U(n){return n&&((n=w$1({},n)).__c=null,n.__k=n.__k&&n.__k.map(U)),n}function M$1(){this.__u=0,this.o=null,this.__b=null;}function j$2(n){var t=n.__.__c;return t&&t.u&&t.u(n)}function O$1(){this.i=null,this.l=null;}n.__e=function(n,t,e){if(n.then)for(var r,o=t;o=o.__;)if((r=o.__c)&&r.__c)return r.__c(n,t.__c);N$1(n,t,e);},(M$1.prototype=new d).__c=function(n,t){var e=this;null==e.o&&(e.o=[]),e.o.push(t);var r=j$2(e.__v),o=!1,u=function(){o||(o=!0,r?r(i):i());};t.__c=t.componentWillUnmount,t.componentWillUnmount=function(){u(),t.__c&&t.__c();};var i=function(){var n;if(!--e.__u)for(e.__v.__k[0]=e.state.u,e.setState({u:e.__b=null});n=e.o.pop();)n.forceUpdate();};e.__u++||e.setState({u:e.__b=e.__v.__k[0]}),n.then(u,u);},M$1.prototype.render=function(n,t){return this.__b&&(this.__v.__k&&(this.__v.__k[0]=U(this.__b)),this.__b=null),[v(p,null,t.u?null:n.children),t.u&&n.fallback]};var P$1=function(n,t,e){if(++e[1]===e[0]&&n.l.delete(t),n.props.revealOrder&&("t"!==n.props.revealOrder[0]||!n.l.size))for(e=n.i;e;){for(;e.length>3;)e.pop()();if(e[1]<e[0])break;n.i=e=e[2];}};(O$1.prototype=new d).u=function(n){var t=this,e=j$2(t.__v),r=t.l.get(n);return r[0]++,function(o){var u=function(){t.props.revealOrder?(r.push(o),P$1(t,n,r)):o();};e?e(u):u();}},O$1.prototype.render=function(n){this.i=null,this.l=new Map;var t=b(n.children);n.revealOrder&&"b"===n.revealOrder[0]&&t.reverse();for(var e=t.length;e--;)this.l.set(t[e],this.i=[1,0,this.i]);return n.children},O$1.prototype.componentDidUpdate=O$1.prototype.componentDidMount=function(){var n=this;n.l.forEach(function(t,e){P$1(n,e,t);});};var W=function(){function n(){}var t=n.prototype;return t.getChildContext=function(){return this.props.context},t.render=function(n){return n.children},n}();function z$1(n){var t=this,e=n.container,r=v(W,{context:t.context},n.vnode);return t.s&&t.s!==e&&(t.v.parentNode&&t.s.removeChild(t.v),I(t.h),t.p=!1),n.vnode?t.p?(e.__k=t.__k,M(r,e),t.__k=e.__k):(t.v=document.createTextNode(""),O("",e),e.appendChild(t.v),t.p=!0,t.s=e,M(r,e,t.v),t.__k=t.v.__k):t.p&&(t.v.parentNode&&t.s.removeChild(t.v),I(t.h)),t.h=r,t.componentWillUnmount=function(){t.v.parentNode&&t.s.removeChild(t.v),I(t.h);},null}function D(n,t){return v(z$1,{vnode:n,container:t})}var H$1=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|fill|flood|font|glyph(?!R)|horiz|marker(?!H|W|U)|overline|paint|stop|strikethrough|stroke|text(?!L)|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;d.prototype.isReactComponent={};var T$1="undefined"!=typeof Symbol&&Symbol.for&&Symbol.for("react.element")||60103;var I$1=n.event;function $$1(n,t){n["UNSAFE_"+t]&&!n[t]&&Object.defineProperty(n,t,{configurable:!1,get:function(){return this["UNSAFE_"+t]},set:function(n){this["UNSAFE_"+t]=n;}});}n.event=function(n){I$1&&(n=I$1(n)),n.persist=function(){};var t=!1,e=!1,r=n.stopPropagation;n.stopPropagation=function(){r.call(n),t=!0;};var o=n.preventDefault;return n.preventDefault=function(){o.call(n),e=!0;},n.isPropagationStopped=function(){return t},n.isDefaultPrevented=function(){return e},n.nativeEvent=n};var q$2={configurable:!0,get:function(){return this.class}},B=n.vnode;n.vnode=function(n){n.$$typeof=T$1;var t=n.type,e=n.props;if(t){if(e.class!=e.className&&(q$2.enumerable="className"in e,null!=e.className&&(e.class=e.className),Object.defineProperty(e,"className",q$2)),"function"!=typeof t){var r,o,u;for(u in e.defaultValue&&void 0!==e.value&&(e.value||0===e.value||(e.value=e.defaultValue),delete e.defaultValue),Array.isArray(e.value)&&e.multiple&&"select"===t&&(b(e.children).forEach(function(n){-1!=e.value.indexOf(n.props.value)&&(n.props.selected=!0);}),delete e.value),e)if(r=H$1.test(u))break;if(r)for(u in o=n.props={},e)o[H$1.test(u)?u.replace(/[A-Z0-9]/,"-$&").toLowerCase():u]=e[u];}!function(t){var e=n.type,r=n.props;if(r&&"string"==typeof e){var o={};for(var u in r)/^on(Ani|Tra|Tou)/.test(u)&&(r[u.toLowerCase()]=r[u],delete r[u]),o[u.toLowerCase()]=u;if(o.ondoubleclick&&(r.ondblclick=r[o.ondoubleclick],delete r[o.ondoubleclick]),o.onbeforeinput&&(r.onbeforeinput=r[o.onbeforeinput],delete r[o.onbeforeinput]),o.onchange&&("textarea"===e||"input"===e.toLowerCase()&&!/^fil|che|ra/i.test(r.type))){var i=o.oninput||"oninput";r[i]||(r[i]=r[o.onchange],delete r[o.onchange]);}}}(),"function"==typeof t&&!t.m&&t.prototype&&($$1(t.prototype,"componentWillMount"),$$1(t.prototype,"componentWillReceiveProps"),$$1(t.prototype,"componentWillUpdate"),t.m=!0);}B&&B(n);};

/**
 *
 * @param {RequestInfo} url
 * @param params
 * @return {Promise<Object>}
 */
async function jsonFetch(url, params = {}) {
  // Si on reçoit un FormData on le convertit en objet
  if (params.body instanceof FormData) {
    params.body = Object.fromEntries(params.body);
  } // Si on reçoit un objet on le convertit en chaine JSON


  if (params.body && typeof params.body === 'object') {
    params.body = JSON.stringify(params.body);
  }

  params = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    ...params
  };
  const response = await fetch(url, params);

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (response.ok) {
    return data;
  }

  throw new ApiError(data);
}
/**
 * Capture un retour d'API
 *
 * @param {function} fn
 */

async function catchViolations(p) {
  try {
    return [await p, null];
  } catch (e) {
    if (e instanceof ApiError) {
      return [null, e.violations];
    }

    throw e;
  }
}
/**
 * Représente une erreur d'API
 * @property {{
 *  violations: {propertyPath: string, message: string}
 * }} data
 */

class ApiError {
  constructor(data) {
    this.data = data;
  } // Récupère la liste de violation pour un champs donnée


  violationsFor(field) {
    return this.data.violations.filter(v => v.propertyPath === field).map(v => v.message);
  }

  get name() {
    return `${this.data.title} ${this.data.detail || ''}`;
  } // Renvoie les violations indexé par propertyPath


  get violations() {
    if (!this.data.violations) {
      return {
        main: `${this.data.title} ${this.data.detail || ''}`
      };
    }

    return this.data.violations.reduce((acc, violation) => {
      if (acc[violation.propertyPath]) {
        acc[violation.propertyPath].push(violation.message);
      } else {
        acc[violation.propertyPath] = [violation.message];
      }

      return acc;
    }, {});
  }

}

class Alert$1 extends HTMLElement {
  constructor({
    type,
    message
  } = {}) {
    super();

    if (type !== undefined) {
      this.type = type;
    }

    if (this.type === 'error' || this.type === null) {
      this.type = 'danger';
    }

    this.message = message;
    this.close = this.close.bind(this);
  }

  connectedCallback() {
    this.type = this.type || this.getAttribute('type') || 'error';
    const text = this.innerHTML;
    const duration = this.getAttribute('duration');
    let progressBar = '';

    if (duration !== null) {
      progressBar = `<div class="alert__progress" style="animation-duration: ${duration}s">`;
      window.setTimeout(this.close, duration * 1000);
    }

    this.innerHTML = `<div class="alert alert-${this.type}">
        <svg class="icon icon-${this.icon}">
          <use xlink:href="/sprite.svg#${this.icon}"></use>
        </svg>
        <div>
          ${this.message || text}
        </div>
        <button class="alert-close">
          <svg class="icon">
            <use xlink:href="/sprite.svg#cross"></use>
          </svg>
        </button>
        ${progressBar}
      </div>`;
    this.querySelector('.alert-close').addEventListener('click', e => {
      e.preventDefault();
      this.close();
    });
  }

  close() {
    const element = this.querySelector('.alert');
    element.classList.add('out');
    window.setTimeout(async () => {
      await slideUp(element);
      this.parentElement.removeChild(this);
      this.dispatchEvent(new CustomEvent('close'));
    }, 500);
  }

  get icon() {
    if (this.type === 'danger') {
      return 'warning';
    } else if (this.type === 'success') {
      return 'check';
    }

    return this.type;
  }

}
class FloatingAlert$1 extends Alert$1 {
  constructor(options = {}) {
    super(options);
  }

  connectedCallback() {
    super.connectedCallback();
    this.classList.add('is-floating');
  }

}
/**
 * Affiche un message flash flottant sur la page
 *
 * @param {string} message
 * @param {string} type
 * @param {number} duration
 */

function flash(message, type = 'success', duration = 2) {
  const alert = new FloatingAlert$1();

  if (duration) {
    alert.setAttribute('duration', duration);
  }

  alert.setAttribute('type', type);
  alert.innerText = message;
  document.body.appendChild(alert);
}

/**
 * Alterne une valeur
 */

function useToggle(initialValue = null) {
  const [value, setValue] = m$1(initialValue);
  return [value, () => setValue(!value)];
}
/**
 * Valeur avec la possibilité de push un valeur supplémentaire
 */

function usePrepend(initialValue = []) {
  const [value, setValue] = m$1(initialValue);
  return [value, item => {
    setValue(v => [item, ...v]);
  }];
}
/**
 * Hook d'effet pour détecter le clique en dehors d'un élément
 */

function useClickOutside(ref, cb) {
  y(() => {
    const escCb = e => {
      if (e.key === 'Escape' && ref.current) {
        cb();
      }
    };

    const clickCb = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        cb();
      }
    };

    document.addEventListener('click', clickCb);
    document.addEventListener('keyup', escCb);
    return function cleanup() {
      document.removeEventListener('click', clickCb);
      document.removeEventListener('keyup', escCb);
    };
  }, [ref, cb]);
}
/**
 * Focus le premier champs dans l'élément correspondant à la ref
 * @param {boolean} focus
 */

function useAutofocus(ref, focus) {
  y(() => {
    if (focus && ref.current) {
      const input = ref.current.querySelector('input, textarea');

      if (input) {
        input.focus();
      }
    }
  }, [focus, ref]);
}
/**
 * Hook faisant un appel fetch et flash en cas d'erreur / succès
 *
 * @param {string} url
 * @param {object} params
 * @return {{data: Object|null, fetch: fetch, loading: boolean, done: boolean}}
 */

function useJsonFetchOrFlash(url, params = {}) {
  const [state, setState] = m$1({
    loading: false,
    data: null,
    done: false
  });

  const fetch = async function () {
    setState(s => ({ ...s,
      loading: true
    }));

    try {
      const response = await jsonFetch(url, params);
      setState(s => ({ ...s,
        loading: false,
        data: response,
        done: true
      }));
    } catch (e) {
      if (e instanceof ApiError) {
        flash(e.name, 'danger', 4);
      } else {
        flash(e, 'danger', 4);
      }
    }

    setState(s => ({ ...s,
      loading: false
    }));
  };

  return { ...state,
    fetch
  };
}
/**
 * useEffect pour une fonction asynchrone
 */

function useAsyncEffect(fn, deps = []) {
  /* eslint-disable */
  y(() => {
    fn();
  }, deps);
  /* eslint-enable */
}

/**
 * Représentation d'un commentaire de l'API
 * @typedef {{id: number, username: string, avatar: string, content: string, createdAt: number, replies: CommentResource[]}} CommentResource
 */

/**
 * @param {string} target
 * @return {Promise<CommentResource[]>}
 */

async function findAllComments(target) {
  return await jsonFetch(`/api/comments?content=${target}`);
}
/**
 * @param {{target: number, username: ?string, email: ?string, content: string}} data
 * @return {Promise<Object>}
 */

async function addComment(body) {
  return jsonFetch('/api/comments', {
    method: 'POST',
    body
  });
}
/**
 * @param {int} id
 * @return {Promise<null>}
 */

async function deleteComment(id) {
  return jsonFetch(`/api/comments/${id}`, {
    method: 'DELETE'
  });
}
/**
 * @param {int} id
 * @param {string} content
 * @return {Promise<CommentResource>}
 */

async function updateComment(id, content) {
  return jsonFetch(`/api/comments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      content
    })
  });
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

/**
 * Loader animé
 */
function Loader({
  className = 'icon',
  ...props
}) {
  return v("spinning-dots", _extends({
    className: className
  }, props));
}

function PrimaryButton({
  children,
  ...props
}) {
  return v(Button, _extends({
    className: "btn-primary"
  }, props), children);
}
function SecondaryButton({
  children,
  ...props
}) {
  return v(Button, _extends({
    className: "btn-secondary"
  }, props), children);
}
/**
 *
 * @param {*} children
 * @param {string} className
 * @param {string} size
 * @param {boolean} loading
 * @param {Object} props
 * @return {*}
 */

function Button({
  children,
  className = '',
  loading = false,
  size,
  ...props
}) {
  return v("button", _extends({
    className: `btn ${className} ${size && `btn-${size}`}`,
    disabled: loading
  }, props), loading && v(Loader, {
    className: "icon"
  }), children);
}

function Stack({
  children,
  gap
}) {
  const style = gap ? `--gap:${gap}` : null;
  return v("div", {
    className: "stack",
    style: style
  }, children);
}
function Flex({
  children,
  gap
}) {
  const style = gap ? `--gap:${gap}` : null;
  return v("div", {
    className: "hstack",
    style: style
  }, children);
}

function PrimaryButton$1({
  children,
  ...props
}) {
  return v(Button$1, _extends({
    className: "btn-primary"
  }, props), children);
}
/**
 *
 * @param {*} children
 * @param {string} className
 * @param {string} size
 * @param {boolean} loading
 * @param {Object} props
 * @return {*}
 */

function Button$1({
  children,
  className = '',
  loading = false,
  size,
  ...props
}) {
  return v("button", _extends({
    className: `btn ${className} ${size && `btn-${size}`}`,
    disabled: loading
  }, props), loading && v(Loader, {
    className: "icon"
  }), children);
}

/**
 * Représente un champs, dans le contexte du formulaire
 *
 * @param type
 * @param name
 * @param onInput
 * @param value
 * @param error
 * @param props
 * @return {*}
 * @constructor
 */

function Field({
  name,
  onInput,
  value,
  error,
  children,
  type = 'text',
  className = '',
  wrapperClass = '',
  ...props
}) {
  // Hooks
  const [dirty, setDirty] = m$1(false);
  const ref = h$1(null);
  useAutofocus(ref, props.autofocus);
  const showError = error && !dirty;

  function handleInput(e) {
    if (dirty === false) {
      setDirty(true);
    }

    if (onInput) {
      onInput(e);
    }
  } // Si le champs a une erreur et n'a pas été modifié


  if (showError) {
    className += ' is-invalid';
  } // Les attributs à passer aux champs


  const attr = {
    name,
    id: name,
    value,
    className,
    onInput: handleInput,
    ...props
  }; // Si l'erreur change on considère le champs comme "clean"

  l(() => {
    if (dirty === true) {
      setDirty(false);
    }
  }, [error, dirty]);
  return v("div", {
    className: `form-group ${wrapperClass}`,
    ref: ref
  }, v("label", {
    htmlFor: name
  }, children), (() => {
    switch (type) {
      case 'textarea':
        return v(FieldTextarea, attr);

      case 'editor':
        return v(FieldEditor, attr);

      default:
        return v(FieldInput, attr);
    }
  })(), showError && v("div", {
    className: "invalid-feedback"
  }, error));
}

function FieldTextarea(props) {
  return v("textarea", props);
}

function FieldInput(props) {
  return v("input", props);
}

function FieldEditor(props) {
  const ref = h$1(null);
  y(() => {
    if (ref.current) {
      ref.current.syncEditor();
    }
  }, [props.value]);
  return v("textarea", _extends({}, props, {
    is: "markdown-editor",
    ref: ref
  }));
}
/**
 * Version contextualisée des champs pour le formulaire
 */


const FormContext = q({
  errors: {},
  loading: false,
  emptyError: () => {}
});
/**
 * Formulaire Ajax
 *
 * @param {object} value Donnée à transmettre au serveur et aux champs
 * @param onChange
 * @param className
 * @param children
 * @param {string} action URL de l'action à appeler pour traiter le formulaire
 * @param {object} data Données à envoyer à l'API et à fusionner avec les données du formulaire
 * @param {string} method Méthode d'envoie des données
 * @param onSuccess Fonction appelée en cas de retour valide de l'API (reçoit les données de l'API en paramètre)
 */

function FetchForm({
  data = {},
  children,
  action,
  className,
  method = 'POST',
  onSuccess = () => {}
}) {
  const [{
    loading,
    errors
  }, setState] = m$1({
    loading: false,
    errors: []
  });
  const mainError = errors.main || null; // Vide l'erreur associée à un champs donnée

  const emptyError = name => {
    if (!errors[name]) return null;
    const newErrors = { ...errors
    };
    delete newErrors[name];
    setState(s => ({ ...s,
      errors: newErrors
    }));
  }; // On soumet le formulaire au travers d'une requête Ajax


  const handleSubmit = async e => {
    e.preventDefault();
    setState({
      loading: true,
      errors: []
    });
    const form = e.target;
    const formData = { ...data,
      ...Object.fromEntries(new FormData(form))
    };

    try {
      const response = await jsonFetch(action, {
        method,
        body: formData
      });
      onSuccess(response);
      form.reset();
    } catch (e) {
      if (e instanceof ApiError) {
        setState(s => ({ ...s,
          errors: e.violations
        }));
      } else if (e.detail) {
        flash(e.detail, 'danger', null);
      } else {
        flash(e, 'danger', null);
        throw e;
      }
    }

    setState(s => ({ ...s,
      loading: false
    }));
  };

  return v(FormContext.Provider, {
    value: {
      loading,
      errors,
      emptyError
    }
  }, v("form", {
    onSubmit: handleSubmit,
    className: className
  }, mainError && v("alert-message", {
    type: "danger",
    onClose: () => emptyError('main'),
    className: "full"
  }, mainError), children));
}
/**
 * Représente un champs, dans le contexte du formulaire
 *
 * @param {string} type
 * @param {string} name
 * @return {*}
 * @constructor
 */

function FormField({
  type = 'text',
  name,
  children,
  ...props
}) {
  const {
    errors,
    emptyError,
    loading
  } = F(FormContext);
  const error = errors[name] || null;
  return v(Field, _extends({
    type: type,
    name: name,
    error: error,
    onInput: () => emptyError(name),
    readonly: loading
  }, props), children);
}
/**
 * Représente un bouton, dans le contexte du formulaire
 *
 * @param children
 * @param props
 * @return {*}
 * @constructor
 */

function FormPrimaryButton({
  children,
  ...props
}) {
  const {
    loading,
    errors
  } = F(FormContext);
  const disabled = loading || Object.keys(errors).filter(k => k !== 'main').length > 0;
  return v(PrimaryButton$1, _extends({
    loading: loading,
    disabled: disabled
  }, props), children);
}

/**
 * Loader animé
 */
function Loader$1({
  className = 'icon',
  ...props
}) {
  return v("spinning-dots", _extends({
    className: className
  }, props));
}

/**
 * Affiche les commentaires associé à un contenu
 *
 * @param {{target: string}} param0
 */

function Comments({
  target
}) {
  const [state, setState] = m$1({
    editing: null,
    // ID du commentaire en cours d'édition
    comments: null,
    // Liste des commentaires
    focus: null,
    // Commentaire à focus
    reply: null // Commentaire auquel on souhaite répondre

  });
  const count = state.comments ? state.comments.length : 0;
  const comments = _$1(() => {
    if (state.comments === null) {
      return null;
    }

    return state.comments.filter(c => c.parent === null).sort((a, b) => b.createdAt - a.createdAt);
  }, [state.comments]); // Trouve les commentaire enfant d'un commentaire

  function repliesFor(comment) {
    return state.comments.filter(c => c.parent === comment.id);
  } // On charge les commentaire dès l'affichage du composant


  useAsyncEffect(async () => {
    const comments = await findAllComments(target);
    setState(s => ({ ...s,
      comments
    }));
  }, [target]); // On focalise se focalise sur un commentaire

  y(() => {
    if (focus) {
      scrollTo(document.getElementById(`c${state.focus}`));
      setState(s => ({ ...s,
        focus: null
      }));
    }
  }, [state.focus]); // On comment l'édition d'un commentaire

  const handleEdit = A$1(comment => {
    setState(s => ({ ...s,
      editing: s.editing === comment.id ? null : comment.id
    }));
  }, []); // On met à jour (via l'API un commentaire)

  const handleUpdate = A$1(async (comment, content) => {
    const newComment = await updateComment(comment.id, content);
    setState(s => ({ ...s,
      editing: null,
      comments: s.comments.map(c => c === comment ? newComment : c)
    }));
  }, []); // On supprime un commentaire

  const handleDelete = A$1(async comment => {
    await deleteComment(comment.id);
    setState(s => ({ ...s,
      comments: s.comments.filter(c => c !== comment)
    }));
  }, []); // On répond à un commentaire

  const handleReply = A$1(comment => {
    setState(s => ({ ...s,
      reply: comment.parent || comment.id
    }));
  }, []);
  const handleCancelReply = A$1(() => {
    setState(s => ({ ...s,
      reply: null
    }));
  }, []); // On crée un nouveau commentaire

  const handleCreate = A$1(async (data, parent) => {
    data = { ...data,
      target,
      parent
    };
    const newComment = await addComment(data);
    setState(s => ({ ...s,
      focus: newComment.id,
      reply: null,
      comments: [newComment, ...s.comments]
    }));
  }, [target]); // On affiche le chargement en attendant

  if (comments === null) {
    return v(Loader$1, null);
  } // On rend la liste des commentaires


  return v("div", {
    className: "comment-area"
  }, v("div", {
    className: "comments__title"
  }, count, " Commentaire", count > 1 ? 's' : ''), v(CommentForm, {
    onSubmit: handleCreate
  }), v("hr", null), v("div", {
    className: "comment-list"
  }, comments.map(comment => v(Comment, {
    key: comment.id,
    comment: comment,
    editing: state.editing === comment.id,
    onEdit: handleEdit,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    onReply: handleReply
  }, repliesFor(comment).map(reply => v(Comment, {
    key: reply.id,
    comment: reply,
    editing: state.editing === reply.id,
    onEdit: handleEdit,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    onReply: handleReply
  })), state.reply === comment.id && v(CommentForm, {
    onSubmit: handleCreate,
    parent: comment.id,
    onCancel: handleCancelReply
  })))));
}
/**
 * Affiche un commentaire
 */

const Comment = C$1(({
  comment,
  editing,
  onEdit,
  onUpdate,
  onDelete,
  onReply,
  children
}) => {
  const anchor = `#c${comment.id}`;
  const canEdit = canManage(comment.userId);
  const className = ['comment'];
  const textarea = h$1(null);
  const [loading, setLoading] = m$1(false);

  function handleEdit(e) {
    e.preventDefault();
    onEdit(comment);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setLoading(true);
    await onUpdate(comment, textarea.current.value);
    setLoading(false);
  }

  async function handleDelete(e) {
    e.preventDefault();

    if (confirm('Voulez vous vraiment supprimer ce commentaire ?')) {
      setLoading(true);
      await onDelete(comment);
    }
  }

  function handleReply(e) {
    e.preventDefault();
    onReply(comment);
  } // On focus automatiquement le champs quand il devient visible


  y(() => {
    if (textarea.current) {
      textarea.current.focus();
    }
  }, [editing]);
  let content = v("div", {
    onDoubleClick: handleEdit
  }, comment.content);

  if (editing) {
    content = v("form", {
      onSubmit: handleUpdate,
      className: "form-group stack"
    }, v("textarea", {
      is: "textarea-autogrow",
      ref: textarea,
      defaultValue: comment.content
    }), v(Flex, null, v(PrimaryButton, {
      type: "submit",
      loading: loading
    }, "Modifier"), v(SecondaryButton, {
      type: "reset",
      onClick: handleEdit
    }, "Annuler")));
  }

  if (loading) {
    className.push('is-loading');
  }

  return v("div", {
    className: className.join(' '),
    id: `c${comment.id}`
  }, v("img", {
    src: comment.avatar,
    alt: "",
    className: "comment__avatar"
  }), v("div", {
    className: "comment__meta"
  }, v("div", {
    className: "comment__author"
  }, comment.username), v("div", {
    className: "comment__actions"
  }, v("span", {
    className: "comment__date"
  }, v("time-ago", {
    time: comment.createdAt
  })), v("a", {
    href: anchor,
    onClick: handleReply
  }, v(Icon, {
    name: "reply"
  }), "R\xE9pondre"), canEdit && v("a", {
    href: anchor,
    onClick: handleEdit
  }, v(Icon, {
    name: "edit"
  }), "Editer"), canEdit && v("a", {
    href: anchor,
    onClick: handleDelete,
    className: "text-danger"
  }, v(Icon, {
    name: "trash"
  }), "Supprimer"))), v("div", {
    className: "comment__content"
  }, content), v("div", {
    className: "comment__replies"
  }, children));
});
/**
 * Formulaire de commentaire
 * @params {{onSubmit: function, parent: number}} props
 */

function CommentForm({
  onSubmit,
  parent,
  onCancel = null
}) {
  const [loading, setLoading] = m$1(false);
  const [errors, setErrors] = m$1({});
  const ref = h$1(null);
  const handleSubmit = A$1(async e => {
    const form = e.target;
    e.preventDefault();
    setLoading(true);
    const errors = (await catchViolations(onSubmit(Object.fromEntries(new FormData(form)), parent)))[1];

    if (errors) {
      setErrors(errors);
    } else {
      form.reset();
    }

    setLoading(false);
  }, [onSubmit, parent]);

  const handleCancel = function (e) {
    e.preventDefault();
    onCancel();
  };

  y(() => {
    if (parent && ref.current) {
      scrollTo(ref.current);
    }
  }, [parent]);
  return v("form", {
    className: "grid",
    onSubmit: handleSubmit,
    ref: ref
  }, !isAuthenticated() && v(p, null, v(Field, {
    name: "username",
    error: errors.username,
    required: true
  }, "Nom d'utilisateur"), v(Field, {
    name: "email",
    type: "email",
    required: true,
    error: errors.email
  }, "Email")), v("div", {
    className: "full"
  }, v(Field, {
    type: "textarea",
    name: "content",
    error: errors.content,
    required: true
  }, "Votre message")), v(Flex, {
    className: "full"
  }, v(PrimaryButton, {
    type: "submit",
    loading: loading
  }, "Envoyer"), onCancel && v(SecondaryButton, {
    onClick: handleCancel
  }, "Annuler")));
}

/**
 * @property {IntersectionObserver} observer
 */

class Comments$1 extends HTMLElement {
  connectedCallback() {
    this.observer = new IntersectionObserver(observables => {
      observables.forEach(observable => {
        // L'élément devient visible
        if (observable.intersectionRatio > 0) {
          this.attachComments();
        }
      });
    });
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer.disconnect();
  }

  attachComments() {
    const target = this.getAttribute('target');
    M(v(Comments, {
      target
    }), this);
    this.observer.disconnect();
  }

}

const terms = [{
  time: 45,
  divide: 60,
  text: "moins d'une minute"
}, {
  time: 90,
  divide: 60,
  text: 'environ une minute'
}, {
  time: 45 * 60,
  divide: 60,
  text: '%d minutes'
}, {
  time: 90 * 60,
  divide: 60 * 60,
  text: 'environ une heure'
}, {
  time: 24 * 60 * 60,
  divide: 60 * 60,
  text: '%d heures'
}, {
  time: 42 * 60 * 60,
  divide: 24 * 60 * 60,
  text: 'environ un jour'
}, {
  time: 30 * 24 * 60 * 60,
  divide: 24 * 60 * 60,
  text: '%d jours'
}, {
  time: 45 * 24 * 60 * 60,
  divide: 24 * 60 * 60 * 30,
  text: 'environ un mois'
}, {
  time: 365 * 24 * 60 * 60,
  divide: 24 * 60 * 60 * 30,
  text: '%d mois'
}, {
  time: 365 * 1.5 * 24 * 60 * 60,
  divide: 24 * 60 * 60 * 365,
  text: 'environ un an'
}, {
  time: Infinity,
  divide: 24 * 60 * 60 * 365,
  text: '%d ans'
}];
/**
 * Custom element permettant d'afficher une date de manière relative
 *
 * @property {number} timer
 */

class TimeAgo extends HTMLElement {
  connectedCallback() {
    const timestamp = parseInt(this.getAttribute('time'), 10) * 1000;
    const date = new Date(timestamp);
    this.updateText(date);
  }

  disconnectedCallback() {
    window.clearTimeout(this.timer);
  }

  updateText(date) {
    const seconds = (new Date().getTime() - date.getTime()) / 1000;
    let term = null;
    const prefix = this.getAttribute('prefix') || 'Il y a';

    for (term of terms) {
      if (Math.abs(seconds) < term.time) {
        break;
      }
    }

    if (seconds >= 0) {
      this.innerHTML = `${prefix} ${term.text.replace('%d', Math.round(seconds / term.divide))}`;
    } else {
      this.innerHTML = `Dans ${term.text.replace('%d', Math.round(Math.abs(seconds) / term.divide))}`;
    }

    let nextTick = Math.abs(seconds) % term.divide;

    if (nextTick === 0) {
      nextTick = term.divide;
    }

    if (nextTick > 2147482) {
      return;
    }

    this.timer = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        this.updateText(date);
      });
    }, 1000 * nextTick);
  }

}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var choices = createCommonjsModule(function (module, exports) {
/*! choices.js v9.0.1 | © 2019 Josh Johnson | https://github.com/jshjohnson/Choices#readme */
(function webpackUniversalModuleDefinition(root, factory) {
	module.exports = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/public/assets/scripts/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {


var isMergeableObject = function isMergeableObject(value) {
	return isNonNullObject(value)
		&& !isSpecial(value)
};

function isNonNullObject(value) {
	return !!value && typeof value === 'object'
}

function isSpecial(value) {
	var stringValue = Object.prototype.toString.call(value);

	return stringValue === '[object RegExp]'
		|| stringValue === '[object Date]'
		|| isReactElement(value)
}

// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
	return value.$$typeof === REACT_ELEMENT_TYPE
}

function emptyTarget(val) {
	return Array.isArray(val) ? [] : {}
}

function cloneUnlessOtherwiseSpecified(value, options) {
	return (options.clone !== false && options.isMergeableObject(value))
		? deepmerge(emptyTarget(value), value, options)
		: value
}

function defaultArrayMerge(target, source, options) {
	return target.concat(source).map(function(element) {
		return cloneUnlessOtherwiseSpecified(element, options)
	})
}

function getMergeFunction(key, options) {
	if (!options.customMerge) {
		return deepmerge
	}
	var customMerge = options.customMerge(key);
	return typeof customMerge === 'function' ? customMerge : deepmerge
}

function getEnumerableOwnPropertySymbols(target) {
	return Object.getOwnPropertySymbols
		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return target.propertyIsEnumerable(symbol)
		})
		: []
}

function getKeys(target) {
	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
	try {
		return (key in target) // Properties are safe to merge if they don't exist in the target yet,
			&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
				&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
	} catch (unused) {
		// Counterintuitively, it's safe to merge any property on a target that causes the `in` operator to throw.
		// This happens when trying to copy an object in the source over a plain string in the target.
		return false
	}
}

function mergeObject(target, source, options) {
	var destination = {};
	if (options.isMergeableObject(target)) {
		getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
	}
	getKeys(source).forEach(function(key) {
		if (propertyIsUnsafe(target, key)) {
			return
		}

		if (!options.isMergeableObject(source[key]) || !target[key]) {
			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		} else {
			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
		}
	});
	return destination
}

function deepmerge(target, source, options) {
	options = options || {};
	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
	options.isMergeableObject = options.isMergeableObject || isMergeableObject;
	// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
	// implementations can use it. The caller may not replace it.
	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

	var sourceIsArray = Array.isArray(source);
	var targetIsArray = Array.isArray(target);
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source, options)
	} else if (sourceIsArray) {
		return options.arrayMerge(target, source, options)
	} else {
		return mergeObject(target, source, options)
	}
}

deepmerge.all = function deepmergeAll(array, options) {
	if (!Array.isArray(array)) {
		throw new Error('first argument should be an array')
	}

	return array.reduce(function(prev, next) {
		return deepmerge(prev, next, options)
	}, {})
};

var deepmerge_1 = deepmerge;

module.exports = deepmerge_1;


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {
/* WEBPACK VAR INJECTION */(function(global, module) {/* harmony import */ var _ponyfill_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);
/* global window */


var root;

if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else {
  root = module;
}

var result = Object(_ponyfill_js__WEBPACK_IMPORTED_MODULE_0__[/* default */ "a"])(root);
/* harmony default export */ __webpack_exports__["a"] = (result);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(5), __webpack_require__(6)(module)));

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

/*!
 * Fuse.js v3.4.5 - Lightweight fuzzy-search (http://fusejs.io)
 * 
 * Copyright (c) 2012-2017 Kirollos Risk (http://kiro.me)
 * All Rights Reserved. Apache Software License 2.0
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 */
!function(e,t){ module.exports=t();}(this,function(){return function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r});},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t){e.exports=function(e){return Array.isArray?Array.isArray(e):"[object Array]"===Object.prototype.toString.call(e)};},function(e,t,n){function r(e){return (r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}var i=n(2),a=n(8),s=n(0),c=function(){function e(t,n){var r=n.location,o=void 0===r?0:r,i=n.distance,s=void 0===i?100:i,c=n.threshold,h=void 0===c?.6:c,l=n.maxPatternLength,u=void 0===l?32:l,f=n.caseSensitive,d=void 0!==f&&f,v=n.tokenSeparator,p=void 0===v?/ +/g:v,g=n.findAllMatches,y=void 0!==g&&g,m=n.minMatchCharLength,k=void 0===m?1:m,S=n.id,x=void 0===S?null:S,b=n.keys,M=void 0===b?[]:b,_=n.shouldSort,L=void 0===_||_,w=n.getFn,A=void 0===w?a:w,C=n.sortFn,I=void 0===C?function(e,t){return e.score-t.score}:C,O=n.tokenize,j=void 0!==O&&O,P=n.matchAllTokens,F=void 0!==P&&P,T=n.includeMatches,z=void 0!==T&&T,E=n.includeScore,K=void 0!==E&&E,$=n.verbose,J=void 0!==$&&$;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.options={location:o,distance:s,threshold:h,maxPatternLength:u,isCaseSensitive:d,tokenSeparator:p,findAllMatches:y,minMatchCharLength:k,id:x,keys:M,includeMatches:z,includeScore:K,shouldSort:L,getFn:A,sortFn:I,verbose:J,tokenize:j,matchAllTokens:F},this.setCollection(t);}var t,n;return t=e,(n=[{key:"setCollection",value:function(e){return this.list=e,e}},{key:"search",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{limit:!1};this._log('---------\nSearch pattern: "'.concat(e,'"'));var n=this._prepareSearchers(e),r=n.tokenSearchers,o=n.fullSearcher,i=this._search(r,o),a=i.weights,s=i.results;return this._computeScore(a,s),this.options.shouldSort&&this._sort(s),t.limit&&"number"==typeof t.limit&&(s=s.slice(0,t.limit)),this._format(s)}},{key:"_prepareSearchers",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t=[];if(this.options.tokenize)for(var n=e.split(this.options.tokenSeparator),r=0,o=n.length;r<o;r+=1)t.push(new i(n[r],this.options));return {tokenSearchers:t,fullSearcher:new i(e,this.options)}}},{key:"_search",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[],t=arguments.length>1?arguments[1]:void 0,n=this.list,r={},o=[];if("string"==typeof n[0]){for(var i=0,a=n.length;i<a;i+=1)this._analyze({key:"",value:n[i],record:i,index:i},{resultMap:r,results:o,tokenSearchers:e,fullSearcher:t});return {weights:null,results:o}}for(var s={},c=0,h=n.length;c<h;c+=1)for(var l=n[c],u=0,f=this.options.keys.length;u<f;u+=1){var d=this.options.keys[u];if("string"!=typeof d){if(s[d.name]={weight:1-d.weight||1},d.weight<=0||d.weight>1)throw new Error("Key weight has to be > 0 and <= 1");d=d.name;}else s[d]={weight:1};this._analyze({key:d,value:this.options.getFn(l,d),record:l,index:c},{resultMap:r,results:o,tokenSearchers:e,fullSearcher:t});}return {weights:s,results:o}}},{key:"_analyze",value:function(e,t){var n=e.key,r=e.arrayIndex,o=void 0===r?-1:r,i=e.value,a=e.record,c=e.index,h=t.tokenSearchers,l=void 0===h?[]:h,u=t.fullSearcher,f=void 0===u?[]:u,d=t.resultMap,v=void 0===d?{}:d,p=t.results,g=void 0===p?[]:p;if(null!=i){var y=!1,m=-1,k=0;if("string"==typeof i){this._log("\nKey: ".concat(""===n?"-":n));var S=f.search(i);if(this._log('Full text: "'.concat(i,'", score: ').concat(S.score)),this.options.tokenize){for(var x=i.split(this.options.tokenSeparator),b=[],M=0;M<l.length;M+=1){var _=l[M];this._log('\nPattern: "'.concat(_.pattern,'"'));for(var L=!1,w=0;w<x.length;w+=1){var A=x[w],C=_.search(A),I={};C.isMatch?(I[A]=C.score,y=!0,L=!0,b.push(C.score)):(I[A]=1,this.options.matchAllTokens||b.push(1)),this._log('Token: "'.concat(A,'", score: ').concat(I[A]));}L&&(k+=1);}m=b[0];for(var O=b.length,j=1;j<O;j+=1)m+=b[j];m/=O,this._log("Token score average:",m);}var P=S.score;m>-1&&(P=(P+m)/2),this._log("Score average:",P);var F=!this.options.tokenize||!this.options.matchAllTokens||k>=l.length;if(this._log("\nCheck Matches: ".concat(F)),(y||S.isMatch)&&F){var T=v[c];T?T.output.push({key:n,arrayIndex:o,value:i,score:P,matchedIndices:S.matchedIndices}):(v[c]={item:a,output:[{key:n,arrayIndex:o,value:i,score:P,matchedIndices:S.matchedIndices}]},g.push(v[c]));}}else if(s(i))for(var z=0,E=i.length;z<E;z+=1)this._analyze({key:n,arrayIndex:z,value:i[z],record:a,index:c},{resultMap:v,results:g,tokenSearchers:l,fullSearcher:f});}}},{key:"_computeScore",value:function(e,t){this._log("\n\nComputing score:\n");for(var n=0,r=t.length;n<r;n+=1){for(var o=t[n].output,i=o.length,a=1,s=1,c=0;c<i;c+=1){var h=e?e[o[c].key].weight:1,l=(1===h?o[c].score:o[c].score||.001)*h;1!==h?s=Math.min(s,l):(o[c].nScore=l,a*=l);}t[n].score=1===s?a:s,this._log(t[n]);}}},{key:"_sort",value:function(e){this._log("\n\nSorting...."),e.sort(this.options.sortFn);}},{key:"_format",value:function(e){var t=[];if(this.options.verbose){var n=[];this._log("\n\nOutput:\n\n",JSON.stringify(e,function(e,t){if("object"===r(t)&&null!==t){if(-1!==n.indexOf(t))return;n.push(t);}return t})),n=null;}var o=[];this.options.includeMatches&&o.push(function(e,t){var n=e.output;t.matches=[];for(var r=0,o=n.length;r<o;r+=1){var i=n[r];if(0!==i.matchedIndices.length){var a={indices:i.matchedIndices,value:i.value};i.key&&(a.key=i.key),i.hasOwnProperty("arrayIndex")&&i.arrayIndex>-1&&(a.arrayIndex=i.arrayIndex),t.matches.push(a);}}}),this.options.includeScore&&o.push(function(e,t){t.score=e.score;});for(var i=0,a=e.length;i<a;i+=1){var s=e[i];if(this.options.id&&(s.item=this.options.getFn(s.item,this.options.id)[0]),o.length){for(var c={item:s.item},h=0,l=o.length;h<l;h+=1)o[h](s,c);t.push(c);}else t.push(s.item);}return t}},{key:"_log",value:function(){var e;this.options.verbose&&(e=console).log.apply(e,arguments);}}])&&o(t.prototype,n),e}();e.exports=c;},function(e,t,n){function r(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}var o=n(3),i=n(4),a=n(7),s=function(){function e(t,n){var r=n.location,o=void 0===r?0:r,i=n.distance,s=void 0===i?100:i,c=n.threshold,h=void 0===c?.6:c,l=n.maxPatternLength,u=void 0===l?32:l,f=n.isCaseSensitive,d=void 0!==f&&f,v=n.tokenSeparator,p=void 0===v?/ +/g:v,g=n.findAllMatches,y=void 0!==g&&g,m=n.minMatchCharLength,k=void 0===m?1:m;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.options={location:o,distance:s,threshold:h,maxPatternLength:u,isCaseSensitive:d,tokenSeparator:p,findAllMatches:y,minMatchCharLength:k},this.pattern=this.options.isCaseSensitive?t:t.toLowerCase(),this.pattern.length<=u&&(this.patternAlphabet=a(this.pattern));}var t,n;return t=e,(n=[{key:"search",value:function(e){if(this.options.isCaseSensitive||(e=e.toLowerCase()),this.pattern===e)return {isMatch:!0,score:0,matchedIndices:[[0,e.length-1]]};var t=this.options,n=t.maxPatternLength,r=t.tokenSeparator;if(this.pattern.length>n)return o(e,this.pattern,r);var a=this.options,s=a.location,c=a.distance,h=a.threshold,l=a.findAllMatches,u=a.minMatchCharLength;return i(e,this.pattern,this.patternAlphabet,{location:s,distance:c,threshold:h,findAllMatches:l,minMatchCharLength:u})}}])&&r(t.prototype,n),e}();e.exports=s;},function(e,t){var n=/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;e.exports=function(e,t){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:/ +/g,o=new RegExp(t.replace(n,"\\$&").replace(r,"|")),i=e.match(o),a=!!i,s=[];if(a)for(var c=0,h=i.length;c<h;c+=1){var l=i[c];s.push([e.indexOf(l),l.length-1]);}return {score:a?.5:1,isMatch:a,matchedIndices:s}};},function(e,t,n){var r=n(5),o=n(6);e.exports=function(e,t,n,i){for(var a=i.location,s=void 0===a?0:a,c=i.distance,h=void 0===c?100:c,l=i.threshold,u=void 0===l?.6:l,f=i.findAllMatches,d=void 0!==f&&f,v=i.minMatchCharLength,p=void 0===v?1:v,g=s,y=e.length,m=u,k=e.indexOf(t,g),S=t.length,x=[],b=0;b<y;b+=1)x[b]=0;if(-1!==k){var M=r(t,{errors:0,currentLocation:k,expectedLocation:g,distance:h});if(m=Math.min(M,m),-1!==(k=e.lastIndexOf(t,g+S))){var _=r(t,{errors:0,currentLocation:k,expectedLocation:g,distance:h});m=Math.min(_,m);}}k=-1;for(var L=[],w=1,A=S+y,C=1<<S-1,I=0;I<S;I+=1){for(var O=0,j=A;O<j;){r(t,{errors:I,currentLocation:g+j,expectedLocation:g,distance:h})<=m?O=j:A=j,j=Math.floor((A-O)/2+O);}A=j;var P=Math.max(1,g-j+1),F=d?y:Math.min(g+j,y)+S,T=Array(F+2);T[F+1]=(1<<I)-1;for(var z=F;z>=P;z-=1){var E=z-1,K=n[e.charAt(E)];if(K&&(x[E]=1),T[z]=(T[z+1]<<1|1)&K,0!==I&&(T[z]|=(L[z+1]|L[z])<<1|1|L[z+1]),T[z]&C&&(w=r(t,{errors:I,currentLocation:E,expectedLocation:g,distance:h}))<=m){if(m=w,(k=E)<=g)break;P=Math.max(1,2*g-k);}}if(r(t,{errors:I+1,currentLocation:g,expectedLocation:g,distance:h})>m)break;L=T;}return {isMatch:k>=0,score:0===w?.001:w,matchedIndices:o(x,p)}};},function(e,t){e.exports=function(e,t){var n=t.errors,r=void 0===n?0:n,o=t.currentLocation,i=void 0===o?0:o,a=t.expectedLocation,s=void 0===a?0:a,c=t.distance,h=void 0===c?100:c,l=r/e.length,u=Math.abs(s-i);return h?l+u/h:u?1:l};},function(e,t){e.exports=function(){for(var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[],t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1,n=[],r=-1,o=-1,i=0,a=e.length;i<a;i+=1){var s=e[i];s&&-1===r?r=i:s||-1===r||((o=i-1)-r+1>=t&&n.push([r,o]),r=-1);}return e[i-1]&&i-r>=t&&n.push([r,i-1]),n};},function(e,t){e.exports=function(e){for(var t={},n=e.length,r=0;r<n;r+=1)t[e.charAt(r)]=0;for(var o=0;o<n;o+=1)t[e.charAt(o)]|=1<<n-o-1;return t};},function(e,t,n){var r=n(0);e.exports=function(e,t){return function e(t,n,o){if(n){var i=n.indexOf("."),a=n,s=null;-1!==i&&(a=n.slice(0,i),s=n.slice(i+1));var c=t[a];if(null!=c)if(s||"string"!=typeof c&&"number"!=typeof c)if(r(c))for(var h=0,l=c.length;h<l;h+=1)e(c[h],s,o);else s&&e(c,s,o);else o.push(c.toString());}else o.push(t);return o}(e,t,[])};}])});

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return symbolObservablePonyfill; });
function symbolObservablePonyfill(root) {
	var result;
	var Symbol = root.Symbol;

	if (typeof Symbol === 'function') {
		if (Symbol.observable) {
			result = Symbol.observable;
		} else {
			result = Symbol('observable');
			Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
}

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(7);


/***/ }),
/* 5 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = function(originalModule) {
	if (!originalModule.webpackPolyfill) {
		var module = Object.create(originalModule);
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		Object.defineProperty(module, "exports", {
			enumerable: true
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./node_modules/fuse.js/dist/fuse.js
var dist_fuse = __webpack_require__(2);
var fuse_default = /*#__PURE__*/__webpack_require__.n(dist_fuse);

// EXTERNAL MODULE: ./node_modules/deepmerge/dist/cjs.js
var cjs = __webpack_require__(0);
var cjs_default = /*#__PURE__*/__webpack_require__.n(cjs);

// EXTERNAL MODULE: ./node_modules/symbol-observable/es/index.js
var es = __webpack_require__(1);

// CONCATENATED MODULE: ./node_modules/redux/es/redux.js


/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var randomString = function randomString() {
  return Math.random().toString(36).substring(7).split('').join('.');
};

var ActionTypes = {
  INIT: "@@redux/INIT" + randomString(),
  REPLACE: "@@redux/REPLACE" + randomString(),
  PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
    return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
  }
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  var proto = obj;

  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(obj) === proto;
}

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */

function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'function' || typeof enhancer === 'function' && typeof arguments[3] === 'function') {
    throw new Error('It looks like you are passing several store enhancers to ' + 'createStore(). This is not supported. Instead, compose them ' + 'together to a single function.');
  }

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.');
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;
  /**
   * This makes a shallow copy of currentListeners so we can use
   * nextListeners as a temporary list while dispatching.
   *
   * This prevents any bugs around consumers calling
   * subscribe/unsubscribe in the middle of a dispatch.
   */

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }
  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */


  function getState() {
    if (isDispatching) {
      throw new Error('You may not call store.getState() while the reducer is executing. ' + 'The reducer has already received the state as an argument. ' + 'Pass it down from the top reducer instead of reading it from the store.');
    }

    return currentState;
  }
  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */


  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.');
    }

    if (isDispatching) {
      throw new Error('You may not call store.subscribe() while the reducer is executing. ' + 'If you would like to be notified after the store has been updated, subscribe from a ' + 'component and invoke store.getState() in the callback to access the latest state. ' + 'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.');
    }

    var isSubscribed = true;
    ensureCanMutateNextListeners();
    nextListeners.push(listener);
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      if (isDispatching) {
        throw new Error('You may not unsubscribe from a store listener while the reducer is executing. ' + 'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.');
      }

      isSubscribed = false;
      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }
  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */


  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;

    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      listener();
    }

    return action;
  }
  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */


  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }

    currentReducer = nextReducer; // This action has a similiar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.

    dispatch({
      type: ActionTypes.REPLACE
    });
  }
  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */


  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.');
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return {
          unsubscribe: unsubscribe
        };
      }
    }, _ref[es["a" /* default */]] = function () {
      return this;
    }, _ref;
  } // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.


  dispatch({
    type: ActionTypes.INIT
  });
  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[es["a" /* default */]] = observable, _ref2;
}

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionDescription = actionType && "action \"" + String(actionType) + "\"" || 'an action';
  return "Given " + actionDescription + ", reducer \"" + key + "\" returned undefined. " + "To ignore an action, you must explicitly return the previous state. " + "If you want this reducer to hold no value, you can return null instead of undefined.";
}

function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, {
      type: ActionTypes.INIT
    });

    if (typeof initialState === 'undefined') {
      throw new Error("Reducer \"" + key + "\" returned undefined during initialization. " + "If the state passed to the reducer is undefined, you must " + "explicitly return the initial state. The initial state may " + "not be undefined. If you don't want to set a value for this reducer, " + "you can use null instead of undefined.");
    }

    if (typeof reducer(undefined, {
      type: ActionTypes.PROBE_UNKNOWN_ACTION()
    }) === 'undefined') {
      throw new Error("Reducer \"" + key + "\" returned undefined when probed with a random type. " + ("Don't try to handle " + ActionTypes.INIT + " or other actions in \"redux/*\" ") + "namespace. They are considered private. Instead, you must return the " + "current state for any unknown actions, unless it is undefined, " + "in which case you must return the initial state, regardless of the " + "action type. The initial state may not be undefined, but can be null.");
    }
  });
}
/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */


function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers);
  var finalReducers = {};

  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i];

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }

  var finalReducerKeys = Object.keys(finalReducers); // This is used to make sure we don't warn about the same

  var shapeAssertionError;

  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state, action) {
    if (state === void 0) {
      state = {};
    }

    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    var hasChanged = false;
    var nextState = {};

    for (var _i = 0; _i < finalReducerKeys.length; _i++) {
      var _key = finalReducerKeys[_i];
      var reducer = finalReducers[_key];
      var previousStateForKey = state[_key];
      var nextStateForKey = reducer(previousStateForKey, action);

      if (typeof nextStateForKey === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(_key, action);
        throw new Error(errorMessage);
      }

      nextState[_key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? nextState : state;
  };
}



// CONCATENATED MODULE: ./src/scripts/reducers/items.js
var defaultState = [];
function items_items(state, action) {
  if (state === void 0) {
    state = defaultState;
  }

  switch (action.type) {
    case 'ADD_ITEM':
      {
        // Add object to items array
        var newState = [].concat(state, [{
          id: action.id,
          choiceId: action.choiceId,
          groupId: action.groupId,
          value: action.value,
          label: action.label,
          active: true,
          highlighted: false,
          customProperties: action.customProperties,
          placeholder: action.placeholder || false,
          keyCode: null
        }]);
        return newState.map(function (obj) {
          var item = obj;
          item.highlighted = false;
          return item;
        });
      }

    case 'REMOVE_ITEM':
      {
        // Set item to inactive
        return state.map(function (obj) {
          var item = obj;

          if (item.id === action.id) {
            item.active = false;
          }

          return item;
        });
      }

    case 'HIGHLIGHT_ITEM':
      {
        return state.map(function (obj) {
          var item = obj;

          if (item.id === action.id) {
            item.highlighted = action.highlighted;
          }

          return item;
        });
      }

    default:
      {
        return state;
      }
  }
}
// CONCATENATED MODULE: ./src/scripts/reducers/groups.js
var groups_defaultState = [];
function groups(state, action) {
  if (state === void 0) {
    state = groups_defaultState;
  }

  switch (action.type) {
    case 'ADD_GROUP':
      {
        return [].concat(state, [{
          id: action.id,
          value: action.value,
          active: action.active,
          disabled: action.disabled
        }]);
      }

    case 'CLEAR_CHOICES':
      {
        return [];
      }

    default:
      {
        return state;
      }
  }
}
// CONCATENATED MODULE: ./src/scripts/reducers/choices.js
var choices_defaultState = [];
function choices_choices(state, action) {
  if (state === void 0) {
    state = choices_defaultState;
  }

  switch (action.type) {
    case 'ADD_CHOICE':
      {
        /*
            A disabled choice appears in the choice dropdown but cannot be selected
            A selected choice has been added to the passed input's value (added as an item)
            An active choice appears within the choice dropdown
         */
        return [].concat(state, [{
          id: action.id,
          elementId: action.elementId,
          groupId: action.groupId,
          value: action.value,
          label: action.label || action.value,
          disabled: action.disabled || false,
          selected: false,
          active: true,
          score: 9999,
          customProperties: action.customProperties,
          placeholder: action.placeholder || false,
          keyCode: null
        }]);
      }

    case 'ADD_ITEM':
      {
        // If all choices need to be activated
        if (action.activateOptions) {
          return state.map(function (obj) {
            var choice = obj;
            choice.active = action.active;
            return choice;
          });
        } // When an item is added and it has an associated choice,
        // we want to disable it so it can't be chosen again


        if (action.choiceId > -1) {
          return state.map(function (obj) {
            var choice = obj;

            if (choice.id === parseInt(action.choiceId, 10)) {
              choice.selected = true;
            }

            return choice;
          });
        }

        return state;
      }

    case 'REMOVE_ITEM':
      {
        // When an item is removed and it has an associated choice,
        // we want to re-enable it so it can be chosen again
        if (action.choiceId > -1) {
          return state.map(function (obj) {
            var choice = obj;

            if (choice.id === parseInt(action.choiceId, 10)) {
              choice.selected = false;
            }

            return choice;
          });
        }

        return state;
      }

    case 'FILTER_CHOICES':
      {
        return state.map(function (obj) {
          var choice = obj; // Set active state based on whether choice is
          // within filtered results

          choice.active = action.results.some(function (_ref) {
            var item = _ref.item,
                score = _ref.score;

            if (item.id === choice.id) {
              choice.score = score;
              return true;
            }

            return false;
          });
          return choice;
        });
      }

    case 'ACTIVATE_CHOICES':
      {
        return state.map(function (obj) {
          var choice = obj;
          choice.active = action.active;
          return choice;
        });
      }

    case 'CLEAR_CHOICES':
      {
        return choices_defaultState;
      }

    default:
      {
        return state;
      }
  }
}
// CONCATENATED MODULE: ./src/scripts/reducers/general.js
var general_defaultState = {
  loading: false
};

var general = function general(state, action) {
  if (state === void 0) {
    state = general_defaultState;
  }

  switch (action.type) {
    case 'SET_IS_LOADING':
      {
        return {
          loading: action.isLoading
        };
      }

    default:
      {
        return state;
      }
  }
};

/* harmony default export */ var reducers_general = (general);
// CONCATENATED MODULE: ./src/scripts/lib/utils.js
/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
var getRandomNumber = function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};
/**
 * @param {number} length
 * @returns {string}
 */

var generateChars = function generateChars(length) {
  return Array.from({
    length: length
  }, function () {
    return getRandomNumber(0, 36).toString(36);
  }).join('');
};
/**
 * @param {HTMLInputElement | HTMLSelectElement} element
 * @param {string} prefix
 * @returns {string}
 */

var generateId = function generateId(element, prefix) {
  var id = element.id || element.name && element.name + "-" + generateChars(2) || generateChars(4);
  id = id.replace(/(:|\.|\[|\]|,)/g, '');
  id = prefix + "-" + id;
  return id;
};
/**
 * @param {any} obj
 * @returns {string}
 */

var getType = function getType(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1);
};
/**
 * @param {string} type
 * @param {any} obj
 * @returns {boolean}
 */

var isType = function isType(type, obj) {
  return obj !== undefined && obj !== null && getType(obj) === type;
};
/**
 * @param {HTMLElement} element
 * @param {HTMLElement} [wrapper={HTMLDivElement}]
 * @returns {HTMLElement}
 */

var utils_wrap = function wrap(element, wrapper) {
  if (wrapper === void 0) {
    wrapper = document.createElement('div');
  }

  if (element.nextSibling) {
    element.parentNode.insertBefore(wrapper, element.nextSibling);
  } else {
    element.parentNode.appendChild(wrapper);
  }

  return wrapper.appendChild(element);
};
/**
 * @param {Element} startEl
 * @param {string} selector
 * @param {1 | -1} direction
 * @returns {Element | undefined}
 */

var getAdjacentEl = function getAdjacentEl(startEl, selector, direction) {
  if (direction === void 0) {
    direction = 1;
  }

  if (!(startEl instanceof Element) || typeof selector !== 'string') {
    return undefined;
  }

  var prop = (direction > 0 ? 'next' : 'previous') + "ElementSibling";
  var sibling = startEl[prop];

  while (sibling) {
    if (sibling.matches(selector)) {
      return sibling;
    }

    sibling = sibling[prop];
  }

  return sibling;
};
/**
 * @param {Element} element
 * @param {Element} parent
 * @param {-1 | 1} direction
 * @returns {boolean}
 */

var isScrolledIntoView = function isScrolledIntoView(element, parent, direction) {
  if (direction === void 0) {
    direction = 1;
  }

  if (!element) {
    return false;
  }

  var isVisible;

  if (direction > 0) {
    // In view from bottom
    isVisible = parent.scrollTop + parent.offsetHeight >= element.offsetTop + element.offsetHeight;
  } else {
    // In view from top
    isVisible = element.offsetTop >= parent.scrollTop;
  }

  return isVisible;
};
/**
 * @param {any} value
 * @returns {any}
 */

var sanitise = function sanitise(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/&/g, '&amp;').replace(/>/g, '&rt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
};
/**
 * @returns {() => (str: string) => Element}
 */

var strToEl = function () {
  var tmpEl = document.createElement('div');
  return function (str) {
    var cleanedInput = str.trim();
    tmpEl.innerHTML = cleanedInput;
    var firldChild = tmpEl.children[0];

    while (tmpEl.firstChild) {
      tmpEl.removeChild(tmpEl.firstChild);
    }

    return firldChild;
  };
}();
/**
 * @param {{ label?: string, value: string }} a
 * @param {{ label?: string, value: string }} b
 * @returns {number}
 */

var sortByAlpha = function sortByAlpha(_ref, _ref2) {
  var value = _ref.value,
      _ref$label = _ref.label,
      label = _ref$label === void 0 ? value : _ref$label;
  var value2 = _ref2.value,
      _ref2$label = _ref2.label,
      label2 = _ref2$label === void 0 ? value2 : _ref2$label;
  return label.localeCompare(label2, [], {
    sensitivity: 'base',
    ignorePunctuation: true,
    numeric: true
  });
};
/**
 * @param {{ score: number }} a
 * @param {{ score: number }} b
 */

var sortByScore = function sortByScore(a, b) {
  return a.score - b.score;
};
/**
 * @param {HTMLElement} element
 * @param {string} type
 * @param {object} customArgs
 */

var dispatchEvent = function dispatchEvent(element, type, customArgs) {
  if (customArgs === void 0) {
    customArgs = null;
  }

  var event = new CustomEvent(type, {
    detail: customArgs,
    bubbles: true,
    cancelable: true
  });
  return element.dispatchEvent(event);
};
/**
 * @param {array} array
 * @param {any} value
 * @param {string} [key="value"]
 * @returns {boolean}
 */

var existsInArray = function existsInArray(array, value, key) {
  if (key === void 0) {
    key = 'value';
  }

  return array.some(function (item) {
    if (typeof value === 'string') {
      return item[key] === value.trim();
    }

    return item[key] === value;
  });
};
/**
 * @param {any} obj
 * @returns {any}
 */

var cloneObject = function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
};
/**
 * Returns an array of keys present on the first but missing on the second object
 * @param {object} a
 * @param {object} b
 * @returns {string[]}
 */

var diff = function diff(a, b) {
  var aKeys = Object.keys(a).sort();
  var bKeys = Object.keys(b).sort();
  return aKeys.filter(function (i) {
    return bKeys.indexOf(i) < 0;
  });
};
// CONCATENATED MODULE: ./src/scripts/reducers/index.js






var appReducer = combineReducers({
  items: items_items,
  groups: groups,
  choices: choices_choices,
  general: reducers_general
});

var reducers_rootReducer = function rootReducer(passedState, action) {
  var state = passedState; // If we are clearing all items, groups and options we reassign
  // state and then pass that state to our proper reducer. This isn't
  // mutating our actual state
  // See: http://stackoverflow.com/a/35641992

  if (action.type === 'CLEAR_ALL') {
    state = undefined;
  } else if (action.type === 'RESET_TO') {
    return cloneObject(action.state);
  }

  return appReducer(state, action);
};

/* harmony default export */ var reducers = (reducers_rootReducer);
// CONCATENATED MODULE: ./src/scripts/store/store.js
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }



/**
 * @typedef {import('../../../types/index').Choices.Choice} Choice
 * @typedef {import('../../../types/index').Choices.Group} Group
 * @typedef {import('../../../types/index').Choices.Item} Item
 */

var store_Store =
/*#__PURE__*/
function () {
  function Store() {
    this._store = createStore(reducers, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
  }
  /**
   * Subscribe store to function call (wrapped Redux method)
   * @param  {Function} onChange Function to trigger when state changes
   * @return
   */


  var _proto = Store.prototype;

  _proto.subscribe = function subscribe(onChange) {
    this._store.subscribe(onChange);
  }
  /**
   * Dispatch event to store (wrapped Redux method)
   * @param  {{ type: string, [x: string]: any }} action Action to trigger
   * @return
   */
  ;

  _proto.dispatch = function dispatch(action) {
    this._store.dispatch(action);
  }
  /**
   * Get store object (wrapping Redux method)
   * @returns {object} State
   */
  ;

  /**
   * Get loading state from store
   * @returns {boolean} Loading State
   */
  _proto.isLoading = function isLoading() {
    return this.state.general.loading;
  }
  /**
   * Get single choice by it's ID
   * @param {string} id
   * @returns {Choice | undefined} Found choice
   */
  ;

  _proto.getChoiceById = function getChoiceById(id) {
    return this.activeChoices.find(function (choice) {
      return choice.id === parseInt(id, 10);
    });
  }
  /**
   * Get group by group id
   * @param  {number} id Group ID
   * @returns {Group | undefined} Group data
   */
  ;

  _proto.getGroupById = function getGroupById(id) {
    return this.groups.find(function (group) {
      return group.id === id;
    });
  };

  _createClass(Store, [{
    key: "state",
    get: function get() {
      return this._store.getState();
    }
    /**
     * Get items from store
     * @returns {Item[]} Item objects
     */

  }, {
    key: "items",
    get: function get() {
      return this.state.items;
    }
    /**
     * Get active items from store
     * @returns {Item[]} Item objects
     */

  }, {
    key: "activeItems",
    get: function get() {
      return this.items.filter(function (item) {
        return item.active === true;
      });
    }
    /**
     * Get highlighted items from store
     * @returns {Item[]} Item objects
     */

  }, {
    key: "highlightedActiveItems",
    get: function get() {
      return this.items.filter(function (item) {
        return item.active && item.highlighted;
      });
    }
    /**
     * Get choices from store
     * @returns {Choice[]} Option objects
     */

  }, {
    key: "choices",
    get: function get() {
      return this.state.choices;
    }
    /**
     * Get active choices from store
     * @returns {Choice[]} Option objects
     */

  }, {
    key: "activeChoices",
    get: function get() {
      return this.choices.filter(function (choice) {
        return choice.active === true;
      });
    }
    /**
     * Get selectable choices from store
     * @returns {Choice[]} Option objects
     */

  }, {
    key: "selectableChoices",
    get: function get() {
      return this.choices.filter(function (choice) {
        return choice.disabled !== true;
      });
    }
    /**
     * Get choices that can be searched (excluding placeholders)
     * @returns {Choice[]} Option objects
     */

  }, {
    key: "searchableChoices",
    get: function get() {
      return this.selectableChoices.filter(function (choice) {
        return choice.placeholder !== true;
      });
    }
    /**
     * Get placeholder choice from store
     * @returns {Choice | undefined} Found placeholder
     */

  }, {
    key: "placeholderChoice",
    get: function get() {
      return [].concat(this.choices).reverse().find(function (choice) {
        return choice.placeholder === true;
      });
    }
    /**
     * Get groups from store
     * @returns {Group[]} Group objects
     */

  }, {
    key: "groups",
    get: function get() {
      return this.state.groups;
    }
    /**
     * Get active groups from store
     * @returns {Group[]} Group objects
     */

  }, {
    key: "activeGroups",
    get: function get() {
      var groups = this.groups,
          choices = this.choices;
      return groups.filter(function (group) {
        var isActive = group.active === true && group.disabled === false;
        var hasActiveOptions = choices.some(function (choice) {
          return choice.active === true && choice.disabled === false;
        });
        return isActive && hasActiveOptions;
      }, []);
    }
  }]);

  return Store;
}();


// CONCATENATED MODULE: ./src/scripts/components/dropdown.js
function dropdown_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function dropdown_createClass(Constructor, protoProps, staticProps) { if (protoProps) dropdown_defineProperties(Constructor.prototype, protoProps); if (staticProps) dropdown_defineProperties(Constructor, staticProps); return Constructor; }

/**
 * @typedef {import('../../../types/index').Choices.passedElement} passedElement
 * @typedef {import('../../../types/index').Choices.ClassNames} ClassNames
 */
var Dropdown =
/*#__PURE__*/
function () {
  /**
   * @param {{
   *  element: HTMLElement,
   *  type: passedElement['type'],
   *  classNames: ClassNames,
   * }} args
   */
  function Dropdown(_ref) {
    var element = _ref.element,
        type = _ref.type,
        classNames = _ref.classNames;
    this.element = element;
    this.classNames = classNames;
    this.type = type;
    this.isActive = false;
  }
  /**
   * Bottom position of dropdown in viewport coordinates
   * @returns {number} Vertical position
   */


  var _proto = Dropdown.prototype;

  /**
   * Find element that matches passed selector
   * @param {string} selector
   * @returns {HTMLElement | null}
   */
  _proto.getChild = function getChild(selector) {
    return this.element.querySelector(selector);
  }
  /**
   * Show dropdown to user by adding active state class
   * @returns {this}
   */
  ;

  _proto.show = function show() {
    this.element.classList.add(this.classNames.activeState);
    this.element.setAttribute('aria-expanded', 'true');
    this.isActive = true;
    return this;
  }
  /**
   * Hide dropdown from user
   * @returns {this}
   */
  ;

  _proto.hide = function hide() {
    this.element.classList.remove(this.classNames.activeState);
    this.element.setAttribute('aria-expanded', 'false');
    this.isActive = false;
    return this;
  };

  dropdown_createClass(Dropdown, [{
    key: "distanceFromTopWindow",
    get: function get() {
      return this.element.getBoundingClientRect().bottom;
    }
  }]);

  return Dropdown;
}();


// CONCATENATED MODULE: ./src/scripts/constants.js

/**
 * @typedef {import('../../types/index').Choices.ClassNames} ClassNames
 * @typedef {import('../../types/index').Choices.Options} Options
 */

/** @type {ClassNames} */

var DEFAULT_CLASSNAMES = {
  containerOuter: 'choices',
  containerInner: 'choices__inner',
  input: 'choices__input',
  inputCloned: 'choices__input--cloned',
  list: 'choices__list',
  listItems: 'choices__list--multiple',
  listSingle: 'choices__list--single',
  listDropdown: 'choices__list--dropdown',
  item: 'choices__item',
  itemSelectable: 'choices__item--selectable',
  itemDisabled: 'choices__item--disabled',
  itemChoice: 'choices__item--choice',
  placeholder: 'choices__placeholder',
  group: 'choices__group',
  groupHeading: 'choices__heading',
  button: 'choices__button',
  activeState: 'is-active',
  focusState: 'is-focused',
  openState: 'is-open',
  disabledState: 'is-disabled',
  highlightedState: 'is-highlighted',
  selectedState: 'is-selected',
  flippedState: 'is-flipped',
  loadingState: 'is-loading',
  noResults: 'has-no-results',
  noChoices: 'has-no-choices'
};
/** @type {Options} */

var DEFAULT_CONFIG = {
  items: [],
  choices: [],
  silent: false,
  renderChoiceLimit: -1,
  maxItemCount: -1,
  addItems: true,
  addItemFilter: null,
  removeItems: true,
  removeItemButton: false,
  editItems: false,
  duplicateItemsAllowed: true,
  delimiter: ',',
  paste: true,
  searchEnabled: true,
  searchChoices: true,
  searchFloor: 1,
  searchResultLimit: 4,
  searchFields: ['label', 'value'],
  position: 'auto',
  resetScrollPosition: true,
  shouldSort: true,
  shouldSortItems: false,
  sorter: sortByAlpha,
  placeholder: true,
  placeholderValue: null,
  searchPlaceholderValue: null,
  prependValue: null,
  appendValue: null,
  renderSelectedChoices: 'auto',
  loadingText: 'Loading...',
  noResultsText: 'No results found',
  noChoicesText: 'No choices to choose from',
  itemSelectText: 'Press to select',
  uniqueItemText: 'Only unique values can be added',
  customAddItemText: 'Only values matching specific conditions can be added',
  addItemText: function addItemText(value) {
    return "Press Enter to add <b>\"" + sanitise(value) + "\"</b>";
  },
  maxItemText: function maxItemText(maxItemCount) {
    return "Only " + maxItemCount + " values can be added";
  },
  valueComparer: function valueComparer(value1, value2) {
    return value1 === value2;
  },
  fuseOptions: {
    includeScore: true
  },
  callbackOnInit: null,
  callbackOnCreateTemplates: null,
  classNames: DEFAULT_CLASSNAMES
};
var EVENTS = {
  showDropdown: 'showDropdown',
  hideDropdown: 'hideDropdown',
  change: 'change',
  choice: 'choice',
  search: 'search',
  addItem: 'addItem',
  removeItem: 'removeItem',
  highlightItem: 'highlightItem',
  highlightChoice: 'highlightChoice'
};
var ACTION_TYPES = {
  ADD_CHOICE: 'ADD_CHOICE',
  FILTER_CHOICES: 'FILTER_CHOICES',
  ACTIVATE_CHOICES: 'ACTIVATE_CHOICES',
  CLEAR_CHOICES: 'CLEAR_CHOICES',
  ADD_GROUP: 'ADD_GROUP',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  HIGHLIGHT_ITEM: 'HIGHLIGHT_ITEM',
  CLEAR_ALL: 'CLEAR_ALL'
};
var KEY_CODES = {
  BACK_KEY: 46,
  DELETE_KEY: 8,
  ENTER_KEY: 13,
  A_KEY: 65,
  ESC_KEY: 27,
  UP_KEY: 38,
  DOWN_KEY: 40,
  PAGE_UP_KEY: 33,
  PAGE_DOWN_KEY: 34
};
var TEXT_TYPE = 'text';
var SELECT_ONE_TYPE = 'select-one';
var SELECT_MULTIPLE_TYPE = 'select-multiple';
var SCROLLING_SPEED = 4;
// CONCATENATED MODULE: ./src/scripts/components/container.js


/**
 * @typedef {import('../../../types/index').Choices.passedElement} passedElement
 * @typedef {import('../../../types/index').Choices.ClassNames} ClassNames
 */

var container_Container =
/*#__PURE__*/
function () {
  /**
   * @param {{
   *  element: HTMLElement,
   *  type: passedElement['type'],
   *  classNames: ClassNames,
   *  position
   * }} args
   */
  function Container(_ref) {
    var element = _ref.element,
        type = _ref.type,
        classNames = _ref.classNames,
        position = _ref.position;
    this.element = element;
    this.classNames = classNames;
    this.type = type;
    this.position = position;
    this.isOpen = false;
    this.isFlipped = false;
    this.isFocussed = false;
    this.isDisabled = false;
    this.isLoading = false;
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
  }

  var _proto = Container.prototype;

  _proto.addEventListeners = function addEventListeners() {
    this.element.addEventListener('focus', this._onFocus);
    this.element.addEventListener('blur', this._onBlur);
  };

  _proto.removeEventListeners = function removeEventListeners() {
    this.element.removeEventListener('focus', this._onFocus);
    this.element.removeEventListener('blur', this._onBlur);
  }
  /**
   * Determine whether container should be flipped based on passed
   * dropdown position
   * @param {number} dropdownPos
   * @returns {boolean}
   */
  ;

  _proto.shouldFlip = function shouldFlip(dropdownPos) {
    if (typeof dropdownPos !== 'number') {
      return false;
    } // If flip is enabled and the dropdown bottom position is
    // greater than the window height flip the dropdown.


    var shouldFlip = false;

    if (this.position === 'auto') {
      shouldFlip = !window.matchMedia("(min-height: " + (dropdownPos + 1) + "px)").matches;
    } else if (this.position === 'top') {
      shouldFlip = true;
    }

    return shouldFlip;
  }
  /**
   * @param {string} activeDescendantID
   */
  ;

  _proto.setActiveDescendant = function setActiveDescendant(activeDescendantID) {
    this.element.setAttribute('aria-activedescendant', activeDescendantID);
  };

  _proto.removeActiveDescendant = function removeActiveDescendant() {
    this.element.removeAttribute('aria-activedescendant');
  }
  /**
   * @param {number} dropdownPos
   */
  ;

  _proto.open = function open(dropdownPos) {
    this.element.classList.add(this.classNames.openState);
    this.element.setAttribute('aria-expanded', 'true');
    this.isOpen = true;

    if (this.shouldFlip(dropdownPos)) {
      this.element.classList.add(this.classNames.flippedState);
      this.isFlipped = true;
    }
  };

  _proto.close = function close() {
    this.element.classList.remove(this.classNames.openState);
    this.element.setAttribute('aria-expanded', 'false');
    this.removeActiveDescendant();
    this.isOpen = false; // A dropdown flips if it does not have space within the page

    if (this.isFlipped) {
      this.element.classList.remove(this.classNames.flippedState);
      this.isFlipped = false;
    }
  };

  _proto.focus = function focus() {
    if (!this.isFocussed) {
      this.element.focus();
    }
  };

  _proto.addFocusState = function addFocusState() {
    this.element.classList.add(this.classNames.focusState);
  };

  _proto.removeFocusState = function removeFocusState() {
    this.element.classList.remove(this.classNames.focusState);
  };

  _proto.enable = function enable() {
    this.element.classList.remove(this.classNames.disabledState);
    this.element.removeAttribute('aria-disabled');

    if (this.type === SELECT_ONE_TYPE) {
      this.element.setAttribute('tabindex', '0');
    }

    this.isDisabled = false;
  };

  _proto.disable = function disable() {
    this.element.classList.add(this.classNames.disabledState);
    this.element.setAttribute('aria-disabled', 'true');

    if (this.type === SELECT_ONE_TYPE) {
      this.element.setAttribute('tabindex', '-1');
    }

    this.isDisabled = true;
  }
  /**
   * @param {HTMLElement} element
   */
  ;

  _proto.wrap = function wrap(element) {
    utils_wrap(element, this.element);
  }
  /**
   * @param {Element} element
   */
  ;

  _proto.unwrap = function unwrap(element) {
    // Move passed element outside this element
    this.element.parentNode.insertBefore(element, this.element); // Remove this element

    this.element.parentNode.removeChild(this.element);
  };

  _proto.addLoadingState = function addLoadingState() {
    this.element.classList.add(this.classNames.loadingState);
    this.element.setAttribute('aria-busy', 'true');
    this.isLoading = true;
  };

  _proto.removeLoadingState = function removeLoadingState() {
    this.element.classList.remove(this.classNames.loadingState);
    this.element.removeAttribute('aria-busy');
    this.isLoading = false;
  };

  _proto._onFocus = function _onFocus() {
    this.isFocussed = true;
  };

  _proto._onBlur = function _onBlur() {
    this.isFocussed = false;
  };

  return Container;
}();


// CONCATENATED MODULE: ./src/scripts/components/input.js
function input_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function input_createClass(Constructor, protoProps, staticProps) { if (protoProps) input_defineProperties(Constructor.prototype, protoProps); if (staticProps) input_defineProperties(Constructor, staticProps); return Constructor; }



/**
 * @typedef {import('../../../types/index').Choices.passedElement} passedElement
 * @typedef {import('../../../types/index').Choices.ClassNames} ClassNames
 */

var input_Input =
/*#__PURE__*/
function () {
  /**
   * @param {{
   *  element: HTMLInputElement,
   *  type: passedElement['type'],
   *  classNames: ClassNames,
   *  preventPaste: boolean
   * }} args
   */
  function Input(_ref) {
    var element = _ref.element,
        type = _ref.type,
        classNames = _ref.classNames,
        preventPaste = _ref.preventPaste;
    this.element = element;
    this.type = type;
    this.classNames = classNames;
    this.preventPaste = preventPaste;
    this.isFocussed = this.element === document.activeElement;
    this.isDisabled = element.disabled;
    this._onPaste = this._onPaste.bind(this);
    this._onInput = this._onInput.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
  }
  /**
   * @param {string} placeholder
   */


  var _proto = Input.prototype;

  _proto.addEventListeners = function addEventListeners() {
    this.element.addEventListener('paste', this._onPaste);
    this.element.addEventListener('input', this._onInput, {
      passive: true
    });
    this.element.addEventListener('focus', this._onFocus, {
      passive: true
    });
    this.element.addEventListener('blur', this._onBlur, {
      passive: true
    });
  };

  _proto.removeEventListeners = function removeEventListeners() {
    this.element.removeEventListener('input', this._onInput, {
      passive: true
    });
    this.element.removeEventListener('paste', this._onPaste);
    this.element.removeEventListener('focus', this._onFocus, {
      passive: true
    });
    this.element.removeEventListener('blur', this._onBlur, {
      passive: true
    });
  };

  _proto.enable = function enable() {
    this.element.removeAttribute('disabled');
    this.isDisabled = false;
  };

  _proto.disable = function disable() {
    this.element.setAttribute('disabled', '');
    this.isDisabled = true;
  };

  _proto.focus = function focus() {
    if (!this.isFocussed) {
      this.element.focus();
    }
  };

  _proto.blur = function blur() {
    if (this.isFocussed) {
      this.element.blur();
    }
  }
  /**
   * Set value of input to blank
   * @param {boolean} setWidth
   * @returns {this}
   */
  ;

  _proto.clear = function clear(setWidth) {
    if (setWidth === void 0) {
      setWidth = true;
    }

    if (this.element.value) {
      this.element.value = '';
    }

    if (setWidth) {
      this.setWidth();
    }

    return this;
  }
  /**
   * Set the correct input width based on placeholder
   * value or input value
   */
  ;

  _proto.setWidth = function setWidth() {
    // Resize input to contents or placeholder
    var _this$element = this.element,
        style = _this$element.style,
        value = _this$element.value,
        placeholder = _this$element.placeholder;
    style.minWidth = placeholder.length + 1 + "ch";
    style.width = value.length + 1 + "ch";
  }
  /**
   * @param {string} activeDescendantID
   */
  ;

  _proto.setActiveDescendant = function setActiveDescendant(activeDescendantID) {
    this.element.setAttribute('aria-activedescendant', activeDescendantID);
  };

  _proto.removeActiveDescendant = function removeActiveDescendant() {
    this.element.removeAttribute('aria-activedescendant');
  };

  _proto._onInput = function _onInput() {
    if (this.type !== SELECT_ONE_TYPE) {
      this.setWidth();
    }
  }
  /**
   * @param {Event} event
   */
  ;

  _proto._onPaste = function _onPaste(event) {
    if (this.preventPaste) {
      event.preventDefault();
    }
  };

  _proto._onFocus = function _onFocus() {
    this.isFocussed = true;
  };

  _proto._onBlur = function _onBlur() {
    this.isFocussed = false;
  };

  input_createClass(Input, [{
    key: "placeholder",
    set: function set(placeholder) {
      this.element.placeholder = placeholder;
    }
    /**
     * @returns {string}
     */

  }, {
    key: "value",
    get: function get() {
      return sanitise(this.element.value);
    }
    /**
     * @param {string} value
     */
    ,
    set: function set(value) {
      this.element.value = value;
    }
  }]);

  return Input;
}();


// CONCATENATED MODULE: ./src/scripts/components/list.js

/**
 * @typedef {import('../../../types/index').Choices.Choice} Choice
 */

var list_List =
/*#__PURE__*/
function () {
  /**
   * @param {{ element: HTMLElement }} args
   */
  function List(_ref) {
    var element = _ref.element;
    this.element = element;
    this.scrollPos = this.element.scrollTop;
    this.height = this.element.offsetHeight;
  }

  var _proto = List.prototype;

  _proto.clear = function clear() {
    this.element.innerHTML = '';
  }
  /**
   * @param {Element | DocumentFragment} node
   */
  ;

  _proto.append = function append(node) {
    this.element.appendChild(node);
  }
  /**
   * @param {string} selector
   * @returns {Element | null}
   */
  ;

  _proto.getChild = function getChild(selector) {
    return this.element.querySelector(selector);
  }
  /**
   * @returns {boolean}
   */
  ;

  _proto.hasChildren = function hasChildren() {
    return this.element.hasChildNodes();
  };

  _proto.scrollToTop = function scrollToTop() {
    this.element.scrollTop = 0;
  }
  /**
   * @param {Element} element
   * @param {1 | -1} direction
   */
  ;

  _proto.scrollToChildElement = function scrollToChildElement(element, direction) {
    var _this = this;

    if (!element) {
      return;
    }

    var listHeight = this.element.offsetHeight; // Scroll position of dropdown

    var listScrollPosition = this.element.scrollTop + listHeight;
    var elementHeight = element.offsetHeight; // Distance from bottom of element to top of parent

    var elementPos = element.offsetTop + elementHeight; // Difference between the element and scroll position

    var destination = direction > 0 ? this.element.scrollTop + elementPos - listScrollPosition : element.offsetTop;
    requestAnimationFrame(function () {
      _this._animateScroll(destination, direction);
    });
  }
  /**
   * @param {number} scrollPos
   * @param {number} strength
   * @param {number} destination
   */
  ;

  _proto._scrollDown = function _scrollDown(scrollPos, strength, destination) {
    var easing = (destination - scrollPos) / strength;
    var distance = easing > 1 ? easing : 1;
    this.element.scrollTop = scrollPos + distance;
  }
  /**
   * @param {number} scrollPos
   * @param {number} strength
   * @param {number} destination
   */
  ;

  _proto._scrollUp = function _scrollUp(scrollPos, strength, destination) {
    var easing = (scrollPos - destination) / strength;
    var distance = easing > 1 ? easing : 1;
    this.element.scrollTop = scrollPos - distance;
  }
  /**
   * @param {*} destination
   * @param {*} direction
   */
  ;

  _proto._animateScroll = function _animateScroll(destination, direction) {
    var _this2 = this;

    var strength = SCROLLING_SPEED;
    var choiceListScrollTop = this.element.scrollTop;
    var continueAnimation = false;

    if (direction > 0) {
      this._scrollDown(choiceListScrollTop, strength, destination);

      if (choiceListScrollTop < destination) {
        continueAnimation = true;
      }
    } else {
      this._scrollUp(choiceListScrollTop, strength, destination);

      if (choiceListScrollTop > destination) {
        continueAnimation = true;
      }
    }

    if (continueAnimation) {
      requestAnimationFrame(function () {
        _this2._animateScroll(destination, direction);
      });
    }
  };

  return List;
}();


// CONCATENATED MODULE: ./src/scripts/components/wrapped-element.js
function wrapped_element_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function wrapped_element_createClass(Constructor, protoProps, staticProps) { if (protoProps) wrapped_element_defineProperties(Constructor.prototype, protoProps); if (staticProps) wrapped_element_defineProperties(Constructor, staticProps); return Constructor; }


/**
 * @typedef {import('../../../types/index').Choices.passedElement} passedElement
 * @typedef {import('../../../types/index').Choices.ClassNames} ClassNames
 */

var wrapped_element_WrappedElement =
/*#__PURE__*/
function () {
  /**
   * @param {{
   *  element: HTMLInputElement | HTMLSelectElement,
   *  classNames: ClassNames,
   * }} args
   */
  function WrappedElement(_ref) {
    var element = _ref.element,
        classNames = _ref.classNames;
    this.element = element;
    this.classNames = classNames;

    if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLSelectElement)) {
      throw new TypeError('Invalid element passed');
    }

    this.isDisabled = false;
  }

  var _proto = WrappedElement.prototype;

  _proto.conceal = function conceal() {
    // Hide passed input
    this.element.classList.add(this.classNames.input);
    this.element.hidden = true; // Remove element from tab index

    this.element.tabIndex = -1; // Backup original styles if any

    var origStyle = this.element.getAttribute('style');

    if (origStyle) {
      this.element.setAttribute('data-choice-orig-style', origStyle);
    }

    this.element.setAttribute('data-choice', 'active');
  };

  _proto.reveal = function reveal() {
    // Reinstate passed element
    this.element.classList.remove(this.classNames.input);
    this.element.hidden = false;
    this.element.removeAttribute('tabindex'); // Recover original styles if any

    var origStyle = this.element.getAttribute('data-choice-orig-style');

    if (origStyle) {
      this.element.removeAttribute('data-choice-orig-style');
      this.element.setAttribute('style', origStyle);
    } else {
      this.element.removeAttribute('style');
    }

    this.element.removeAttribute('data-choice'); // Re-assign values - this is weird, I know
    // @todo Figure out why we need to do this

    this.element.value = this.element.value; // eslint-disable-line no-self-assign
  };

  _proto.enable = function enable() {
    this.element.removeAttribute('disabled');
    this.element.disabled = false;
    this.isDisabled = false;
  };

  _proto.disable = function disable() {
    this.element.setAttribute('disabled', '');
    this.element.disabled = true;
    this.isDisabled = true;
  };

  _proto.triggerEvent = function triggerEvent(eventType, data) {
    dispatchEvent(this.element, eventType, data);
  };

  wrapped_element_createClass(WrappedElement, [{
    key: "isActive",
    get: function get() {
      return this.element.dataset.choice === 'active';
    }
  }, {
    key: "dir",
    get: function get() {
      return this.element.dir;
    }
  }, {
    key: "value",
    get: function get() {
      return this.element.value;
    },
    set: function set(value) {
      // you must define setter here otherwise it will be readonly property
      this.element.value = value;
    }
  }]);

  return WrappedElement;
}();


// CONCATENATED MODULE: ./src/scripts/components/wrapped-input.js
function wrapped_input_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function wrapped_input_createClass(Constructor, protoProps, staticProps) { if (protoProps) wrapped_input_defineProperties(Constructor.prototype, protoProps); if (staticProps) wrapped_input_defineProperties(Constructor, staticProps); return Constructor; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }


/**
 * @typedef {import('../../../types/index').Choices.ClassNames} ClassNames
 * @typedef {import('../../../types/index').Choices.Item} Item
 */

var WrappedInput =
/*#__PURE__*/
function (_WrappedElement) {
  _inheritsLoose(WrappedInput, _WrappedElement);

  /**
   * @param {{
   *  element: HTMLInputElement,
   *  classNames: ClassNames,
   *  delimiter: string
   * }} args
   */
  function WrappedInput(_ref) {
    var _this;

    var element = _ref.element,
        classNames = _ref.classNames,
        delimiter = _ref.delimiter;
    _this = _WrappedElement.call(this, {
      element: element,
      classNames: classNames
    }) || this;
    _this.delimiter = delimiter;
    return _this;
  }
  /**
   * @returns {string}
   */


  wrapped_input_createClass(WrappedInput, [{
    key: "value",
    get: function get() {
      return this.element.value;
    }
    /**
     * @param {Item[]} items
     */
    ,
    set: function set(items) {
      var itemValues = items.map(function (_ref2) {
        var value = _ref2.value;
        return value;
      });
      var joinedValues = itemValues.join(this.delimiter);
      this.element.setAttribute('value', joinedValues);
      this.element.value = joinedValues;
    }
  }]);

  return WrappedInput;
}(wrapped_element_WrappedElement);


// CONCATENATED MODULE: ./src/scripts/components/wrapped-select.js
function wrapped_select_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function wrapped_select_createClass(Constructor, protoProps, staticProps) { if (protoProps) wrapped_select_defineProperties(Constructor.prototype, protoProps); if (staticProps) wrapped_select_defineProperties(Constructor, staticProps); return Constructor; }

function wrapped_select_inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }


/**
 * @typedef {import('../../../types/index').Choices.ClassNames} ClassNames
 * @typedef {import('../../../types/index').Choices.Item} Item
 * @typedef {import('../../../types/index').Choices.Choice} Choice
 */

var WrappedSelect =
/*#__PURE__*/
function (_WrappedElement) {
  wrapped_select_inheritsLoose(WrappedSelect, _WrappedElement);

  /**
   * @param {{
   *  element: HTMLSelectElement,
   *  classNames: ClassNames,
   *  delimiter: string
   *  template: function
   * }} args
   */
  function WrappedSelect(_ref) {
    var _this;

    var element = _ref.element,
        classNames = _ref.classNames,
        template = _ref.template;
    _this = _WrappedElement.call(this, {
      element: element,
      classNames: classNames
    }) || this;
    _this.template = template;
    return _this;
  }

  var _proto = WrappedSelect.prototype;

  /**
   * @param {DocumentFragment} fragment
   */
  _proto.appendDocFragment = function appendDocFragment(fragment) {
    this.element.innerHTML = '';
    this.element.appendChild(fragment);
  };

  wrapped_select_createClass(WrappedSelect, [{
    key: "placeholderOption",
    get: function get() {
      return this.element.querySelector('option[value=""]') || // Backward compatibility layer for the non-standard placeholder attribute supported in older versions.
      this.element.querySelector('option[placeholder]');
    }
    /**
     * @returns {Element[]}
     */

  }, {
    key: "optionGroups",
    get: function get() {
      return Array.from(this.element.getElementsByTagName('OPTGROUP'));
    }
    /**
     * @returns {Item[] | Choice[]}
     */

  }, {
    key: "options",
    get: function get() {
      return Array.from(this.element.options);
    }
    /**
     * @param {Item[] | Choice[]} options
     */
    ,
    set: function set(options) {
      var _this2 = this;

      var fragment = document.createDocumentFragment();

      var addOptionToFragment = function addOptionToFragment(data) {
        // Create a standard select option
        var option = _this2.template(data); // Append it to fragment


        fragment.appendChild(option);
      }; // Add each list item to list


      options.forEach(function (optionData) {
        return addOptionToFragment(optionData);
      });
      this.appendDocFragment(fragment);
    }
  }]);

  return WrappedSelect;
}(wrapped_element_WrappedElement);


// CONCATENATED MODULE: ./src/scripts/components/index.js







// CONCATENATED MODULE: ./src/scripts/templates.js
/**
 * Helpers to create HTML elements used by Choices
 * Can be overridden by providing `callbackOnCreateTemplates` option
 * @typedef {import('../../types/index').Choices.Templates} Templates
 * @typedef {import('../../types/index').Choices.ClassNames} ClassNames
 * @typedef {import('../../types/index').Choices.Options} Options
 * @typedef {import('../../types/index').Choices.Item} Item
 * @typedef {import('../../types/index').Choices.Choice} Choice
 * @typedef {import('../../types/index').Choices.Group} Group
 */
var TEMPLATES =
/** @type {Templates} */
{
  /**
   * @param {Partial<ClassNames>} classNames
   * @param {"ltr" | "rtl" | "auto"} dir
   * @param {boolean} isSelectElement
   * @param {boolean} isSelectOneElement
   * @param {boolean} searchEnabled
   * @param {"select-one" | "select-multiple" | "text"} passedElementType
   */
  containerOuter: function containerOuter(_ref, dir, isSelectElement, isSelectOneElement, searchEnabled, passedElementType) {
    var _containerOuter = _ref.containerOuter;
    var div = Object.assign(document.createElement('div'), {
      className: _containerOuter
    });
    div.dataset.type = passedElementType;

    if (dir) {
      div.dir = dir;
    }

    if (isSelectOneElement) {
      div.tabIndex = 0;
    }

    if (isSelectElement) {
      div.setAttribute('role', searchEnabled ? 'combobox' : 'listbox');

      if (searchEnabled) {
        div.setAttribute('aria-autocomplete', 'list');
      }
    }

    div.setAttribute('aria-haspopup', 'true');
    div.setAttribute('aria-expanded', 'false');
    return div;
  },

  /**
   * @param {Partial<ClassNames>} classNames
   */
  containerInner: function containerInner(_ref2) {
    var _containerInner = _ref2.containerInner;
    return Object.assign(document.createElement('div'), {
      className: _containerInner
    });
  },

  /**
   * @param {Partial<ClassNames>} classNames
   * @param {boolean} isSelectOneElement
   */
  itemList: function itemList(_ref3, isSelectOneElement) {
    var list = _ref3.list,
        listSingle = _ref3.listSingle,
        listItems = _ref3.listItems;
    return Object.assign(document.createElement('div'), {
      className: list + " " + (isSelectOneElement ? listSingle : listItems)
    });
  },

  /**
   * @param {Partial<ClassNames>} classNames
   * @param {string} value
   */
  placeholder: function placeholder(_ref4, value) {
    var _placeholder = _ref4.placeholder;
    return Object.assign(document.createElement('div'), {
      className: _placeholder,
      innerHTML: value
    });
  },

  /**
   * @param {Partial<ClassNames>} classNames
   * @param {Item} item
   * @param {boolean} removeItemButton
   */
  item: function item(_ref5, _ref6, removeItemButton) {
    var _item = _ref5.item,
        button = _ref5.button,
        highlightedState = _ref5.highlightedState,
        itemSelectable = _ref5.itemSelectable,
        placeholder = _ref5.placeholder;
    var id = _ref6.id,
        value = _ref6.value,
        label = _ref6.label,
        customProperties = _ref6.customProperties,
        active = _ref6.active,
        disabled = _ref6.disabled,
        highlighted = _ref6.highlighted,
        isPlaceholder = _ref6.placeholder;
    var div = Object.assign(document.createElement('div'), {
      className: _item,
      innerHTML: label
    });
    Object.assign(div.dataset, {
      item: '',
      id: id,
      value: value,
      customProperties: customProperties
    });

    if (active) {
      div.setAttribute('aria-selected', 'true');
    }

    if (disabled) {
      div.setAttribute('aria-disabled', 'true');
    }

    if (isPlaceholder) {
      div.classList.add(placeholder);
    }

    div.classList.add(highlighted ? highlightedState : itemSelectable);

    if (removeItemButton) {
      if (disabled) {
        div.classList.remove(itemSelectable);
      }

      div.dataset.deletable = '';
      /** @todo This MUST be localizable, not hardcoded! */

      var REMOVE_ITEM_TEXT = 'Remove item';
      var removeButton = Object.assign(document.createElement('button'), {
        type: 'button',
        className: button,
        innerHTML: REMOVE_ITEM_TEXT
      });
      removeButton.setAttribute('aria-label', REMOVE_ITEM_TEXT + ": '" + value + "'");
      removeButton.dataset.button = '';
      div.appendChild(removeButton);
    }

    return div;
  },

  /**
   * @param {Partial<ClassNames>} classNames
   * @param {boolean} isSelectOneElement
   */
  choiceList: function choiceList(_ref7, isSelectOneElement) {
    var list = _ref7.list;
    var div = Object.assign(document.createElement('div'), {
      className: list
    });

    if (!isSelectOneElement) {
      div.setAttribute('aria-multiselectable', 'true');
    }

    div.setAttribute('role', 'listbox');
    return div;
  },

  /**
   * @param {Partial<ClassNames>} classNames
   * @param {Group} group
   */
  choiceGroup: function choiceGroup(_ref8, _ref9) {
    var group = _ref8.group,
        groupHeading = _ref8.groupHeading,
        itemDisabled = _ref8.itemDisabled;
    var id = _ref9.id,
        value = _ref9.value,
        disabled = _ref9.disabled;
    var div = Object.assign(document.createElement('div'), {
      className: group + " " + (disabled ? itemDisabled : '')
    });
    div.setAttribute('role', 'group');
    Object.assign(div.dataset, {
      group: '',
      id: id,
      value: value
    });

    if (disabled) {
      div.setAttribute('aria-disabled', 'true');
    }

    div.appendChild(Object.assign(document.createElement('div'), {
      className: groupHeading,
      innerHTML: value
    }));
    return div;
  },

  /**
   * @param {Partial<ClassNames>} classNames
   * @param {Choice} choice
   * @param {Options['itemSelectText']} selectText
   */
  choice: function choice(_ref10, _ref11, selectText) {
    var item = _ref10.item,
        itemChoice = _ref10.itemChoice,
        itemSelectable = _ref10.itemSelectable,
        selectedState = _ref10.selectedState,
        itemDisabled = _ref10.itemDisabled,
        placeholder = _ref10.placeholder;
    var id = _ref11.id,
        value = _ref11.value,
        label = _ref11.label,
        groupId = _ref11.groupId,
        elementId = _ref11.elementId,
        isDisabled = _ref11.disabled,
        isSelected = _ref11.selected,
        isPlaceholder = _ref11.placeholder;
    var div = Object.assign(document.createElement('div'), {
      id: elementId,
      innerHTML: label,
      className: item + " " + itemChoice
    });

    if (isSelected) {
      div.classList.add(selectedState);
    }

    if (isPlaceholder) {
      div.classList.add(placeholder);
    }

    div.setAttribute('role', groupId > 0 ? 'treeitem' : 'option');
    Object.assign(div.dataset, {
      choice: '',
      id: id,
      value: value,
      selectText: selectText
    });

    if (isDisabled) {
      div.classList.add(itemDisabled);
      div.dataset.choiceDisabled = '';
      div.setAttribute('aria-disabled', 'true');
    } else {
      div.classList.add(itemSelectable);
      div.dataset.choiceSelectable = '';
    }

    return div;
  },

  /**
   * @param {Partial<ClassNames>} classNames
   * @param {string} placeholderValue
   */
  input: function input(_ref12, placeholderValue) {
    var _input = _ref12.input,
        inputCloned = _ref12.inputCloned;
    var inp = Object.assign(document.createElement('input'), {
      type: 'text',
      className: _input + " " + inputCloned,
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: false
    });
    inp.setAttribute('role', 'textbox');
    inp.setAttribute('aria-autocomplete', 'list');
    inp.setAttribute('aria-label', placeholderValue);
    return inp;
  },

  /**
   * @param {Partial<ClassNames>} classNames
   */
  dropdown: function dropdown(_ref13) {
    var list = _ref13.list,
        listDropdown = _ref13.listDropdown;
    var div = document.createElement('div');
    div.classList.add(list, listDropdown);
    div.setAttribute('aria-expanded', 'false');
    return div;
  },

  /**
   *
   * @param {Partial<ClassNames>} classNames
   * @param {string} innerHTML
   * @param {"no-choices" | "no-results" | ""} type
   */
  notice: function notice(_ref14, innerHTML, type) {
    var item = _ref14.item,
        itemChoice = _ref14.itemChoice,
        noResults = _ref14.noResults,
        noChoices = _ref14.noChoices;

    if (type === void 0) {
      type = '';
    }

    var classes = [item, itemChoice];

    if (type === 'no-choices') {
      classes.push(noChoices);
    } else if (type === 'no-results') {
      classes.push(noResults);
    }

    return Object.assign(document.createElement('div'), {
      innerHTML: innerHTML,
      className: classes.join(' ')
    });
  },

  /**
   * @param {Item} option
   */
  option: function option(_ref15) {
    var label = _ref15.label,
        value = _ref15.value,
        customProperties = _ref15.customProperties,
        active = _ref15.active,
        disabled = _ref15.disabled;
    var opt = new Option(label, value, false, active);

    if (customProperties) {
      opt.dataset.customProperties = customProperties;
    }

    opt.disabled = disabled;
    return opt;
  }
};
// CONCATENATED MODULE: ./src/scripts/actions/choices.js
/**
 * @typedef {import('redux').Action} Action
 * @typedef {import('../../../types/index').Choices.Choice} Choice
 */

/**
 * @argument {Choice} choice
 * @returns {Action & Choice}
 */

var choices_addChoice = function addChoice(_ref) {
  var value = _ref.value,
      label = _ref.label,
      id = _ref.id,
      groupId = _ref.groupId,
      disabled = _ref.disabled,
      elementId = _ref.elementId,
      customProperties = _ref.customProperties,
      placeholder = _ref.placeholder,
      keyCode = _ref.keyCode;
  return {
    type: ACTION_TYPES.ADD_CHOICE,
    value: value,
    label: label,
    id: id,
    groupId: groupId,
    disabled: disabled,
    elementId: elementId,
    customProperties: customProperties,
    placeholder: placeholder,
    keyCode: keyCode
  };
};
/**
 * @argument {Choice[]} results
 * @returns {Action & { results: Choice[] }}
 */

var choices_filterChoices = function filterChoices(results) {
  return {
    type: ACTION_TYPES.FILTER_CHOICES,
    results: results
  };
};
/**
 * @argument {boolean} active
 * @returns {Action & { active: boolean }}
 */

var choices_activateChoices = function activateChoices(active) {
  if (active === void 0) {
    active = true;
  }

  return {
    type: ACTION_TYPES.ACTIVATE_CHOICES,
    active: active
  };
};
/**
 * @returns {Action}
 */

var choices_clearChoices = function clearChoices() {
  return {
    type: ACTION_TYPES.CLEAR_CHOICES
  };
};
// CONCATENATED MODULE: ./src/scripts/actions/items.js

/**
 * @typedef {import('redux').Action} Action
 * @typedef {import('../../../types/index').Choices.Item} Item
 */

/**
 * @param {Item} item
 * @returns {Action & Item}
 */

var items_addItem = function addItem(_ref) {
  var value = _ref.value,
      label = _ref.label,
      id = _ref.id,
      choiceId = _ref.choiceId,
      groupId = _ref.groupId,
      customProperties = _ref.customProperties,
      placeholder = _ref.placeholder,
      keyCode = _ref.keyCode;
  return {
    type: ACTION_TYPES.ADD_ITEM,
    value: value,
    label: label,
    id: id,
    choiceId: choiceId,
    groupId: groupId,
    customProperties: customProperties,
    placeholder: placeholder,
    keyCode: keyCode
  };
};
/**
 * @param {string} id
 * @param {string} choiceId
 * @returns {Action & { id: string, choiceId: string }}
 */

var items_removeItem = function removeItem(id, choiceId) {
  return {
    type: ACTION_TYPES.REMOVE_ITEM,
    id: id,
    choiceId: choiceId
  };
};
/**
 * @param {string} id
 * @param {boolean} highlighted
 * @returns {Action & { id: string, highlighted: boolean }}
 */

var items_highlightItem = function highlightItem(id, highlighted) {
  return {
    type: ACTION_TYPES.HIGHLIGHT_ITEM,
    id: id,
    highlighted: highlighted
  };
};
// CONCATENATED MODULE: ./src/scripts/actions/groups.js

/**
 * @typedef {import('redux').Action} Action
 * @typedef {import('../../../types/index').Choices.Group} Group
 */

/**
 * @param {Group} group
 * @returns {Action & Group}
 */

var groups_addGroup = function addGroup(_ref) {
  var value = _ref.value,
      id = _ref.id,
      active = _ref.active,
      disabled = _ref.disabled;
  return {
    type: ACTION_TYPES.ADD_GROUP,
    value: value,
    id: id,
    active: active,
    disabled: disabled
  };
};
// CONCATENATED MODULE: ./src/scripts/actions/misc.js
/**
 * @typedef {import('redux').Action} Action
 */

/**
 * @returns {Action}
 */
var clearAll = function clearAll() {
  return {
    type: 'CLEAR_ALL'
  };
};
/**
 * @param {any} state
 * @returns {Action & { state: object }}
 */

var resetTo = function resetTo(state) {
  return {
    type: 'RESET_TO',
    state: state
  };
};
/**
 * @param {boolean} isLoading
 * @returns {Action & { isLoading: boolean }}
 */

var setIsLoading = function setIsLoading(isLoading) {
  return {
    type: 'SET_IS_LOADING',
    isLoading: isLoading
  };
};
// CONCATENATED MODULE: ./src/scripts/choices.js
function choices_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function choices_createClass(Constructor, protoProps, staticProps) { if (protoProps) choices_defineProperties(Constructor.prototype, protoProps); if (staticProps) choices_defineProperties(Constructor, staticProps); return Constructor; }












/** @see {@link http://browserhacks.com/#hack-acea075d0ac6954f275a70023906050c} */

var IS_IE11 = '-ms-scroll-limit' in document.documentElement.style && '-ms-ime-align' in document.documentElement.style;
/**
 * @typedef {import('../../types/index').Choices.Choice} Choice
 * @typedef {import('../../types/index').Choices.Item} Item
 * @typedef {import('../../types/index').Choices.Group} Group
 * @typedef {import('../../types/index').Choices.Options} Options
 */

/** @type {Partial<Options>} */

var USER_DEFAULTS = {};
/**
 * Choices
 * @author Josh Johnson<josh@joshuajohnson.co.uk>
 */

var choices_Choices =
/*#__PURE__*/
function () {
  choices_createClass(Choices, null, [{
    key: "defaults",
    get: function get() {
      return Object.preventExtensions({
        get options() {
          return USER_DEFAULTS;
        },

        get templates() {
          return TEMPLATES;
        }

      });
    }
    /**
     * @param {string | HTMLInputElement | HTMLSelectElement} element
     * @param {Partial<Options>} userConfig
     */

  }]);

  function Choices(element, userConfig) {
    var _this = this;

    if (element === void 0) {
      element = '[data-choice]';
    }

    if (userConfig === void 0) {
      userConfig = {};
    }

    /** @type {Partial<Options>} */
    this.config = cjs_default.a.all([DEFAULT_CONFIG, Choices.defaults.options, userConfig], // When merging array configs, replace with a copy of the userConfig array,
    // instead of concatenating with the default array
    {
      arrayMerge: function arrayMerge(_, sourceArray) {
        return [].concat(sourceArray);
      }
    });
    var invalidConfigOptions = diff(this.config, DEFAULT_CONFIG);

    if (invalidConfigOptions.length) {
      console.warn('Unknown config option(s) passed', invalidConfigOptions.join(', '));
    }

    var passedElement = typeof element === 'string' ? document.querySelector(element) : element;

    if (!(passedElement instanceof HTMLInputElement || passedElement instanceof HTMLSelectElement)) {
      throw TypeError('Expected one of the following types text|select-one|select-multiple');
    }

    this._isTextElement = passedElement.type === TEXT_TYPE;
    this._isSelectOneElement = passedElement.type === SELECT_ONE_TYPE;
    this._isSelectMultipleElement = passedElement.type === SELECT_MULTIPLE_TYPE;
    this._isSelectElement = this._isSelectOneElement || this._isSelectMultipleElement;
    this.config.searchEnabled = this._isSelectMultipleElement || this.config.searchEnabled;

    if (!['auto', 'always'].includes(this.config.renderSelectedChoices)) {
      this.config.renderSelectedChoices = 'auto';
    }

    if (userConfig.addItemFilter && typeof userConfig.addItemFilter !== 'function') {
      var re = userConfig.addItemFilter instanceof RegExp ? userConfig.addItemFilter : new RegExp(userConfig.addItemFilter);
      this.config.addItemFilter = re.test.bind(re);
    }

    if (this._isTextElement) {
      this.passedElement = new WrappedInput({
        element: passedElement,
        classNames: this.config.classNames,
        delimiter: this.config.delimiter
      });
    } else {
      this.passedElement = new WrappedSelect({
        element: passedElement,
        classNames: this.config.classNames,
        template: function template(data) {
          return _this._templates.option(data);
        }
      });
    }

    this.initialised = false;
    this._store = new store_Store();
    this._initialState = {};
    this._currentState = {};
    this._prevState = {};
    this._currentValue = '';
    this._canSearch = this.config.searchEnabled;
    this._isScrollingOnIe = false;
    this._highlightPosition = 0;
    this._wasTap = true;
    this._placeholderValue = this._generatePlaceholderValue();
    this._baseId = generateId(this.passedElement.element, 'choices-');
    /**
     * setting direction in cases where it's explicitly set on passedElement
     * or when calculated direction is different from the document
     * @type {HTMLElement['dir']}
     */

    this._direction = this.passedElement.dir;

    if (!this._direction) {
      var _window$getComputedSt = window.getComputedStyle(this.passedElement.element),
          elementDirection = _window$getComputedSt.direction;

      var _window$getComputedSt2 = window.getComputedStyle(document.documentElement),
          documentDirection = _window$getComputedSt2.direction;

      if (elementDirection !== documentDirection) {
        this._direction = elementDirection;
      }
    }

    this._idNames = {
      itemChoice: 'item-choice'
    }; // Assign preset groups from passed element

    this._presetGroups = this.passedElement.optionGroups; // Assign preset options from passed element

    this._presetOptions = this.passedElement.options; // Assign preset choices from passed object

    this._presetChoices = this.config.choices; // Assign preset items from passed object first

    this._presetItems = this.config.items; // Add any values passed from attribute

    if (this.passedElement.value) {
      this._presetItems = this._presetItems.concat(this.passedElement.value.split(this.config.delimiter));
    } // Create array of choices from option elements


    if (this.passedElement.options) {
      this.passedElement.options.forEach(function (o) {
        _this._presetChoices.push({
          value: o.value,
          label: o.innerHTML,
          selected: o.selected,
          disabled: o.disabled || o.parentNode.disabled,
          placeholder: o.value === '' || o.hasAttribute('placeholder'),
          customProperties: o.getAttribute('data-custom-properties')
        });
      });
    }

    this._render = this._render.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseOver = this._onMouseOver.bind(this);
    this._onFormReset = this._onFormReset.bind(this);
    this._onAKey = this._onAKey.bind(this);
    this._onEnterKey = this._onEnterKey.bind(this);
    this._onEscapeKey = this._onEscapeKey.bind(this);
    this._onDirectionKey = this._onDirectionKey.bind(this);
    this._onDeleteKey = this._onDeleteKey.bind(this); // If element has already been initialised with Choices, fail silently

    if (this.passedElement.isActive) {
      if (!this.config.silent) {
        console.warn('Trying to initialise Choices on element already initialised');
      }

      this.initialised = true;
      return;
    } // Let's go


    this.init();
  }

  var _proto = Choices.prototype;

  _proto.init = function init() {
    if (this.initialised) {
      return;
    }

    this._createTemplates();

    this._createElements();

    this._createStructure(); // Set initial state (We need to clone the state because some reducers
    // modify the inner objects properties in the state) 🤢


    this._initialState = cloneObject(this._store.state);

    this._store.subscribe(this._render);

    this._render();

    this._addEventListeners();

    var shouldDisable = !this.config.addItems || this.passedElement.element.hasAttribute('disabled');

    if (shouldDisable) {
      this.disable();
    }

    this.initialised = true;
    var callbackOnInit = this.config.callbackOnInit; // Run callback if it is a function

    if (callbackOnInit && typeof callbackOnInit === 'function') {
      callbackOnInit.call(this);
    }
  };

  _proto.destroy = function destroy() {
    if (!this.initialised) {
      return;
    }

    this._removeEventListeners();

    this.passedElement.reveal();
    this.containerOuter.unwrap(this.passedElement.element);
    this.clearStore();

    if (this._isSelectElement) {
      this.passedElement.options = this._presetOptions;
    }

    this._templates = null;
    this.initialised = false;
  };

  _proto.enable = function enable() {
    if (this.passedElement.isDisabled) {
      this.passedElement.enable();
    }

    if (this.containerOuter.isDisabled) {
      this._addEventListeners();

      this.input.enable();
      this.containerOuter.enable();
    }

    return this;
  };

  _proto.disable = function disable() {
    if (!this.passedElement.isDisabled) {
      this.passedElement.disable();
    }

    if (!this.containerOuter.isDisabled) {
      this._removeEventListeners();

      this.input.disable();
      this.containerOuter.disable();
    }

    return this;
  };

  _proto.highlightItem = function highlightItem(item, runEvent) {
    if (runEvent === void 0) {
      runEvent = true;
    }

    if (!item) {
      return this;
    }

    var id = item.id,
        _item$groupId = item.groupId,
        groupId = _item$groupId === void 0 ? -1 : _item$groupId,
        _item$value = item.value,
        value = _item$value === void 0 ? '' : _item$value,
        _item$label = item.label,
        label = _item$label === void 0 ? '' : _item$label;
    var group = groupId >= 0 ? this._store.getGroupById(groupId) : null;

    this._store.dispatch(items_highlightItem(id, true));

    if (runEvent) {
      this.passedElement.triggerEvent(EVENTS.highlightItem, {
        id: id,
        value: value,
        label: label,
        groupValue: group && group.value ? group.value : null
      });
    }

    return this;
  };

  _proto.unhighlightItem = function unhighlightItem(item) {
    if (!item) {
      return this;
    }

    var id = item.id,
        _item$groupId2 = item.groupId,
        groupId = _item$groupId2 === void 0 ? -1 : _item$groupId2,
        _item$value2 = item.value,
        value = _item$value2 === void 0 ? '' : _item$value2,
        _item$label2 = item.label,
        label = _item$label2 === void 0 ? '' : _item$label2;
    var group = groupId >= 0 ? this._store.getGroupById(groupId) : null;

    this._store.dispatch(items_highlightItem(id, false));

    this.passedElement.triggerEvent(EVENTS.highlightItem, {
      id: id,
      value: value,
      label: label,
      groupValue: group && group.value ? group.value : null
    });
    return this;
  };

  _proto.highlightAll = function highlightAll() {
    var _this2 = this;

    this._store.items.forEach(function (item) {
      return _this2.highlightItem(item);
    });

    return this;
  };

  _proto.unhighlightAll = function unhighlightAll() {
    var _this3 = this;

    this._store.items.forEach(function (item) {
      return _this3.unhighlightItem(item);
    });

    return this;
  };

  _proto.removeActiveItemsByValue = function removeActiveItemsByValue(value) {
    var _this4 = this;

    this._store.activeItems.filter(function (item) {
      return item.value === value;
    }).forEach(function (item) {
      return _this4._removeItem(item);
    });

    return this;
  };

  _proto.removeActiveItems = function removeActiveItems(excludedId) {
    var _this5 = this;

    this._store.activeItems.filter(function (_ref) {
      var id = _ref.id;
      return id !== excludedId;
    }).forEach(function (item) {
      return _this5._removeItem(item);
    });

    return this;
  };

  _proto.removeHighlightedItems = function removeHighlightedItems(runEvent) {
    var _this6 = this;

    if (runEvent === void 0) {
      runEvent = false;
    }

    this._store.highlightedActiveItems.forEach(function (item) {
      _this6._removeItem(item); // If this action was performed by the user
      // trigger the event


      if (runEvent) {
        _this6._triggerChange(item.value);
      }
    });

    return this;
  };

  _proto.showDropdown = function showDropdown(preventInputFocus) {
    var _this7 = this;

    if (this.dropdown.isActive) {
      return this;
    }

    requestAnimationFrame(function () {
      _this7.dropdown.show();

      _this7.containerOuter.open(_this7.dropdown.distanceFromTopWindow);

      if (!preventInputFocus && _this7._canSearch) {
        _this7.input.focus();
      }

      _this7.passedElement.triggerEvent(EVENTS.showDropdown, {});
    });
    return this;
  };

  _proto.hideDropdown = function hideDropdown(preventInputBlur) {
    var _this8 = this;

    if (!this.dropdown.isActive) {
      return this;
    }

    requestAnimationFrame(function () {
      _this8.dropdown.hide();

      _this8.containerOuter.close();

      if (!preventInputBlur && _this8._canSearch) {
        _this8.input.removeActiveDescendant();

        _this8.input.blur();
      }

      _this8.passedElement.triggerEvent(EVENTS.hideDropdown, {});
    });
    return this;
  };

  _proto.getValue = function getValue(valueOnly) {
    if (valueOnly === void 0) {
      valueOnly = false;
    }

    var values = this._store.activeItems.reduce(function (selectedItems, item) {
      var itemValue = valueOnly ? item.value : item;
      selectedItems.push(itemValue);
      return selectedItems;
    }, []);

    return this._isSelectOneElement ? values[0] : values;
  }
  /**
   * @param {string[] | import('../../types/index').Choices.Item[]} items
   */
  ;

  _proto.setValue = function setValue(items) {
    var _this9 = this;

    if (!this.initialised) {
      return this;
    }

    items.forEach(function (value) {
      return _this9._setChoiceOrItem(value);
    });
    return this;
  };

  _proto.setChoiceByValue = function setChoiceByValue(value) {
    var _this10 = this;

    if (!this.initialised || this._isTextElement) {
      return this;
    } // If only one value has been passed, convert to array


    var choiceValue = Array.isArray(value) ? value : [value]; // Loop through each value and

    choiceValue.forEach(function (val) {
      return _this10._findAndSelectChoiceByValue(val);
    });
    return this;
  }
  /**
   * Set choices of select input via an array of objects (or function that returns array of object or promise of it),
   * a value field name and a label field name.
   * This behaves the same as passing items via the choices option but can be called after initialising Choices.
   * This can also be used to add groups of choices (see example 2); Optionally pass a true `replaceChoices` value to remove any existing choices.
   * Optionally pass a `customProperties` object to add additional data to your choices (useful when searching/filtering etc).
   *
   * **Input types affected:** select-one, select-multiple
   *
   * @template {Choice[] | ((instance: Choices) => object[] | Promise<object[]>)} T
   * @param {T} [choicesArrayOrFetcher]
   * @param {string} [value = 'value'] - name of `value` field
   * @param {string} [label = 'label'] - name of 'label' field
   * @param {boolean} [replaceChoices = false] - whether to replace of add choices
   * @returns {this | Promise<this>}
   *
   * @example
   * ```js
   * const example = new Choices(element);
   *
   * example.setChoices([
   *   {value: 'One', label: 'Label One', disabled: true},
   *   {value: 'Two', label: 'Label Two', selected: true},
   *   {value: 'Three', label: 'Label Three'},
   * ], 'value', 'label', false);
   * ```
   *
   * @example
   * ```js
   * const example = new Choices(element);
   *
   * example.setChoices(async () => {
   *   try {
   *      const items = await fetch('/items');
   *      return items.json()
   *   } catch(err) {
   *      console.error(err)
   *   }
   * });
   * ```
   *
   * @example
   * ```js
   * const example = new Choices(element);
   *
   * example.setChoices([{
   *   label: 'Group one',
   *   id: 1,
   *   disabled: false,
   *   choices: [
   *     {value: 'Child One', label: 'Child One', selected: true},
   *     {value: 'Child Two', label: 'Child Two',  disabled: true},
   *     {value: 'Child Three', label: 'Child Three'},
   *   ]
   * },
   * {
   *   label: 'Group two',
   *   id: 2,
   *   disabled: false,
   *   choices: [
   *     {value: 'Child Four', label: 'Child Four', disabled: true},
   *     {value: 'Child Five', label: 'Child Five'},
   *     {value: 'Child Six', label: 'Child Six', customProperties: {
   *       description: 'Custom description about child six',
   *       random: 'Another random custom property'
   *     }},
   *   ]
   * }], 'value', 'label', false);
   * ```
   */
  ;

  _proto.setChoices = function setChoices(choicesArrayOrFetcher, value, label, replaceChoices) {
    var _this11 = this;

    if (choicesArrayOrFetcher === void 0) {
      choicesArrayOrFetcher = [];
    }

    if (value === void 0) {
      value = 'value';
    }

    if (label === void 0) {
      label = 'label';
    }

    if (replaceChoices === void 0) {
      replaceChoices = false;
    }

    if (!this.initialised) {
      throw new ReferenceError("setChoices was called on a non-initialized instance of Choices");
    }

    if (!this._isSelectElement) {
      throw new TypeError("setChoices can't be used with INPUT based Choices");
    }

    if (typeof value !== 'string' || !value) {
      throw new TypeError("value parameter must be a name of 'value' field in passed objects");
    } // Clear choices if needed


    if (replaceChoices) {
      this.clearChoices();
    }

    if (typeof choicesArrayOrFetcher === 'function') {
      // it's a choices fetcher function
      var fetcher = choicesArrayOrFetcher(this);

      if (typeof Promise === 'function' && fetcher instanceof Promise) {
        // that's a promise
        // eslint-disable-next-line compat/compat
        return new Promise(function (resolve) {
          return requestAnimationFrame(resolve);
        }).then(function () {
          return _this11._handleLoadingState(true);
        }).then(function () {
          return fetcher;
        }).then(function (data) {
          return _this11.setChoices(data, value, label, replaceChoices);
        }).catch(function (err) {
          if (!_this11.config.silent) {
            console.error(err);
          }
        }).then(function () {
          return _this11._handleLoadingState(false);
        }).then(function () {
          return _this11;
        });
      } // function returned something else than promise, let's check if it's an array of choices


      if (!Array.isArray(fetcher)) {
        throw new TypeError(".setChoices first argument function must return either array of choices or Promise, got: " + typeof fetcher);
      } // recursion with results, it's sync and choices were cleared already


      return this.setChoices(fetcher, value, label, false);
    }

    if (!Array.isArray(choicesArrayOrFetcher)) {
      throw new TypeError(".setChoices must be called either with array of choices with a function resulting into Promise of array of choices");
    }

    this.containerOuter.removeLoadingState();

    this._startLoading();

    choicesArrayOrFetcher.forEach(function (groupOrChoice) {
      if (groupOrChoice.choices) {
        _this11._addGroup({
          id: parseInt(groupOrChoice.id, 10) || null,
          group: groupOrChoice,
          valueKey: value,
          labelKey: label
        });
      } else {
        _this11._addChoice({
          value: groupOrChoice[value],
          label: groupOrChoice[label],
          isSelected: groupOrChoice.selected,
          isDisabled: groupOrChoice.disabled,
          customProperties: groupOrChoice.customProperties,
          placeholder: groupOrChoice.placeholder
        });
      }
    });

    this._stopLoading();

    return this;
  };

  _proto.clearChoices = function clearChoices() {
    this._store.dispatch(choices_clearChoices());

    return this;
  };

  _proto.clearStore = function clearStore() {
    this._store.dispatch(clearAll());

    return this;
  };

  _proto.clearInput = function clearInput() {
    var shouldSetInputWidth = !this._isSelectOneElement;
    this.input.clear(shouldSetInputWidth);

    if (!this._isTextElement && this._canSearch) {
      this._isSearching = false;

      this._store.dispatch(choices_activateChoices(true));
    }

    return this;
  };

  _proto._render = function _render() {
    if (this._store.isLoading()) {
      return;
    }

    this._currentState = this._store.state;
    var stateChanged = this._currentState.choices !== this._prevState.choices || this._currentState.groups !== this._prevState.groups || this._currentState.items !== this._prevState.items;
    var shouldRenderChoices = this._isSelectElement;
    var shouldRenderItems = this._currentState.items !== this._prevState.items;

    if (!stateChanged) {
      return;
    }

    if (shouldRenderChoices) {
      this._renderChoices();
    }

    if (shouldRenderItems) {
      this._renderItems();
    }

    this._prevState = this._currentState;
  };

  _proto._renderChoices = function _renderChoices() {
    var _this12 = this;

    var _this$_store = this._store,
        activeGroups = _this$_store.activeGroups,
        activeChoices = _this$_store.activeChoices;
    var choiceListFragment = document.createDocumentFragment();
    this.choiceList.clear();

    if (this.config.resetScrollPosition) {
      requestAnimationFrame(function () {
        return _this12.choiceList.scrollToTop();
      });
    } // If we have grouped options


    if (activeGroups.length >= 1 && !this._isSearching) {
      // If we have a placeholder choice along with groups
      var activePlaceholders = activeChoices.filter(function (activeChoice) {
        return activeChoice.placeholder === true && activeChoice.groupId === -1;
      });

      if (activePlaceholders.length >= 1) {
        choiceListFragment = this._createChoicesFragment(activePlaceholders, choiceListFragment);
      }

      choiceListFragment = this._createGroupsFragment(activeGroups, activeChoices, choiceListFragment);
    } else if (activeChoices.length >= 1) {
      choiceListFragment = this._createChoicesFragment(activeChoices, choiceListFragment);
    } // If we have choices to show


    if (choiceListFragment.childNodes && choiceListFragment.childNodes.length > 0) {
      var activeItems = this._store.activeItems;

      var canAddItem = this._canAddItem(activeItems, this.input.value); // ...and we can select them


      if (canAddItem.response) {
        // ...append them and highlight the first choice
        this.choiceList.append(choiceListFragment);

        this._highlightChoice();
      } else {
        // ...otherwise show a notice
        this.choiceList.append(this._getTemplate('notice', canAddItem.notice));
      }
    } else {
      // Otherwise show a notice
      var dropdownItem;
      var notice;

      if (this._isSearching) {
        notice = typeof this.config.noResultsText === 'function' ? this.config.noResultsText() : this.config.noResultsText;
        dropdownItem = this._getTemplate('notice', notice, 'no-results');
      } else {
        notice = typeof this.config.noChoicesText === 'function' ? this.config.noChoicesText() : this.config.noChoicesText;
        dropdownItem = this._getTemplate('notice', notice, 'no-choices');
      }

      this.choiceList.append(dropdownItem);
    }
  };

  _proto._renderItems = function _renderItems() {
    var activeItems = this._store.activeItems || [];
    this.itemList.clear(); // Create a fragment to store our list items
    // (so we don't have to update the DOM for each item)

    var itemListFragment = this._createItemsFragment(activeItems); // If we have items to add, append them


    if (itemListFragment.childNodes) {
      this.itemList.append(itemListFragment);
    }
  };

  _proto._createGroupsFragment = function _createGroupsFragment(groups, choices, fragment) {
    var _this13 = this;

    if (fragment === void 0) {
      fragment = document.createDocumentFragment();
    }

    var getGroupChoices = function getGroupChoices(group) {
      return choices.filter(function (choice) {
        if (_this13._isSelectOneElement) {
          return choice.groupId === group.id;
        }

        return choice.groupId === group.id && (_this13.config.renderSelectedChoices === 'always' || !choice.selected);
      });
    }; // If sorting is enabled, filter groups


    if (this.config.shouldSort) {
      groups.sort(this.config.sorter);
    }

    groups.forEach(function (group) {
      var groupChoices = getGroupChoices(group);

      if (groupChoices.length >= 1) {
        var dropdownGroup = _this13._getTemplate('choiceGroup', group);

        fragment.appendChild(dropdownGroup);

        _this13._createChoicesFragment(groupChoices, fragment, true);
      }
    });
    return fragment;
  };

  _proto._createChoicesFragment = function _createChoicesFragment(choices, fragment, withinGroup) {
    var _this14 = this;

    if (fragment === void 0) {
      fragment = document.createDocumentFragment();
    }

    if (withinGroup === void 0) {
      withinGroup = false;
    }

    // Create a fragment to store our list items (so we don't have to update the DOM for each item)
    var _this$config = this.config,
        renderSelectedChoices = _this$config.renderSelectedChoices,
        searchResultLimit = _this$config.searchResultLimit,
        renderChoiceLimit = _this$config.renderChoiceLimit;
    var filter = this._isSearching ? sortByScore : this.config.sorter;

    var appendChoice = function appendChoice(choice) {
      var shouldRender = renderSelectedChoices === 'auto' ? _this14._isSelectOneElement || !choice.selected : true;

      if (shouldRender) {
        var dropdownItem = _this14._getTemplate('choice', choice, _this14.config.itemSelectText);

        fragment.appendChild(dropdownItem);
      }
    };

    var rendererableChoices = choices;

    if (renderSelectedChoices === 'auto' && !this._isSelectOneElement) {
      rendererableChoices = choices.filter(function (choice) {
        return !choice.selected;
      });
    } // Split array into placeholders and "normal" choices


    var _rendererableChoices$ = rendererableChoices.reduce(function (acc, choice) {
      if (choice.placeholder) {
        acc.placeholderChoices.push(choice);
      } else {
        acc.normalChoices.push(choice);
      }

      return acc;
    }, {
      placeholderChoices: [],
      normalChoices: []
    }),
        placeholderChoices = _rendererableChoices$.placeholderChoices,
        normalChoices = _rendererableChoices$.normalChoices; // If sorting is enabled or the user is searching, filter choices


    if (this.config.shouldSort || this._isSearching) {
      normalChoices.sort(filter);
    }

    var choiceLimit = rendererableChoices.length; // Prepend placeholeder

    var sortedChoices = this._isSelectOneElement ? [].concat(placeholderChoices, normalChoices) : normalChoices;

    if (this._isSearching) {
      choiceLimit = searchResultLimit;
    } else if (renderChoiceLimit && renderChoiceLimit > 0 && !withinGroup) {
      choiceLimit = renderChoiceLimit;
    } // Add each choice to dropdown within range


    for (var i = 0; i < choiceLimit; i += 1) {
      if (sortedChoices[i]) {
        appendChoice(sortedChoices[i]);
      }
    }

    return fragment;
  };

  _proto._createItemsFragment = function _createItemsFragment(items, fragment) {
    var _this15 = this;

    if (fragment === void 0) {
      fragment = document.createDocumentFragment();
    }

    // Create fragment to add elements to
    var _this$config2 = this.config,
        shouldSortItems = _this$config2.shouldSortItems,
        sorter = _this$config2.sorter,
        removeItemButton = _this$config2.removeItemButton; // If sorting is enabled, filter items

    if (shouldSortItems && !this._isSelectOneElement) {
      items.sort(sorter);
    }

    if (this._isTextElement) {
      // Update the value of the hidden input
      this.passedElement.value = items;
    } else {
      // Update the options of the hidden input
      this.passedElement.options = items;
    }

    var addItemToFragment = function addItemToFragment(item) {
      // Create new list element
      var listItem = _this15._getTemplate('item', item, removeItemButton); // Append it to list


      fragment.appendChild(listItem);
    }; // Add each list item to list


    items.forEach(addItemToFragment);
    return fragment;
  };

  _proto._triggerChange = function _triggerChange(value) {
    if (value === undefined || value === null) {
      return;
    }

    this.passedElement.triggerEvent(EVENTS.change, {
      value: value
    });
  };

  _proto._selectPlaceholderChoice = function _selectPlaceholderChoice() {
    var placeholderChoice = this._store.placeholderChoice;

    if (placeholderChoice) {
      this._addItem({
        value: placeholderChoice.value,
        label: placeholderChoice.label,
        choiceId: placeholderChoice.id,
        groupId: placeholderChoice.groupId,
        placeholder: placeholderChoice.placeholder
      });

      this._triggerChange(placeholderChoice.value);
    }
  };

  _proto._handleButtonAction = function _handleButtonAction(activeItems, element) {
    if (!activeItems || !element || !this.config.removeItems || !this.config.removeItemButton) {
      return;
    }

    var itemId = element.parentNode.getAttribute('data-id');
    var itemToRemove = activeItems.find(function (item) {
      return item.id === parseInt(itemId, 10);
    }); // Remove item associated with button

    this._removeItem(itemToRemove);

    this._triggerChange(itemToRemove.value);

    if (this._isSelectOneElement) {
      this._selectPlaceholderChoice();
    }
  };

  _proto._handleItemAction = function _handleItemAction(activeItems, element, hasShiftKey) {
    var _this16 = this;

    if (hasShiftKey === void 0) {
      hasShiftKey = false;
    }

    if (!activeItems || !element || !this.config.removeItems || this._isSelectOneElement) {
      return;
    }

    var passedId = element.getAttribute('data-id'); // We only want to select one item with a click
    // so we deselect any items that aren't the target
    // unless shift is being pressed

    activeItems.forEach(function (item) {
      if (item.id === parseInt(passedId, 10) && !item.highlighted) {
        _this16.highlightItem(item);
      } else if (!hasShiftKey && item.highlighted) {
        _this16.unhighlightItem(item);
      }
    }); // Focus input as without focus, a user cannot do anything with a
    // highlighted item

    this.input.focus();
  };

  _proto._handleChoiceAction = function _handleChoiceAction(activeItems, element) {
    if (!activeItems || !element) {
      return;
    } // If we are clicking on an option


    var id = element.dataset.id;

    var choice = this._store.getChoiceById(id);

    if (!choice) {
      return;
    }

    var passedKeyCode = activeItems[0] && activeItems[0].keyCode ? activeItems[0].keyCode : null;
    var hasActiveDropdown = this.dropdown.isActive; // Update choice keyCode

    choice.keyCode = passedKeyCode;
    this.passedElement.triggerEvent(EVENTS.choice, {
      choice: choice
    });

    if (!choice.selected && !choice.disabled) {
      var canAddItem = this._canAddItem(activeItems, choice.value);

      if (canAddItem.response) {
        this._addItem({
          value: choice.value,
          label: choice.label,
          choiceId: choice.id,
          groupId: choice.groupId,
          customProperties: choice.customProperties,
          placeholder: choice.placeholder,
          keyCode: choice.keyCode
        });

        this._triggerChange(choice.value);
      }
    }

    this.clearInput(); // We want to close the dropdown if we are dealing with a single select box

    if (hasActiveDropdown && this._isSelectOneElement) {
      this.hideDropdown(true);
      this.containerOuter.focus();
    }
  };

  _proto._handleBackspace = function _handleBackspace(activeItems) {
    if (!this.config.removeItems || !activeItems) {
      return;
    }

    var lastItem = activeItems[activeItems.length - 1];
    var hasHighlightedItems = activeItems.some(function (item) {
      return item.highlighted;
    }); // If editing the last item is allowed and there are not other selected items,
    // we can edit the item value. Otherwise if we can remove items, remove all selected items

    if (this.config.editItems && !hasHighlightedItems && lastItem) {
      this.input.value = lastItem.value;
      this.input.setWidth();

      this._removeItem(lastItem);

      this._triggerChange(lastItem.value);
    } else {
      if (!hasHighlightedItems) {
        // Highlight last item if none already highlighted
        this.highlightItem(lastItem, false);
      }

      this.removeHighlightedItems(true);
    }
  };

  _proto._startLoading = function _startLoading() {
    this._store.dispatch(setIsLoading(true));
  };

  _proto._stopLoading = function _stopLoading() {
    this._store.dispatch(setIsLoading(false));
  };

  _proto._handleLoadingState = function _handleLoadingState(setLoading) {
    if (setLoading === void 0) {
      setLoading = true;
    }

    var placeholderItem = this.itemList.getChild("." + this.config.classNames.placeholder);

    if (setLoading) {
      this.disable();
      this.containerOuter.addLoadingState();

      if (this._isSelectOneElement) {
        if (!placeholderItem) {
          placeholderItem = this._getTemplate('placeholder', this.config.loadingText);
          this.itemList.append(placeholderItem);
        } else {
          placeholderItem.innerHTML = this.config.loadingText;
        }
      } else {
        this.input.placeholder = this.config.loadingText;
      }
    } else {
      this.enable();
      this.containerOuter.removeLoadingState();

      if (this._isSelectOneElement) {
        placeholderItem.innerHTML = this._placeholderValue || '';
      } else {
        this.input.placeholder = this._placeholderValue || '';
      }
    }
  };

  _proto._handleSearch = function _handleSearch(value) {
    if (!value || !this.input.isFocussed) {
      return;
    }

    var choices = this._store.choices;
    var _this$config3 = this.config,
        searchFloor = _this$config3.searchFloor,
        searchChoices = _this$config3.searchChoices;
    var hasUnactiveChoices = choices.some(function (option) {
      return !option.active;
    }); // Check that we have a value to search and the input was an alphanumeric character

    if (value && value.length >= searchFloor) {
      var resultCount = searchChoices ? this._searchChoices(value) : 0; // Trigger search event

      this.passedElement.triggerEvent(EVENTS.search, {
        value: value,
        resultCount: resultCount
      });
    } else if (hasUnactiveChoices) {
      // Otherwise reset choices to active
      this._isSearching = false;

      this._store.dispatch(choices_activateChoices(true));
    }
  };

  _proto._canAddItem = function _canAddItem(activeItems, value) {
    var canAddItem = true;
    var notice = typeof this.config.addItemText === 'function' ? this.config.addItemText(value) : this.config.addItemText;

    if (!this._isSelectOneElement) {
      var isDuplicateValue = existsInArray(activeItems, value);

      if (this.config.maxItemCount > 0 && this.config.maxItemCount <= activeItems.length) {
        // If there is a max entry limit and we have reached that limit
        // don't update
        canAddItem = false;
        notice = typeof this.config.maxItemText === 'function' ? this.config.maxItemText(this.config.maxItemCount) : this.config.maxItemText;
      }

      if (!this.config.duplicateItemsAllowed && isDuplicateValue && canAddItem) {
        canAddItem = false;
        notice = typeof this.config.uniqueItemText === 'function' ? this.config.uniqueItemText(value) : this.config.uniqueItemText;
      }

      if (this._isTextElement && this.config.addItems && canAddItem && typeof this.config.addItemFilter === 'function' && !this.config.addItemFilter(value)) {
        canAddItem = false;
        notice = typeof this.config.customAddItemText === 'function' ? this.config.customAddItemText(value) : this.config.customAddItemText;
      }
    }

    return {
      response: canAddItem,
      notice: notice
    };
  };

  _proto._searchChoices = function _searchChoices(value) {
    var newValue = typeof value === 'string' ? value.trim() : value;
    var currentValue = typeof this._currentValue === 'string' ? this._currentValue.trim() : this._currentValue;

    if (newValue.length < 1 && newValue === currentValue + " ") {
      return 0;
    } // If new value matches the desired length and is not the same as the current value with a space


    var haystack = this._store.searchableChoices;
    var needle = newValue;
    var keys = [].concat(this.config.searchFields);
    var options = Object.assign(this.config.fuseOptions, {
      keys: keys
    });
    var fuse = new fuse_default.a(haystack, options);
    var results = fuse.search(needle);
    this._currentValue = newValue;
    this._highlightPosition = 0;
    this._isSearching = true;

    this._store.dispatch(choices_filterChoices(results));

    return results.length;
  };

  _proto._addEventListeners = function _addEventListeners() {
    var _document = document,
        documentElement = _document.documentElement; // capture events - can cancel event processing or propagation

    documentElement.addEventListener('touchend', this._onTouchEnd, true);
    this.containerOuter.element.addEventListener('keydown', this._onKeyDown, true);
    this.containerOuter.element.addEventListener('mousedown', this._onMouseDown, true); // passive events - doesn't call `preventDefault` or `stopPropagation`

    documentElement.addEventListener('click', this._onClick, {
      passive: true
    });
    documentElement.addEventListener('touchmove', this._onTouchMove, {
      passive: true
    });
    this.dropdown.element.addEventListener('mouseover', this._onMouseOver, {
      passive: true
    });

    if (this._isSelectOneElement) {
      this.containerOuter.element.addEventListener('focus', this._onFocus, {
        passive: true
      });
      this.containerOuter.element.addEventListener('blur', this._onBlur, {
        passive: true
      });
    }

    this.input.element.addEventListener('keyup', this._onKeyUp, {
      passive: true
    });
    this.input.element.addEventListener('focus', this._onFocus, {
      passive: true
    });
    this.input.element.addEventListener('blur', this._onBlur, {
      passive: true
    });

    if (this.input.element.form) {
      this.input.element.form.addEventListener('reset', this._onFormReset, {
        passive: true
      });
    }

    this.input.addEventListeners();
  };

  _proto._removeEventListeners = function _removeEventListeners() {
    var _document2 = document,
        documentElement = _document2.documentElement;
    documentElement.removeEventListener('touchend', this._onTouchEnd, true);
    this.containerOuter.element.removeEventListener('keydown', this._onKeyDown, true);
    this.containerOuter.element.removeEventListener('mousedown', this._onMouseDown, true);
    documentElement.removeEventListener('click', this._onClick);
    documentElement.removeEventListener('touchmove', this._onTouchMove);
    this.dropdown.element.removeEventListener('mouseover', this._onMouseOver);

    if (this._isSelectOneElement) {
      this.containerOuter.element.removeEventListener('focus', this._onFocus);
      this.containerOuter.element.removeEventListener('blur', this._onBlur);
    }

    this.input.element.removeEventListener('keyup', this._onKeyUp);
    this.input.element.removeEventListener('focus', this._onFocus);
    this.input.element.removeEventListener('blur', this._onBlur);

    if (this.input.element.form) {
      this.input.element.form.removeEventListener('reset', this._onFormReset);
    }

    this.input.removeEventListeners();
  }
  /**
   * @param {KeyboardEvent} event
   */
  ;

  _proto._onKeyDown = function _onKeyDown(event) {
    var _keyDownActions;

    var target = event.target,
        keyCode = event.keyCode,
        ctrlKey = event.ctrlKey,
        metaKey = event.metaKey;
    var activeItems = this._store.activeItems;
    var hasFocusedInput = this.input.isFocussed;
    var hasActiveDropdown = this.dropdown.isActive;
    var hasItems = this.itemList.hasChildren();
    var keyString = String.fromCharCode(keyCode);
    var BACK_KEY = KEY_CODES.BACK_KEY,
        DELETE_KEY = KEY_CODES.DELETE_KEY,
        ENTER_KEY = KEY_CODES.ENTER_KEY,
        A_KEY = KEY_CODES.A_KEY,
        ESC_KEY = KEY_CODES.ESC_KEY,
        UP_KEY = KEY_CODES.UP_KEY,
        DOWN_KEY = KEY_CODES.DOWN_KEY,
        PAGE_UP_KEY = KEY_CODES.PAGE_UP_KEY,
        PAGE_DOWN_KEY = KEY_CODES.PAGE_DOWN_KEY;
    var hasCtrlDownKeyPressed = ctrlKey || metaKey; // If a user is typing and the dropdown is not active

    if (!this._isTextElement && /[a-zA-Z0-9-_ ]/.test(keyString)) {
      this.showDropdown();
    } // Map keys to key actions


    var keyDownActions = (_keyDownActions = {}, _keyDownActions[A_KEY] = this._onAKey, _keyDownActions[ENTER_KEY] = this._onEnterKey, _keyDownActions[ESC_KEY] = this._onEscapeKey, _keyDownActions[UP_KEY] = this._onDirectionKey, _keyDownActions[PAGE_UP_KEY] = this._onDirectionKey, _keyDownActions[DOWN_KEY] = this._onDirectionKey, _keyDownActions[PAGE_DOWN_KEY] = this._onDirectionKey, _keyDownActions[DELETE_KEY] = this._onDeleteKey, _keyDownActions[BACK_KEY] = this._onDeleteKey, _keyDownActions); // If keycode has a function, run it

    if (keyDownActions[keyCode]) {
      keyDownActions[keyCode]({
        event: event,
        target: target,
        keyCode: keyCode,
        metaKey: metaKey,
        activeItems: activeItems,
        hasFocusedInput: hasFocusedInput,
        hasActiveDropdown: hasActiveDropdown,
        hasItems: hasItems,
        hasCtrlDownKeyPressed: hasCtrlDownKeyPressed
      });
    }
  };

  _proto._onKeyUp = function _onKeyUp(_ref2) {
    var target = _ref2.target,
        keyCode = _ref2.keyCode;
    var value = this.input.value;
    var activeItems = this._store.activeItems;

    var canAddItem = this._canAddItem(activeItems, value);

    var backKey = KEY_CODES.BACK_KEY,
        deleteKey = KEY_CODES.DELETE_KEY; // We are typing into a text input and have a value, we want to show a dropdown
    // notice. Otherwise hide the dropdown

    if (this._isTextElement) {
      var canShowDropdownNotice = canAddItem.notice && value;

      if (canShowDropdownNotice) {
        var dropdownItem = this._getTemplate('notice', canAddItem.notice);

        this.dropdown.element.innerHTML = dropdownItem.outerHTML;
        this.showDropdown(true);
      } else {
        this.hideDropdown(true);
      }
    } else {
      var userHasRemovedValue = (keyCode === backKey || keyCode === deleteKey) && !target.value;
      var canReactivateChoices = !this._isTextElement && this._isSearching;
      var canSearch = this._canSearch && canAddItem.response;

      if (userHasRemovedValue && canReactivateChoices) {
        this._isSearching = false;

        this._store.dispatch(choices_activateChoices(true));
      } else if (canSearch) {
        this._handleSearch(this.input.value);
      }
    }

    this._canSearch = this.config.searchEnabled;
  };

  _proto._onAKey = function _onAKey(_ref3) {
    var hasItems = _ref3.hasItems,
        hasCtrlDownKeyPressed = _ref3.hasCtrlDownKeyPressed;

    // If CTRL + A or CMD + A have been pressed and there are items to select
    if (hasCtrlDownKeyPressed && hasItems) {
      this._canSearch = false;
      var shouldHightlightAll = this.config.removeItems && !this.input.value && this.input.element === document.activeElement;

      if (shouldHightlightAll) {
        this.highlightAll();
      }
    }
  };

  _proto._onEnterKey = function _onEnterKey(_ref4) {
    var event = _ref4.event,
        target = _ref4.target,
        activeItems = _ref4.activeItems,
        hasActiveDropdown = _ref4.hasActiveDropdown;
    var enterKey = KEY_CODES.ENTER_KEY;
    var targetWasButton = target.hasAttribute('data-button');

    if (this._isTextElement && target.value) {
      var value = this.input.value;

      var canAddItem = this._canAddItem(activeItems, value);

      if (canAddItem.response) {
        this.hideDropdown(true);

        this._addItem({
          value: value
        });

        this._triggerChange(value);

        this.clearInput();
      }
    }

    if (targetWasButton) {
      this._handleButtonAction(activeItems, target);

      event.preventDefault();
    }

    if (hasActiveDropdown) {
      var highlightedChoice = this.dropdown.getChild("." + this.config.classNames.highlightedState);

      if (highlightedChoice) {
        // add enter keyCode value
        if (activeItems[0]) {
          activeItems[0].keyCode = enterKey; // eslint-disable-line no-param-reassign
        }

        this._handleChoiceAction(activeItems, highlightedChoice);
      }

      event.preventDefault();
    } else if (this._isSelectOneElement) {
      this.showDropdown();
      event.preventDefault();
    }
  };

  _proto._onEscapeKey = function _onEscapeKey(_ref5) {
    var hasActiveDropdown = _ref5.hasActiveDropdown;

    if (hasActiveDropdown) {
      this.hideDropdown(true);
      this.containerOuter.focus();
    }
  };

  _proto._onDirectionKey = function _onDirectionKey(_ref6) {
    var event = _ref6.event,
        hasActiveDropdown = _ref6.hasActiveDropdown,
        keyCode = _ref6.keyCode,
        metaKey = _ref6.metaKey;
    var downKey = KEY_CODES.DOWN_KEY,
        pageUpKey = KEY_CODES.PAGE_UP_KEY,
        pageDownKey = KEY_CODES.PAGE_DOWN_KEY; // If up or down key is pressed, traverse through options

    if (hasActiveDropdown || this._isSelectOneElement) {
      this.showDropdown();
      this._canSearch = false;
      var directionInt = keyCode === downKey || keyCode === pageDownKey ? 1 : -1;
      var skipKey = metaKey || keyCode === pageDownKey || keyCode === pageUpKey;
      var selectableChoiceIdentifier = '[data-choice-selectable]';
      var nextEl;

      if (skipKey) {
        if (directionInt > 0) {
          nextEl = this.dropdown.element.querySelector(selectableChoiceIdentifier + ":last-of-type");
        } else {
          nextEl = this.dropdown.element.querySelector(selectableChoiceIdentifier);
        }
      } else {
        var currentEl = this.dropdown.element.querySelector("." + this.config.classNames.highlightedState);

        if (currentEl) {
          nextEl = getAdjacentEl(currentEl, selectableChoiceIdentifier, directionInt);
        } else {
          nextEl = this.dropdown.element.querySelector(selectableChoiceIdentifier);
        }
      }

      if (nextEl) {
        // We prevent default to stop the cursor moving
        // when pressing the arrow
        if (!isScrolledIntoView(nextEl, this.choiceList.element, directionInt)) {
          this.choiceList.scrollToChildElement(nextEl, directionInt);
        }

        this._highlightChoice(nextEl);
      } // Prevent default to maintain cursor position whilst
      // traversing dropdown options


      event.preventDefault();
    }
  };

  _proto._onDeleteKey = function _onDeleteKey(_ref7) {
    var event = _ref7.event,
        target = _ref7.target,
        hasFocusedInput = _ref7.hasFocusedInput,
        activeItems = _ref7.activeItems;

    // If backspace or delete key is pressed and the input has no value
    if (hasFocusedInput && !target.value && !this._isSelectOneElement) {
      this._handleBackspace(activeItems);

      event.preventDefault();
    }
  };

  _proto._onTouchMove = function _onTouchMove() {
    if (this._wasTap) {
      this._wasTap = false;
    }
  };

  _proto._onTouchEnd = function _onTouchEnd(event) {
    var _ref8 = event || event.touches[0],
        target = _ref8.target;

    var touchWasWithinContainer = this._wasTap && this.containerOuter.element.contains(target);

    if (touchWasWithinContainer) {
      var containerWasExactTarget = target === this.containerOuter.element || target === this.containerInner.element;

      if (containerWasExactTarget) {
        if (this._isTextElement) {
          this.input.focus();
        } else if (this._isSelectMultipleElement) {
          this.showDropdown();
        }
      } // Prevents focus event firing


      event.stopPropagation();
    }

    this._wasTap = true;
  }
  /**
   * Handles mousedown event in capture mode for containetOuter.element
   * @param {MouseEvent} event
   */
  ;

  _proto._onMouseDown = function _onMouseDown(event) {
    var target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    } // If we have our mouse down on the scrollbar and are on IE11...


    if (IS_IE11 && this.choiceList.element.contains(target)) {
      // check if click was on a scrollbar area
      var firstChoice =
      /** @type {HTMLElement} */
      this.choiceList.element.firstElementChild;
      var isOnScrollbar = this._direction === 'ltr' ? event.offsetX >= firstChoice.offsetWidth : event.offsetX < firstChoice.offsetLeft;
      this._isScrollingOnIe = isOnScrollbar;
    }

    if (target === this.input.element) {
      return;
    }

    var item = target.closest('[data-button],[data-item],[data-choice]');

    if (item instanceof HTMLElement) {
      var hasShiftKey = event.shiftKey;
      var activeItems = this._store.activeItems;
      var dataset = item.dataset;

      if ('button' in dataset) {
        this._handleButtonAction(activeItems, item);
      } else if ('item' in dataset) {
        this._handleItemAction(activeItems, item, hasShiftKey);
      } else if ('choice' in dataset) {
        this._handleChoiceAction(activeItems, item);
      }
    }

    event.preventDefault();
  }
  /**
   * Handles mouseover event over this.dropdown
   * @param {MouseEvent} event
   */
  ;

  _proto._onMouseOver = function _onMouseOver(_ref9) {
    var target = _ref9.target;

    if (target instanceof HTMLElement && 'choice' in target.dataset) {
      this._highlightChoice(target);
    }
  };

  _proto._onClick = function _onClick(_ref10) {
    var target = _ref10.target;
    var clickWasWithinContainer = this.containerOuter.element.contains(target);

    if (clickWasWithinContainer) {
      if (!this.dropdown.isActive && !this.containerOuter.isDisabled) {
        if (this._isTextElement) {
          if (document.activeElement !== this.input.element) {
            this.input.focus();
          }
        } else {
          this.showDropdown();
          this.containerOuter.focus();
        }
      } else if (this._isSelectOneElement && target !== this.input.element && !this.dropdown.element.contains(target)) {
        this.hideDropdown();
      }
    } else {
      var hasHighlightedItems = this._store.highlightedActiveItems.length > 0;

      if (hasHighlightedItems) {
        this.unhighlightAll();
      }

      this.containerOuter.removeFocusState();
      this.hideDropdown(true);
    }
  };

  _proto._onFocus = function _onFocus(_ref11) {
    var _this17 = this,
        _focusActions;

    var target = _ref11.target;
    var focusWasWithinContainer = this.containerOuter.element.contains(target);

    if (!focusWasWithinContainer) {
      return;
    }

    var focusActions = (_focusActions = {}, _focusActions[TEXT_TYPE] = function () {
      if (target === _this17.input.element) {
        _this17.containerOuter.addFocusState();
      }
    }, _focusActions[SELECT_ONE_TYPE] = function () {
      _this17.containerOuter.addFocusState();

      if (target === _this17.input.element) {
        _this17.showDropdown(true);
      }
    }, _focusActions[SELECT_MULTIPLE_TYPE] = function () {
      if (target === _this17.input.element) {
        _this17.showDropdown(true); // If element is a select box, the focused element is the container and the dropdown
        // isn't already open, focus and show dropdown


        _this17.containerOuter.addFocusState();
      }
    }, _focusActions);
    focusActions[this.passedElement.element.type]();
  };

  _proto._onBlur = function _onBlur(_ref12) {
    var _this18 = this;

    var target = _ref12.target;
    var blurWasWithinContainer = this.containerOuter.element.contains(target);

    if (blurWasWithinContainer && !this._isScrollingOnIe) {
      var _blurActions;

      var activeItems = this._store.activeItems;
      var hasHighlightedItems = activeItems.some(function (item) {
        return item.highlighted;
      });
      var blurActions = (_blurActions = {}, _blurActions[TEXT_TYPE] = function () {
        if (target === _this18.input.element) {
          _this18.containerOuter.removeFocusState();

          if (hasHighlightedItems) {
            _this18.unhighlightAll();
          }

          _this18.hideDropdown(true);
        }
      }, _blurActions[SELECT_ONE_TYPE] = function () {
        _this18.containerOuter.removeFocusState();

        if (target === _this18.input.element || target === _this18.containerOuter.element && !_this18._canSearch) {
          _this18.hideDropdown(true);
        }
      }, _blurActions[SELECT_MULTIPLE_TYPE] = function () {
        if (target === _this18.input.element) {
          _this18.containerOuter.removeFocusState();

          _this18.hideDropdown(true);

          if (hasHighlightedItems) {
            _this18.unhighlightAll();
          }
        }
      }, _blurActions);
      blurActions[this.passedElement.element.type]();
    } else {
      // On IE11, clicking the scollbar blurs our input and thus
      // closes the dropdown. To stop this, we refocus our input
      // if we know we are on IE *and* are scrolling.
      this._isScrollingOnIe = false;
      this.input.element.focus();
    }
  };

  _proto._onFormReset = function _onFormReset() {
    this._store.dispatch(resetTo(this._initialState));
  };

  _proto._highlightChoice = function _highlightChoice(el) {
    var _this19 = this;

    if (el === void 0) {
      el = null;
    }

    var choices = Array.from(this.dropdown.element.querySelectorAll('[data-choice-selectable]'));

    if (!choices.length) {
      return;
    }

    var passedEl = el;
    var highlightedChoices = Array.from(this.dropdown.element.querySelectorAll("." + this.config.classNames.highlightedState)); // Remove any highlighted choices

    highlightedChoices.forEach(function (choice) {
      choice.classList.remove(_this19.config.classNames.highlightedState);
      choice.setAttribute('aria-selected', 'false');
    });

    if (passedEl) {
      this._highlightPosition = choices.indexOf(passedEl);
    } else {
      // Highlight choice based on last known highlight location
      if (choices.length > this._highlightPosition) {
        // If we have an option to highlight
        passedEl = choices[this._highlightPosition];
      } else {
        // Otherwise highlight the option before
        passedEl = choices[choices.length - 1];
      }

      if (!passedEl) {
        passedEl = choices[0];
      }
    }

    passedEl.classList.add(this.config.classNames.highlightedState);
    passedEl.setAttribute('aria-selected', 'true');
    this.passedElement.triggerEvent(EVENTS.highlightChoice, {
      el: passedEl
    });

    if (this.dropdown.isActive) {
      // IE11 ignores aria-label and blocks virtual keyboard
      // if aria-activedescendant is set without a dropdown
      this.input.setActiveDescendant(passedEl.id);
      this.containerOuter.setActiveDescendant(passedEl.id);
    }
  };

  _proto._addItem = function _addItem(_ref13) {
    var value = _ref13.value,
        _ref13$label = _ref13.label,
        label = _ref13$label === void 0 ? null : _ref13$label,
        _ref13$choiceId = _ref13.choiceId,
        choiceId = _ref13$choiceId === void 0 ? -1 : _ref13$choiceId,
        _ref13$groupId = _ref13.groupId,
        groupId = _ref13$groupId === void 0 ? -1 : _ref13$groupId,
        _ref13$customProperti = _ref13.customProperties,
        customProperties = _ref13$customProperti === void 0 ? null : _ref13$customProperti,
        _ref13$placeholder = _ref13.placeholder,
        placeholder = _ref13$placeholder === void 0 ? false : _ref13$placeholder,
        _ref13$keyCode = _ref13.keyCode,
        keyCode = _ref13$keyCode === void 0 ? null : _ref13$keyCode;
    var passedValue = typeof value === 'string' ? value.trim() : value;
    var passedKeyCode = keyCode;
    var passedCustomProperties = customProperties;
    var items = this._store.items;
    var passedLabel = label || passedValue;
    var passedOptionId = choiceId || -1;
    var group = groupId >= 0 ? this._store.getGroupById(groupId) : null;
    var id = items ? items.length + 1 : 1; // If a prepended value has been passed, prepend it

    if (this.config.prependValue) {
      passedValue = this.config.prependValue + passedValue.toString();
    } // If an appended value has been passed, append it


    if (this.config.appendValue) {
      passedValue += this.config.appendValue.toString();
    }

    this._store.dispatch(items_addItem({
      value: passedValue,
      label: passedLabel,
      id: id,
      choiceId: passedOptionId,
      groupId: groupId,
      customProperties: customProperties,
      placeholder: placeholder,
      keyCode: passedKeyCode
    }));

    if (this._isSelectOneElement) {
      this.removeActiveItems(id);
    } // Trigger change event


    this.passedElement.triggerEvent(EVENTS.addItem, {
      id: id,
      value: passedValue,
      label: passedLabel,
      customProperties: passedCustomProperties,
      groupValue: group && group.value ? group.value : undefined,
      keyCode: passedKeyCode
    });
    return this;
  };

  _proto._removeItem = function _removeItem(item) {
    if (!item || !isType('Object', item)) {
      return this;
    }

    var id = item.id,
        value = item.value,
        label = item.label,
        choiceId = item.choiceId,
        groupId = item.groupId;
    var group = groupId >= 0 ? this._store.getGroupById(groupId) : null;

    this._store.dispatch(items_removeItem(id, choiceId));

    if (group && group.value) {
      this.passedElement.triggerEvent(EVENTS.removeItem, {
        id: id,
        value: value,
        label: label,
        groupValue: group.value
      });
    } else {
      this.passedElement.triggerEvent(EVENTS.removeItem, {
        id: id,
        value: value,
        label: label
      });
    }

    return this;
  };

  _proto._addChoice = function _addChoice(_ref14) {
    var value = _ref14.value,
        _ref14$label = _ref14.label,
        label = _ref14$label === void 0 ? null : _ref14$label,
        _ref14$isSelected = _ref14.isSelected,
        isSelected = _ref14$isSelected === void 0 ? false : _ref14$isSelected,
        _ref14$isDisabled = _ref14.isDisabled,
        isDisabled = _ref14$isDisabled === void 0 ? false : _ref14$isDisabled,
        _ref14$groupId = _ref14.groupId,
        groupId = _ref14$groupId === void 0 ? -1 : _ref14$groupId,
        _ref14$customProperti = _ref14.customProperties,
        customProperties = _ref14$customProperti === void 0 ? null : _ref14$customProperti,
        _ref14$placeholder = _ref14.placeholder,
        placeholder = _ref14$placeholder === void 0 ? false : _ref14$placeholder,
        _ref14$keyCode = _ref14.keyCode,
        keyCode = _ref14$keyCode === void 0 ? null : _ref14$keyCode;

    if (typeof value === 'undefined' || value === null) {
      return;
    } // Generate unique id


    var choices = this._store.choices;
    var choiceLabel = label || value;
    var choiceId = choices ? choices.length + 1 : 1;
    var choiceElementId = this._baseId + "-" + this._idNames.itemChoice + "-" + choiceId;

    this._store.dispatch(choices_addChoice({
      id: choiceId,
      groupId: groupId,
      elementId: choiceElementId,
      value: value,
      label: choiceLabel,
      disabled: isDisabled,
      customProperties: customProperties,
      placeholder: placeholder,
      keyCode: keyCode
    }));

    if (isSelected) {
      this._addItem({
        value: value,
        label: choiceLabel,
        choiceId: choiceId,
        customProperties: customProperties,
        placeholder: placeholder,
        keyCode: keyCode
      });
    }
  };

  _proto._addGroup = function _addGroup(_ref15) {
    var _this20 = this;

    var group = _ref15.group,
        id = _ref15.id,
        _ref15$valueKey = _ref15.valueKey,
        valueKey = _ref15$valueKey === void 0 ? 'value' : _ref15$valueKey,
        _ref15$labelKey = _ref15.labelKey,
        labelKey = _ref15$labelKey === void 0 ? 'label' : _ref15$labelKey;
    var groupChoices = isType('Object', group) ? group.choices : Array.from(group.getElementsByTagName('OPTION'));
    var groupId = id || Math.floor(new Date().valueOf() * Math.random());
    var isDisabled = group.disabled ? group.disabled : false;

    if (groupChoices) {
      this._store.dispatch(groups_addGroup({
        value: group.label,
        id: groupId,
        active: true,
        disabled: isDisabled
      }));

      var addGroupChoices = function addGroupChoices(choice) {
        var isOptDisabled = choice.disabled || choice.parentNode && choice.parentNode.disabled;

        _this20._addChoice({
          value: choice[valueKey],
          label: isType('Object', choice) ? choice[labelKey] : choice.innerHTML,
          isSelected: choice.selected,
          isDisabled: isOptDisabled,
          groupId: groupId,
          customProperties: choice.customProperties,
          placeholder: choice.placeholder
        });
      };

      groupChoices.forEach(addGroupChoices);
    } else {
      this._store.dispatch(groups_addGroup({
        value: group.label,
        id: group.id,
        active: false,
        disabled: group.disabled
      }));
    }
  };

  _proto._getTemplate = function _getTemplate(template) {
    var _this$_templates$temp;

    if (!template) {
      return null;
    }

    var classNames = this.config.classNames;

    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return (_this$_templates$temp = this._templates[template]).call.apply(_this$_templates$temp, [this, classNames].concat(args));
  };

  _proto._createTemplates = function _createTemplates() {
    var callbackOnCreateTemplates = this.config.callbackOnCreateTemplates;
    var userTemplates = {};

    if (callbackOnCreateTemplates && typeof callbackOnCreateTemplates === 'function') {
      userTemplates = callbackOnCreateTemplates.call(this, strToEl);
    }

    this._templates = cjs_default()(TEMPLATES, userTemplates);
  };

  _proto._createElements = function _createElements() {
    this.containerOuter = new container_Container({
      element: this._getTemplate('containerOuter', this._direction, this._isSelectElement, this._isSelectOneElement, this.config.searchEnabled, this.passedElement.element.type),
      classNames: this.config.classNames,
      type: this.passedElement.element.type,
      position: this.config.position
    });
    this.containerInner = new container_Container({
      element: this._getTemplate('containerInner'),
      classNames: this.config.classNames,
      type: this.passedElement.element.type,
      position: this.config.position
    });
    this.input = new input_Input({
      element: this._getTemplate('input', this._placeholderValue),
      classNames: this.config.classNames,
      type: this.passedElement.element.type,
      preventPaste: !this.config.paste
    });
    this.choiceList = new list_List({
      element: this._getTemplate('choiceList', this._isSelectOneElement)
    });
    this.itemList = new list_List({
      element: this._getTemplate('itemList', this._isSelectOneElement)
    });
    this.dropdown = new Dropdown({
      element: this._getTemplate('dropdown'),
      classNames: this.config.classNames,
      type: this.passedElement.element.type
    });
  };

  _proto._createStructure = function _createStructure() {
    // Hide original element
    this.passedElement.conceal(); // Wrap input in container preserving DOM ordering

    this.containerInner.wrap(this.passedElement.element); // Wrapper inner container with outer container

    this.containerOuter.wrap(this.containerInner.element);

    if (this._isSelectOneElement) {
      this.input.placeholder = this.config.searchPlaceholderValue || '';
    } else if (this._placeholderValue) {
      this.input.placeholder = this._placeholderValue;
      this.input.setWidth();
    }

    this.containerOuter.element.appendChild(this.containerInner.element);
    this.containerOuter.element.appendChild(this.dropdown.element);
    this.containerInner.element.appendChild(this.itemList.element);

    if (!this._isTextElement) {
      this.dropdown.element.appendChild(this.choiceList.element);
    }

    if (!this._isSelectOneElement) {
      this.containerInner.element.appendChild(this.input.element);
    } else if (this.config.searchEnabled) {
      this.dropdown.element.insertBefore(this.input.element, this.dropdown.element.firstChild);
    }

    if (this._isSelectElement) {
      this._highlightPosition = 0;
      this._isSearching = false;

      this._startLoading();

      if (this._presetGroups.length) {
        this._addPredefinedGroups(this._presetGroups);
      } else {
        this._addPredefinedChoices(this._presetChoices);
      }

      this._stopLoading();
    }

    if (this._isTextElement) {
      this._addPredefinedItems(this._presetItems);
    }
  };

  _proto._addPredefinedGroups = function _addPredefinedGroups(groups) {
    var _this21 = this;

    // If we have a placeholder option
    var placeholderChoice = this.passedElement.placeholderOption;

    if (placeholderChoice && placeholderChoice.parentNode.tagName === 'SELECT') {
      this._addChoice({
        value: placeholderChoice.value,
        label: placeholderChoice.innerHTML,
        isSelected: placeholderChoice.selected,
        isDisabled: placeholderChoice.disabled,
        placeholder: true
      });
    }

    groups.forEach(function (group) {
      return _this21._addGroup({
        group: group,
        id: group.id || null
      });
    });
  };

  _proto._addPredefinedChoices = function _addPredefinedChoices(choices) {
    var _this22 = this;

    // If sorting is enabled or the user is searching, filter choices
    if (this.config.shouldSort) {
      choices.sort(this.config.sorter);
    }

    var hasSelectedChoice = choices.some(function (choice) {
      return choice.selected;
    });
    var firstEnabledChoiceIndex = choices.findIndex(function (choice) {
      return choice.disabled === undefined || !choice.disabled;
    });
    choices.forEach(function (choice, index) {
      var value = choice.value,
          label = choice.label,
          customProperties = choice.customProperties,
          placeholder = choice.placeholder;

      if (_this22._isSelectElement) {
        // If the choice is actually a group
        if (choice.choices) {
          _this22._addGroup({
            group: choice,
            id: choice.id || null
          });
        } else {
          /**
           * If there is a selected choice already or the choice is not the first in
           * the array, add each choice normally.
           *
           * Otherwise we pre-select the first enabled choice in the array ("select-one" only)
           */
          var shouldPreselect = _this22._isSelectOneElement && !hasSelectedChoice && index === firstEnabledChoiceIndex;
          var isSelected = shouldPreselect ? true : choice.selected;
          var isDisabled = choice.disabled;

          _this22._addChoice({
            value: value,
            label: label,
            isSelected: isSelected,
            isDisabled: isDisabled,
            customProperties: customProperties,
            placeholder: placeholder
          });
        }
      } else {
        _this22._addChoice({
          value: value,
          label: label,
          isSelected: choice.selected,
          isDisabled: choice.disabled,
          customProperties: customProperties,
          placeholder: placeholder
        });
      }
    });
  }
  /**
   * @param {Item[]} items
   */
  ;

  _proto._addPredefinedItems = function _addPredefinedItems(items) {
    var _this23 = this;

    items.forEach(function (item) {
      if (typeof item === 'object' && item.value) {
        _this23._addItem({
          value: item.value,
          label: item.label,
          choiceId: item.id,
          customProperties: item.customProperties,
          placeholder: item.placeholder
        });
      }

      if (typeof item === 'string') {
        _this23._addItem({
          value: item
        });
      }
    });
  };

  _proto._setChoiceOrItem = function _setChoiceOrItem(item) {
    var _this24 = this;

    var itemType = getType(item).toLowerCase();
    var handleType = {
      object: function object() {
        if (!item.value) {
          return;
        } // If we are dealing with a select input, we need to create an option first
        // that is then selected. For text inputs we can just add items normally.


        if (!_this24._isTextElement) {
          _this24._addChoice({
            value: item.value,
            label: item.label,
            isSelected: true,
            isDisabled: false,
            customProperties: item.customProperties,
            placeholder: item.placeholder
          });
        } else {
          _this24._addItem({
            value: item.value,
            label: item.label,
            choiceId: item.id,
            customProperties: item.customProperties,
            placeholder: item.placeholder
          });
        }
      },
      string: function string() {
        if (!_this24._isTextElement) {
          _this24._addChoice({
            value: item,
            label: item,
            isSelected: true,
            isDisabled: false
          });
        } else {
          _this24._addItem({
            value: item
          });
        }
      }
    };
    handleType[itemType]();
  };

  _proto._findAndSelectChoiceByValue = function _findAndSelectChoiceByValue(val) {
    var _this25 = this;

    var choices = this._store.choices; // Check 'value' property exists and the choice isn't already selected

    var foundChoice = choices.find(function (choice) {
      return _this25.config.valueComparer(choice.value, val);
    });

    if (foundChoice && !foundChoice.selected) {
      this._addItem({
        value: foundChoice.value,
        label: foundChoice.label,
        choiceId: foundChoice.id,
        groupId: foundChoice.groupId,
        customProperties: foundChoice.customProperties,
        placeholder: foundChoice.placeholder,
        keyCode: foundChoice.keyCode
      });
    }
  };

  _proto._generatePlaceholderValue = function _generatePlaceholderValue() {
    if (this._isSelectElement) {
      var placeholderOption = this.passedElement.placeholderOption;
      return placeholderOption ? placeholderOption.text : false;
    }

    var _this$config4 = this.config,
        placeholder = _this$config4.placeholder,
        placeholderValue = _this$config4.placeholderValue;
    var dataset = this.passedElement.element.dataset;

    if (placeholder) {
      if (placeholderValue) {
        return placeholderValue;
      }

      if (dataset.placeholder) {
        return dataset.placeholder;
      }
    }

    return false;
  };

  return Choices;
}();

/* harmony default export */ var scripts_choices = __webpack_exports__["default"] = (choices_Choices);

/***/ })
/******/ ])["default"];
});
});

var Choices = /*@__PURE__*/unwrapExports(choices);

/**
 * @property {Choices} choices
 */

class Choices$1 extends HTMLInputElement {
  connectedCallback() {
    if (!this.getAttribute('choicesBinded')) {
      this.setAttribute('choicesBinded', 'true');
      this.choices = new Choices(this, {
        removeItems: true,
        removeItemButton: true,
        addItemText: value => {
          return `Appuyer sur entrer pour ajouter <b>"${value}"</b>`;
        }
      });
    }
  }

  disconnectedCallback() {
    if (this.choices) {
      this.choices.destroy();
    }
  }

}

/**
 * Objet permettant de construire un éditeur CodeMirror
 *
 * @property {HTMLDivElement} element
 * @property {CodeMirror} editor
 * @property {string} value
 */
class Editor {
  /**
   * @param {string} value
   */
  constructor(value = '') {
    this.value = value;
    this.element = document.createElement('div');
    this.element.classList.add('mdeditor__editor');
  }
  /**
   * Démarre l'éditeur
   */


  async boot() {
    const {
      default: CodeMirror
    } = await import('./CodeMirror-39d52028.js');
    this.editor = new CodeMirror(this.element, {
      value: this.value,
      mode: 'markdown',
      theme: 'neo',
      lineWrapping: true,
      cursorBlinkRate: 0,
      viewportMargin: Infinity
    });
    window.requestAnimationFrame(() => {
      this.editor.refresh();
    });
    this.editor.on('change', cm => {
      this.onChange(cm.getValue());
    });
  }
  /**
   * Entoure la selection.
   *
   * @param {string} start
   * @param {null|string} end
   */


  wrapWith(start, end = null) {
    if (end === null) {
      end = start;
    }

    this.editor.getDoc().replaceSelection(start + this.editor.getDoc().getSelection() + end);
    this.editor.focus();
  }
  /**
   * Remplace la selection par la valeur donnée.
   *
   * @param {string} value
   */


  replace(value) {
    this.editor.getDoc().replaceSelection(value);
    this.editor.focus();
  }
  /**
   * Remplace la selection par la valeur donnée.
   *
   * @param {string} value
   */


  setValue(value) {
    if (this.editor && value !== this.editor.getValue()) {
      this.editor.setValue(value);
    }
  }
  /**
   * Ajoute un racourci à l'éditeur
   *
   * @param {string} shortcut
   * @param {function} action
   */


  addShortcut(shortcut, action) {
    this.editor.setOption('extraKeys', { ...this.editor.getOption('extraKeys'),
      [shortcut]: action
    });
  }
  /**
   * Fonction appelée lors du changement de valeur de l'éditeur
   *
   * @param {string} value
   */


  onChange() {}

}

/**
 * @property {Editor} editor
 * @property {HTMLButtonElement} element
 */
class Button$2 {
  constructor(editor) {
    this.action = this.action.bind(this);
    this.editor = editor;
    this.element = null;
    const icon = this.icon();

    if (icon) {
      if (this.shortcut() !== false) {
        this.editor.addShortcut(this.shortcut(), this.action);
      }

      this.element = document.createElement('button');
      this.element.setAttribute('type', 'button');
      this.element.addEventListener('click', e => {
        e.preventDefault();
        this.action();
      });
      this.element.appendChild(icon);
    }
  }

  icon() {
    return '';
  }

  shortcut() {
    return false;
  }

  action() {
    console.error('Vous devez définir une action pour ce bouton');
  }

}

class BoldButton extends Button$2 {
  shortcut() {
    return 'Ctrl-B';
  }

  icon() {
    return strToDom('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M304.793 243.891c33.639-18.537 53.657-54.16 53.657-95.693 0-48.236-26.25-87.626-68.626-104.179C265.138 34.01 240.849 32 209.661 32H24c-8.837 0-16 7.163-16 16v33.049c0 8.837 7.163 16 16 16h33.113v318.53H24c-8.837 0-16 7.163-16 16V464c0 8.837 7.163 16 16 16h195.69c24.203 0 44.834-1.289 66.866-7.584C337.52 457.193 376 410.647 376 350.014c0-52.168-26.573-91.684-71.207-106.123zM142.217 100.809h67.444c16.294 0 27.536 2.019 37.525 6.717 15.828 8.479 24.906 26.502 24.906 49.446 0 35.029-20.32 56.79-53.029 56.79h-76.846V100.809zm112.642 305.475c-10.14 4.056-22.677 4.907-31.409 4.907h-81.233V281.943h84.367c39.645 0 63.057 25.38 63.057 63.057.001 28.425-13.66 52.483-34.782 61.284z"/></svg>');
  }
  /**
   * @param {Editor} editor
   */


  action() {
    this.editor.wrapWith('**');
  }

}

/**
 * @property {boolean} listening
 * @property {webkitSpeechRecognition} recognition
 */

class SpeechButton extends Button$2 {
  constructor(editor) {
    super(editor);
    this.listening = false;

    if (window.webkitSpeechRecognition) {
      /* eslint-disable new-cap */
      this.recognition = new window.webkitSpeechRecognition();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
    }
  }

  icon() {
    if (!window.webkitSpeechRecognition) {
      return null;
    }

    this.icon = strToDom('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M96 256V96c0-53.019 42.981-96 96-96s96 42.981 96 96v160c0 53.019-42.981 96-96 96s-96-42.981-96-96zm252-56h-24c-6.627 0-12 5.373-12 12v42.68c0 66.217-53.082 120.938-119.298 121.318C126.213 376.38 72 322.402 72 256v-44c0-6.627-5.373-12-12-12H36c-6.627 0-12 5.373-12 12v44c0 84.488 62.693 154.597 144 166.278V468h-68c-6.627 0-12 5.373-12 12v20c0 6.627 5.373 12 12 12h184c6.627 0 12-5.373 12-12v-20c0-6.627-5.373-12-12-12h-68v-45.722c81.307-11.681 144-81.79 144-166.278v-44c0-6.627-5.373-12-12-12z"/></svg>');
    return this.icon;
  }
  /**
   * @param {Editor} editor
   */


  action() {
    if (this.listening === true) {
      this.recognition.stop();
      this.listening = false;
      this.icon.style.fill = null;
      return;
    }

    this.icon.style.fill = 'red';
    this.recognition.start();
    this.listening = true;

    this.recognition.onresult = e => {
      const result = e.results.item(e.resultIndex);

      if (result.isFinal === true) {
        const transcript = result.item(0).transcript;
        const sentence = transcript.charAt(0).toUpperCase() + transcript.slice(1);
        this.editor.replace(sentence);
      }
    };
  }

}

/**
 * Crée un élément HTML
 *
 * Cette fonction ne couvre que les besoins de l'application, jsx-dom pourrait remplacer cette fonction
 *
 * @param {string} tagName
 * @param {object} attributes
 * @param {...HTMLElement|string} children
 * @return HTMLElement
 */

function createElement$1(tagName, attributes = {}, ...children) {
  if (typeof tagName === 'function') {
    return tagName(attributes);
  }

  const svgTags = ['svg', 'use', 'path', 'circle', 'g']; // On construit l'élément

  const e = !svgTags.includes(tagName) ? document.createElement(tagName) : document.createElementNS('http://www.w3.org/2000/svg', tagName); // On lui associe les bons attributs

  for (const k of Object.keys(attributes || {})) {
    if (typeof attributes[k] === 'function' && k.startsWith('on')) {
      e.addEventListener(k.substr(2).toLowerCase(), attributes[k]);
    } else if (k === 'xlink:href') {
      e.setAttributeNS('http://www.w3.org/1999/xlink', 'href', attributes[k]);
    } else {
      e.setAttribute(k, attributes[k]);
    }
  } // On aplatit les enfants


  children = children.reduce((acc, child) => {
    return Array.isArray(child) ? [...acc, ...child] : [...acc, child];
  }, []); // On ajoute les enfants à l'élément

  for (const child of children) {
    if (typeof child === 'string' || typeof child === 'number') {
      e.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement || child instanceof SVGElement) {
      e.appendChild(child);
    } else {
      console.error("Impossible d'ajouter l'élément", child, typeof child);
    }
  }

  return e;
}
/**
 * CreateElement version Tagged templates
 * @type {(strings: TemplateStringsArray, ...values: any[]) => (HTMLElement[] | HTMLElement)}
 */

const html$1 = htm.bind(createElement$1);
/**
 * Transform une chaine en élément DOM
 * @param {string} str
 * @return {DocumentFragment}
 */

function strToDom$1(str) {
  return document.createRange().createContextualFragment(str).firstChild;
}

class LinkButton extends Button$2 {
  shortcut() {
    return 'Ctrl-L';
  }

  icon() {
    return strToDom$1('<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7.859 14.691l-.81.805a1.814 1.814 0 01-2.545 0 1.762 1.762 0 010-2.504l2.98-2.955c.617-.613 1.779-1.515 2.626-.675a.993.993 0 101.397-1.407c-1.438-1.428-3.566-1.164-5.419.675l-2.98 2.956A3.72 3.72 0 002 14.244a3.72 3.72 0 001.108 2.658 3.779 3.779 0 002.669 1.096c.967 0 1.934-.365 2.669-1.096l.811-.805a.988.988 0 00-.695-1.692.995.995 0 00-.703.286zm9.032-11.484c-1.547-1.534-3.709-1.617-5.139-.197l-1.009 1.002a.99.99 0 001.396 1.406l1.01-1.001c.74-.736 1.711-.431 2.346.197.336.335.522.779.522 1.252s-.186.917-.522 1.251l-3.18 3.154c-1.454 1.441-2.136.766-2.427.477a.992.992 0 00-1.615.327.99.99 0 00.219 1.079c.668.662 1.43.99 2.228.99.977 0 2.01-.492 2.993-1.467l3.18-3.153A3.732 3.732 0 0018 5.866a3.726 3.726 0 00-1.109-2.659z"/></svg>');
  }

  action() {
    const link = window.prompt('Entrez le lien');
    this.editor.wrapWith('[', `](${link})`);
  }

}

class FullScreenButton extends Button$2 {
  constructor(editor) {
    super(editor);
    this.isFullscreen = false;
  }

  icon() {
    this.icon = strToDom('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={style}><path d="M352.201 425.775l-79.196 79.196c-9.373 9.373-24.568 9.373-33.941 0l-79.196-79.196c-15.119-15.119-4.411-40.971 16.971-40.97h51.162L228 284H127.196v51.162c0 21.382-25.851 32.09-40.971 16.971L7.029 272.937c-9.373-9.373-9.373-24.569 0-33.941L86.225 159.8c15.119-15.119 40.971-4.411 40.971 16.971V228H228V127.196h-51.23c-21.382 0-32.09-25.851-16.971-40.971l79.196-79.196c9.373-9.373 24.568-9.373 33.941 0l79.196 79.196c15.119 15.119 4.411 40.971-16.971 40.971h-51.162V228h100.804v-51.162c0-21.382 25.851-32.09 40.97-16.971l79.196 79.196c9.373 9.373 9.373 24.569 0 33.941L425.773 352.2c-15.119 15.119-40.971 4.411-40.97-16.971V284H284v100.804h51.23c21.382 0 32.09 25.851 16.971 40.971z"/></svg>');
    return this.icon;
  }
  /**
   * @param {Editor} editor
   */


  action() {
    this.isFullscreen = !this.isFullscreen;
    this.icon.style.fill = this.isFullscreen ? '#8BC34A' : null;
  }

}

/**
 * @property {HTMLDivElement} element
 */
class Toolbar {
  /**
   * @param {Editor} value
   */
  constructor(editor) {
    this.element = document.createElement('div');
    this.element.classList.add('mdeditor__toolbar');
    const left = createElement('div', {
      class: 'mdeditor__toolbarleft'
    });
    const right = createElement('div', {
      class: 'mdeditor__toolbarright'
    });
    const fullScreenButton = new FullScreenButton(editor);
    this.addButtons(left, [new BoldButton(editor), new LinkButton(editor), new SpeechButton(editor)]);
    this.addButtons(right, [fullScreenButton]);
    this.element.appendChild(left);
    this.element.appendChild(right);
    fullScreenButton.element.addEventListener('click', () => {
      this.onFullScreen();
    });
  }
  /**
   * @param {Button[]} button
   */


  addButtons(target, buttons) {
    for (const button of buttons) {
      if (button.element !== null) {
        target.appendChild(button.element);
      }
    }
  }

  onFullScreen() {}

}

/**
 * @property {HTMLDivElement} container
 * @property {HTMLFormElement|null} form
 * @property {Editor|null} editor
 */

class MarkdownEditor extends HTMLTextAreaElement {
  constructor() {
    super();
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.onFormReset = this.onFormReset.bind(this);
  }

  async connectedCallback() {
    const editor = new Editor(this.value, this.getAttribute('original'));
    await editor.boot();
    const toolbar = new Toolbar(editor); // Construction du DOM

    this.container = createElement('div', {
      class: 'mdeditor'
    });
    this.container.appendChild(toolbar.element);
    this.container.appendChild(editor.element); // Evènement

    toolbar.onFullScreen = this.toggleFullscreen;

    editor.onChange = value => {
      this.value = value;
      this.dispatchEvent(new Event('input', {
        bubbles: true,
        cancelable: true
      }));
    };

    this.syncEditor = () => editor.setValue(this.value);

    if (this.form) {
      this.form.addEventListener('reset', this.onFormReset);
    } // On ajoute au dom


    this.insertAdjacentElement('beforebegin', this.container);
    this.style.display = 'none';
    this.editor = editor;
  }

  disconnectedCallback() {
    if (this.form) {
      this.form.removeEventListener('reset', this.onFormReset);
    }

    if (this.container) {
      this.container.remove();
    }
  }

  onFormReset() {
    if (this.editor) {
      this.editor.setValue('');
    }
  }

  toggleFullscreen() {
    this.container.classList.toggle('mdeditor--fullscreen');
  }
  /**
   * Permet de forcer la synchronisation de l'éditeur depuis le textarea (utile quand le composant est monté dans react)
   */


  syncEditor() {}

}

/**
 * Crée un loader qui se place au dessus de l'élément courant
 */

class LoaderOverlay extends HTMLElement {
  constructor() {
    super();
    this.style.position = 'absolute';
    this.style.left = '0';
    this.style.right = '0';
    this.style.bottom = '0';
    this.style.top = '0';
    this.style.margin = '0';
    this.style.padding = '0';
    this.style.zIndex = '10';
    this.style.display = 'flex';
    this.style.alignItems = 'center';
    this.style.justifyContent = 'center';
    this.style.transition = 'opacity .3s';
    this.style.background = 'rgba(255,255,255,.8)';
  }

  connectedCallback() {
    // On crée le loader
    const loader = new SpinningDots();
    loader.style.width = '20px';
    loader.style.height = '20px'; // On ajoute le loader à notre élément

    this.appendChild(loader);
  }
  /**
   * Masque le loader avec un effet d'animation
   */


  hide() {
    this.style.opacity = 0;
  }

}
customElements.define('loader-overlay', LoaderOverlay);

/**
 * Bouton pour appeler une URL avec la méthode DELETE et masquer le parent en cas de retour
 */

class AjaxDelete extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', async e => {
      e.preventDefault();

      if (!confirm('Voulez vous vraiment effectuer cette action ?')) {
        return;
      } // On affiche le loader


      const target = this.getAttribute('target');
      const parent = target ? closest(this, this.getAttribute('target')) : this.parentNode;
      const loader = new LoaderOverlay();
      parent.style.position = 'relative';
      parent.appendChild(loader); // On fait l'appel

      try {
        await jsonFetch(this.getAttribute('url'), {
          method: 'DELETE'
        });
        loader.hide();
        await slideUpAndRemove(parent);
      } catch (e) {
        loader.hide();
        document.body.appendChild(new FloatingAlert$1({
          message: e.detail
        }));
      }
    });
  }

}

/**
 * Crée un élément qui va scroller jusqu'à la cible indiquer dans l'attribute data-to
 *
 * ```html
 * <div is="auto-scroll" data-to="[checked]">
 * </div>
 * ```
 */
class AutoScroll extends HTMLDivElement {
  connectedCallback() {
    const target = document.querySelector(this.dataset.to);
    this.scrollTo(0, target.offsetTop - this.getBoundingClientRect().height / 2);
    target.classList.add('is-selected');
  }

}

/**
 * Trouve une valeur aléatoire entre min et max
 *
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const lineHeight = 18; // Hauteur de ligne

const lineDuration = 0.4; // Durée d'animation pour une ligne

const screens = 2; // Nombre d'écran de code à remplire

class AnimatedEditor extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({
      mode: 'open'
    });
    this.width = parseInt(this.getAttribute('width'), 10);
    this.height = parseInt(this.getAttribute('height'), 10);
    this.style.display = 'block';
    const linesPerScreen = Math.floor(350 / lineHeight);
    this.root.innerHTML = this.drawSVG(this.drawLines(linesPerScreen)) + this.buildStyle(linesPerScreen);
  }

  drawSVG(code) {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 678 402">
  <mask id="previewmask">
    <path fill="#fff" d="M26 57a4 4 0 014-4h283a4 4 0 014 4v313a4 4 0 01-4 4H30a4 4 0 01-4-4V57z"/>
  </mask>
  <mask id="screenmask">
    <rect x="0" y="2" width="321" height="363" fill="white"/>
  </mask>
  <g>
    <rect width="324" height="382" x="10" y="8" fill="#F7FAFB" rx="4"/>
    <rect width="323" height="381" x="10.5" y="8.5" stroke="#D5E3EC" rx="3.5"/>
  </g>
  <g>
    <path fill="#fff" d="M26 57a4 4 0 014-4h283a4 4 0 014 4v313a4 4 0 01-4 4H30a4 4 0 01-4-4V57z"/>
    <path stroke="#D5E3EC"
          d="M30 53.5h283a3.5 3.5 0 013.5 3.5v313a3.5 3.5 0 01-3.5 3.5H30a3.5 3.5 0 01-3.5-3.5V57a3.5 3.5 0 013.5-3.5z"/>
  </g>
  <g>
    <circle cx="32.5" cy="30.5" r="6.5" fill="#fff"/>
    <circle cx="32.5" cy="30.5" r="6" stroke="#D5E3EC"/>
  </g>
  <g>
    <circle cx="52.5" cy="30.5" r="6.5" fill="#fff"/>
    <circle cx="52.5" cy="30.5" r="6" stroke="#D5E3EC"/>
  </g>
  <g>
    <circle cx="72.5" cy="30.5" r="6.5" fill="#fff"/>
    <circle cx="72.5" cy="30.5" r="6" stroke="#D5E3EC"/>
  </g>
  <g mask="url(#previewmask)">
    <g class="preview">
      ${this.drawPanels()}
    </g>
  </g>
  <g>
    <rect width="324" height="382" x="344" y="8" fill="#F7FAFB" rx="4"/>
    <rect width="323" height="381" x="344.5" y="8.5" stroke="#D5E3EC" rx="3.5"/>
  </g>
  <path fill="#E8F0F2" stroke="#D5E3EC"
        d="M348 8.5h47.5v381H348a3.5 3.5 0 01-3.5-3.5V12a3.5 3.5 0 013.5-3.5z"/>
  <path fill="#D5E3EC" d="M395 8h1v383h-1z"/>
  <path fill="#F7FAFB" d="M396 9h72v15h-72z"/>
  <circle id="Ellipse 19" cx="460.5" cy="16.5" r="1" fill="#E8F0F2" stroke="#D5E3EC"/>
  <path fill="#E8F0F2" stroke="#D5E3EC" d="M467.5 8.5h72v15h-72z"/>
  <path fill="#E8F0F2" stroke="#D5E3EC" d="M539.5 8.5h72v15h-72z"/>
  <circle id="Ellipse 20" cx="532.5" cy="16.5" r="1" fill="#E8F0F2" stroke="#D5E3EC"/>
  <circle id="Ellipse 21" cx="602.5" cy="16.5" r="1" fill="#E8F0F2" stroke="#D5E3EC"/>
  <rect width="50" height="4" x="404" y="14" fill="#E8F0F2" rx="2"/>
  ${code}
</svg>`;
  }
  /**
   * Dessine une ligne de code
   *
   * @param {int} linesPerScreen
   * @return {string}
   */


  drawLines(linesPerScreen) {
    const lines = linesPerScreen * screens;
    const screenWidth = 300;
    let line = 0;
    let currentIndent = 0; // Indentation

    let html = '<g style="transform: translate(346px, 24px)">';
    html += '<g mask="url(#screenmask)">';
    html += '<g class="screen">';

    while (line < lines) {
      const indent = randomBetween(currentIndent === 0 ? 0 : -1, currentIndent === 3 ? 0 : 1);
      currentIndent += indent;
      html += this.drawLine(line, currentIndent, screenWidth);
      line++;
    }

    html += '</g>';
    html += '</g>';
    html += '</g>';
    return html;
  }
  /**
   * Dessine une carte dans le panneau aperçu
   *
   * @return {string}
   */


  drawPanels() {
    let html = '';

    for (let i = 0; i < 5; i++) {
      const delay = 3 * i + 0.5;
      html += `
      <g style="transform: translateY(${i * 97}px)">
        <g stroke="#D5E3EC" class="panel" style="animation-delay: ${delay}s">
          <path fill="#F7FAFB"
                d="M46 69.5h252a3.5 3.5 0 013.5 3.5v73a3.5 3.5 0 01-3.5 3.5H46a3.5 3.5 0 01-3.5-3.5V73a3.5 3.5 0 013.5-3.5z"/>
          <circle cx="75" cy="101" r="21.5" fill="#fff" style="animation-delay: ${delay + 0.5}s"/>
          <rect width="186" height="14" x="104.5" y="79.5" fill="#fff" rx="3.5"  style="animation-delay: ${delay + 1}s"/>
          <rect width="137" height="14" x="104.5" y="102.5" fill="#fff" rx="3.5"  style="animation-delay: ${delay + 1.5}s"/>
          <rect  width="155" height="14" x="104.5" y="125.5" fill="#fff" rx="3.5"  style="animation-delay: ${delay + 2}s"/>
        </g>
      </g>`;
    }

    return html;
  }
  /**
   * Dessine une ligne de code
   *
   * @param {int} line
   * @param {int} indent
   * @param {int} lineWidth
   * @return {string}
   */


  drawLine(line, indent, lineWidth) {
    const y = line * lineHeight + 10;
    const delay = line * lineDuration;
    let html = '';
    let x = indent * 20 + 70;
    html += `<mask id="line${line}">
    <rect x="0" y="${y}" width="${lineWidth}" height="10" fill="white" class="mask" style="transform-origin: ${x}px 0px; animation-delay: ${delay}s" rx="5"/>
    </mask>`;

    while (x < lineWidth) {
      const width = randomBetween(20, 100);
      const color = width > 50 ? '#121C42' : '#5A63FF';

      if (width + x <= lineWidth) {
        html += `<rect width="${width}" height="10" x="${x}" y="${y}" fill="${color}" rx="5" mask="url(#line${line})"/>`;
      }

      x += width + 4;
    } // On dessine le numéro de ligne


    html += `<rect width="20" height="8" x="13" y="${y + 1}" fill="#D5E3EC" rx="5"/>`;
    return html;
  }

  buildStyle(linesPerScreen) {
    const delay = (linesPerScreen - 1) * lineDuration;
    return `<style>
      .mask  {
        animation: ${lineDuration}s moveRect both linear;
      }
      .screen {
        animation: moveScreen ${linesPerScreen * (screens - 1) * lineDuration}s ${delay}s both linear;
        transform-origin: 0 0;
      }
      .preview {
        animation: movePreview 1.5s 9s both;
        transform-origin: 0 0;
      }
      .panel {
        animation: .5s appearPanel both;
      }
      .panel rect,
      .panel circle {
        stroke-dasharray: 400px;
        stroke-dashoffset: 400px;
        animation: 1s ${delay + 1}s appearStroke both linear;
      }
      @keyframes moveRect {
        0% { transform: scaleX(0) }
        100% { transform:scaleX(1) }
      }
      @keyframes moveScreen {
        0% { transform: translateY(0) }
        100% { transform:translateY(-${linesPerScreen * lineHeight * (screens - 1)}px) }
      }
      @keyframes movePreview {
        0% { transform: translateY(0) }
        100% { transform:translateY(-190px) }
      }
      @keyframes appearPanel {
        0% { transform: translateY(30px); opacity: 0; }
        100% { transform:translateY(0); opacity: 1; }
      }
      @keyframes appearStroke {
        0% { stroke-dashoffset: 400px; fill: #F7FAFB; }
        100% { stroke-dashoffset: 0; fill: #FFF; }
      }
    </style>`;
  }

  buildPanelStyle(index) {
    const delay = 3 * (index - 1) + 0.5;
    return `
      .panel-${index} {
      }
      .panel-${index} circle {
        stroke-dasharray: 400px;
        stroke-dashoffset: 400px;
        animation: 1s ${delay + 0.5}s appearDashRect both linear;
      }
      .panel-${index} rect {
        stroke-dasharray: 400px;
        stroke-dashoffset: 400px;
        animation: 1s ${delay + 1}s appearDashRect both linear;
      }
      .panel-${index} rect:nth-child(4) {
        animation-delay: ${delay + 1.5}s;
      }
      .panel-${index} rect:nth-child(5) {
        animation-delay: ${delay + 2}s;
      }
    `;
  }

}

class AutoSubmit extends HTMLFormElement {
  connectedCallback() {
    Array.from(this.querySelectorAll('input')).forEach(input => {
      input.addEventListener('change', () => {
        this.submit();
      });
    });
  }

}

function SlideIn({
  show,
  children,
  style = {},
  forwardedRef = null,
  ...props
}) {
  const [shouldRender, setRender] = m$1(show);
  y(() => {
    if (show) setRender(true);
  }, [show]);

  const onAnimationEnd = e => {
    if (!show && e.animationName === 'slideOut') setRender(false);
  };

  return shouldRender && v("div", _extends({
    style: {
      animation: `${show ? 'slideIn' : 'slideOut'} .3s both`,
      ...style
    },
    onAnimationEnd: onAnimationEnd,
    ref: forwardedRef
  }, props), children);
}

function Spinner({
  width = 16,
  margin = 10
}) {
  const style = {
    display: 'block',
    width: `${width}px`,
    height: `${width}px`,
    margin: `${margin}px auto`
  };
  return v("spinning-dots", {
    style: style
  });
}

function emitEvent(notification) {
  notification.createdAt = new Date(notification.createdAt);
  window.dispatchEvent(new CustomEvent('gnotification', {
    detail: notification
  }));
}
/**
 * Charge les notifications (en Ajax) et se connecte au SSE
 */


async function loadNotifications() {
  // On récupère les dernières notifications en AJAX
  const notifications = await fetchAll(4);
  notifications.reverse();
  notifications.forEach(emitEvent); // On se connecte au SSE

  const url = new URL(window.grafikart.MERCURE_URL);
  url.searchParams.append('topic', '/notifications/{channel}');
  url.searchParams.append('topic', `/notifications/user/${window.grafikart.USER}`);
  const eventSource = new EventSource(url, {
    withCredentials: true
  });

  eventSource.onmessage = e => emitEvent(JSON.parse(e.data));

  return notifications;
}
async function fetchAll(count) {
  return await jsonFetch(`/api/notifications?count=${count}`);
}

const OPEN = 0;
const CLOSE = 1;

function countUnread(notifications, notificationReadAt) {
  return notifications.filter(({
    createdAt
  }) => {
    return notificationReadAt < createdAt;
  }).length;
}
/**
 * Contient les notifications
 *
 * @return {*}
 * @constructor
 */


function Notifications() {
  // Hooks
  const [state, setState] = m$1(CLOSE);
  const [notifications, pushNotification] = usePrepend();
  const [notificationReadAt, setNotificationReadAt] = m$1(lastNotificationRead());
  const [loading, setLoading] = m$1(true); // Méthodes

  const openMenu = e => {
    e.preventDefault();
    setState(OPEN);
  };

  const closeMenu = () => {
    setNotificationReadAt(new Date());
    setState(CLOSE);
  }; // On charge les notification la première fois


  useAsyncEffect(async () => {
    if (isAuthenticated()) {
      await loadNotifications();
      setLoading(false);
    }
  }, []); // On écoute l'arrivé de nouveaux évènement depuis l'API ou le SSE

  y(() => {
    const onNotification = e => {
      pushNotification(e.detail);
    };

    window.addEventListener('gnotification', onNotification);
    return () => {
      window.removeEventListener('gnotification', onNotification);
    };
  }, [pushNotification]); // Le système de notification ne fonction que pour les utilisateurs

  if (!isAuthenticated()) return null;
  return v(p, null, v("button", {
    onClick: openMenu
  }, v(Icon, {
    name: "bell"
  })), v(Badge, {
    count: countUnread(notifications, notificationReadAt)
  }), v(SlideIn, {
    className: "notifications",
    show: state === OPEN
  }, v(Popup, {
    loading: loading,
    onClickOutside: closeMenu,
    notifications: notifications,
    notificationReadAt: notificationReadAt
  })));
}
/**
 * Badge contenant le nombre de notifications
 */

function Badge({
  count
}) {
  return count > 0 && v("span", {
    className: "notification-badge"
  }, count);
}
/**
 * Popup contenant les notifications
 */


function Popup({
  notifications = [],
  onClickOutside = () => {},
  loading = false,
  notificationReadAt,
  ...props
}) {
  const ref = h$1();
  useClickOutside(ref, onClickOutside);
  return v("div", _extends({
    ref: ref
  }, props), v("div", {
    className: "notifications_title"
  }, "Nouveaux messages"), v("div", {
    className: "notifications_body"
  }, loading && v(Spinner, null), notifications.map(n => v(Notification, _extends({
    key: n.id,
    notificationReadAt: notificationReadAt
  }, n))), v("a", {
    href: "/notifications",
    className: "notifications_footer"
  }, "Toutes les notifications")));
}
/**
 * Représente une notification
 */


function Notification({
  url,
  message,
  createdAt,
  notificationReadAt
}) {
  const isRead = notificationReadAt > createdAt;
  const className = `notifications_item ${isRead ? 'is-read' : ''}`;
  return v("a", {
    href: url,
    className: className
  }, v("div", {
    className: "notifications_text"
  }, v("p", null, message)));
}

class Tabs extends HTMLElement {
  constructor () {
    super();
    this.onHashChange = this.onHashChange.bind(this);
  }

  connectedCallback () {
    this.setAttribute('role', 'tablist');
    const tabs = Array.from(this.children);
    const hash = window.location.hash.replace('#', '');
    let currentTab = tabs[0];

    tabs.forEach((tab, i) => {
      const id =
        tab.tagName === 'A'
          ? tab.getAttribute('href').replace('#', '')
          : tab.getAttribute('aria-controls');
      const tabpanel = document.getElementById(id);

      // Should the element be the current element ?
      if (tab.getAttribute('aria-selected') === 'true' && hash === '') {
        currentTab = tab;
      }
      if (id === hash) {
        currentTab = tab;
      }

      // Extra attributes to improve accessibility
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', 'false');
      tab.setAttribute('tabindex', '-1');
      tab.setAttribute('aria-controls', id);
      tab.getAttribute('id') || tab.setAttribute('id', 'tab-' + id);
      tabpanel.setAttribute('role', 'tabpanel');
      tabpanel.setAttribute('aria-labelledby', tab.getAttribute('id'));
      tabpanel.setAttribute('hidden', 'hidden');
      tabpanel.setAttribute('tabindex', '0');

      // Keyboard navigation (for accessibility purpose)
      tab.addEventListener('keyup', e => {
        let index = null;
        if (e.key === 'ArrowRight') {
          index = i === tabs.length - 1 ? 0 : i + 1;
        } else if (e.key === 'ArrowLeft') {
          index = i === 0 ? tabs.length - 1 : i - 1;
        } else if (e.key === 'Home') {
          index = 0;
        } else if (e.key === 'End') {
          index = tabs.length - 1;
        }
        if (index !== null) {
          this.activate(tabs[index]);
          tabs[index].focus();
        }
      });
      // Mouse control
      tab.addEventListener('click', e => {
        e.preventDefault();
        this.activate(tab, tab.tagName === 'A');
      });
    });

    window.addEventListener('hashchange', this.onHashChange);

    this.activate(currentTab, false);
    if (currentTab.getAttribute('aria-controls') === hash) {
      window.requestAnimationFrame(() => {
        currentTab.scrollIntoView({
          behavior: 'smooth'
        });
      });
    }
  }

  disconnectedCallback () {
    window.removeEventListener('hashchange', this.onHashChange);
  }

  /**
   * Detects hashChange and activate the current tab if necessary
   */
  onHashChange () {
    const tab = Array.from(this.children).find(
      tab => tab.getAttribute('href') === window.location.hash
    );
    if (tab !== undefined) {
      this.activate(tab);
      document.querySelector(window.location.hash).scrollIntoView({
        behavior: 'smooth'
      });
    }
  }

  /**
   * @param {HTMLElement} tab
   * @param {boolean} changeHash
   */
  activate (tab, changeHash = true) {
    const currentTab = this.querySelector('[aria-selected="true"]');
    if (currentTab !== null) {
      const tabpanel = document.getElementById(
        currentTab.getAttribute('aria-controls')
      );
      currentTab.setAttribute('aria-selected', 'false');
      currentTab.setAttribute('tabindex', '-1');
      tabpanel.setAttribute('hidden', 'hidden');
    }
    const id = tab.getAttribute('aria-controls');
    const tabpanel = document.getElementById(id);
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tabpanel.removeAttribute('hidden');
    if (changeHash) {
      window.history.replaceState({}, '', '#' + id);
    }
  }
}
if (window.autoDefineComponent !== undefined) {
  customElements.define('nav-tabs', Tabs);
}

function debounce$1 (callback, delay) {
  let timer;
  return function () {
    const args = arguments;
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(function () {
      callback.apply(context, args);
    }, delay);
  }
}

function throttle (callback, delay) {
  let last;
  let timer;
  return function () {
    const context = this;
    const now = +new Date();
    const args = arguments;
    if (last && now < last + delay) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        last = now;
        callback.apply(context, args);
      }, delay);
    } else {
      last = now;
      callback.apply(context, args);
    }
  }
}

class ScrollTop extends HTMLElement {
  constructor () {
    super();
    this.onScroll = throttle(this.onScroll.bind(this), 100);
    this.isVisible = false;
  }

  connectedCallback () {
    this.addEventListener('click', () => {
      window.scrollTo(0, 0);
    });
    window.addEventListener('scroll', this.onScroll);
  }

  disconnectedCallback () {
    window.removeEventListener('scroll', this.onScroll);
  }

  onScroll () {
    const threshold = window.innerHeight / 3;
    if (window.scrollY > threshold && this.isVisible === false) {
      this.removeAttribute('hidden', 'hidden');
      this.isVisible = true;
    } else if (window.scrollY < threshold && this.isVisible === true) {
      this.setAttribute('hidden', 'hidden');
      this.isVisible = false;
    }
  }
}
if (window.autoDefineComponent !== undefined) {
  customElements.define('scroll-top', ScrollTop);
}

/**
 * @property {Element|null} previouslyFocusedElement Element focused before the opening of the modal
 * @property {array<HTMLDivElement>} trapElements
 */
class ModalDialog extends HTMLElement {
  static get observedAttributes () {
    return ['hidden']
  }

  constructor () {
    super();
    this.close = this.close.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.previouslyFocusedElement = null;
    this.trapElements = [];
  }

  connectedCallback () {
    this.setAttribute('aria-modal', 'true');
    this.setAttribute('role', 'dialog');
    this.addEventListener('click', e => {
      if (
        (e.target === this && this.getAttribute('overlay-close') !== null) ||
        e.target.dataset.dismiss !== undefined ||
        e.target.closest('[data-dismiss]') !== null
      ) {
        this.close();
      }
    });
    this.createTrapFocusElement('afterbegin');
    this.createTrapFocusElement('beforeend');
    document.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback () {
    document.removeEventListener('keydown', this.onKeyDown);
    this.trapElements.forEach(element =>
      element.parentElement.removeChild(element)
    );
    this.trapElements = [];
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'hidden' && newValue === null) {
      this.previouslyFocusedElement = document.activeElement;
      const firstInput = this.getFocusableElements()[0];
      if (firstInput) {
        firstInput.focus();
      }
      document.addEventListener('keydown', this.onKeyDown);
      this.removeAttribute('aria-hidden');
    }
    if (name === 'hidden' && newValue === 'hidden') {
      if (this.previouslyFocusedElement !== null) {
        this.previouslyFocusedElement.focus();
      }
      this.previouslyFocusedElement = null;
      this.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', this.onKeyDown);
    }
  }

  /**
   * @param {KeyboardEvent} e
   */
  onKeyDown (e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  close () {
    const event = new CustomEvent('close', {
      detail: { close: true },
      cancelable: true
    });
    this.dispatchEvent(event);
    if (!event.defaultPrevented) {
      this.setAttribute('hidden', 'hidden');
    }
  }

  /**
   * Create an element used to trap focus inside the dialog
   *
   * @param position
   */
  createTrapFocusElement (position) {
    const element = document.createElement('div');
    element.setAttribute('tabindex', '0');
    element.addEventListener('focus', () => {
      const focusableElements = this.getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[
          position === 'afterbegin' ? focusableElements.length - 1 : 0
        ].focus();
      }
    });
    this.trapElements.push(element);
    this.insertAdjacentElement(position, element);
  }

  /**
   * @return array<Element>
   */
  getFocusableElements () {
    const selector = `[href],
      button:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]`;
    return Array.from(this.querySelectorAll(selector)).filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0
    })
  }
}

if (window.autoDefineComponent !== undefined) {
  customElements.define('modal-dialog', ModalDialog);
}

/**
 * Bind an eventlistener on multiple elements
 *
 * @param {NodeListOf<HTMLElement>} elements
 * @param {string} elements
 * @param {function} callback
 */
function addEventListeners (elements, eventName, callback) {
  Array.from(elements).forEach(function (el) {
    el.addEventListener(eventName, function (e) {
      e.preventDefault();
      callback();
    });
  });
}

/**
 * @param {object} value
 */
function writeCookie (value) {
  document.cookie = `${CookieBanner.cookieName}=${JSON.stringify(
    value
  )};max-age=${CookieBanner.expires};path=${CookieBanner.path}`;
}

/**
 * @param {object} value
 */
function readCookie () {
  const prefix = CookieBanner.cookieName + '=';
  for (const cookie of document.cookie.split(/; */)) {
    if (cookie.startsWith(prefix)) {
      return JSON.parse(cookie.replace(prefix, ''))
    }
  }
  return null
}

class CookieBanner extends HTMLElement {
  connectedCallback () {
    if (readCookie() !== null) {
      if (this.parentElement) {
        this.parentElement.removeChild(this);
      } else {
        this.hide();
      }
      return
    }
    this.removeAttribute('hidden');
    this.removeAttribute('aria-hidden');
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-live', 'polite');
    this.addEventListener('keydown', this.onKeyDown.bind(this));
    addEventListeners(
      this.querySelectorAll('[data-accept]'),
      'click',
      this.accept.bind(this)
    );
    addEventListeners(
      this.querySelectorAll('[data-reject]'),
      'click',
      this.reject.bind(this)
    );
    addEventListeners(
      this.querySelectorAll('form'),
      'submit',
      this.accept.bind(this)
    );
  }

  disconnectedCallback () {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  /**
   * @param {KeyboardEvent} e
   */
  onKeyDown (e) {
    if (e.key === 'Escape') {
      this.reject();
    }
  }

  reject () {
    this.dispatchEvent(new CustomEvent('reject'));
    this.hide();
    writeCookie(false);
  }

  accept () {
    /** @var {HTMLFormElement|null} form */
    const form = this.querySelector('form');
    let detail = {};
    if (form !== null) {
      detail = Object.fromEntries(new FormData(form).entries());
    }
    this.dispatchEvent(
      new CustomEvent('accept', {
        detail
      })
    );
    writeCookie(detail);
    this.hide();
  }

  hide () {
    this.removeAttribute('tabindex');
    this.setAttribute('hidden', 'hidden');
    this.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', this.onKeyDown);
  }

  /**
   * Check if we have the user consent
   *
   * @return {false|object} The object contains the data accepted by the user
   */
  static hasConsent () {
    const cookie = readCookie();
    if (cookie === null || cookie === false) {
      return false
    }
    return cookie
  }
}

CookieBanner.cookieName = 'cookieConsent';
CookieBanner.expires = 31104000000;
CookieBanner.path = '/';

if (window.autoDefineComponent !== undefined) {
  customElements.define('cookie-banner', CookieBanner);
}

class Autogrow extends HTMLTextAreaElement {
  autogrow () {
    const previousHeight = this.style.height;
    this.style.height = 'auto';
    if (this.style.height !== previousHeight) {
      this.dispatchEvent(
        new CustomEvent('grow', {
          detail: {
            height: this.scrollHeight
          }
        })
      );
    }
    this.style.height = this.scrollHeight + 'px';
  }

  onFocus () {
    this.autogrow();
    window.addEventListener('resize', this.onResize);
    this.removeEventListener('focus', this.onFocus);
  }

  onResize () {
    this.autogrow();
  }

  connectedCallback () {
    this.style.overflow = 'hidden';
    this.style.resize = 'none';
    this.addEventListener('input', this.autogrow);
    this.addEventListener('focus', this.onFocus);
  }

  disconnectedCallback () {
    window.removeEventListener('resize', this.onResize);
  }

  constructor () {
    super();
    this.autogrow = this.autogrow.bind(this);
    this.onResize = debounce$1(this.onResize.bind(this), 300);
    this.onFocus = this.onFocus.bind(this);
  }
}

if (window.autoDefineComponent !== undefined) {
  customElements.define('textarea-autogrow', Autogrow, { extends: 'textarea' });
}

function Alert$2({
  type = 'success',
  children,
  duration
}) {
  return v("alert-message", {
    type: type,
    className: "full",
    duration: duration
  }, children);
}

function ContactForm() {
  const [success, setSuccess] = m$1(false);

  if (success) {
    return v(Alert$2, null, "Votre mail a bien \xE9t\xE9 envoy\xE9, vous recevrez une r\xE9ponse dans les plus bref d\xE9lais.");
  }

  return v(FetchForm, {
    action: "/api/contact",
    onSuccess: () => setSuccess(true),
    className: "grid2"
  }, v(FormField, {
    name: "name",
    required: true
  }, "Votre nom"), v(FormField, {
    name: "email",
    type: "email",
    required: true
  }, "Votre email"), v(FormField, {
    name: "content",
    type: "textarea",
    required: true,
    wrapperClass: "full"
  }, "Votre message"), v("div", {
    className: "full"
  }, v(FormPrimaryButton, null, "Envoyer")));
}

function preactCustomElement(tagName, Component, propNames, options) {
  function PreactElement() {
    const inst = Reflect.construct(HTMLElement, [], PreactElement);
    inst._vdomComponent = Component;
    inst._root = options && options.shadow ? inst.attachShadow({
      mode: 'open'
    }) : inst;
    return inst;
  }

  PreactElement.prototype = Object.create(HTMLElement.prototype);
  PreactElement.prototype.constructor = PreactElement;
  PreactElement.prototype.connectedCallback = connectedCallback;
  PreactElement.prototype.attributeChangedCallback = attributeChangedCallback;
  PreactElement.prototype.detachedCallback = detachedCallback;
  PreactElement.observedAttributes = propNames || Component.observedAttributes || Object.keys(Component.propTypes || {});
  return customElements.define(tagName || Component.tagName || Component.displayName || Component.name, PreactElement);
}

function connectedCallback() {
  this._vdom = toVdom(this, this._vdomComponent);
  (this.hasAttribute('hydrate') ? O : M)(this._vdom, this._root);
}

function attributeChangedCallback(name, oldValue, newValue) {
  if (!this._vdom) return;
  const props = {};
  props[name] = newValue;
  this._vdom = S(this._vdom, props);
  M(this._vdom, this._root);
}

function detachedCallback() {
  M(this._vdom = null, this._root);
}

function toVdom(element, nodeName) {
  if (element.nodeType === Node.TEXT_NODE) return element.data;
  if (element.nodeType !== Node.ELEMENT_NODE) return null;
  const children = [];
  const props = {};
  let i = 0;
  const a = element.attributes;
  const cn = element.childNodes;

  for (i = a.length; i--;) props[a[i].name] = a[i].value;

  for (i = cn.length; i--;) children[i] = toVdom(cn[i]);

  props.parent = element;
  return v(nodeName || element.nodeName.toLowerCase(), props, children);
}

function CreateMessage({
  topic,
  parent
}) {
  const [value, setValue] = m$1({
    content: ''
  });
  const endpoint = `/api/forum/topics/${topic}/messages`;

  const onSuccess = function (data) {
    const message = strToDom(data.html);
    parent.insertAdjacentElement('beforebegin', message);
    slideDown(message);
    setValue({
      content: ''
    });
  };

  return isAuthenticated() && v(FetchForm, {
    action: endpoint,
    value: value,
    onChange: setValue,
    onSuccess: onSuccess
  }, v(Stack, null, v(FormField, {
    placeholder: "Votre message",
    name: "content",
    type: "editor"
  }, "Votre message"), v(FormPrimaryButton, null, "R\xE9pondre")));
}

/**
 * Bouton de signalement avec formulaire en tooltip
 */

function ForumReport({
  message,
  topic
}) {
  // Hooks
  const ref = h$1(null);
  const [showForm, toggleForm] = useToggle(false);
  const [success, toggleSuccess] = useToggle(false);
  useClickOutside(ref, toggleForm);

  if (!isAuthenticated()) {
    return null;
  }

  return v("div", {
    style: {
      position: 'relative'
    }
  }, v("button", {
    className: "rounded-button",
    onClick: toggleForm,
    disabled: success,
    "aria-label": "Signaler le message",
    "data-microtip-position": "top",
    role: "tooltip"
  }, v("span", null, "!")), v(SlideIn, {
    show: showForm && !success,
    className: "forum-report__form",
    forwardedRef: ref
  }, v(ReportForm, {
    message: message,
    topic: topic,
    onSuccess: toggleSuccess
  })));
}
/**
 * Formulaire de signalement
 */

function ReportForm({
  onSuccess,
  message,
  topic
}) {
  const data = {
    message: null,
    topic: null
  };

  if (message) {
    data.message = `/api/forum/messages/${message}`;
  } else if (topic) {
    data.topic = `/api/forum/topics/${topic}`;
  } else {
    throw new Error('Impossible de charger le formulaire de signalement');
  }

  const placeholder = 'Indiquez en quoi ce sujet ne convient pas';
  const action = '/api/forum/reports';

  const onReportSuccess = function () {
    flash('Merci pour votre signalement');
    onSuccess();
  };

  return v(FetchForm, {
    data: data,
    className: "forum-report stack",
    action: action,
    onSuccess: onReportSuccess
  }, v(FormField, {
    type: "textarea",
    name: "reason",
    required: true,
    placeholder: placeholder,
    autofocus: true
  }, "Raison du signalement"), v(FormPrimaryButton, null, "Envoyer"));
}

function ForumDelete({
  message,
  topic,
  owner
}) {
  let endpoint = null;

  if (message) {
    endpoint = `/api/forum/messages/${message}`;
  } else if (topic) {
    endpoint = `/api/forum/topics/${topic}`;
  } else {
    throw new Error('Impossible de charger le composant de suppression');
  } // On prépare les hooks


  const button = h$1(null);
  const {
    loading: deleteLoading,
    fetch: deleteFetch,
    done
  } = useJsonFetchOrFlash(endpoint, {
    method: 'DELETE'
  });
  y(() => {
    if (done) {
      const message = closest(button.current, '.forum-message');
      flash('Votre message a bien été supprimé');
      message.remove();
    }
  }, [done]); // Handler

  const handleDeleteClick = async () => {
    if (!confirm('Voulez vous vraiment supprimer ce message ?')) {
      return;
    }

    await deleteFetch();
  }; // L'utilisateur ne peut pas intervenir sur ce sujet


  if (!canManage(owner)) {
    return null;
  }

  return v(p, null, ' ', "-", ' ', v("button", {
    className: "text-danger",
    onClick: handleDeleteClick,
    disabled: deleteLoading,
    ref: button
  }, deleteLoading && v(Loader$1, {
    style: {
      width: 12,
      marginRight: 5
    }
  }), "Supprimer"));
}

/**
 * Trouve le endpoint à contacter en fonction de l'élément à modifier
 *
 * @param {string|number|null} message
 * @param {string|number|null} topic
 * @return {string}
 */
function resolveEndpoint({
  message,
  topic
}) {
  if (message) {
    return `/api/forum/messages/${message}`;
  } else if (topic) {
    return `/api/forum/topics/${topic}`;
  }

  throw new Error("Impossible de charger le composant d'édition");
}

function ForumEdit({
  message,
  topic,
  owner
}) {
  const element = h$1();
  const container = h$1();
  const [rawContent, setRawContent] = m$1(null);
  const [loading, setLoading] = m$1(false);
  const [state, setState] = m$1('view');
  const endpoint = resolveEndpoint({
    message,
    topic
  }); // Handler

  async function startEditing() {
    // On récupère le contenu original
    if (rawContent === null) {
      setLoading(true);
      const response = await jsonFetch(endpoint);
      setLoading(false);
      setRawContent(response.content);
    }

    const message = element.current.closest('.forum-message');
    container.current = message.querySelector('.js-forum-edit');
    message.querySelector('.js-content').style.display = 'none';
    setState('edit');
  }

  function handleCancel() {
    setState('view');
    const message = element.current.closest('.forum-message');
    message.querySelector('.js-content').style.display = null;
  }

  function handleSuccess(data) {
    // On met à jour le contenu dans la div
    const message = element.current.closest('.forum-message');
    setRawContent(data.content);
    message.querySelector('.js-content').innerHTML = data.formattedContent; // On revient sur l'affichage du message

    handleCancel();
  } // L'utilisateur ne peut pas intervenir sur ce sujet


  if (!canManage(owner)) {
    return null;
  }

  if (topic) {
    return v(p, null, "- ", v("a", {
      href: `/forum/${topic}/edit`
    }, "Editer"));
  }

  return v("span", {
    ref: element
  }, state === 'view' && v(p, null, "-", ' ', v("button", {
    onClick: startEditing
  }, loading && v(Loader$1, {
    style: {
      width: 12,
      marginRight: 5
    }
  }), "Editer")), state === 'edit' && v(ForumEditor, {
    container: container.current,
    endpoint: endpoint,
    content: rawContent,
    onSuccess: handleSuccess,
    onCancel: handleCancel
  }));
}
/**
 * Génère un éditeur pour l'édition d'un message sur le forum
 */

function ForumEditor({
  container,
  endpoint,
  onCancel,
  content,
  onSuccess
}) {
  return D(v(FetchForm, {
    action: endpoint,
    method: "PUT",
    onSuccess: onSuccess
  }, v(Stack, null, v(FormField, {
    name: "content",
    defaultValue: content,
    type: "editor"
  }), v(Flex, null, v(FormPrimaryButton, null, "Editer"), v(SecondaryButton, {
    onClick: onCancel,
    type: "button"
  }, "Annuler")))), container);
}

/**
 * Génère un bouton permettant de lire tous les sujets du forum
 * @param {Object} props
 * @param {string} props.endpoint
 */

function ForumRead({
  endpoint
}) {
  const {
    loading,
    done,
    fetch
  } = useJsonFetchOrFlash(endpoint, {
    method: 'POST'
  });
  y(() => {
    if (done) {
      flash('Tous les sujets ont été marqués comme lu');
      Array.from(document.querySelectorAll('.forum-topic')).forEach(topic => topic.classList.add('is-read'));
    }
  }, [done]);

  if (!isAuthenticated() || done) {
    return null;
  }

  return v(SecondaryButton, {
    size: "small",
    loading: loading,
    onClick: fetch
  }, !loading && v(Icon, {
    name: "eye"
  }), " Marquer tous comme lus");
}

preactCustomElement('forum-delete', ForumDelete);
preactCustomElement('forum-edit', ForumEdit);
preactCustomElement('forum-create-message', CreateMessage, ['topic']);
preactCustomElement('forum-report', ForumReport, ['message', 'topic']);
preactCustomElement('forum-read', ForumRead, ['endpoint']);

customElements.define('nav-tabs', Tabs);
customElements.define('textarea-autogrow', Autogrow, {
  extends: 'textarea'
});
customElements.define('modal-dialog', ModalDialog);
customElements.define('alert-message', Alert);
customElements.define('alert-floating', FloatingAlert);
customElements.define('youtube-player', YoutubePlayer);
customElements.define('modal-box', Modal);
customElements.define('live-recap', RecapLiveElement);
customElements.define('play-button', PlayButton);
customElements.define('waves-shape', Waves);
customElements.define('comments-area', Comments$1);
customElements.define('time-ago', TimeAgo);
customElements.define('ajax-delete', AjaxDelete);
customElements.define('animated-editor', AnimatedEditor);
customElements.define('spinning-dots', SpinningDots);
preactCustomElement('site-notifications', Notifications);
preactCustomElement('contact-form', ContactForm); // CustomElement étendus

customElements.define('input-switch', Switch, {
  extends: 'input'
});
customElements.define('input-choices', Choices$1, {
  extends: 'input'
});
customElements.define('markdown-editor', MarkdownEditor, {
  extends: 'textarea'
});
customElements.define('auto-scroll', AutoScroll, {
  extends: 'div'
});
customElements.define('auto-submit', AutoSubmit, {
  extends: 'form'
});

const ratio = 0.02;
const options = {
  root: null,
  rootMargin: '0px',
  threshold: ratio
};

const handleIntersect = function (entries, observer) {
  entries.forEach(entry => {
    if (entry.intersectionRatio > ratio) {
      entry.target.classList.add('in');

      if (entry.target.dataset.delay) {
        entry.target.style.transitionDelay = `.${entry.target.dataset.delay}s`;
      }

      observer.unobserve(entry.target);
    }
  });
};

const observer = new IntersectionObserver(handleIntersect, options);
document.addEventListener('turbolinks:load', () => {
  document.querySelectorAll('.fade').forEach(r => {
    observer.observe(r);
  });
});
document.addEventListener('turbolinks:before-render', () => {
  observer.takeRecords();
});

var script = createCommonjsModule(function (module) {
/*!
  * $script.js JS loader & dependency manager
  * https://github.com/ded/script.js
  * (c) Dustin Diaz 2014 | License MIT
  */

(function (name, definition) {
  if ( module.exports) module.exports = definition();
  else this[name] = definition();
})('$script', function () {
  var doc = document
    , head = doc.getElementsByTagName('head')[0]
    , f = false
    , push = 'push'
    , readyState = 'readyState'
    , onreadystatechange = 'onreadystatechange'
    , list = {}
    , delay = {}
    , scripts = {}
    , scriptpath
    , urlArgs;

  function every(ar, fn) {
    for (var i = 0, j = ar.length; i < j; ++i) if (!fn(ar[i])) return f
    return 1
  }
  function each(ar, fn) {
    every(ar, function (el) {
      fn(el);
      return 1
    });
  }

  function $script(paths, idOrDone, optDone) {
    paths = paths[push] ? paths : [paths];
    var idOrDoneIsDone = idOrDone && idOrDone.call
      , done = idOrDoneIsDone ? idOrDone : optDone
      , id = idOrDoneIsDone ? paths.join('') : idOrDone
      , queue = paths.length;
    function loopFn(item) {
      return item.call ? item() : list[item]
    }
    function callback() {
      if (!--queue) {
        list[id] = 1;
        done && done();
        for (var dset in delay) {
          every(dset.split('|'), loopFn) && !each(delay[dset], loopFn) && (delay[dset] = []);
        }
      }
    }
    setTimeout(function () {
      each(paths, function loading(path, force) {
        if (path === null) return callback()
        
        if (!force && !/^https?:\/\//.test(path) && scriptpath) {
          path = (path.indexOf('.js') === -1) ? scriptpath + path + '.js' : scriptpath + path;
        }
        
        if (scripts[path]) {
          return (scripts[path] == 2) ? callback() : setTimeout(function () { loading(path, true); }, 0)
        }

        scripts[path] = 1;
        create(path, callback);
      });
    }, 0);
    return $script
  }

  function create(path, fn) {
    var el = doc.createElement('script'), loaded;
    el.onload = el.onerror = el[onreadystatechange] = function () {
      if ((el[readyState] && !(/^c|loade/.test(el[readyState]))) || loaded) return;
      el.onload = el[onreadystatechange] = null;
      loaded = 1;
      scripts[path] = 2;
      fn();
    };
    el.async = 1;
    el.src = urlArgs ? path + (path.indexOf('?') === -1 ? '?' : '&') + urlArgs : path;
    head.insertBefore(el, head.lastChild);
  }

  $script.get = create;

  $script.order = function (scripts, id, done) {
    (function callback(s) {
      s = scripts.shift();
      !scripts.length ? $script(s, id, done) : $script(s, callback);
    }());
  };

  $script.path = function (p) {
    scriptpath = p;
  };
  $script.urlArgs = function (str) {
    urlArgs = str;
  };
  $script.ready = function (deps, ready, req) {
    deps = deps[push] ? deps : [deps];
    var missing = [];
    !each(deps, function (dep) {
      list[dep] || missing[push](dep);
    }) && every(deps, function (dep) {return list[dep]}) ?
      ready() : !function (key) {
      delay[key] = delay[key] || [];
      delay[key][push](ready);
      req && req(missing);
    }(deps.join('|'));
    return $script
  };

  $script.done = function (idOrDone) {
    $script([null], idOrDone);
  };

  return $script
});
});

const lazylangs = ['typescript', 'elixir', 'less', 'stylus', 'scss', 'sass', 'yaml'];
/**
 * Ajoute highlightjs sur les éléments sélectionnés
 *
 * @param {NodeList<HTMLElement>} $codes
 */

function highlight($codes) {
  $codes.forEach(code => {
    let lazy = false;
    let cls = code.getAttribute('class');

    if (cls === null) {
      cls = 'bash';
    } else {
      cls = code.getAttribute('class').replace('markup', 'bash');
    }

    lazylangs.forEach(lang => {
      if (cls.endsWith(lang)) {
        lazy = true;
        script(`//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.13.1/languages/${lang}.min.js`, () => {
          window.hljs.highlightBlock(code);
        });
      }
    });

    if (lazy === false) {
      window.hljs.highlightBlock(code);
    }
  });
}
/**
 * Détecte et ajoute la coloration syntaxique sur le site
 */


function bindHighlight() {
  const $codes = document.querySelectorAll('pre code');

  if ($codes.length > 0) {
    if (window.hljs) {
      highlight($codes);
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      document.querySelector('head').appendChild(link);
      script('//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.1/highlight.min.js', () => {
        window.hljs.configure({
          tabReplace: '    '
        });
        highlight($codes);
      });
    }
  }
}

document.addEventListener('turbolinks:load', () => {
  bindHighlight();
});

var flatpickr = createCommonjsModule(function (module, exports) {
/* flatpickr v4.6.3, @license MIT */
(function (global, factory) {
     module.exports = factory() ;
}(commonjsGlobal, function () {
    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var HOOKS = [
        "onChange",
        "onClose",
        "onDayCreate",
        "onDestroy",
        "onKeyDown",
        "onMonthChange",
        "onOpen",
        "onParseConfig",
        "onReady",
        "onValueUpdate",
        "onYearChange",
        "onPreCalendarPosition",
    ];
    var defaults = {
        _disable: [],
        _enable: [],
        allowInput: false,
        altFormat: "F j, Y",
        altInput: false,
        altInputClass: "form-control input",
        animate: typeof window === "object" &&
            window.navigator.userAgent.indexOf("MSIE") === -1,
        ariaDateFormat: "F j, Y",
        clickOpens: true,
        closeOnSelect: true,
        conjunction: ", ",
        dateFormat: "Y-m-d",
        defaultHour: 12,
        defaultMinute: 0,
        defaultSeconds: 0,
        disable: [],
        disableMobile: false,
        enable: [],
        enableSeconds: false,
        enableTime: false,
        errorHandler: function (err) {
            return typeof console !== "undefined" && console.warn(err);
        },
        getWeek: function (givenDate) {
            var date = new Date(givenDate.getTime());
            date.setHours(0, 0, 0, 0);
            // Thursday in current week decides the year.
            date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
            // January 4 is always in week 1.
            var week1 = new Date(date.getFullYear(), 0, 4);
            // Adjust to Thursday in week 1 and count number of weeks from date to week1.
            return (1 +
                Math.round(((date.getTime() - week1.getTime()) / 86400000 -
                    3 +
                    ((week1.getDay() + 6) % 7)) /
                    7));
        },
        hourIncrement: 1,
        ignoredFocusElements: [],
        inline: false,
        locale: "default",
        minuteIncrement: 5,
        mode: "single",
        monthSelectorType: "dropdown",
        nextArrow: "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 17 17'><g></g><path d='M13.207 8.472l-7.854 7.854-0.707-0.707 7.146-7.146-7.146-7.148 0.707-0.707 7.854 7.854z' /></svg>",
        noCalendar: false,
        now: new Date(),
        onChange: [],
        onClose: [],
        onDayCreate: [],
        onDestroy: [],
        onKeyDown: [],
        onMonthChange: [],
        onOpen: [],
        onParseConfig: [],
        onReady: [],
        onValueUpdate: [],
        onYearChange: [],
        onPreCalendarPosition: [],
        plugins: [],
        position: "auto",
        positionElement: undefined,
        prevArrow: "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 17 17'><g></g><path d='M5.207 8.471l7.146 7.147-0.707 0.707-7.853-7.854 7.854-7.853 0.707 0.707-7.147 7.146z' /></svg>",
        shorthandCurrentMonth: false,
        showMonths: 1,
        static: false,
        time_24hr: false,
        weekNumbers: false,
        wrap: false
    };

    var english = {
        weekdays: {
            shorthand: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            longhand: [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ]
        },
        months: {
            shorthand: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ],
            longhand: [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
            ]
        },
        daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        firstDayOfWeek: 0,
        ordinal: function (nth) {
            var s = nth % 100;
            if (s > 3 && s < 21)
                return "th";
            switch (s % 10) {
                case 1:
                    return "st";
                case 2:
                    return "nd";
                case 3:
                    return "rd";
                default:
                    return "th";
            }
        },
        rangeSeparator: " to ",
        weekAbbreviation: "Wk",
        scrollTitle: "Scroll to increment",
        toggleTitle: "Click to toggle",
        amPM: ["AM", "PM"],
        yearAriaLabel: "Year",
        hourAriaLabel: "Hour",
        minuteAriaLabel: "Minute",
        time_24hr: false
    };

    var pad = function (number) { return ("0" + number).slice(-2); };
    var int = function (bool) { return (bool === true ? 1 : 0); };
    /* istanbul ignore next */
    function debounce(func, wait, immediate) {
        if (immediate === void 0) { immediate = false; }
        var timeout;
        return function () {
            var context = this, args = arguments;
            timeout !== null && clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                timeout = null;
                if (!immediate)
                    func.apply(context, args);
            }, wait);
            if (immediate && !timeout)
                func.apply(context, args);
        };
    }
    var arrayify = function (obj) {
        return obj instanceof Array ? obj : [obj];
    };

    function toggleClass(elem, className, bool) {
        if (bool === true)
            return elem.classList.add(className);
        elem.classList.remove(className);
    }
    function createElement(tag, className, content) {
        var e = window.document.createElement(tag);
        className = className || "";
        content = content || "";
        e.className = className;
        if (content !== undefined)
            e.textContent = content;
        return e;
    }
    function clearNode(node) {
        while (node.firstChild)
            node.removeChild(node.firstChild);
    }
    function findParent(node, condition) {
        if (condition(node))
            return node;
        else if (node.parentNode)
            return findParent(node.parentNode, condition);
        return undefined; // nothing found
    }
    function createNumberInput(inputClassName, opts) {
        var wrapper = createElement("div", "numInputWrapper"), numInput = createElement("input", "numInput " + inputClassName), arrowUp = createElement("span", "arrowUp"), arrowDown = createElement("span", "arrowDown");
        if (navigator.userAgent.indexOf("MSIE 9.0") === -1) {
            numInput.type = "number";
        }
        else {
            numInput.type = "text";
            numInput.pattern = "\\d*";
        }
        if (opts !== undefined)
            for (var key in opts)
                numInput.setAttribute(key, opts[key]);
        wrapper.appendChild(numInput);
        wrapper.appendChild(arrowUp);
        wrapper.appendChild(arrowDown);
        return wrapper;
    }
    function getEventTarget(event) {
        if (typeof event.composedPath === "function") {
            var path = event.composedPath();
            return path[0];
        }
        return event.target;
    }

    var doNothing = function () { return undefined; };
    var monthToStr = function (monthNumber, shorthand, locale) { return locale.months[shorthand ? "shorthand" : "longhand"][monthNumber]; };
    var revFormat = {
        D: doNothing,
        F: function (dateObj, monthName, locale) {
            dateObj.setMonth(locale.months.longhand.indexOf(monthName));
        },
        G: function (dateObj, hour) {
            dateObj.setHours(parseFloat(hour));
        },
        H: function (dateObj, hour) {
            dateObj.setHours(parseFloat(hour));
        },
        J: function (dateObj, day) {
            dateObj.setDate(parseFloat(day));
        },
        K: function (dateObj, amPM, locale) {
            dateObj.setHours((dateObj.getHours() % 12) +
                12 * int(new RegExp(locale.amPM[1], "i").test(amPM)));
        },
        M: function (dateObj, shortMonth, locale) {
            dateObj.setMonth(locale.months.shorthand.indexOf(shortMonth));
        },
        S: function (dateObj, seconds) {
            dateObj.setSeconds(parseFloat(seconds));
        },
        U: function (_, unixSeconds) { return new Date(parseFloat(unixSeconds) * 1000); },
        W: function (dateObj, weekNum, locale) {
            var weekNumber = parseInt(weekNum);
            var date = new Date(dateObj.getFullYear(), 0, 2 + (weekNumber - 1) * 7, 0, 0, 0, 0);
            date.setDate(date.getDate() - date.getDay() + locale.firstDayOfWeek);
            return date;
        },
        Y: function (dateObj, year) {
            dateObj.setFullYear(parseFloat(year));
        },
        Z: function (_, ISODate) { return new Date(ISODate); },
        d: function (dateObj, day) {
            dateObj.setDate(parseFloat(day));
        },
        h: function (dateObj, hour) {
            dateObj.setHours(parseFloat(hour));
        },
        i: function (dateObj, minutes) {
            dateObj.setMinutes(parseFloat(minutes));
        },
        j: function (dateObj, day) {
            dateObj.setDate(parseFloat(day));
        },
        l: doNothing,
        m: function (dateObj, month) {
            dateObj.setMonth(parseFloat(month) - 1);
        },
        n: function (dateObj, month) {
            dateObj.setMonth(parseFloat(month) - 1);
        },
        s: function (dateObj, seconds) {
            dateObj.setSeconds(parseFloat(seconds));
        },
        u: function (_, unixMillSeconds) {
            return new Date(parseFloat(unixMillSeconds));
        },
        w: doNothing,
        y: function (dateObj, year) {
            dateObj.setFullYear(2000 + parseFloat(year));
        }
    };
    var tokenRegex = {
        D: "(\\w+)",
        F: "(\\w+)",
        G: "(\\d\\d|\\d)",
        H: "(\\d\\d|\\d)",
        J: "(\\d\\d|\\d)\\w+",
        K: "",
        M: "(\\w+)",
        S: "(\\d\\d|\\d)",
        U: "(.+)",
        W: "(\\d\\d|\\d)",
        Y: "(\\d{4})",
        Z: "(.+)",
        d: "(\\d\\d|\\d)",
        h: "(\\d\\d|\\d)",
        i: "(\\d\\d|\\d)",
        j: "(\\d\\d|\\d)",
        l: "(\\w+)",
        m: "(\\d\\d|\\d)",
        n: "(\\d\\d|\\d)",
        s: "(\\d\\d|\\d)",
        u: "(.+)",
        w: "(\\d\\d|\\d)",
        y: "(\\d{2})"
    };
    var formats = {
        // get the date in UTC
        Z: function (date) { return date.toISOString(); },
        // weekday name, short, e.g. Thu
        D: function (date, locale, options) {
            return locale.weekdays.shorthand[formats.w(date, locale, options)];
        },
        // full month name e.g. January
        F: function (date, locale, options) {
            return monthToStr(formats.n(date, locale, options) - 1, false, locale);
        },
        // padded hour 1-12
        G: function (date, locale, options) {
            return pad(formats.h(date, locale, options));
        },
        // hours with leading zero e.g. 03
        H: function (date) { return pad(date.getHours()); },
        // day (1-30) with ordinal suffix e.g. 1st, 2nd
        J: function (date, locale) {
            return locale.ordinal !== undefined
                ? date.getDate() + locale.ordinal(date.getDate())
                : date.getDate();
        },
        // AM/PM
        K: function (date, locale) { return locale.amPM[int(date.getHours() > 11)]; },
        // shorthand month e.g. Jan, Sep, Oct, etc
        M: function (date, locale) {
            return monthToStr(date.getMonth(), true, locale);
        },
        // seconds 00-59
        S: function (date) { return pad(date.getSeconds()); },
        // unix timestamp
        U: function (date) { return date.getTime() / 1000; },
        W: function (date, _, options) {
            return options.getWeek(date);
        },
        // full year e.g. 2016
        Y: function (date) { return date.getFullYear(); },
        // day in month, padded (01-30)
        d: function (date) { return pad(date.getDate()); },
        // hour from 1-12 (am/pm)
        h: function (date) { return (date.getHours() % 12 ? date.getHours() % 12 : 12); },
        // minutes, padded with leading zero e.g. 09
        i: function (date) { return pad(date.getMinutes()); },
        // day in month (1-30)
        j: function (date) { return date.getDate(); },
        // weekday name, full, e.g. Thursday
        l: function (date, locale) {
            return locale.weekdays.longhand[date.getDay()];
        },
        // padded month number (01-12)
        m: function (date) { return pad(date.getMonth() + 1); },
        // the month number (1-12)
        n: function (date) { return date.getMonth() + 1; },
        // seconds 0-59
        s: function (date) { return date.getSeconds(); },
        // Unix Milliseconds
        u: function (date) { return date.getTime(); },
        // number of the day of the week
        w: function (date) { return date.getDay(); },
        // last two digits of year e.g. 16 for 2016
        y: function (date) { return String(date.getFullYear()).substring(2); }
    };

    var createDateFormatter = function (_a) {
        var _b = _a.config, config = _b === void 0 ? defaults : _b, _c = _a.l10n, l10n = _c === void 0 ? english : _c;
        return function (dateObj, frmt, overrideLocale) {
            var locale = overrideLocale || l10n;
            if (config.formatDate !== undefined) {
                return config.formatDate(dateObj, frmt, locale);
            }
            return frmt
                .split("")
                .map(function (c, i, arr) {
                return formats[c] && arr[i - 1] !== "\\"
                    ? formats[c](dateObj, locale, config)
                    : c !== "\\"
                        ? c
                        : "";
            })
                .join("");
        };
    };
    var createDateParser = function (_a) {
        var _b = _a.config, config = _b === void 0 ? defaults : _b, _c = _a.l10n, l10n = _c === void 0 ? english : _c;
        return function (date, givenFormat, timeless, customLocale) {
            if (date !== 0 && !date)
                return undefined;
            var locale = customLocale || l10n;
            var parsedDate;
            var dateOrig = date;
            if (date instanceof Date)
                parsedDate = new Date(date.getTime());
            else if (typeof date !== "string" &&
                date.toFixed !== undefined // timestamp
            )
                // create a copy
                parsedDate = new Date(date);
            else if (typeof date === "string") {
                // date string
                var format = givenFormat || (config || defaults).dateFormat;
                var datestr = String(date).trim();
                if (datestr === "today") {
                    parsedDate = new Date();
                    timeless = true;
                }
                else if (/Z$/.test(datestr) ||
                    /GMT$/.test(datestr) // datestrings w/ timezone
                )
                    parsedDate = new Date(date);
                else if (config && config.parseDate)
                    parsedDate = config.parseDate(date, format);
                else {
                    parsedDate =
                        !config || !config.noCalendar
                            ? new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0)
                            : new Date(new Date().setHours(0, 0, 0, 0));
                    var matched = void 0, ops = [];
                    for (var i = 0, matchIndex = 0, regexStr = ""; i < format.length; i++) {
                        var token_1 = format[i];
                        var isBackSlash = token_1 === "\\";
                        var escaped = format[i - 1] === "\\" || isBackSlash;
                        if (tokenRegex[token_1] && !escaped) {
                            regexStr += tokenRegex[token_1];
                            var match = new RegExp(regexStr).exec(date);
                            if (match && (matched = true)) {
                                ops[token_1 !== "Y" ? "push" : "unshift"]({
                                    fn: revFormat[token_1],
                                    val: match[++matchIndex]
                                });
                            }
                        }
                        else if (!isBackSlash)
                            regexStr += "."; // don't really care
                        ops.forEach(function (_a) {
                            var fn = _a.fn, val = _a.val;
                            return (parsedDate = fn(parsedDate, val, locale) || parsedDate);
                        });
                    }
                    parsedDate = matched ? parsedDate : undefined;
                }
            }
            /* istanbul ignore next */
            if (!(parsedDate instanceof Date && !isNaN(parsedDate.getTime()))) {
                config.errorHandler(new Error("Invalid date provided: " + dateOrig));
                return undefined;
            }
            if (timeless === true)
                parsedDate.setHours(0, 0, 0, 0);
            return parsedDate;
        };
    };
    /**
     * Compute the difference in dates, measured in ms
     */
    function compareDates(date1, date2, timeless) {
        if (timeless === void 0) { timeless = true; }
        if (timeless !== false) {
            return (new Date(date1.getTime()).setHours(0, 0, 0, 0) -
                new Date(date2.getTime()).setHours(0, 0, 0, 0));
        }
        return date1.getTime() - date2.getTime();
    }
    var isBetween = function (ts, ts1, ts2) {
        return ts > Math.min(ts1, ts2) && ts < Math.max(ts1, ts2);
    };
    var duration = {
        DAY: 86400000
    };

    if (typeof Object.assign !== "function") {
        Object.assign = function (target) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (!target) {
                throw TypeError("Cannot convert undefined or null to object");
            }
            var _loop_1 = function (source) {
                if (source) {
                    Object.keys(source).forEach(function (key) { return (target[key] = source[key]); });
                }
            };
            for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
                var source = args_1[_a];
                _loop_1(source);
            }
            return target;
        };
    }

    var DEBOUNCED_CHANGE_MS = 300;
    function FlatpickrInstance(element, instanceConfig) {
        var self = {
            config: __assign({}, defaults, flatpickr.defaultConfig),
            l10n: english
        };
        self.parseDate = createDateParser({ config: self.config, l10n: self.l10n });
        self._handlers = [];
        self.pluginElements = [];
        self.loadedPlugins = [];
        self._bind = bind;
        self._setHoursFromDate = setHoursFromDate;
        self._positionCalendar = positionCalendar;
        self.changeMonth = changeMonth;
        self.changeYear = changeYear;
        self.clear = clear;
        self.close = close;
        self._createElement = createElement;
        self.destroy = destroy;
        self.isEnabled = isEnabled;
        self.jumpToDate = jumpToDate;
        self.open = open;
        self.redraw = redraw;
        self.set = set;
        self.setDate = setDate;
        self.toggle = toggle;
        function setupHelperFunctions() {
            self.utils = {
                getDaysInMonth: function (month, yr) {
                    if (month === void 0) { month = self.currentMonth; }
                    if (yr === void 0) { yr = self.currentYear; }
                    if (month === 1 && ((yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0))
                        return 29;
                    return self.l10n.daysInMonth[month];
                }
            };
        }
        function init() {
            self.element = self.input = element;
            self.isOpen = false;
            parseConfig();
            setupLocale();
            setupInputs();
            setupDates();
            setupHelperFunctions();
            if (!self.isMobile)
                build();
            bindEvents();
            if (self.selectedDates.length || self.config.noCalendar) {
                if (self.config.enableTime) {
                    setHoursFromDate(self.config.noCalendar
                        ? self.latestSelectedDateObj || self.config.minDate
                        : undefined);
                }
                updateValue(false);
            }
            setCalendarWidth();
            self.showTimeInput =
                self.selectedDates.length > 0 || self.config.noCalendar;
            var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            /* TODO: investigate this further
        
              Currently, there is weird positioning behavior in safari causing pages
              to scroll up. https://github.com/chmln/flatpickr/issues/563
        
              However, most browsers are not Safari and positioning is expensive when used
              in scale. https://github.com/chmln/flatpickr/issues/1096
            */
            if (!self.isMobile && isSafari) {
                positionCalendar();
            }
            triggerEvent("onReady");
        }
        function bindToInstance(fn) {
            return fn.bind(self);
        }
        function setCalendarWidth() {
            var config = self.config;
            if (config.weekNumbers === false && config.showMonths === 1)
                return;
            else if (config.noCalendar !== true) {
                window.requestAnimationFrame(function () {
                    if (self.calendarContainer !== undefined) {
                        self.calendarContainer.style.visibility = "hidden";
                        self.calendarContainer.style.display = "block";
                    }
                    if (self.daysContainer !== undefined) {
                        var daysWidth = (self.days.offsetWidth + 1) * config.showMonths;
                        self.daysContainer.style.width = daysWidth + "px";
                        self.calendarContainer.style.width =
                            daysWidth +
                                (self.weekWrapper !== undefined
                                    ? self.weekWrapper.offsetWidth
                                    : 0) +
                                "px";
                        self.calendarContainer.style.removeProperty("visibility");
                        self.calendarContainer.style.removeProperty("display");
                    }
                });
            }
        }
        /**
         * The handler for all events targeting the time inputs
         */
        function updateTime(e) {
            if (self.selectedDates.length === 0) {
                setDefaultTime();
            }
            if (e !== undefined && e.type !== "blur") {
                timeWrapper(e);
            }
            var prevValue = self._input.value;
            setHoursFromInputs();
            updateValue();
            if (self._input.value !== prevValue) {
                self._debouncedChange();
            }
        }
        function ampm2military(hour, amPM) {
            return (hour % 12) + 12 * int(amPM === self.l10n.amPM[1]);
        }
        function military2ampm(hour) {
            switch (hour % 24) {
                case 0:
                case 12:
                    return 12;
                default:
                    return hour % 12;
            }
        }
        /**
         * Syncs the selected date object time with user's time input
         */
        function setHoursFromInputs() {
            if (self.hourElement === undefined || self.minuteElement === undefined)
                return;
            var hours = (parseInt(self.hourElement.value.slice(-2), 10) || 0) % 24, minutes = (parseInt(self.minuteElement.value, 10) || 0) % 60, seconds = self.secondElement !== undefined
                ? (parseInt(self.secondElement.value, 10) || 0) % 60
                : 0;
            if (self.amPM !== undefined) {
                hours = ampm2military(hours, self.amPM.textContent);
            }
            var limitMinHours = self.config.minTime !== undefined ||
                (self.config.minDate &&
                    self.minDateHasTime &&
                    self.latestSelectedDateObj &&
                    compareDates(self.latestSelectedDateObj, self.config.minDate, true) ===
                        0);
            var limitMaxHours = self.config.maxTime !== undefined ||
                (self.config.maxDate &&
                    self.maxDateHasTime &&
                    self.latestSelectedDateObj &&
                    compareDates(self.latestSelectedDateObj, self.config.maxDate, true) ===
                        0);
            if (limitMaxHours) {
                var maxTime = self.config.maxTime !== undefined
                    ? self.config.maxTime
                    : self.config.maxDate;
                hours = Math.min(hours, maxTime.getHours());
                if (hours === maxTime.getHours())
                    minutes = Math.min(minutes, maxTime.getMinutes());
                if (minutes === maxTime.getMinutes())
                    seconds = Math.min(seconds, maxTime.getSeconds());
            }
            if (limitMinHours) {
                var minTime = self.config.minTime !== undefined
                    ? self.config.minTime
                    : self.config.minDate;
                hours = Math.max(hours, minTime.getHours());
                if (hours === minTime.getHours())
                    minutes = Math.max(minutes, minTime.getMinutes());
                if (minutes === minTime.getMinutes())
                    seconds = Math.max(seconds, minTime.getSeconds());
            }
            setHours(hours, minutes, seconds);
        }
        /**
         * Syncs time input values with a date
         */
        function setHoursFromDate(dateObj) {
            var date = dateObj || self.latestSelectedDateObj;
            if (date)
                setHours(date.getHours(), date.getMinutes(), date.getSeconds());
        }
        function setDefaultHours() {
            var hours = self.config.defaultHour;
            var minutes = self.config.defaultMinute;
            var seconds = self.config.defaultSeconds;
            if (self.config.minDate !== undefined) {
                var minHr = self.config.minDate.getHours();
                var minMinutes = self.config.minDate.getMinutes();
                hours = Math.max(hours, minHr);
                if (hours === minHr)
                    minutes = Math.max(minMinutes, minutes);
                if (hours === minHr && minutes === minMinutes)
                    seconds = self.config.minDate.getSeconds();
            }
            if (self.config.maxDate !== undefined) {
                var maxHr = self.config.maxDate.getHours();
                var maxMinutes = self.config.maxDate.getMinutes();
                hours = Math.min(hours, maxHr);
                if (hours === maxHr)
                    minutes = Math.min(maxMinutes, minutes);
                if (hours === maxHr && minutes === maxMinutes)
                    seconds = self.config.maxDate.getSeconds();
            }
            setHours(hours, minutes, seconds);
        }
        /**
         * Sets the hours, minutes, and optionally seconds
         * of the latest selected date object and the
         * corresponding time inputs
         * @param {Number} hours the hour. whether its military
         *                 or am-pm gets inferred from config
         * @param {Number} minutes the minutes
         * @param {Number} seconds the seconds (optional)
         */
        function setHours(hours, minutes, seconds) {
            if (self.latestSelectedDateObj !== undefined) {
                self.latestSelectedDateObj.setHours(hours % 24, minutes, seconds || 0, 0);
            }
            if (!self.hourElement || !self.minuteElement || self.isMobile)
                return;
            self.hourElement.value = pad(!self.config.time_24hr
                ? ((12 + hours) % 12) + 12 * int(hours % 12 === 0)
                : hours);
            self.minuteElement.value = pad(minutes);
            if (self.amPM !== undefined)
                self.amPM.textContent = self.l10n.amPM[int(hours >= 12)];
            if (self.secondElement !== undefined)
                self.secondElement.value = pad(seconds);
        }
        /**
         * Handles the year input and incrementing events
         * @param {Event} event the keyup or increment event
         */
        function onYearInput(event) {
            var year = parseInt(event.target.value) + (event.delta || 0);
            if (year / 1000 > 1 ||
                (event.key === "Enter" && !/[^\d]/.test(year.toString()))) {
                changeYear(year);
            }
        }
        /**
         * Essentially addEventListener + tracking
         * @param {Element} element the element to addEventListener to
         * @param {String} event the event name
         * @param {Function} handler the event handler
         */
        function bind(element, event, handler, options) {
            if (event instanceof Array)
                return event.forEach(function (ev) { return bind(element, ev, handler, options); });
            if (element instanceof Array)
                return element.forEach(function (el) { return bind(el, event, handler, options); });
            element.addEventListener(event, handler, options);
            self._handlers.push({
                element: element,
                event: event,
                handler: handler,
                options: options
            });
        }
        /**
         * A mousedown handler which mimics click.
         * Minimizes latency, since we don't need to wait for mouseup in most cases.
         * Also, avoids handling right clicks.
         *
         * @param {Function} handler the event handler
         */
        function onClick(handler) {
            return function (evt) {
                evt.which === 1 && handler(evt);
            };
        }
        function triggerChange() {
            triggerEvent("onChange");
        }
        /**
         * Adds all the necessary event listeners
         */
        function bindEvents() {
            if (self.config.wrap) {
                ["open", "close", "toggle", "clear"].forEach(function (evt) {
                    Array.prototype.forEach.call(self.element.querySelectorAll("[data-" + evt + "]"), function (el) {
                        return bind(el, "click", self[evt]);
                    });
                });
            }
            if (self.isMobile) {
                setupMobile();
                return;
            }
            var debouncedResize = debounce(onResize, 50);
            self._debouncedChange = debounce(triggerChange, DEBOUNCED_CHANGE_MS);
            if (self.daysContainer && !/iPhone|iPad|iPod/i.test(navigator.userAgent))
                bind(self.daysContainer, "mouseover", function (e) {
                    if (self.config.mode === "range")
                        onMouseOver(e.target);
                });
            bind(window.document.body, "keydown", onKeyDown);
            if (!self.config.inline && !self.config.static)
                bind(window, "resize", debouncedResize);
            if (window.ontouchstart !== undefined)
                bind(window.document, "touchstart", documentClick);
            else
                bind(window.document, "mousedown", onClick(documentClick));
            bind(window.document, "focus", documentClick, { capture: true });
            if (self.config.clickOpens === true) {
                bind(self._input, "focus", self.open);
                bind(self._input, "mousedown", onClick(self.open));
            }
            if (self.daysContainer !== undefined) {
                bind(self.monthNav, "mousedown", onClick(onMonthNavClick));
                bind(self.monthNav, ["keyup", "increment"], onYearInput);
                bind(self.daysContainer, "mousedown", onClick(selectDate));
            }
            if (self.timeContainer !== undefined &&
                self.minuteElement !== undefined &&
                self.hourElement !== undefined) {
                var selText = function (e) {
                    return e.target.select();
                };
                bind(self.timeContainer, ["increment"], updateTime);
                bind(self.timeContainer, "blur", updateTime, { capture: true });
                bind(self.timeContainer, "mousedown", onClick(timeIncrement));
                bind([self.hourElement, self.minuteElement], ["focus", "click"], selText);
                if (self.secondElement !== undefined)
                    bind(self.secondElement, "focus", function () { return self.secondElement && self.secondElement.select(); });
                if (self.amPM !== undefined) {
                    bind(self.amPM, "mousedown", onClick(function (e) {
                        updateTime(e);
                        triggerChange();
                    }));
                }
            }
        }
        /**
         * Set the calendar view to a particular date.
         * @param {Date} jumpDate the date to set the view to
         * @param {boolean} triggerChange if change events should be triggered
         */
        function jumpToDate(jumpDate, triggerChange) {
            var jumpTo = jumpDate !== undefined
                ? self.parseDate(jumpDate)
                : self.latestSelectedDateObj ||
                    (self.config.minDate && self.config.minDate > self.now
                        ? self.config.minDate
                        : self.config.maxDate && self.config.maxDate < self.now
                            ? self.config.maxDate
                            : self.now);
            var oldYear = self.currentYear;
            var oldMonth = self.currentMonth;
            try {
                if (jumpTo !== undefined) {
                    self.currentYear = jumpTo.getFullYear();
                    self.currentMonth = jumpTo.getMonth();
                }
            }
            catch (e) {
                /* istanbul ignore next */
                e.message = "Invalid date supplied: " + jumpTo;
                self.config.errorHandler(e);
            }
            if (triggerChange && self.currentYear !== oldYear) {
                triggerEvent("onYearChange");
                buildMonthSwitch();
            }
            if (triggerChange &&
                (self.currentYear !== oldYear || self.currentMonth !== oldMonth)) {
                triggerEvent("onMonthChange");
            }
            self.redraw();
        }
        /**
         * The up/down arrow handler for time inputs
         * @param {Event} e the click event
         */
        function timeIncrement(e) {
            if (~e.target.className.indexOf("arrow"))
                incrementNumInput(e, e.target.classList.contains("arrowUp") ? 1 : -1);
        }
        /**
         * Increments/decrements the value of input associ-
         * ated with the up/down arrow by dispatching an
         * "increment" event on the input.
         *
         * @param {Event} e the click event
         * @param {Number} delta the diff (usually 1 or -1)
         * @param {Element} inputElem the input element
         */
        function incrementNumInput(e, delta, inputElem) {
            var target = e && e.target;
            var input = inputElem ||
                (target && target.parentNode && target.parentNode.firstChild);
            var event = createEvent("increment");
            event.delta = delta;
            input && input.dispatchEvent(event);
        }
        function build() {
            var fragment = window.document.createDocumentFragment();
            self.calendarContainer = createElement("div", "flatpickr-calendar");
            self.calendarContainer.tabIndex = -1;
            if (!self.config.noCalendar) {
                fragment.appendChild(buildMonthNav());
                self.innerContainer = createElement("div", "flatpickr-innerContainer");
                if (self.config.weekNumbers) {
                    var _a = buildWeeks(), weekWrapper = _a.weekWrapper, weekNumbers = _a.weekNumbers;
                    self.innerContainer.appendChild(weekWrapper);
                    self.weekNumbers = weekNumbers;
                    self.weekWrapper = weekWrapper;
                }
                self.rContainer = createElement("div", "flatpickr-rContainer");
                self.rContainer.appendChild(buildWeekdays());
                if (!self.daysContainer) {
                    self.daysContainer = createElement("div", "flatpickr-days");
                    self.daysContainer.tabIndex = -1;
                }
                buildDays();
                self.rContainer.appendChild(self.daysContainer);
                self.innerContainer.appendChild(self.rContainer);
                fragment.appendChild(self.innerContainer);
            }
            if (self.config.enableTime) {
                fragment.appendChild(buildTime());
            }
            toggleClass(self.calendarContainer, "rangeMode", self.config.mode === "range");
            toggleClass(self.calendarContainer, "animate", self.config.animate === true);
            toggleClass(self.calendarContainer, "multiMonth", self.config.showMonths > 1);
            self.calendarContainer.appendChild(fragment);
            var customAppend = self.config.appendTo !== undefined &&
                self.config.appendTo.nodeType !== undefined;
            if (self.config.inline || self.config.static) {
                self.calendarContainer.classList.add(self.config.inline ? "inline" : "static");
                if (self.config.inline) {
                    if (!customAppend && self.element.parentNode)
                        self.element.parentNode.insertBefore(self.calendarContainer, self._input.nextSibling);
                    else if (self.config.appendTo !== undefined)
                        self.config.appendTo.appendChild(self.calendarContainer);
                }
                if (self.config.static) {
                    var wrapper = createElement("div", "flatpickr-wrapper");
                    if (self.element.parentNode)
                        self.element.parentNode.insertBefore(wrapper, self.element);
                    wrapper.appendChild(self.element);
                    if (self.altInput)
                        wrapper.appendChild(self.altInput);
                    wrapper.appendChild(self.calendarContainer);
                }
            }
            if (!self.config.static && !self.config.inline)
                (self.config.appendTo !== undefined
                    ? self.config.appendTo
                    : window.document.body).appendChild(self.calendarContainer);
        }
        function createDay(className, date, dayNumber, i) {
            var dateIsEnabled = isEnabled(date, true), dayElement = createElement("span", "flatpickr-day " + className, date.getDate().toString());
            dayElement.dateObj = date;
            dayElement.$i = i;
            dayElement.setAttribute("aria-label", self.formatDate(date, self.config.ariaDateFormat));
            if (className.indexOf("hidden") === -1 &&
                compareDates(date, self.now) === 0) {
                self.todayDateElem = dayElement;
                dayElement.classList.add("today");
                dayElement.setAttribute("aria-current", "date");
            }
            if (dateIsEnabled) {
                dayElement.tabIndex = -1;
                if (isDateSelected(date)) {
                    dayElement.classList.add("selected");
                    self.selectedDateElem = dayElement;
                    if (self.config.mode === "range") {
                        toggleClass(dayElement, "startRange", self.selectedDates[0] &&
                            compareDates(date, self.selectedDates[0], true) === 0);
                        toggleClass(dayElement, "endRange", self.selectedDates[1] &&
                            compareDates(date, self.selectedDates[1], true) === 0);
                        if (className === "nextMonthDay")
                            dayElement.classList.add("inRange");
                    }
                }
            }
            else {
                dayElement.classList.add("flatpickr-disabled");
            }
            if (self.config.mode === "range") {
                if (isDateInRange(date) && !isDateSelected(date))
                    dayElement.classList.add("inRange");
            }
            if (self.weekNumbers &&
                self.config.showMonths === 1 &&
                className !== "prevMonthDay" &&
                dayNumber % 7 === 1) {
                self.weekNumbers.insertAdjacentHTML("beforeend", "<span class='flatpickr-day'>" + self.config.getWeek(date) + "</span>");
            }
            triggerEvent("onDayCreate", dayElement);
            return dayElement;
        }
        function focusOnDayElem(targetNode) {
            targetNode.focus();
            if (self.config.mode === "range")
                onMouseOver(targetNode);
        }
        function getFirstAvailableDay(delta) {
            var startMonth = delta > 0 ? 0 : self.config.showMonths - 1;
            var endMonth = delta > 0 ? self.config.showMonths : -1;
            for (var m = startMonth; m != endMonth; m += delta) {
                var month = self.daysContainer.children[m];
                var startIndex = delta > 0 ? 0 : month.children.length - 1;
                var endIndex = delta > 0 ? month.children.length : -1;
                for (var i = startIndex; i != endIndex; i += delta) {
                    var c = month.children[i];
                    if (c.className.indexOf("hidden") === -1 && isEnabled(c.dateObj))
                        return c;
                }
            }
            return undefined;
        }
        function getNextAvailableDay(current, delta) {
            var givenMonth = current.className.indexOf("Month") === -1
                ? current.dateObj.getMonth()
                : self.currentMonth;
            var endMonth = delta > 0 ? self.config.showMonths : -1;
            var loopDelta = delta > 0 ? 1 : -1;
            for (var m = givenMonth - self.currentMonth; m != endMonth; m += loopDelta) {
                var month = self.daysContainer.children[m];
                var startIndex = givenMonth - self.currentMonth === m
                    ? current.$i + delta
                    : delta < 0
                        ? month.children.length - 1
                        : 0;
                var numMonthDays = month.children.length;
                for (var i = startIndex; i >= 0 && i < numMonthDays && i != (delta > 0 ? numMonthDays : -1); i += loopDelta) {
                    var c = month.children[i];
                    if (c.className.indexOf("hidden") === -1 &&
                        isEnabled(c.dateObj) &&
                        Math.abs(current.$i - i) >= Math.abs(delta))
                        return focusOnDayElem(c);
                }
            }
            self.changeMonth(loopDelta);
            focusOnDay(getFirstAvailableDay(loopDelta), 0);
            return undefined;
        }
        function focusOnDay(current, offset) {
            var dayFocused = isInView(document.activeElement || document.body);
            var startElem = current !== undefined
                ? current
                : dayFocused
                    ? document.activeElement
                    : self.selectedDateElem !== undefined && isInView(self.selectedDateElem)
                        ? self.selectedDateElem
                        : self.todayDateElem !== undefined && isInView(self.todayDateElem)
                            ? self.todayDateElem
                            : getFirstAvailableDay(offset > 0 ? 1 : -1);
            if (startElem === undefined)
                return self._input.focus();
            if (!dayFocused)
                return focusOnDayElem(startElem);
            getNextAvailableDay(startElem, offset);
        }
        function buildMonthDays(year, month) {
            var firstOfMonth = (new Date(year, month, 1).getDay() - self.l10n.firstDayOfWeek + 7) % 7;
            var prevMonthDays = self.utils.getDaysInMonth((month - 1 + 12) % 12);
            var daysInMonth = self.utils.getDaysInMonth(month), days = window.document.createDocumentFragment(), isMultiMonth = self.config.showMonths > 1, prevMonthDayClass = isMultiMonth ? "prevMonthDay hidden" : "prevMonthDay", nextMonthDayClass = isMultiMonth ? "nextMonthDay hidden" : "nextMonthDay";
            var dayNumber = prevMonthDays + 1 - firstOfMonth, dayIndex = 0;
            // prepend days from the ending of previous month
            for (; dayNumber <= prevMonthDays; dayNumber++, dayIndex++) {
                days.appendChild(createDay(prevMonthDayClass, new Date(year, month - 1, dayNumber), dayNumber, dayIndex));
            }
            // Start at 1 since there is no 0th day
            for (dayNumber = 1; dayNumber <= daysInMonth; dayNumber++, dayIndex++) {
                days.appendChild(createDay("", new Date(year, month, dayNumber), dayNumber, dayIndex));
            }
            // append days from the next month
            for (var dayNum = daysInMonth + 1; dayNum <= 42 - firstOfMonth &&
                (self.config.showMonths === 1 || dayIndex % 7 !== 0); dayNum++, dayIndex++) {
                days.appendChild(createDay(nextMonthDayClass, new Date(year, month + 1, dayNum % daysInMonth), dayNum, dayIndex));
            }
            //updateNavigationCurrentMonth();
            var dayContainer = createElement("div", "dayContainer");
            dayContainer.appendChild(days);
            return dayContainer;
        }
        function buildDays() {
            if (self.daysContainer === undefined) {
                return;
            }
            clearNode(self.daysContainer);
            // TODO: week numbers for each month
            if (self.weekNumbers)
                clearNode(self.weekNumbers);
            var frag = document.createDocumentFragment();
            for (var i = 0; i < self.config.showMonths; i++) {
                var d = new Date(self.currentYear, self.currentMonth, 1);
                d.setMonth(self.currentMonth + i);
                frag.appendChild(buildMonthDays(d.getFullYear(), d.getMonth()));
            }
            self.daysContainer.appendChild(frag);
            self.days = self.daysContainer.firstChild;
            if (self.config.mode === "range" && self.selectedDates.length === 1) {
                onMouseOver();
            }
        }
        function buildMonthSwitch() {
            if (self.config.showMonths > 1 ||
                self.config.monthSelectorType !== "dropdown")
                return;
            var shouldBuildMonth = function (month) {
                if (self.config.minDate !== undefined &&
                    self.currentYear === self.config.minDate.getFullYear() &&
                    month < self.config.minDate.getMonth()) {
                    return false;
                }
                return !(self.config.maxDate !== undefined &&
                    self.currentYear === self.config.maxDate.getFullYear() &&
                    month > self.config.maxDate.getMonth());
            };
            self.monthsDropdownContainer.tabIndex = -1;
            self.monthsDropdownContainer.innerHTML = "";
            for (var i = 0; i < 12; i++) {
                if (!shouldBuildMonth(i))
                    continue;
                var month = createElement("option", "flatpickr-monthDropdown-month");
                month.value = new Date(self.currentYear, i).getMonth().toString();
                month.textContent = monthToStr(i, self.config.shorthandCurrentMonth, self.l10n);
                month.tabIndex = -1;
                if (self.currentMonth === i) {
                    month.selected = true;
                }
                self.monthsDropdownContainer.appendChild(month);
            }
        }
        function buildMonth() {
            var container = createElement("div", "flatpickr-month");
            var monthNavFragment = window.document.createDocumentFragment();
            var monthElement;
            if (self.config.showMonths > 1 ||
                self.config.monthSelectorType === "static") {
                monthElement = createElement("span", "cur-month");
            }
            else {
                self.monthsDropdownContainer = createElement("select", "flatpickr-monthDropdown-months");
                bind(self.monthsDropdownContainer, "change", function (e) {
                    var target = e.target;
                    var selectedMonth = parseInt(target.value, 10);
                    self.changeMonth(selectedMonth - self.currentMonth);
                    triggerEvent("onMonthChange");
                });
                buildMonthSwitch();
                monthElement = self.monthsDropdownContainer;
            }
            var yearInput = createNumberInput("cur-year", { tabindex: "-1" });
            var yearElement = yearInput.getElementsByTagName("input")[0];
            yearElement.setAttribute("aria-label", self.l10n.yearAriaLabel);
            if (self.config.minDate) {
                yearElement.setAttribute("min", self.config.minDate.getFullYear().toString());
            }
            if (self.config.maxDate) {
                yearElement.setAttribute("max", self.config.maxDate.getFullYear().toString());
                yearElement.disabled =
                    !!self.config.minDate &&
                        self.config.minDate.getFullYear() === self.config.maxDate.getFullYear();
            }
            var currentMonth = createElement("div", "flatpickr-current-month");
            currentMonth.appendChild(monthElement);
            currentMonth.appendChild(yearInput);
            monthNavFragment.appendChild(currentMonth);
            container.appendChild(monthNavFragment);
            return {
                container: container,
                yearElement: yearElement,
                monthElement: monthElement
            };
        }
        function buildMonths() {
            clearNode(self.monthNav);
            self.monthNav.appendChild(self.prevMonthNav);
            if (self.config.showMonths) {
                self.yearElements = [];
                self.monthElements = [];
            }
            for (var m = self.config.showMonths; m--;) {
                var month = buildMonth();
                self.yearElements.push(month.yearElement);
                self.monthElements.push(month.monthElement);
                self.monthNav.appendChild(month.container);
            }
            self.monthNav.appendChild(self.nextMonthNav);
        }
        function buildMonthNav() {
            self.monthNav = createElement("div", "flatpickr-months");
            self.yearElements = [];
            self.monthElements = [];
            self.prevMonthNav = createElement("span", "flatpickr-prev-month");
            self.prevMonthNav.innerHTML = self.config.prevArrow;
            self.nextMonthNav = createElement("span", "flatpickr-next-month");
            self.nextMonthNav.innerHTML = self.config.nextArrow;
            buildMonths();
            Object.defineProperty(self, "_hidePrevMonthArrow", {
                get: function () { return self.__hidePrevMonthArrow; },
                set: function (bool) {
                    if (self.__hidePrevMonthArrow !== bool) {
                        toggleClass(self.prevMonthNav, "flatpickr-disabled", bool);
                        self.__hidePrevMonthArrow = bool;
                    }
                }
            });
            Object.defineProperty(self, "_hideNextMonthArrow", {
                get: function () { return self.__hideNextMonthArrow; },
                set: function (bool) {
                    if (self.__hideNextMonthArrow !== bool) {
                        toggleClass(self.nextMonthNav, "flatpickr-disabled", bool);
                        self.__hideNextMonthArrow = bool;
                    }
                }
            });
            self.currentYearElement = self.yearElements[0];
            updateNavigationCurrentMonth();
            return self.monthNav;
        }
        function buildTime() {
            self.calendarContainer.classList.add("hasTime");
            if (self.config.noCalendar)
                self.calendarContainer.classList.add("noCalendar");
            self.timeContainer = createElement("div", "flatpickr-time");
            self.timeContainer.tabIndex = -1;
            var separator = createElement("span", "flatpickr-time-separator", ":");
            var hourInput = createNumberInput("flatpickr-hour", {
                "aria-label": self.l10n.hourAriaLabel
            });
            self.hourElement = hourInput.getElementsByTagName("input")[0];
            var minuteInput = createNumberInput("flatpickr-minute", {
                "aria-label": self.l10n.minuteAriaLabel
            });
            self.minuteElement = minuteInput.getElementsByTagName("input")[0];
            self.hourElement.tabIndex = self.minuteElement.tabIndex = -1;
            self.hourElement.value = pad(self.latestSelectedDateObj
                ? self.latestSelectedDateObj.getHours()
                : self.config.time_24hr
                    ? self.config.defaultHour
                    : military2ampm(self.config.defaultHour));
            self.minuteElement.value = pad(self.latestSelectedDateObj
                ? self.latestSelectedDateObj.getMinutes()
                : self.config.defaultMinute);
            self.hourElement.setAttribute("step", self.config.hourIncrement.toString());
            self.minuteElement.setAttribute("step", self.config.minuteIncrement.toString());
            self.hourElement.setAttribute("min", self.config.time_24hr ? "0" : "1");
            self.hourElement.setAttribute("max", self.config.time_24hr ? "23" : "12");
            self.minuteElement.setAttribute("min", "0");
            self.minuteElement.setAttribute("max", "59");
            self.timeContainer.appendChild(hourInput);
            self.timeContainer.appendChild(separator);
            self.timeContainer.appendChild(minuteInput);
            if (self.config.time_24hr)
                self.timeContainer.classList.add("time24hr");
            if (self.config.enableSeconds) {
                self.timeContainer.classList.add("hasSeconds");
                var secondInput = createNumberInput("flatpickr-second");
                self.secondElement = secondInput.getElementsByTagName("input")[0];
                self.secondElement.value = pad(self.latestSelectedDateObj
                    ? self.latestSelectedDateObj.getSeconds()
                    : self.config.defaultSeconds);
                self.secondElement.setAttribute("step", self.minuteElement.getAttribute("step"));
                self.secondElement.setAttribute("min", "0");
                self.secondElement.setAttribute("max", "59");
                self.timeContainer.appendChild(createElement("span", "flatpickr-time-separator", ":"));
                self.timeContainer.appendChild(secondInput);
            }
            if (!self.config.time_24hr) {
                // add self.amPM if appropriate
                self.amPM = createElement("span", "flatpickr-am-pm", self.l10n.amPM[int((self.latestSelectedDateObj
                    ? self.hourElement.value
                    : self.config.defaultHour) > 11)]);
                self.amPM.title = self.l10n.toggleTitle;
                self.amPM.tabIndex = -1;
                self.timeContainer.appendChild(self.amPM);
            }
            return self.timeContainer;
        }
        function buildWeekdays() {
            if (!self.weekdayContainer)
                self.weekdayContainer = createElement("div", "flatpickr-weekdays");
            else
                clearNode(self.weekdayContainer);
            for (var i = self.config.showMonths; i--;) {
                var container = createElement("div", "flatpickr-weekdaycontainer");
                self.weekdayContainer.appendChild(container);
            }
            updateWeekdays();
            return self.weekdayContainer;
        }
        function updateWeekdays() {
            if (!self.weekdayContainer) {
                return;
            }
            var firstDayOfWeek = self.l10n.firstDayOfWeek;
            var weekdays = self.l10n.weekdays.shorthand.slice();
            if (firstDayOfWeek > 0 && firstDayOfWeek < weekdays.length) {
                weekdays = weekdays.splice(firstDayOfWeek, weekdays.length).concat(weekdays.splice(0, firstDayOfWeek));
            }
            for (var i = self.config.showMonths; i--;) {
                self.weekdayContainer.children[i].innerHTML = "\n      <span class='flatpickr-weekday'>\n        " + weekdays.join("</span><span class='flatpickr-weekday'>") + "\n      </span>\n      ";
            }
        }
        /* istanbul ignore next */
        function buildWeeks() {
            self.calendarContainer.classList.add("hasWeeks");
            var weekWrapper = createElement("div", "flatpickr-weekwrapper");
            weekWrapper.appendChild(createElement("span", "flatpickr-weekday", self.l10n.weekAbbreviation));
            var weekNumbers = createElement("div", "flatpickr-weeks");
            weekWrapper.appendChild(weekNumbers);
            return {
                weekWrapper: weekWrapper,
                weekNumbers: weekNumbers
            };
        }
        function changeMonth(value, isOffset) {
            if (isOffset === void 0) { isOffset = true; }
            var delta = isOffset ? value : value - self.currentMonth;
            if ((delta < 0 && self._hidePrevMonthArrow === true) ||
                (delta > 0 && self._hideNextMonthArrow === true))
                return;
            self.currentMonth += delta;
            if (self.currentMonth < 0 || self.currentMonth > 11) {
                self.currentYear += self.currentMonth > 11 ? 1 : -1;
                self.currentMonth = (self.currentMonth + 12) % 12;
                triggerEvent("onYearChange");
                buildMonthSwitch();
            }
            buildDays();
            triggerEvent("onMonthChange");
            updateNavigationCurrentMonth();
        }
        function clear(triggerChangeEvent, toInitial) {
            if (triggerChangeEvent === void 0) { triggerChangeEvent = true; }
            if (toInitial === void 0) { toInitial = true; }
            self.input.value = "";
            if (self.altInput !== undefined)
                self.altInput.value = "";
            if (self.mobileInput !== undefined)
                self.mobileInput.value = "";
            self.selectedDates = [];
            self.latestSelectedDateObj = undefined;
            if (toInitial === true) {
                self.currentYear = self._initialDate.getFullYear();
                self.currentMonth = self._initialDate.getMonth();
            }
            self.showTimeInput = false;
            if (self.config.enableTime === true) {
                setDefaultHours();
            }
            self.redraw();
            if (triggerChangeEvent)
                // triggerChangeEvent is true (default) or an Event
                triggerEvent("onChange");
        }
        function close() {
            self.isOpen = false;
            if (!self.isMobile) {
                if (self.calendarContainer !== undefined) {
                    self.calendarContainer.classList.remove("open");
                }
                if (self._input !== undefined) {
                    self._input.classList.remove("active");
                }
            }
            triggerEvent("onClose");
        }
        function destroy() {
            if (self.config !== undefined)
                triggerEvent("onDestroy");
            for (var i = self._handlers.length; i--;) {
                var h = self._handlers[i];
                h.element.removeEventListener(h.event, h.handler, h.options);
            }
            self._handlers = [];
            if (self.mobileInput) {
                if (self.mobileInput.parentNode)
                    self.mobileInput.parentNode.removeChild(self.mobileInput);
                self.mobileInput = undefined;
            }
            else if (self.calendarContainer && self.calendarContainer.parentNode) {
                if (self.config.static && self.calendarContainer.parentNode) {
                    var wrapper = self.calendarContainer.parentNode;
                    wrapper.lastChild && wrapper.removeChild(wrapper.lastChild);
                    if (wrapper.parentNode) {
                        while (wrapper.firstChild)
                            wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
                        wrapper.parentNode.removeChild(wrapper);
                    }
                }
                else
                    self.calendarContainer.parentNode.removeChild(self.calendarContainer);
            }
            if (self.altInput) {
                self.input.type = "text";
                if (self.altInput.parentNode)
                    self.altInput.parentNode.removeChild(self.altInput);
                delete self.altInput;
            }
            if (self.input) {
                self.input.type = self.input._type;
                self.input.classList.remove("flatpickr-input");
                self.input.removeAttribute("readonly");
                self.input.value = "";
            }
            [
                "_showTimeInput",
                "latestSelectedDateObj",
                "_hideNextMonthArrow",
                "_hidePrevMonthArrow",
                "__hideNextMonthArrow",
                "__hidePrevMonthArrow",
                "isMobile",
                "isOpen",
                "selectedDateElem",
                "minDateHasTime",
                "maxDateHasTime",
                "days",
                "daysContainer",
                "_input",
                "_positionElement",
                "innerContainer",
                "rContainer",
                "monthNav",
                "todayDateElem",
                "calendarContainer",
                "weekdayContainer",
                "prevMonthNav",
                "nextMonthNav",
                "monthsDropdownContainer",
                "currentMonthElement",
                "currentYearElement",
                "navigationCurrentMonth",
                "selectedDateElem",
                "config",
            ].forEach(function (k) {
                try {
                    delete self[k];
                }
                catch (_) { }
            });
        }
        function isCalendarElem(elem) {
            if (self.config.appendTo && self.config.appendTo.contains(elem))
                return true;
            return self.calendarContainer.contains(elem);
        }
        function documentClick(e) {
            if (self.isOpen && !self.config.inline) {
                var eventTarget_1 = getEventTarget(e);
                var isCalendarElement = isCalendarElem(eventTarget_1);
                var isInput = eventTarget_1 === self.input ||
                    eventTarget_1 === self.altInput ||
                    self.element.contains(eventTarget_1) ||
                    // web components
                    // e.path is not present in all browsers. circumventing typechecks
                    (e.path &&
                        e.path.indexOf &&
                        (~e.path.indexOf(self.input) ||
                            ~e.path.indexOf(self.altInput)));
                var lostFocus = e.type === "blur"
                    ? isInput &&
                        e.relatedTarget &&
                        !isCalendarElem(e.relatedTarget)
                    : !isInput &&
                        !isCalendarElement &&
                        !isCalendarElem(e.relatedTarget);
                var isIgnored = !self.config.ignoredFocusElements.some(function (elem) {
                    return elem.contains(eventTarget_1);
                });
                if (lostFocus && isIgnored) {
                    if (self.timeContainer !== undefined &&
                        self.minuteElement !== undefined &&
                        self.hourElement !== undefined) {
                        updateTime();
                    }
                    self.close();
                    if (self.config.mode === "range" && self.selectedDates.length === 1) {
                        self.clear(false);
                        self.redraw();
                    }
                }
            }
        }
        function changeYear(newYear) {
            if (!newYear ||
                (self.config.minDate && newYear < self.config.minDate.getFullYear()) ||
                (self.config.maxDate && newYear > self.config.maxDate.getFullYear()))
                return;
            var newYearNum = newYear, isNewYear = self.currentYear !== newYearNum;
            self.currentYear = newYearNum || self.currentYear;
            if (self.config.maxDate &&
                self.currentYear === self.config.maxDate.getFullYear()) {
                self.currentMonth = Math.min(self.config.maxDate.getMonth(), self.currentMonth);
            }
            else if (self.config.minDate &&
                self.currentYear === self.config.minDate.getFullYear()) {
                self.currentMonth = Math.max(self.config.minDate.getMonth(), self.currentMonth);
            }
            if (isNewYear) {
                self.redraw();
                triggerEvent("onYearChange");
                buildMonthSwitch();
            }
        }
        function isEnabled(date, timeless) {
            if (timeless === void 0) { timeless = true; }
            var dateToCheck = self.parseDate(date, undefined, timeless); // timeless
            if ((self.config.minDate &&
                dateToCheck &&
                compareDates(dateToCheck, self.config.minDate, timeless !== undefined ? timeless : !self.minDateHasTime) < 0) ||
                (self.config.maxDate &&
                    dateToCheck &&
                    compareDates(dateToCheck, self.config.maxDate, timeless !== undefined ? timeless : !self.maxDateHasTime) > 0))
                return false;
            if (self.config.enable.length === 0 && self.config.disable.length === 0)
                return true;
            if (dateToCheck === undefined)
                return false;
            var bool = self.config.enable.length > 0, array = bool ? self.config.enable : self.config.disable;
            for (var i = 0, d = void 0; i < array.length; i++) {
                d = array[i];
                if (typeof d === "function" &&
                    d(dateToCheck) // disabled by function
                )
                    return bool;
                else if (d instanceof Date &&
                    dateToCheck !== undefined &&
                    d.getTime() === dateToCheck.getTime())
                    // disabled by date
                    return bool;
                else if (typeof d === "string" && dateToCheck !== undefined) {
                    // disabled by date string
                    var parsed = self.parseDate(d, undefined, true);
                    return parsed && parsed.getTime() === dateToCheck.getTime()
                        ? bool
                        : !bool;
                }
                else if (
                // disabled by range
                typeof d === "object" &&
                    dateToCheck !== undefined &&
                    d.from &&
                    d.to &&
                    dateToCheck.getTime() >= d.from.getTime() &&
                    dateToCheck.getTime() <= d.to.getTime())
                    return bool;
            }
            return !bool;
        }
        function isInView(elem) {
            if (self.daysContainer !== undefined)
                return (elem.className.indexOf("hidden") === -1 &&
                    self.daysContainer.contains(elem));
            return false;
        }
        function onKeyDown(e) {
            // e.key                      e.keyCode
            // "Backspace"                        8
            // "Tab"                              9
            // "Enter"                           13
            // "Escape"     (IE "Esc")           27
            // "ArrowLeft"  (IE "Left")          37
            // "ArrowUp"    (IE "Up")            38
            // "ArrowRight" (IE "Right")         39
            // "ArrowDown"  (IE "Down")          40
            // "Delete"     (IE "Del")           46
            var isInput = e.target === self._input;
            var allowInput = self.config.allowInput;
            var allowKeydown = self.isOpen && (!allowInput || !isInput);
            var allowInlineKeydown = self.config.inline && isInput && !allowInput;
            if (e.keyCode === 13 && isInput) {
                if (allowInput) {
                    self.setDate(self._input.value, true, e.target === self.altInput
                        ? self.config.altFormat
                        : self.config.dateFormat);
                    return e.target.blur();
                }
                else {
                    self.open();
                }
            }
            else if (isCalendarElem(e.target) ||
                allowKeydown ||
                allowInlineKeydown) {
                var isTimeObj = !!self.timeContainer &&
                    self.timeContainer.contains(e.target);
                switch (e.keyCode) {
                    case 13:
                        if (isTimeObj) {
                            e.preventDefault();
                            updateTime();
                            focusAndClose();
                        }
                        else
                            selectDate(e);
                        break;
                    case 27: // escape
                        e.preventDefault();
                        focusAndClose();
                        break;
                    case 8:
                    case 46:
                        if (isInput && !self.config.allowInput) {
                            e.preventDefault();
                            self.clear();
                        }
                        break;
                    case 37:
                    case 39:
                        if (!isTimeObj && !isInput) {
                            e.preventDefault();
                            if (self.daysContainer !== undefined &&
                                (allowInput === false ||
                                    (document.activeElement && isInView(document.activeElement)))) {
                                var delta_1 = e.keyCode === 39 ? 1 : -1;
                                if (!e.ctrlKey)
                                    focusOnDay(undefined, delta_1);
                                else {
                                    e.stopPropagation();
                                    changeMonth(delta_1);
                                    focusOnDay(getFirstAvailableDay(1), 0);
                                }
                            }
                        }
                        else if (self.hourElement)
                            self.hourElement.focus();
                        break;
                    case 38:
                    case 40:
                        e.preventDefault();
                        var delta = e.keyCode === 40 ? 1 : -1;
                        if ((self.daysContainer && e.target.$i !== undefined) ||
                            e.target === self.input ||
                            e.target === self.altInput) {
                            if (e.ctrlKey) {
                                e.stopPropagation();
                                changeYear(self.currentYear - delta);
                                focusOnDay(getFirstAvailableDay(1), 0);
                            }
                            else if (!isTimeObj)
                                focusOnDay(undefined, delta * 7);
                        }
                        else if (e.target === self.currentYearElement) {
                            changeYear(self.currentYear - delta);
                        }
                        else if (self.config.enableTime) {
                            if (!isTimeObj && self.hourElement)
                                self.hourElement.focus();
                            updateTime(e);
                            self._debouncedChange();
                        }
                        break;
                    case 9:
                        if (isTimeObj) {
                            var elems = [
                                self.hourElement,
                                self.minuteElement,
                                self.secondElement,
                                self.amPM,
                            ]
                                .concat(self.pluginElements)
                                .filter(function (x) { return x; });
                            var i = elems.indexOf(e.target);
                            if (i !== -1) {
                                var target = elems[i + (e.shiftKey ? -1 : 1)];
                                e.preventDefault();
                                (target || self._input).focus();
                            }
                        }
                        else if (!self.config.noCalendar &&
                            self.daysContainer &&
                            self.daysContainer.contains(e.target) &&
                            e.shiftKey) {
                            e.preventDefault();
                            self._input.focus();
                        }
                        break;
                }
            }
            if (self.amPM !== undefined && e.target === self.amPM) {
                switch (e.key) {
                    case self.l10n.amPM[0].charAt(0):
                    case self.l10n.amPM[0].charAt(0).toLowerCase():
                        self.amPM.textContent = self.l10n.amPM[0];
                        setHoursFromInputs();
                        updateValue();
                        break;
                    case self.l10n.amPM[1].charAt(0):
                    case self.l10n.amPM[1].charAt(0).toLowerCase():
                        self.amPM.textContent = self.l10n.amPM[1];
                        setHoursFromInputs();
                        updateValue();
                        break;
                }
            }
            if (isInput || isCalendarElem(e.target)) {
                triggerEvent("onKeyDown", e);
            }
        }
        function onMouseOver(elem) {
            if (self.selectedDates.length !== 1 ||
                (elem &&
                    (!elem.classList.contains("flatpickr-day") ||
                        elem.classList.contains("flatpickr-disabled"))))
                return;
            var hoverDate = elem
                ? elem.dateObj.getTime()
                : self.days.firstElementChild.dateObj.getTime(), initialDate = self.parseDate(self.selectedDates[0], undefined, true).getTime(), rangeStartDate = Math.min(hoverDate, self.selectedDates[0].getTime()), rangeEndDate = Math.max(hoverDate, self.selectedDates[0].getTime());
            var containsDisabled = false;
            var minRange = 0, maxRange = 0;
            for (var t = rangeStartDate; t < rangeEndDate; t += duration.DAY) {
                if (!isEnabled(new Date(t), true)) {
                    containsDisabled =
                        containsDisabled || (t > rangeStartDate && t < rangeEndDate);
                    if (t < initialDate && (!minRange || t > minRange))
                        minRange = t;
                    else if (t > initialDate && (!maxRange || t < maxRange))
                        maxRange = t;
                }
            }
            for (var m = 0; m < self.config.showMonths; m++) {
                var month = self.daysContainer.children[m];
                var _loop_1 = function (i, l) {
                    var dayElem = month.children[i], date = dayElem.dateObj;
                    var timestamp = date.getTime();
                    var outOfRange = (minRange > 0 && timestamp < minRange) ||
                        (maxRange > 0 && timestamp > maxRange);
                    if (outOfRange) {
                        dayElem.classList.add("notAllowed");
                        ["inRange", "startRange", "endRange"].forEach(function (c) {
                            dayElem.classList.remove(c);
                        });
                        return "continue";
                    }
                    else if (containsDisabled && !outOfRange)
                        return "continue";
                    ["startRange", "inRange", "endRange", "notAllowed"].forEach(function (c) {
                        dayElem.classList.remove(c);
                    });
                    if (elem !== undefined) {
                        elem.classList.add(hoverDate <= self.selectedDates[0].getTime()
                            ? "startRange"
                            : "endRange");
                        if (initialDate < hoverDate && timestamp === initialDate)
                            dayElem.classList.add("startRange");
                        else if (initialDate > hoverDate && timestamp === initialDate)
                            dayElem.classList.add("endRange");
                        if (timestamp >= minRange &&
                            (maxRange === 0 || timestamp <= maxRange) &&
                            isBetween(timestamp, initialDate, hoverDate))
                            dayElem.classList.add("inRange");
                    }
                };
                for (var i = 0, l = month.children.length; i < l; i++) {
                    _loop_1(i, l);
                }
            }
        }
        function onResize() {
            if (self.isOpen && !self.config.static && !self.config.inline)
                positionCalendar();
        }
        function setDefaultTime() {
            self.setDate(self.config.minDate !== undefined
                ? new Date(self.config.minDate.getTime())
                : new Date(), true);
            setDefaultHours();
            updateValue();
        }
        function open(e, positionElement) {
            if (positionElement === void 0) { positionElement = self._positionElement; }
            if (self.isMobile === true) {
                if (e) {
                    e.preventDefault();
                    e.target && e.target.blur();
                }
                if (self.mobileInput !== undefined) {
                    self.mobileInput.focus();
                    self.mobileInput.click();
                }
                triggerEvent("onOpen");
                return;
            }
            if (self._input.disabled || self.config.inline)
                return;
            var wasOpen = self.isOpen;
            self.isOpen = true;
            if (!wasOpen) {
                self.calendarContainer.classList.add("open");
                self._input.classList.add("active");
                triggerEvent("onOpen");
                positionCalendar(positionElement);
            }
            if (self.config.enableTime === true && self.config.noCalendar === true) {
                if (self.selectedDates.length === 0) {
                    setDefaultTime();
                }
                if (self.config.allowInput === false &&
                    (e === undefined ||
                        !self.timeContainer.contains(e.relatedTarget))) {
                    setTimeout(function () { return self.hourElement.select(); }, 50);
                }
            }
        }
        function minMaxDateSetter(type) {
            return function (date) {
                var dateObj = (self.config["_" + type + "Date"] = self.parseDate(date, self.config.dateFormat));
                var inverseDateObj = self.config["_" + (type === "min" ? "max" : "min") + "Date"];
                if (dateObj !== undefined) {
                    self[type === "min" ? "minDateHasTime" : "maxDateHasTime"] =
                        dateObj.getHours() > 0 ||
                            dateObj.getMinutes() > 0 ||
                            dateObj.getSeconds() > 0;
                }
                if (self.selectedDates) {
                    self.selectedDates = self.selectedDates.filter(function (d) { return isEnabled(d); });
                    if (!self.selectedDates.length && type === "min")
                        setHoursFromDate(dateObj);
                    updateValue();
                }
                if (self.daysContainer) {
                    redraw();
                    if (dateObj !== undefined)
                        self.currentYearElement[type] = dateObj.getFullYear().toString();
                    else
                        self.currentYearElement.removeAttribute(type);
                    self.currentYearElement.disabled =
                        !!inverseDateObj &&
                            dateObj !== undefined &&
                            inverseDateObj.getFullYear() === dateObj.getFullYear();
                }
            };
        }
        function parseConfig() {
            var boolOpts = [
                "wrap",
                "weekNumbers",
                "allowInput",
                "clickOpens",
                "time_24hr",
                "enableTime",
                "noCalendar",
                "altInput",
                "shorthandCurrentMonth",
                "inline",
                "static",
                "enableSeconds",
                "disableMobile",
            ];
            var userConfig = __assign({}, instanceConfig, JSON.parse(JSON.stringify(element.dataset || {})));
            var formats = {};
            self.config.parseDate = userConfig.parseDate;
            self.config.formatDate = userConfig.formatDate;
            Object.defineProperty(self.config, "enable", {
                get: function () { return self.config._enable; },
                set: function (dates) {
                    self.config._enable = parseDateRules(dates);
                }
            });
            Object.defineProperty(self.config, "disable", {
                get: function () { return self.config._disable; },
                set: function (dates) {
                    self.config._disable = parseDateRules(dates);
                }
            });
            var timeMode = userConfig.mode === "time";
            if (!userConfig.dateFormat && (userConfig.enableTime || timeMode)) {
                var defaultDateFormat = flatpickr.defaultConfig.dateFormat || defaults.dateFormat;
                formats.dateFormat =
                    userConfig.noCalendar || timeMode
                        ? "H:i" + (userConfig.enableSeconds ? ":S" : "")
                        : defaultDateFormat + " H:i" + (userConfig.enableSeconds ? ":S" : "");
            }
            if (userConfig.altInput &&
                (userConfig.enableTime || timeMode) &&
                !userConfig.altFormat) {
                var defaultAltFormat = flatpickr.defaultConfig.altFormat || defaults.altFormat;
                formats.altFormat =
                    userConfig.noCalendar || timeMode
                        ? "h:i" + (userConfig.enableSeconds ? ":S K" : " K")
                        : defaultAltFormat + (" h:i" + (userConfig.enableSeconds ? ":S" : "") + " K");
            }
            if (!userConfig.altInputClass) {
                self.config.altInputClass =
                    self.input.className + " " + self.config.altInputClass;
            }
            Object.defineProperty(self.config, "minDate", {
                get: function () { return self.config._minDate; },
                set: minMaxDateSetter("min")
            });
            Object.defineProperty(self.config, "maxDate", {
                get: function () { return self.config._maxDate; },
                set: minMaxDateSetter("max")
            });
            var minMaxTimeSetter = function (type) { return function (val) {
                self.config[type === "min" ? "_minTime" : "_maxTime"] = self.parseDate(val, "H:i:S");
            }; };
            Object.defineProperty(self.config, "minTime", {
                get: function () { return self.config._minTime; },
                set: minMaxTimeSetter("min")
            });
            Object.defineProperty(self.config, "maxTime", {
                get: function () { return self.config._maxTime; },
                set: minMaxTimeSetter("max")
            });
            if (userConfig.mode === "time") {
                self.config.noCalendar = true;
                self.config.enableTime = true;
            }
            Object.assign(self.config, formats, userConfig);
            for (var i = 0; i < boolOpts.length; i++)
                self.config[boolOpts[i]] =
                    self.config[boolOpts[i]] === true ||
                        self.config[boolOpts[i]] === "true";
            HOOKS.filter(function (hook) { return self.config[hook] !== undefined; }).forEach(function (hook) {
                self.config[hook] = arrayify(self.config[hook] || []).map(bindToInstance);
            });
            self.isMobile =
                !self.config.disableMobile &&
                    !self.config.inline &&
                    self.config.mode === "single" &&
                    !self.config.disable.length &&
                    !self.config.enable.length &&
                    !self.config.weekNumbers &&
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            for (var i = 0; i < self.config.plugins.length; i++) {
                var pluginConf = self.config.plugins[i](self) || {};
                for (var key in pluginConf) {
                    if (HOOKS.indexOf(key) > -1) {
                        self.config[key] = arrayify(pluginConf[key])
                            .map(bindToInstance)
                            .concat(self.config[key]);
                    }
                    else if (typeof userConfig[key] === "undefined")
                        self.config[key] = pluginConf[key];
                }
            }
            triggerEvent("onParseConfig");
        }
        function setupLocale() {
            if (typeof self.config.locale !== "object" &&
                typeof flatpickr.l10ns[self.config.locale] === "undefined")
                self.config.errorHandler(new Error("flatpickr: invalid locale " + self.config.locale));
            self.l10n = __assign({}, flatpickr.l10ns["default"], (typeof self.config.locale === "object"
                ? self.config.locale
                : self.config.locale !== "default"
                    ? flatpickr.l10ns[self.config.locale]
                    : undefined));
            tokenRegex.K = "(" + self.l10n.amPM[0] + "|" + self.l10n.amPM[1] + "|" + self.l10n.amPM[0].toLowerCase() + "|" + self.l10n.amPM[1].toLowerCase() + ")";
            var userConfig = __assign({}, instanceConfig, JSON.parse(JSON.stringify(element.dataset || {})));
            if (userConfig.time_24hr === undefined &&
                flatpickr.defaultConfig.time_24hr === undefined) {
                self.config.time_24hr = self.l10n.time_24hr;
            }
            self.formatDate = createDateFormatter(self);
            self.parseDate = createDateParser({ config: self.config, l10n: self.l10n });
        }
        function positionCalendar(customPositionElement) {
            if (self.calendarContainer === undefined)
                return;
            triggerEvent("onPreCalendarPosition");
            var positionElement = customPositionElement || self._positionElement;
            var calendarHeight = Array.prototype.reduce.call(self.calendarContainer.children, (function (acc, child) { return acc + child.offsetHeight; }), 0), calendarWidth = self.calendarContainer.offsetWidth, configPos = self.config.position.split(" "), configPosVertical = configPos[0], configPosHorizontal = configPos.length > 1 ? configPos[1] : null, inputBounds = positionElement.getBoundingClientRect(), distanceFromBottom = window.innerHeight - inputBounds.bottom, showOnTop = configPosVertical === "above" ||
                (configPosVertical !== "below" &&
                    distanceFromBottom < calendarHeight &&
                    inputBounds.top > calendarHeight);
            var top = window.pageYOffset +
                inputBounds.top +
                (!showOnTop ? positionElement.offsetHeight + 2 : -calendarHeight - 2);
            toggleClass(self.calendarContainer, "arrowTop", !showOnTop);
            toggleClass(self.calendarContainer, "arrowBottom", showOnTop);
            if (self.config.inline)
                return;
            var left = window.pageXOffset +
                inputBounds.left -
                (configPosHorizontal != null && configPosHorizontal === "center"
                    ? (calendarWidth - inputBounds.width) / 2
                    : 0);
            var right = window.document.body.offsetWidth - (window.pageXOffset + inputBounds.right);
            var rightMost = left + calendarWidth > window.document.body.offsetWidth;
            var centerMost = right + calendarWidth > window.document.body.offsetWidth;
            toggleClass(self.calendarContainer, "rightMost", rightMost);
            if (self.config.static)
                return;
            self.calendarContainer.style.top = top + "px";
            if (!rightMost) {
                self.calendarContainer.style.left = left + "px";
                self.calendarContainer.style.right = "auto";
            }
            else if (!centerMost) {
                self.calendarContainer.style.left = "auto";
                self.calendarContainer.style.right = right + "px";
            }
            else {
                var doc = document.styleSheets[0];
                // some testing environments don't have css support
                if (doc === undefined)
                    return;
                var bodyWidth = window.document.body.offsetWidth;
                var centerLeft = Math.max(0, bodyWidth / 2 - calendarWidth / 2);
                var centerBefore = ".flatpickr-calendar.centerMost:before";
                var centerAfter = ".flatpickr-calendar.centerMost:after";
                var centerIndex = doc.cssRules.length;
                var centerStyle = "{left:" + inputBounds.left + "px;right:auto;}";
                toggleClass(self.calendarContainer, "rightMost", false);
                toggleClass(self.calendarContainer, "centerMost", true);
                doc.insertRule(centerBefore + "," + centerAfter + centerStyle, centerIndex);
                self.calendarContainer.style.left = centerLeft + "px";
                self.calendarContainer.style.right = "auto";
            }
        }
        function redraw() {
            if (self.config.noCalendar || self.isMobile)
                return;
            updateNavigationCurrentMonth();
            buildDays();
        }
        function focusAndClose() {
            self._input.focus();
            if (window.navigator.userAgent.indexOf("MSIE") !== -1 ||
                navigator.msMaxTouchPoints !== undefined) {
                // hack - bugs in the way IE handles focus keeps the calendar open
                setTimeout(self.close, 0);
            }
            else {
                self.close();
            }
        }
        function selectDate(e) {
            e.preventDefault();
            e.stopPropagation();
            var isSelectable = function (day) {
                return day.classList &&
                    day.classList.contains("flatpickr-day") &&
                    !day.classList.contains("flatpickr-disabled") &&
                    !day.classList.contains("notAllowed");
            };
            var t = findParent(e.target, isSelectable);
            if (t === undefined)
                return;
            var target = t;
            var selectedDate = (self.latestSelectedDateObj = new Date(target.dateObj.getTime()));
            var shouldChangeMonth = (selectedDate.getMonth() < self.currentMonth ||
                selectedDate.getMonth() >
                    self.currentMonth + self.config.showMonths - 1) &&
                self.config.mode !== "range";
            self.selectedDateElem = target;
            if (self.config.mode === "single")
                self.selectedDates = [selectedDate];
            else if (self.config.mode === "multiple") {
                var selectedIndex = isDateSelected(selectedDate);
                if (selectedIndex)
                    self.selectedDates.splice(parseInt(selectedIndex), 1);
                else
                    self.selectedDates.push(selectedDate);
            }
            else if (self.config.mode === "range") {
                if (self.selectedDates.length === 2) {
                    self.clear(false, false);
                }
                self.latestSelectedDateObj = selectedDate;
                self.selectedDates.push(selectedDate);
                // unless selecting same date twice, sort ascendingly
                if (compareDates(selectedDate, self.selectedDates[0], true) !== 0)
                    self.selectedDates.sort(function (a, b) { return a.getTime() - b.getTime(); });
            }
            setHoursFromInputs();
            if (shouldChangeMonth) {
                var isNewYear = self.currentYear !== selectedDate.getFullYear();
                self.currentYear = selectedDate.getFullYear();
                self.currentMonth = selectedDate.getMonth();
                if (isNewYear) {
                    triggerEvent("onYearChange");
                    buildMonthSwitch();
                }
                triggerEvent("onMonthChange");
            }
            updateNavigationCurrentMonth();
            buildDays();
            updateValue();
            if (self.config.enableTime)
                setTimeout(function () { return (self.showTimeInput = true); }, 50);
            // maintain focus
            if (!shouldChangeMonth &&
                self.config.mode !== "range" &&
                self.config.showMonths === 1)
                focusOnDayElem(target);
            else if (self.selectedDateElem !== undefined &&
                self.hourElement === undefined) {
                self.selectedDateElem && self.selectedDateElem.focus();
            }
            if (self.hourElement !== undefined)
                self.hourElement !== undefined && self.hourElement.focus();
            if (self.config.closeOnSelect) {
                var single = self.config.mode === "single" && !self.config.enableTime;
                var range = self.config.mode === "range" &&
                    self.selectedDates.length === 2 &&
                    !self.config.enableTime;
                if (single || range) {
                    focusAndClose();
                }
            }
            triggerChange();
        }
        var CALLBACKS = {
            locale: [setupLocale, updateWeekdays],
            showMonths: [buildMonths, setCalendarWidth, buildWeekdays],
            minDate: [jumpToDate],
            maxDate: [jumpToDate]
        };
        function set(option, value) {
            if (option !== null && typeof option === "object") {
                Object.assign(self.config, option);
                for (var key in option) {
                    if (CALLBACKS[key] !== undefined)
                        CALLBACKS[key].forEach(function (x) { return x(); });
                }
            }
            else {
                self.config[option] = value;
                if (CALLBACKS[option] !== undefined)
                    CALLBACKS[option].forEach(function (x) { return x(); });
                else if (HOOKS.indexOf(option) > -1)
                    self.config[option] = arrayify(value);
            }
            self.redraw();
            updateValue(false);
        }
        function setSelectedDate(inputDate, format) {
            var dates = [];
            if (inputDate instanceof Array)
                dates = inputDate.map(function (d) { return self.parseDate(d, format); });
            else if (inputDate instanceof Date || typeof inputDate === "number")
                dates = [self.parseDate(inputDate, format)];
            else if (typeof inputDate === "string") {
                switch (self.config.mode) {
                    case "single":
                    case "time":
                        dates = [self.parseDate(inputDate, format)];
                        break;
                    case "multiple":
                        dates = inputDate
                            .split(self.config.conjunction)
                            .map(function (date) { return self.parseDate(date, format); });
                        break;
                    case "range":
                        dates = inputDate
                            .split(self.l10n.rangeSeparator)
                            .map(function (date) { return self.parseDate(date, format); });
                        break;
                }
            }
            else
                self.config.errorHandler(new Error("Invalid date supplied: " + JSON.stringify(inputDate)));
            self.selectedDates = dates.filter(function (d) { return d instanceof Date && isEnabled(d, false); });
            if (self.config.mode === "range")
                self.selectedDates.sort(function (a, b) { return a.getTime() - b.getTime(); });
        }
        function setDate(date, triggerChange, format) {
            if (triggerChange === void 0) { triggerChange = false; }
            if (format === void 0) { format = self.config.dateFormat; }
            if ((date !== 0 && !date) || (date instanceof Array && date.length === 0))
                return self.clear(triggerChange);
            setSelectedDate(date, format);
            self.showTimeInput = self.selectedDates.length > 0;
            self.latestSelectedDateObj =
                self.selectedDates[self.selectedDates.length - 1];
            self.redraw();
            jumpToDate();
            setHoursFromDate();
            if (self.selectedDates.length === 0) {
                self.clear(false);
            }
            updateValue(triggerChange);
            if (triggerChange)
                triggerEvent("onChange");
        }
        function parseDateRules(arr) {
            return arr
                .slice()
                .map(function (rule) {
                if (typeof rule === "string" ||
                    typeof rule === "number" ||
                    rule instanceof Date) {
                    return self.parseDate(rule, undefined, true);
                }
                else if (rule &&
                    typeof rule === "object" &&
                    rule.from &&
                    rule.to)
                    return {
                        from: self.parseDate(rule.from, undefined),
                        to: self.parseDate(rule.to, undefined)
                    };
                return rule;
            })
                .filter(function (x) { return x; }); // remove falsy values
        }
        function setupDates() {
            self.selectedDates = [];
            self.now = self.parseDate(self.config.now) || new Date();
            // Workaround IE11 setting placeholder as the input's value
            var preloadedDate = self.config.defaultDate ||
                ((self.input.nodeName === "INPUT" ||
                    self.input.nodeName === "TEXTAREA") &&
                    self.input.placeholder &&
                    self.input.value === self.input.placeholder
                    ? null
                    : self.input.value);
            if (preloadedDate)
                setSelectedDate(preloadedDate, self.config.dateFormat);
            self._initialDate =
                self.selectedDates.length > 0
                    ? self.selectedDates[0]
                    : self.config.minDate &&
                        self.config.minDate.getTime() > self.now.getTime()
                        ? self.config.minDate
                        : self.config.maxDate &&
                            self.config.maxDate.getTime() < self.now.getTime()
                            ? self.config.maxDate
                            : self.now;
            self.currentYear = self._initialDate.getFullYear();
            self.currentMonth = self._initialDate.getMonth();
            if (self.selectedDates.length > 0)
                self.latestSelectedDateObj = self.selectedDates[0];
            if (self.config.minTime !== undefined)
                self.config.minTime = self.parseDate(self.config.minTime, "H:i");
            if (self.config.maxTime !== undefined)
                self.config.maxTime = self.parseDate(self.config.maxTime, "H:i");
            self.minDateHasTime =
                !!self.config.minDate &&
                    (self.config.minDate.getHours() > 0 ||
                        self.config.minDate.getMinutes() > 0 ||
                        self.config.minDate.getSeconds() > 0);
            self.maxDateHasTime =
                !!self.config.maxDate &&
                    (self.config.maxDate.getHours() > 0 ||
                        self.config.maxDate.getMinutes() > 0 ||
                        self.config.maxDate.getSeconds() > 0);
            Object.defineProperty(self, "showTimeInput", {
                get: function () { return self._showTimeInput; },
                set: function (bool) {
                    self._showTimeInput = bool;
                    if (self.calendarContainer)
                        toggleClass(self.calendarContainer, "showTimeInput", bool);
                    self.isOpen && positionCalendar();
                }
            });
        }
        function setupInputs() {
            self.input = self.config.wrap
                ? element.querySelector("[data-input]")
                : element;
            /* istanbul ignore next */
            if (!self.input) {
                self.config.errorHandler(new Error("Invalid input element specified"));
                return;
            }
            // hack: store previous type to restore it after destroy()
            self.input._type = self.input.type;
            self.input.type = "text";
            self.input.classList.add("flatpickr-input");
            self._input = self.input;
            if (self.config.altInput) {
                // replicate self.element
                self.altInput = createElement(self.input.nodeName, self.config.altInputClass);
                self._input = self.altInput;
                self.altInput.placeholder = self.input.placeholder;
                self.altInput.disabled = self.input.disabled;
                self.altInput.required = self.input.required;
                self.altInput.tabIndex = self.input.tabIndex;
                self.altInput.type = "text";
                self.input.setAttribute("type", "hidden");
                if (!self.config.static && self.input.parentNode)
                    self.input.parentNode.insertBefore(self.altInput, self.input.nextSibling);
            }
            if (!self.config.allowInput)
                self._input.setAttribute("readonly", "readonly");
            self._positionElement = self.config.positionElement || self._input;
        }
        function setupMobile() {
            var inputType = self.config.enableTime
                ? self.config.noCalendar
                    ? "time"
                    : "datetime-local"
                : "date";
            self.mobileInput = createElement("input", self.input.className + " flatpickr-mobile");
            self.mobileInput.step = self.input.getAttribute("step") || "any";
            self.mobileInput.tabIndex = 1;
            self.mobileInput.type = inputType;
            self.mobileInput.disabled = self.input.disabled;
            self.mobileInput.required = self.input.required;
            self.mobileInput.placeholder = self.input.placeholder;
            self.mobileFormatStr =
                inputType === "datetime-local"
                    ? "Y-m-d\\TH:i:S"
                    : inputType === "date"
                        ? "Y-m-d"
                        : "H:i:S";
            if (self.selectedDates.length > 0) {
                self.mobileInput.defaultValue = self.mobileInput.value = self.formatDate(self.selectedDates[0], self.mobileFormatStr);
            }
            if (self.config.minDate)
                self.mobileInput.min = self.formatDate(self.config.minDate, "Y-m-d");
            if (self.config.maxDate)
                self.mobileInput.max = self.formatDate(self.config.maxDate, "Y-m-d");
            self.input.type = "hidden";
            if (self.altInput !== undefined)
                self.altInput.type = "hidden";
            try {
                if (self.input.parentNode)
                    self.input.parentNode.insertBefore(self.mobileInput, self.input.nextSibling);
            }
            catch (_a) { }
            bind(self.mobileInput, "change", function (e) {
                self.setDate(e.target.value, false, self.mobileFormatStr);
                triggerEvent("onChange");
                triggerEvent("onClose");
            });
        }
        function toggle(e) {
            if (self.isOpen === true)
                return self.close();
            self.open(e);
        }
        function triggerEvent(event, data) {
            // If the instance has been destroyed already, all hooks have been removed
            if (self.config === undefined)
                return;
            var hooks = self.config[event];
            if (hooks !== undefined && hooks.length > 0) {
                for (var i = 0; hooks[i] && i < hooks.length; i++)
                    hooks[i](self.selectedDates, self.input.value, self, data);
            }
            if (event === "onChange") {
                self.input.dispatchEvent(createEvent("change"));
                // many front-end frameworks bind to the input event
                self.input.dispatchEvent(createEvent("input"));
            }
        }
        function createEvent(name) {
            var e = document.createEvent("Event");
            e.initEvent(name, true, true);
            return e;
        }
        function isDateSelected(date) {
            for (var i = 0; i < self.selectedDates.length; i++) {
                if (compareDates(self.selectedDates[i], date) === 0)
                    return "" + i;
            }
            return false;
        }
        function isDateInRange(date) {
            if (self.config.mode !== "range" || self.selectedDates.length < 2)
                return false;
            return (compareDates(date, self.selectedDates[0]) >= 0 &&
                compareDates(date, self.selectedDates[1]) <= 0);
        }
        function updateNavigationCurrentMonth() {
            if (self.config.noCalendar || self.isMobile || !self.monthNav)
                return;
            self.yearElements.forEach(function (yearElement, i) {
                var d = new Date(self.currentYear, self.currentMonth, 1);
                d.setMonth(self.currentMonth + i);
                if (self.config.showMonths > 1 ||
                    self.config.monthSelectorType === "static") {
                    self.monthElements[i].textContent =
                        monthToStr(d.getMonth(), self.config.shorthandCurrentMonth, self.l10n) + " ";
                }
                else {
                    self.monthsDropdownContainer.value = d.getMonth().toString();
                }
                yearElement.value = d.getFullYear().toString();
            });
            self._hidePrevMonthArrow =
                self.config.minDate !== undefined &&
                    (self.currentYear === self.config.minDate.getFullYear()
                        ? self.currentMonth <= self.config.minDate.getMonth()
                        : self.currentYear < self.config.minDate.getFullYear());
            self._hideNextMonthArrow =
                self.config.maxDate !== undefined &&
                    (self.currentYear === self.config.maxDate.getFullYear()
                        ? self.currentMonth + 1 > self.config.maxDate.getMonth()
                        : self.currentYear > self.config.maxDate.getFullYear());
        }
        function getDateStr(format) {
            return self.selectedDates
                .map(function (dObj) { return self.formatDate(dObj, format); })
                .filter(function (d, i, arr) {
                return self.config.mode !== "range" ||
                    self.config.enableTime ||
                    arr.indexOf(d) === i;
            })
                .join(self.config.mode !== "range"
                ? self.config.conjunction
                : self.l10n.rangeSeparator);
        }
        /**
         * Updates the values of inputs associated with the calendar
         */
        function updateValue(triggerChange) {
            if (triggerChange === void 0) { triggerChange = true; }
            if (self.mobileInput !== undefined && self.mobileFormatStr) {
                self.mobileInput.value =
                    self.latestSelectedDateObj !== undefined
                        ? self.formatDate(self.latestSelectedDateObj, self.mobileFormatStr)
                        : "";
            }
            self.input.value = getDateStr(self.config.dateFormat);
            if (self.altInput !== undefined) {
                self.altInput.value = getDateStr(self.config.altFormat);
            }
            if (triggerChange !== false)
                triggerEvent("onValueUpdate");
        }
        function onMonthNavClick(e) {
            var isPrevMonth = self.prevMonthNav.contains(e.target);
            var isNextMonth = self.nextMonthNav.contains(e.target);
            if (isPrevMonth || isNextMonth) {
                changeMonth(isPrevMonth ? -1 : 1);
            }
            else if (self.yearElements.indexOf(e.target) >= 0) {
                e.target.select();
            }
            else if (e.target.classList.contains("arrowUp")) {
                self.changeYear(self.currentYear + 1);
            }
            else if (e.target.classList.contains("arrowDown")) {
                self.changeYear(self.currentYear - 1);
            }
        }
        function timeWrapper(e) {
            e.preventDefault();
            var isKeyDown = e.type === "keydown", input = e.target;
            if (self.amPM !== undefined && e.target === self.amPM) {
                self.amPM.textContent =
                    self.l10n.amPM[int(self.amPM.textContent === self.l10n.amPM[0])];
            }
            var min = parseFloat(input.getAttribute("min")), max = parseFloat(input.getAttribute("max")), step = parseFloat(input.getAttribute("step")), curValue = parseInt(input.value, 10), delta = e.delta ||
                (isKeyDown ? (e.which === 38 ? 1 : -1) : 0);
            var newValue = curValue + step * delta;
            if (typeof input.value !== "undefined" && input.value.length === 2) {
                var isHourElem = input === self.hourElement, isMinuteElem = input === self.minuteElement;
                if (newValue < min) {
                    newValue =
                        max +
                            newValue +
                            int(!isHourElem) +
                            (int(isHourElem) && int(!self.amPM));
                    if (isMinuteElem)
                        incrementNumInput(undefined, -1, self.hourElement);
                }
                else if (newValue > max) {
                    newValue =
                        input === self.hourElement ? newValue - max - int(!self.amPM) : min;
                    if (isMinuteElem)
                        incrementNumInput(undefined, 1, self.hourElement);
                }
                if (self.amPM &&
                    isHourElem &&
                    (step === 1
                        ? newValue + curValue === 23
                        : Math.abs(newValue - curValue) > step)) {
                    self.amPM.textContent =
                        self.l10n.amPM[int(self.amPM.textContent === self.l10n.amPM[0])];
                }
                input.value = pad(newValue);
            }
        }
        init();
        return self;
    }
    /* istanbul ignore next */
    function _flatpickr(nodeList, config) {
        // static list
        var nodes = Array.prototype.slice
            .call(nodeList)
            .filter(function (x) { return x instanceof HTMLElement; });
        var instances = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            try {
                if (node.getAttribute("data-fp-omit") !== null)
                    continue;
                if (node._flatpickr !== undefined) {
                    node._flatpickr.destroy();
                    node._flatpickr = undefined;
                }
                node._flatpickr = FlatpickrInstance(node, config || {});
                instances.push(node._flatpickr);
            }
            catch (e) {
                console.error(e);
            }
        }
        return instances.length === 1 ? instances[0] : instances;
    }
    /* istanbul ignore next */
    if (typeof HTMLElement !== "undefined" &&
        typeof HTMLCollection !== "undefined" &&
        typeof NodeList !== "undefined") {
        // browser env
        HTMLCollection.prototype.flatpickr = NodeList.prototype.flatpickr = function (config) {
            return _flatpickr(this, config);
        };
        HTMLElement.prototype.flatpickr = function (config) {
            return _flatpickr([this], config);
        };
    }
    /* istanbul ignore next */
    var flatpickr = function (selector, config) {
        if (typeof selector === "string") {
            return _flatpickr(window.document.querySelectorAll(selector), config);
        }
        else if (selector instanceof Node) {
            return _flatpickr([selector], config);
        }
        else {
            return _flatpickr(selector, config);
        }
    };
    /* istanbul ignore next */
    flatpickr.defaultConfig = {};
    flatpickr.l10ns = {
        en: __assign({}, english),
        "default": __assign({}, english)
    };
    flatpickr.localize = function (l10n) {
        flatpickr.l10ns["default"] = __assign({}, flatpickr.l10ns["default"], l10n);
    };
    flatpickr.setDefaults = function (config) {
        flatpickr.defaultConfig = __assign({}, flatpickr.defaultConfig, config);
    };
    flatpickr.parseDate = createDateParser({});
    flatpickr.formatDate = createDateFormatter({});
    flatpickr.compareDates = compareDates;
    /* istanbul ignore next */
    if (typeof jQuery !== "undefined" && typeof jQuery.fn !== "undefined") {
        jQuery.fn.flatpickr = function (config) {
            return _flatpickr(this, config);
        };
    }
    // eslint-disable-next-line @typescript-eslint/camelcase
    Date.prototype.fp_incr = function (days) {
        return new Date(this.getFullYear(), this.getMonth(), this.getDate() + (typeof days === "string" ? parseInt(days, 10) : days));
    };
    if (typeof window !== "undefined") {
        window.flatpickr = flatpickr;
    }

    return flatpickr;

}));
});

/**
 * @property {flatpickr} flatpickr
 */

class DatePicker extends HTMLInputElement {
  connectedCallback() {
    this.flatpickr = flatpickr(this, {
      locale: {
        firstDayOfWeek: 1,
        weekdays: {
          shorthand: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
          longhand: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
        },
        months: {
          shorthand: ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'],
          longhand: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
        },

        ordinal(nth) {
          if (nth > 1) {
            return '';
          }

          return 'er';
        },

        rangeSeparator: ' au ',
        weekAbbreviation: 'Sem',
        scrollTitle: 'Défiler pour augmenter la valeur',
        toggleTitle: 'Cliquer pour basculer',
        time_24hr: true
      },
      altFormat: 'd F Y H:i',
      dateFormat: 'Y-m-d H:i:s',
      altInput: true,
      enableTime: true,
      defaultHour: this.getAttribute('hour')
    });
  }

  disconnectedCallback() {
    this.flatpickr.destroy();
  }

}

/**
 * @param {string} endpoint
 * @param {string} search
 */

function getItems(endpoint, search) {
  return async function () {
    const response = await fetch(`${endpoint}/${search}`);

    if (response.status >= 200 && response.status < 300) {
      return await response.json();
    }

    return [];
  };
}
/**
 * @property {number|null} timer
 * @property {choices} Choices
 * @property {string} endpoint
 */


class UserSelect extends HTMLSelectElement {
  connectedCallback() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      return;
    }

    this.endpoint = this.getAttribute('endpoint');

    if (this.endpoint === null) {
      console.error("Impossible de monter l'élément user-select, endpoint n'est pas définit");
      return;
    }

    const onSearch = debounce(this.onSearch.bind(this), 1000);
    this.choices = new Choices(this);
    this.addEventListener('search', onSearch);
  }

  disconnectedCallback() {
    this.timer = window.setTimeout(function () {
      if (this.choices) {
        this.choices.destroy();
      }
    }, 500);
  }

  onSearch(e) {
    const search = e.detail.value;

    if (search.length > 2) {
      this.choices.setChoices(getItems(this.endpoint, search), 'id', 'username', true);
    }
  }

}

const ko = Math.pow(2, 10);

function ceil(n, decimals) {
  return Math.ceil(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
/**
 * Convertit une taille de fichier en valeur humaine
 * @param {string} size
 */


function human(size) {
  let k = size / ko;
  let unit = 'k';

  if (k > ko) {
    k = k / ko;
    unit = 'M';
  }

  k = ceil(k, k > 10 ? 0 : 1);
  return `${k}${unit}`;
}

const DS = '/';
/**
 * Représentation d'un dossier
 * @typedef {{folder: string, count: number, children: Folder[], path: string}} Folder
 */

/**
 * Retour d'API
 * @typedef {{path: string, count: number}} Path
 */

/**
 * Normalize la structure des dossiers en renvoyant un arbre
 *
 * @param {Path[]} paths
 * @return {Folder[]}
 */

function pathsToTree(paths) {
  function pathToObject(path, count, relativePath) {
    if (folderMap[relativePath]) {
      folderMap[relativePath].count += count;
      return folderMap[relativePath];
    }

    const folder = {
      folder: path,
      count,
      path: relativePath,
      children: []
    };
    folderMap[relativePath] = folder;
    return folder;
  }

  const folderMap = {};
  return uniq(paths.map(p => {
    if (p.path.includes('/')) {
      const parts = p.path.split('/');
      const folder = pathToObject(parts[0], p.count, parts[0]);
      let parent = folder;

      for (let i = 1; i < parts.length; i++) {
        const child = pathToObject(parts[i], p.count, parts.slice(0, i + 1).join(DS));
        if (!parent.children.includes(child)) parent.children.push(child);
        parent = child;
      }

      return folder;
    }

    return pathToObject(p.path, p.count, p.path);
  }));
}

function uniq(arr) {
  return arr.filter((value, index) => arr.indexOf(value) === index);
}

/**
 * @param {object} obj
 * @return {URLSearchParams}
 */
function objToSearchParams(obj) {
  if (obj === undefined || obj === null) {
    return new URLSearchParams();
  }

  const params = new URLSearchParams();
  Object.keys(obj).forEach(k => {
    params.append(k, obj[k]);
  });
  return params;
}

/**
 * Fichier (retour d'api)
 * @typedef {{id: number, createdAt: number, name: string, size: number, url: string}} ApiFile
 */

function FileManager({
  dragOver,
  apiEndpoint,
  onSelectFile
}) {
  const searchInput = h$1(null);
  const [folders, setFolders] = m$1(null);
  const [files, setFiles] = m$1(null);
  const [currentFolder, setCurrentFolder] = m$1(null);

  const handleNewfile = e => {
    console.log('----', e);
    setFiles(files => [e.detail, ...files]);
  };

  const handleSearch = e => {
    e.preventDefault();
    loadFiles({
      q: searchInput.current.value
    });
  };

  const handleSelectFolder = folder => {
    if (currentFolder === folder) {
      return;
    }

    setCurrentFolder(folder);

    if (folder.children.length === 0) {
      loadFiles({
        path: folder.path
      });
    }
  };

  const handleDelete = async file => {
    await jsonFetch(`${apiEndpoint}/${file.id}`, {
      method: 'DELETE'
    });
    setFiles(files => files.filter(f => file !== f));
  };

  const loadFiles = async params => {
    setFiles(null);
    const url = new URL(`${apiEndpoint}/files`, location.href);
    url.search = objToSearchParams(params);
    const files = await jsonFetch(url);
    setFiles(files);
  };

  useAsyncEffect(async () => {
    const folders = await jsonFetch(`${apiEndpoint}/folders`);
    setFolders(pathsToTree(folders));
  }, []);
  useAsyncEffect(async () => {
    const files = await jsonFetch(`${apiEndpoint}/files`);
    setFiles(files);
  }, []);
  return v("div", {
    className: classNames('filemanager', dragOver && 'has-dragover')
  }, v("input", {
    type: "text",
    is: "input-attachment",
    onattachment: handleNewfile
  }), v("aside", null, v("form", {
    onSubmit: handleSearch,
    className: "form-group"
  }, v("label", {
    htmlFor: "file-search",
    className: "bloc__title"
  }, "Rechercher"), v("input", {
    type: "search",
    placeholder: "e.g. image.png",
    id: "file-search",
    name: "q",
    ref: searchInput
  })), v("hr", null), v("div", {
    className: "bloc"
  }, v("div", {
    className: "bloc__title"
  }, "Dossiers"), v("div", {
    className: "hierarchy"
  }, folders === null ? v("div", {
    className: "loader"
  }, v(Loader$1, null)) : folders.map(folder => v(Folder, {
    key: folder,
    folder: folder,
    currentFolder: currentFolder,
    onSelect: handleSelectFolder
  }))))), v("main", {
    className: "relative"
  }, files === null ? v("div", {
    className: "loader"
  }, v(Loader$1, null)) : v("table", {
    cellSpacing: "0"
  }, v("thead", null, v("tr", null, v("th", {
    className: "th-image"
  }, "Image"), v("th", null, "Nom"), v("th", null, "Taille"), v("th", null, "Actions"))), v("tbody", null, files.map(file => v(File, {
    key: file,
    file: file,
    onDelete: handleDelete,
    onSelect: onSelectFile
  }))))));
}
/**
 * Représente un fichier
 *
 * @param {{file: ApiFile, onSelect: function}} props
 */

function File({
  file,
  onSelect,
  onDelete
}) {
  return v("tr", null, v("td", {
    onClick: () => onSelect(file)
  }, v("img", {
    src: file.url,
    alt: file.alt,
    loading: "lazy"
  })), v("td", {
    onClick: () => onSelect(file)
  }, file.filename), v("td", null, human(file.filesize)), v("td", null, v("button", {
    class: "delete",
    onClick: () => onDelete(file)
  }, v("svg", {
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 16 16"
  }, v("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M1 0h14c.6 0 1 .4 1 1v14c0 .6-.4 1-1 1H1c-.6 0-1-.4-1-1V1c0-.6.4-1 1-1zm9.1 11.5l1.4-1.4L9.4 8l2.1-2.1-1.4-1.4L8 6.6 5.9 4.5 4.5 5.9 6.6 8l-2.1 2.1 1.4 1.4L8 9.4l2.1 2.1z",
    fill: "currentColor"
  })))));
}
/**
 * Représente un dossier
 */


function Folder({
  folder,
  onSelect,
  currentFolder
}) {
  const isSelected = currentFolder && currentFolder.path.startsWith(folder.path);
  const hasChildren = folder.children && folder.children.length > 0;
  return v(p, null, v("div", {
    className: classNames('hierarchy__item', hasChildren ? 'has-children' : 'is-deeper', isSelected && 'is-selected'),
    onClick: () => onSelect(folder)
  }, v("svg", {
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 9 10",
    class: "arrow"
  }, v("path", {
    d: "M1.196.073A.47.47 0 00.737.048.414.414 0 00.5.417v9.166c0 .155.092.297.238.369a.459.459 0 00.458-.025l7.111-4.584A.41.41 0 008.5 5a.41.41 0 00-.193-.343L1.196.073z",
    fill: "currentColor"
  })), v("svg", {
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 17 16"
  }, v("path", {
    d: "M15.8 7.4c-.2-.2-.5-.4-.8-.4H4c-.4 0-.8.2-.9.6l-3 7c-.2.6 0 1.4.9 1.4h11c.4 0 .8-.2.9-.6l3-7c.2-.3.1-.7-.1-1z",
    fill: "currentColor"
  }), v("path", {
    d: "M1.2 6.8C1.7 5.7 2.8 5 4 5h9V3c0-.6-.4-1-1-1H6.4L4.7.3C4.5.1 4.3 0 4 0H1C.4 0 0 .4 0 1v8.7l1.2-2.9z",
    fill: "currentColor"
  })), folder.folder, v("span", null, folder.count)), isSelected && folder.children.map(child => v(Folder, {
    key: folder,
    folder: child,
    onSelect: onSelect,
    currentFolder: currentFolder
  })));
}

/**
 * @property {number|null} timer
 * @property {choices} Choices
 * @property {string} endpoint
 * @property {bool} overwrite L'envoie d'une nouvelle image écrase la précédente
 */

class InputAttachment extends HTMLInputElement {
  connectedCallback() {
    const preview = this.getAttribute('preview');
    this.insertAdjacentHTML('afterend', `
<div class="input-attachment">
<div class="input-attachment__preview" style="background-image:url(${preview})"></div>
</div>
`);
    this.style.display = 'none';
    this.container = this.parentElement.querySelector('.input-attachment');
    this.container.addEventListener('dragenter', this.onDragEnter.bind(this));
    this.container.addEventListener('dragleave', this.ondragleave.bind(this));
    this.container.addEventListener('dragover', this.onDragOver);
    this.container.addEventListener('drop', this.onDrop.bind(this));
    this.container.addEventListener('click', this.onClick.bind(this));
    this.preview = this.container.querySelector('.input-attachment__preview');
    this.overwrite = this.getAttribute('overwrite') !== null;
  }

  onDragEnter(e) {
    e.preventDefault();
    this.container.classList.add('is-hovered');
  }

  ondragleave(e) {
    e.preventDefault();
    this.container.classList.remove('is-hovered');
  }

  onDragOver(e) {
    e.preventDefault();
  }

  async onDrop(e) {
    e.preventDefault();
    this.container.classList.add('is-hovered');
    const loader = new SpinningDots();
    loader.classList.add('input-attachment__loader');
    this.container.appendChild(loader);
    const files = e.dataTransfer.files;
    if (files.length === 0) return false;
    const data = new FormData();
    data.append('file', files[0]);
    data.append('_token', document.querySelector('meta[name="csrf-token"]').getAttribute('content'));
    let url = '/admin/attachment';

    if (this.attachmentId !== '' && this.overwrite) {
      url = `${url}/${this.attachmentId}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: data
    });
    const responseData = await response.json();

    if (response.ok) {
      this.setAttachment(responseData);
    } else {
      const alert = new Alert({
        message: responseData.error
      });
      document.querySelector('.dashboard').appendChild(alert);
    }

    this.container.removeChild(loader);
    this.container.classList.remove('is-hovered');
  }

  onClick(e) {
    // TODO : Prévoir une modale
    e.preventDefault();
    const modal = document.createElement('modal-box');
    const fm = document.createElement('file-manager');
    modal.appendChild(fm);
    fm.addEventListener('file', e => {
      this.setAttachment(e.detail);
      modal.close();
    });
    document.body.appendChild(modal);
  }

  setAttachment(attachment) {
    this.preview.style.backgroundImage = `url(${attachment.url})`;
    this.value = attachment.id;
    const changeEvent = document.createEvent('HTMLEvents');
    changeEvent.initEvent('change', false, true);
    this.dispatchEvent(changeEvent);
    this.dispatchEvent(new CustomEvent('attachment', {
      detail: attachment
    }));
  }
  /**
   * @return {string}
   */


  get attachmentId() {
    return this.value;
  }

}

class FileManager$1 extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({
      mode: 'closed'
    });
    this.root.innerHTML = this.style();
    this.addEventListener('dragenter', this.onDragEnter.bind(this));
    this.addEventListener('dragleave', this.ondragleave.bind(this));
    this.addEventListener('dragover', this.onDragOver);
    this.addEventListener('drop', this.onDrop.bind(this));
    M(v(FileManager, {
      apiEndpoint: '/admin/attachment',
      dragOver: false,
      onSelectFile: this.onSelectFile.bind(this)
    }), this.root);
  }
  /**
   * @param {{id: number, createdAt: number, name: string, size: number, url: string}} file
   */


  onSelectFile(file) {
    this.dispatchEvent(new CustomEvent('file', {
      detail: file
    }));
  }

  style() {
    return `<style>
    :host {
      display: block;
      --space: 8px;
      --accent: #457cff;
      --space-4: calc(4 * var(--space));
      --space-3: calc(3 * var(--space));
      --space-2: calc(2 * var(--space));
      --background:
    }
    button {
      cursor: pointer;
      background: transparent;
      border: none;
    }
    ::-webkit-scrollbar {
      width: 5px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
      padding: 1px;
    }

    ::-webkit-scrollbar-thumb {
      background: #c6d0d6;
      border-radius: 4px;
    }

    * {
      box-sizing: border-box;
    }
    a {
      text-decoration: none;
      color: inherit;
    }
    a:hover {
      text-decoration: underline;
    }
    .input-attachment {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      opacity: 0;
      background: var(--accent);
      transition: opacity .3s;
      z-index: 5;
      pointer-events: none;
    }
    .has-dragover .input-attachment {
      opacity: .8;
      pointer-events: auto;
    }
    .filemanager {
      position: relative;
      height: 100%;
      box-shadow: 0 1px 4px rgba(212, 212, 212, 0.2);
      border-radius: 8px;
      border: 1px solid #ebeced;
      background-color: #fefefe;
      font-size: 16px;
      display: grid;
      grid-template-columns: 278px 1fr;
    }
    hr {
      border: none;
      margin-top: var(--space-3);
      margin-bottom: var(--space-3);
      height: 1px;
      background-color: #f0f0f6;
    }
    main {
      padding-top: var(--space-4);
      padding-bottom: var(--space-4);
    }
    aside {
      padding: var(--space-4);
      border-right:1px solid #f0f0f6;
    }
    aside, main {
        overflow: auto;
    }
    input[type=text],
    input[type=search] {
      display: block;
      font-size: 16px;
      padding: 0 var(--space-2);
      width: 100%;
      height: 48px;
      box-shadow: 0 1px 1px rgba(212, 212, 212, 0.2);
      border-radius: 6px;
      border: 1px solid #d7dee1;
      background-color: #fefefe;
    }
    .hierarchy .arrow {
      width: 8px;
      height: 12px;
      margin-right: var(--space-2);
    }
    .bloc__title {
      display: block;
      color: #6f6f85;
      margin-bottom: var(--space-2);
      font-size: 14px;
      font-weight: 300;
    }
    .hierarchy {
        min-height: 150px;
        position: relative;
    }
    .hierarchy svg {
      display: block;
      width: 16px;
      height: 16px;
      margin-right: var(--space);
      color: #c6d0d6;
      transition: color .3s;
    }
    .hierarchy__item {
      display: flex;
      align-items: center;
      font-weight: 500;
      height: 36px;
      margin-left: calc(var(--space) * -1);
      margin-right: calc(var(--space) * -1);
      padding: var(--space);
      border-radius: 6px;
      transition: .3s;
      cursor: pointer;
    }
    .hierarchy__item span {
      display: block;
      padding: 0 5px 0 4px;
      margin-left: 12px;
      height: 16px;
      border-radius: 4px;
      background-color: #c6d0d6;
      font-size: 12px;
      transition: .2s;
      transition-property: background, box-shadow;
      font-weight: 600;
    }
    .hierarchy__item.is-deeper {
      margin-left: var(--space-3);
    }
    .hierarchy__item.is-deeper .arrow {
        opacity: 0;
        width: 0;
    }
    .hierarchy__item:hover {
      background-color:#457cff1A;
      color: var(--accent);
      text-decoration: none;
    }
    .hierarchy__item:hover span {
      color: #FFF;
      box-shadow: 0 1px 3px rgba(106, 106, 106, 0.5);
      background-image: linear-gradient(180deg, #457cff 0%, #366ae6 100%);
    }
    .hierarchy__item:hover svg {
      color: var(--accent);
    }
    .hierarchy__item.is-selected {
      color: #212944;
    }
    .hierarchy__item.is-selected .arrow {
      transform: rotate(90deg);
    }
    .hierarchy__item.is-selected svg {
      color: #212944;
    }
    table {
      width: 100%;
    }
    th:first-child, td:first-child {
      padding-left: var(--space-4)!important;
    }
    th:last-child, td:last-child {
      padding-right: var(--space-4)!important;
      text-align: right;
    }
    th {
      text-align: left;
      padding-bottom: var(--space);
      color: #6f6f85;
      font-size: 14px;
      font-weight: 300;
      border: none;
    }
    th.th-image {
      width: 250px;
    }
    th:last-child {
      text-align: right;
    }
    td {
      border: none;
      padding: calc(1.5 * var(--space)) 0;
      padding-right: var(--space-3);
    }
    td:last-child {
      padding-right: 0;
    }
    td img {
      cursor: pointer;
      object-fit: cover;
      width: 250px;
      height: 100px;
      box-shadow: 0 1px 4px rgba(16, 43, 107, 0.6);
      border-radius: 6px;
    }
    tr:hover td {
      background-color: #f8fafb;
    }
    .delete svg {
      width: 16px;
      height: 16px;
      color: #c6d0d6;
      transition: color .3s;
    }
    .delete:hover svg {
      color: #FB4635;
    }
    .loader {
       position:absolute;
       top: 0;
       left: 0;
       right: 0;
       bottom: 0;
       display: flex;
       align-items: center;
       justify-content: center;
       background: #FFFC;
       color: #6f6f85;
    }
    .loader spinning-dots {
      width: 20px;
      height: 20px;
    }
    </style>`;
  }

  onDragEnter(e) {
    e.stopPropagation();
    e.preventDefault();
    M(v(FileManager, {
      apiEndpoint: '/admin/attachment',
      dragOver: true,
      onSelectFile: this.onSelectFile.bind(this)
    }), this.root);
  }

  ondragleave(e) {
    e.stopPropagation();
    e.preventDefault();
    M(v(FileManager, {
      apiEndpoint: '/admin/attachment',
      dragOver: false,
      onSelectFile: this.onSelectFile.bind(this)
    }), this.root);
  }

  onDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  onDrop() {
    M(v(FileManager, {
      apiEndpoint: '/admin/attachment',
      dragOver: false,
      onSelectFile: this.onSelectFile.bind(this)
    }), this.root);
  }

}

/**
 * Filtre un listener pour ne le lancer que lors d'une pression sur Entrer
 *
 * @param {function(KeyboardEvent)} callback
 * @return {function(KeyboardEvent)}
 */
function enterKeyListener(callback) {
  return function (e) {
    if (e.key === 'Enter') {
      callback(e);
    }
  };
}

/**!
 * Sortable 1.10.2
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _extends$1() {
  _extends$1 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$1.apply(this, arguments);
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

var version = "1.10.2";

function userAgent(pattern) {
  if (typeof window !== 'undefined' && window.navigator) {
    return !!
    /*@__PURE__*/
    navigator.userAgent.match(pattern);
  }
}

var IE11OrLess = userAgent(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i);
var Edge = userAgent(/Edge/i);
var FireFox = userAgent(/firefox/i);
var Safari = userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i);
var IOS = userAgent(/iP(ad|od|hone)/i);
var ChromeForAndroid = userAgent(/chrome/i) && userAgent(/android/i);

var captureMode = {
  capture: false,
  passive: false
};

function on(el, event, fn) {
  el.addEventListener(event, fn, !IE11OrLess && captureMode);
}

function off(el, event, fn) {
  el.removeEventListener(event, fn, !IE11OrLess && captureMode);
}

function matches(
/**HTMLElement*/
el,
/**String*/
selector) {
  if (!selector) return;
  selector[0] === '>' && (selector = selector.substring(1));

  if (el) {
    try {
      if (el.matches) {
        return el.matches(selector);
      } else if (el.msMatchesSelector) {
        return el.msMatchesSelector(selector);
      } else if (el.webkitMatchesSelector) {
        return el.webkitMatchesSelector(selector);
      }
    } catch (_) {
      return false;
    }
  }

  return false;
}

function getParentOrHost(el) {
  return el.host && el !== document && el.host.nodeType ? el.host : el.parentNode;
}

function closest$1(
/**HTMLElement*/
el,
/**String*/
selector,
/**HTMLElement*/
ctx, includeCTX) {
  if (el) {
    ctx = ctx || document;

    do {
      if (selector != null && (selector[0] === '>' ? el.parentNode === ctx && matches(el, selector) : matches(el, selector)) || includeCTX && el === ctx) {
        return el;
      }

      if (el === ctx) break;
      /* jshint boss:true */
    } while (el = getParentOrHost(el));
  }

  return null;
}

var R_SPACE = /\s+/g;

function toggleClass(el, name, state) {
  if (el && name) {
    if (el.classList) {
      el.classList[state ? 'add' : 'remove'](name);
    } else {
      var className = (' ' + el.className + ' ').replace(R_SPACE, ' ').replace(' ' + name + ' ', ' ');
      el.className = (className + (state ? ' ' + name : '')).replace(R_SPACE, ' ');
    }
  }
}

function css(el, prop, val) {
  var style = el && el.style;

  if (style) {
    if (val === void 0) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        val = document.defaultView.getComputedStyle(el, '');
      } else if (el.currentStyle) {
        val = el.currentStyle;
      }

      return prop === void 0 ? val : val[prop];
    } else {
      if (!(prop in style) && prop.indexOf('webkit') === -1) {
        prop = '-webkit-' + prop;
      }

      style[prop] = val + (typeof val === 'string' ? '' : 'px');
    }
  }
}

function matrix(el, selfOnly) {
  var appliedTransforms = '';

  if (typeof el === 'string') {
    appliedTransforms = el;
  } else {
    do {
      var transform = css(el, 'transform');

      if (transform && transform !== 'none') {
        appliedTransforms = transform + ' ' + appliedTransforms;
      }
      /* jshint boss:true */

    } while (!selfOnly && (el = el.parentNode));
  }

  var matrixFn = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  /*jshint -W056 */

  return matrixFn && new matrixFn(appliedTransforms);
}

function find(ctx, tagName, iterator) {
  if (ctx) {
    var list = ctx.getElementsByTagName(tagName),
        i = 0,
        n = list.length;

    if (iterator) {
      for (; i < n; i++) {
        iterator(list[i], i);
      }
    }

    return list;
  }

  return [];
}

function getWindowScrollingElement() {
  var scrollingElement = document.scrollingElement;

  if (scrollingElement) {
    return scrollingElement;
  } else {
    return document.documentElement;
  }
}
/**
 * Returns the "bounding client rect" of given element
 * @param  {HTMLElement} el                       The element whose boundingClientRect is wanted
 * @param  {[Boolean]} relativeToContainingBlock  Whether the rect should be relative to the containing block of (including) the container
 * @param  {[Boolean]} relativeToNonStaticParent  Whether the rect should be relative to the relative parent of (including) the contaienr
 * @param  {[Boolean]} undoScale                  Whether the container's scale() should be undone
 * @param  {[HTMLElement]} container              The parent the element will be placed in
 * @return {Object}                               The boundingClientRect of el, with specified adjustments
 */


function getRect(el, relativeToContainingBlock, relativeToNonStaticParent, undoScale, container) {
  if (!el.getBoundingClientRect && el !== window) return;
  var elRect, top, left, bottom, right, height, width;

  if (el !== window && el !== getWindowScrollingElement()) {
    elRect = el.getBoundingClientRect();
    top = elRect.top;
    left = elRect.left;
    bottom = elRect.bottom;
    right = elRect.right;
    height = elRect.height;
    width = elRect.width;
  } else {
    top = 0;
    left = 0;
    bottom = window.innerHeight;
    right = window.innerWidth;
    height = window.innerHeight;
    width = window.innerWidth;
  }

  if ((relativeToContainingBlock || relativeToNonStaticParent) && el !== window) {
    // Adjust for translate()
    container = container || el.parentNode; // solves #1123 (see: https://stackoverflow.com/a/37953806/6088312)
    // Not needed on <= IE11

    if (!IE11OrLess) {
      do {
        if (container && container.getBoundingClientRect && (css(container, 'transform') !== 'none' || relativeToNonStaticParent && css(container, 'position') !== 'static')) {
          var containerRect = container.getBoundingClientRect(); // Set relative to edges of padding box of container

          top -= containerRect.top + parseInt(css(container, 'border-top-width'));
          left -= containerRect.left + parseInt(css(container, 'border-left-width'));
          bottom = top + elRect.height;
          right = left + elRect.width;
          break;
        }
        /* jshint boss:true */

      } while (container = container.parentNode);
    }
  }

  if (undoScale && el !== window) {
    // Adjust for scale()
    var elMatrix = matrix(container || el),
        scaleX = elMatrix && elMatrix.a,
        scaleY = elMatrix && elMatrix.d;

    if (elMatrix) {
      top /= scaleY;
      left /= scaleX;
      width /= scaleX;
      height /= scaleY;
      bottom = top + height;
      right = left + width;
    }
  }

  return {
    top: top,
    left: left,
    bottom: bottom,
    right: right,
    width: width,
    height: height
  };
}
/**
 * Checks if a side of an element is scrolled past a side of its parents
 * @param  {HTMLElement}  el           The element who's side being scrolled out of view is in question
 * @param  {String}       elSide       Side of the element in question ('top', 'left', 'right', 'bottom')
 * @param  {String}       parentSide   Side of the parent in question ('top', 'left', 'right', 'bottom')
 * @return {HTMLElement}               The parent scroll element that the el's side is scrolled past, or null if there is no such element
 */


function isScrolledPast(el, elSide, parentSide) {
  var parent = getParentAutoScrollElement(el, true),
      elSideVal = getRect(el)[elSide];
  /* jshint boss:true */

  while (parent) {
    var parentSideVal = getRect(parent)[parentSide],
        visible = void 0;

    if (parentSide === 'top' || parentSide === 'left') {
      visible = elSideVal >= parentSideVal;
    } else {
      visible = elSideVal <= parentSideVal;
    }

    if (!visible) return parent;
    if (parent === getWindowScrollingElement()) break;
    parent = getParentAutoScrollElement(parent, false);
  }

  return false;
}
/**
 * Gets nth child of el, ignoring hidden children, sortable's elements (does not ignore clone if it's visible)
 * and non-draggable elements
 * @param  {HTMLElement} el       The parent element
 * @param  {Number} childNum      The index of the child
 * @param  {Object} options       Parent Sortable's options
 * @return {HTMLElement}          The child at index childNum, or null if not found
 */


function getChild(el, childNum, options) {
  var currentChild = 0,
      i = 0,
      children = el.children;

  while (i < children.length) {
    if (children[i].style.display !== 'none' && children[i] !== Sortable.ghost && children[i] !== Sortable.dragged && closest$1(children[i], options.draggable, el, false)) {
      if (currentChild === childNum) {
        return children[i];
      }

      currentChild++;
    }

    i++;
  }

  return null;
}
/**
 * Gets the last child in the el, ignoring ghostEl or invisible elements (clones)
 * @param  {HTMLElement} el       Parent element
 * @param  {selector} selector    Any other elements that should be ignored
 * @return {HTMLElement}          The last child, ignoring ghostEl
 */


function lastChild(el, selector) {
  var last = el.lastElementChild;

  while (last && (last === Sortable.ghost || css(last, 'display') === 'none' || selector && !matches(last, selector))) {
    last = last.previousElementSibling;
  }

  return last || null;
}
/**
 * Returns the index of an element within its parent for a selected set of
 * elements
 * @param  {HTMLElement} el
 * @param  {selector} selector
 * @return {number}
 */


function index(el, selector) {
  var index = 0;

  if (!el || !el.parentNode) {
    return -1;
  }
  /* jshint boss:true */


  while (el = el.previousElementSibling) {
    if (el.nodeName.toUpperCase() !== 'TEMPLATE' && el !== Sortable.clone && (!selector || matches(el, selector))) {
      index++;
    }
  }

  return index;
}
/**
 * Returns the scroll offset of the given element, added with all the scroll offsets of parent elements.
 * The value is returned in real pixels.
 * @param  {HTMLElement} el
 * @return {Array}             Offsets in the format of [left, top]
 */


function getRelativeScrollOffset(el) {
  var offsetLeft = 0,
      offsetTop = 0,
      winScroller = getWindowScrollingElement();

  if (el) {
    do {
      var elMatrix = matrix(el),
          scaleX = elMatrix.a,
          scaleY = elMatrix.d;
      offsetLeft += el.scrollLeft * scaleX;
      offsetTop += el.scrollTop * scaleY;
    } while (el !== winScroller && (el = el.parentNode));
  }

  return [offsetLeft, offsetTop];
}
/**
 * Returns the index of the object within the given array
 * @param  {Array} arr   Array that may or may not hold the object
 * @param  {Object} obj  An object that has a key-value pair unique to and identical to a key-value pair in the object you want to find
 * @return {Number}      The index of the object in the array, or -1
 */


function indexOfObject(arr, obj) {
  for (var i in arr) {
    if (!arr.hasOwnProperty(i)) continue;

    for (var key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] === arr[i][key]) return Number(i);
    }
  }

  return -1;
}

function getParentAutoScrollElement(el, includeSelf) {
  // skip to window
  if (!el || !el.getBoundingClientRect) return getWindowScrollingElement();
  var elem = el;
  var gotSelf = false;

  do {
    // we don't need to get elem css if it isn't even overflowing in the first place (performance)
    if (elem.clientWidth < elem.scrollWidth || elem.clientHeight < elem.scrollHeight) {
      var elemCSS = css(elem);

      if (elem.clientWidth < elem.scrollWidth && (elemCSS.overflowX == 'auto' || elemCSS.overflowX == 'scroll') || elem.clientHeight < elem.scrollHeight && (elemCSS.overflowY == 'auto' || elemCSS.overflowY == 'scroll')) {
        if (!elem.getBoundingClientRect || elem === document.body) return getWindowScrollingElement();
        if (gotSelf || includeSelf) return elem;
        gotSelf = true;
      }
    }
    /* jshint boss:true */

  } while (elem = elem.parentNode);

  return getWindowScrollingElement();
}

function extend(dst, src) {
  if (dst && src) {
    for (var key in src) {
      if (src.hasOwnProperty(key)) {
        dst[key] = src[key];
      }
    }
  }

  return dst;
}

function isRectEqual(rect1, rect2) {
  return Math.round(rect1.top) === Math.round(rect2.top) && Math.round(rect1.left) === Math.round(rect2.left) && Math.round(rect1.height) === Math.round(rect2.height) && Math.round(rect1.width) === Math.round(rect2.width);
}

var _throttleTimeout;

function throttle$1(callback, ms) {
  return function () {
    if (!_throttleTimeout) {
      var args = arguments,
          _this = this;

      if (args.length === 1) {
        callback.call(_this, args[0]);
      } else {
        callback.apply(_this, args);
      }

      _throttleTimeout = setTimeout(function () {
        _throttleTimeout = void 0;
      }, ms);
    }
  };
}

function cancelThrottle() {
  clearTimeout(_throttleTimeout);
  _throttleTimeout = void 0;
}

function scrollBy(el, x, y) {
  el.scrollLeft += x;
  el.scrollTop += y;
}

function clone(el) {
  var Polymer = window.Polymer;
  var $ = window.jQuery || window.Zepto;

  if (Polymer && Polymer.dom) {
    return Polymer.dom(el).cloneNode(true);
  } else if ($) {
    return $(el).clone(true)[0];
  } else {
    return el.cloneNode(true);
  }
}

var expando = 'Sortable' + new Date().getTime();

function AnimationStateManager() {
  var animationStates = [],
      animationCallbackId;
  return {
    captureAnimationState: function captureAnimationState() {
      animationStates = [];
      if (!this.options.animation) return;
      var children = [].slice.call(this.el.children);
      children.forEach(function (child) {
        if (css(child, 'display') === 'none' || child === Sortable.ghost) return;
        animationStates.push({
          target: child,
          rect: getRect(child)
        });

        var fromRect = _objectSpread({}, animationStates[animationStates.length - 1].rect); // If animating: compensate for current animation


        if (child.thisAnimationDuration) {
          var childMatrix = matrix(child, true);

          if (childMatrix) {
            fromRect.top -= childMatrix.f;
            fromRect.left -= childMatrix.e;
          }
        }

        child.fromRect = fromRect;
      });
    },
    addAnimationState: function addAnimationState(state) {
      animationStates.push(state);
    },
    removeAnimationState: function removeAnimationState(target) {
      animationStates.splice(indexOfObject(animationStates, {
        target: target
      }), 1);
    },
    animateAll: function animateAll(callback) {
      var _this = this;

      if (!this.options.animation) {
        clearTimeout(animationCallbackId);
        if (typeof callback === 'function') callback();
        return;
      }

      var animating = false,
          animationTime = 0;
      animationStates.forEach(function (state) {
        var time = 0,
            target = state.target,
            fromRect = target.fromRect,
            toRect = getRect(target),
            prevFromRect = target.prevFromRect,
            prevToRect = target.prevToRect,
            animatingRect = state.rect,
            targetMatrix = matrix(target, true);

        if (targetMatrix) {
          // Compensate for current animation
          toRect.top -= targetMatrix.f;
          toRect.left -= targetMatrix.e;
        }

        target.toRect = toRect;

        if (target.thisAnimationDuration) {
          // Could also check if animatingRect is between fromRect and toRect
          if (isRectEqual(prevFromRect, toRect) && !isRectEqual(fromRect, toRect) && // Make sure animatingRect is on line between toRect & fromRect
          (animatingRect.top - toRect.top) / (animatingRect.left - toRect.left) === (fromRect.top - toRect.top) / (fromRect.left - toRect.left)) {
            // If returning to same place as started from animation and on same axis
            time = calculateRealTime(animatingRect, prevFromRect, prevToRect, _this.options);
          }
        } // if fromRect != toRect: animate


        if (!isRectEqual(toRect, fromRect)) {
          target.prevFromRect = fromRect;
          target.prevToRect = toRect;

          if (!time) {
            time = _this.options.animation;
          }

          _this.animate(target, animatingRect, toRect, time);
        }

        if (time) {
          animating = true;
          animationTime = Math.max(animationTime, time);
          clearTimeout(target.animationResetTimer);
          target.animationResetTimer = setTimeout(function () {
            target.animationTime = 0;
            target.prevFromRect = null;
            target.fromRect = null;
            target.prevToRect = null;
            target.thisAnimationDuration = null;
          }, time);
          target.thisAnimationDuration = time;
        }
      });
      clearTimeout(animationCallbackId);

      if (!animating) {
        if (typeof callback === 'function') callback();
      } else {
        animationCallbackId = setTimeout(function () {
          if (typeof callback === 'function') callback();
        }, animationTime);
      }

      animationStates = [];
    },
    animate: function animate(target, currentRect, toRect, duration) {
      if (duration) {
        css(target, 'transition', '');
        css(target, 'transform', '');
        var elMatrix = matrix(this.el),
            scaleX = elMatrix && elMatrix.a,
            scaleY = elMatrix && elMatrix.d,
            translateX = (currentRect.left - toRect.left) / (scaleX || 1),
            translateY = (currentRect.top - toRect.top) / (scaleY || 1);
        target.animatingX = !!translateX;
        target.animatingY = !!translateY;
        css(target, 'transform', 'translate3d(' + translateX + 'px,' + translateY + 'px,0)');
        repaint(target); // repaint

        css(target, 'transition', 'transform ' + duration + 'ms' + (this.options.easing ? ' ' + this.options.easing : ''));
        css(target, 'transform', 'translate3d(0,0,0)');
        typeof target.animated === 'number' && clearTimeout(target.animated);
        target.animated = setTimeout(function () {
          css(target, 'transition', '');
          css(target, 'transform', '');
          target.animated = false;
          target.animatingX = false;
          target.animatingY = false;
        }, duration);
      }
    }
  };
}

function repaint(target) {
  return target.offsetWidth;
}

function calculateRealTime(animatingRect, fromRect, toRect, options) {
  return Math.sqrt(Math.pow(fromRect.top - animatingRect.top, 2) + Math.pow(fromRect.left - animatingRect.left, 2)) / Math.sqrt(Math.pow(fromRect.top - toRect.top, 2) + Math.pow(fromRect.left - toRect.left, 2)) * options.animation;
}

var plugins = [];
var defaults = {
  initializeByDefault: true
};
var PluginManager = {
  mount: function mount(plugin) {
    // Set default static properties
    for (var option in defaults) {
      if (defaults.hasOwnProperty(option) && !(option in plugin)) {
        plugin[option] = defaults[option];
      }
    }

    plugins.push(plugin);
  },
  pluginEvent: function pluginEvent(eventName, sortable, evt) {
    var _this = this;

    this.eventCanceled = false;

    evt.cancel = function () {
      _this.eventCanceled = true;
    };

    var eventNameGlobal = eventName + 'Global';
    plugins.forEach(function (plugin) {
      if (!sortable[plugin.pluginName]) return; // Fire global events if it exists in this sortable

      if (sortable[plugin.pluginName][eventNameGlobal]) {
        sortable[plugin.pluginName][eventNameGlobal](_objectSpread({
          sortable: sortable
        }, evt));
      } // Only fire plugin event if plugin is enabled in this sortable,
      // and plugin has event defined


      if (sortable.options[plugin.pluginName] && sortable[plugin.pluginName][eventName]) {
        sortable[plugin.pluginName][eventName](_objectSpread({
          sortable: sortable
        }, evt));
      }
    });
  },
  initializePlugins: function initializePlugins(sortable, el, defaults, options) {
    plugins.forEach(function (plugin) {
      var pluginName = plugin.pluginName;
      if (!sortable.options[pluginName] && !plugin.initializeByDefault) return;
      var initialized = new plugin(sortable, el, sortable.options);
      initialized.sortable = sortable;
      initialized.options = sortable.options;
      sortable[pluginName] = initialized; // Add default options from plugin

      _extends$1(defaults, initialized.defaults);
    });

    for (var option in sortable.options) {
      if (!sortable.options.hasOwnProperty(option)) continue;
      var modified = this.modifyOption(sortable, option, sortable.options[option]);

      if (typeof modified !== 'undefined') {
        sortable.options[option] = modified;
      }
    }
  },
  getEventProperties: function getEventProperties(name, sortable) {
    var eventProperties = {};
    plugins.forEach(function (plugin) {
      if (typeof plugin.eventProperties !== 'function') return;

      _extends$1(eventProperties, plugin.eventProperties.call(sortable[plugin.pluginName], name));
    });
    return eventProperties;
  },
  modifyOption: function modifyOption(sortable, name, value) {
    var modifiedValue;
    plugins.forEach(function (plugin) {
      // Plugin must exist on the Sortable
      if (!sortable[plugin.pluginName]) return; // If static option listener exists for this option, call in the context of the Sortable's instance of this plugin

      if (plugin.optionListeners && typeof plugin.optionListeners[name] === 'function') {
        modifiedValue = plugin.optionListeners[name].call(sortable[plugin.pluginName], value);
      }
    });
    return modifiedValue;
  }
};

function dispatchEvent(_ref) {
  var sortable = _ref.sortable,
      rootEl = _ref.rootEl,
      name = _ref.name,
      targetEl = _ref.targetEl,
      cloneEl = _ref.cloneEl,
      toEl = _ref.toEl,
      fromEl = _ref.fromEl,
      oldIndex = _ref.oldIndex,
      newIndex = _ref.newIndex,
      oldDraggableIndex = _ref.oldDraggableIndex,
      newDraggableIndex = _ref.newDraggableIndex,
      originalEvent = _ref.originalEvent,
      putSortable = _ref.putSortable,
      extraEventProperties = _ref.extraEventProperties;
  sortable = sortable || rootEl && rootEl[expando];
  if (!sortable) return;
  var evt,
      options = sortable.options,
      onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1); // Support for new CustomEvent feature

  if (window.CustomEvent && !IE11OrLess && !Edge) {
    evt = new CustomEvent(name, {
      bubbles: true,
      cancelable: true
    });
  } else {
    evt = document.createEvent('Event');
    evt.initEvent(name, true, true);
  }

  evt.to = toEl || rootEl;
  evt.from = fromEl || rootEl;
  evt.item = targetEl || rootEl;
  evt.clone = cloneEl;
  evt.oldIndex = oldIndex;
  evt.newIndex = newIndex;
  evt.oldDraggableIndex = oldDraggableIndex;
  evt.newDraggableIndex = newDraggableIndex;
  evt.originalEvent = originalEvent;
  evt.pullMode = putSortable ? putSortable.lastPutMode : undefined;

  var allEventProperties = _objectSpread({}, extraEventProperties, PluginManager.getEventProperties(name, sortable));

  for (var option in allEventProperties) {
    evt[option] = allEventProperties[option];
  }

  if (rootEl) {
    rootEl.dispatchEvent(evt);
  }

  if (options[onName]) {
    options[onName].call(sortable, evt);
  }
}

var pluginEvent = function pluginEvent(eventName, sortable) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      originalEvent = _ref.evt,
      data = _objectWithoutProperties(_ref, ["evt"]);

  PluginManager.pluginEvent.bind(Sortable)(eventName, sortable, _objectSpread({
    dragEl: dragEl,
    parentEl: parentEl,
    ghostEl: ghostEl,
    rootEl: rootEl,
    nextEl: nextEl,
    lastDownEl: lastDownEl,
    cloneEl: cloneEl,
    cloneHidden: cloneHidden,
    dragStarted: moved,
    putSortable: putSortable,
    activeSortable: Sortable.active,
    originalEvent: originalEvent,
    oldIndex: oldIndex,
    oldDraggableIndex: oldDraggableIndex,
    newIndex: newIndex,
    newDraggableIndex: newDraggableIndex,
    hideGhostForTarget: _hideGhostForTarget,
    unhideGhostForTarget: _unhideGhostForTarget,
    cloneNowHidden: function cloneNowHidden() {
      cloneHidden = true;
    },
    cloneNowShown: function cloneNowShown() {
      cloneHidden = false;
    },
    dispatchSortableEvent: function dispatchSortableEvent(name) {
      _dispatchEvent({
        sortable: sortable,
        name: name,
        originalEvent: originalEvent
      });
    }
  }, data));
};

function _dispatchEvent(info) {
  dispatchEvent(_objectSpread({
    putSortable: putSortable,
    cloneEl: cloneEl,
    targetEl: dragEl,
    rootEl: rootEl,
    oldIndex: oldIndex,
    oldDraggableIndex: oldDraggableIndex,
    newIndex: newIndex,
    newDraggableIndex: newDraggableIndex
  }, info));
}

var dragEl,
    parentEl,
    ghostEl,
    rootEl,
    nextEl,
    lastDownEl,
    cloneEl,
    cloneHidden,
    oldIndex,
    newIndex,
    oldDraggableIndex,
    newDraggableIndex,
    activeGroup,
    putSortable,
    awaitingDragStarted = false,
    ignoreNextClick = false,
    sortables = [],
    tapEvt,
    touchEvt,
    lastDx,
    lastDy,
    tapDistanceLeft,
    tapDistanceTop,
    moved,
    lastTarget,
    lastDirection,
    pastFirstInvertThresh = false,
    isCircumstantialInvert = false,
    targetMoveDistance,
    // For positioning ghost absolutely
ghostRelativeParent,
    ghostRelativeParentInitialScroll = [],
    // (left, top)
_silent = false,
    savedInputChecked = [];
/** @const */

var documentExists = typeof document !== 'undefined',
    PositionGhostAbsolutely = IOS,
    CSSFloatProperty = Edge || IE11OrLess ? 'cssFloat' : 'float',
    // This will not pass for IE9, because IE9 DnD only works on anchors
supportDraggable = documentExists && !ChromeForAndroid && !IOS && 'draggable' in document.createElement('div'),
    supportCssPointerEvents = function () {
  if (!documentExists) return; // false when <= IE11

  if (IE11OrLess) {
    return false;
  }

  var el = document.createElement('x');
  el.style.cssText = 'pointer-events:auto';
  return el.style.pointerEvents === 'auto';
}(),
    _detectDirection = function _detectDirection(el, options) {
  var elCSS = css(el),
      elWidth = parseInt(elCSS.width) - parseInt(elCSS.paddingLeft) - parseInt(elCSS.paddingRight) - parseInt(elCSS.borderLeftWidth) - parseInt(elCSS.borderRightWidth),
      child1 = getChild(el, 0, options),
      child2 = getChild(el, 1, options),
      firstChildCSS = child1 && css(child1),
      secondChildCSS = child2 && css(child2),
      firstChildWidth = firstChildCSS && parseInt(firstChildCSS.marginLeft) + parseInt(firstChildCSS.marginRight) + getRect(child1).width,
      secondChildWidth = secondChildCSS && parseInt(secondChildCSS.marginLeft) + parseInt(secondChildCSS.marginRight) + getRect(child2).width;

  if (elCSS.display === 'flex') {
    return elCSS.flexDirection === 'column' || elCSS.flexDirection === 'column-reverse' ? 'vertical' : 'horizontal';
  }

  if (elCSS.display === 'grid') {
    return elCSS.gridTemplateColumns.split(' ').length <= 1 ? 'vertical' : 'horizontal';
  }

  if (child1 && firstChildCSS["float"] && firstChildCSS["float"] !== 'none') {
    var touchingSideChild2 = firstChildCSS["float"] === 'left' ? 'left' : 'right';
    return child2 && (secondChildCSS.clear === 'both' || secondChildCSS.clear === touchingSideChild2) ? 'vertical' : 'horizontal';
  }

  return child1 && (firstChildCSS.display === 'block' || firstChildCSS.display === 'flex' || firstChildCSS.display === 'table' || firstChildCSS.display === 'grid' || firstChildWidth >= elWidth && elCSS[CSSFloatProperty] === 'none' || child2 && elCSS[CSSFloatProperty] === 'none' && firstChildWidth + secondChildWidth > elWidth) ? 'vertical' : 'horizontal';
},
    _dragElInRowColumn = function _dragElInRowColumn(dragRect, targetRect, vertical) {
  var dragElS1Opp = vertical ? dragRect.left : dragRect.top,
      dragElS2Opp = vertical ? dragRect.right : dragRect.bottom,
      dragElOppLength = vertical ? dragRect.width : dragRect.height,
      targetS1Opp = vertical ? targetRect.left : targetRect.top,
      targetS2Opp = vertical ? targetRect.right : targetRect.bottom,
      targetOppLength = vertical ? targetRect.width : targetRect.height;
  return dragElS1Opp === targetS1Opp || dragElS2Opp === targetS2Opp || dragElS1Opp + dragElOppLength / 2 === targetS1Opp + targetOppLength / 2;
},

/**
 * Detects first nearest empty sortable to X and Y position using emptyInsertThreshold.
 * @param  {Number} x      X position
 * @param  {Number} y      Y position
 * @return {HTMLElement}   Element of the first found nearest Sortable
 */
_detectNearestEmptySortable = function _detectNearestEmptySortable(x, y) {
  var ret;
  sortables.some(function (sortable) {
    if (lastChild(sortable)) return;
    var rect = getRect(sortable),
        threshold = sortable[expando].options.emptyInsertThreshold,
        insideHorizontally = x >= rect.left - threshold && x <= rect.right + threshold,
        insideVertically = y >= rect.top - threshold && y <= rect.bottom + threshold;

    if (threshold && insideHorizontally && insideVertically) {
      return ret = sortable;
    }
  });
  return ret;
},
    _prepareGroup = function _prepareGroup(options) {
  function toFn(value, pull) {
    return function (to, from, dragEl, evt) {
      var sameGroup = to.options.group.name && from.options.group.name && to.options.group.name === from.options.group.name;

      if (value == null && (pull || sameGroup)) {
        // Default pull value
        // Default pull and put value if same group
        return true;
      } else if (value == null || value === false) {
        return false;
      } else if (pull && value === 'clone') {
        return value;
      } else if (typeof value === 'function') {
        return toFn(value(to, from, dragEl, evt), pull)(to, from, dragEl, evt);
      } else {
        var otherGroup = (pull ? to : from).options.group.name;
        return value === true || typeof value === 'string' && value === otherGroup || value.join && value.indexOf(otherGroup) > -1;
      }
    };
  }

  var group = {};
  var originalGroup = options.group;

  if (!originalGroup || _typeof(originalGroup) != 'object') {
    originalGroup = {
      name: originalGroup
    };
  }

  group.name = originalGroup.name;
  group.checkPull = toFn(originalGroup.pull, true);
  group.checkPut = toFn(originalGroup.put);
  group.revertClone = originalGroup.revertClone;
  options.group = group;
},
    _hideGhostForTarget = function _hideGhostForTarget() {
  if (!supportCssPointerEvents && ghostEl) {
    css(ghostEl, 'display', 'none');
  }
},
    _unhideGhostForTarget = function _unhideGhostForTarget() {
  if (!supportCssPointerEvents && ghostEl) {
    css(ghostEl, 'display', '');
  }
}; // #1184 fix - Prevent click event on fallback if dragged but item not changed position


if (documentExists) {
  document.addEventListener('click', function (evt) {
    if (ignoreNextClick) {
      evt.preventDefault();
      evt.stopPropagation && evt.stopPropagation();
      evt.stopImmediatePropagation && evt.stopImmediatePropagation();
      ignoreNextClick = false;
      return false;
    }
  }, true);
}

var nearestEmptyInsertDetectEvent = function nearestEmptyInsertDetectEvent(evt) {
  if (dragEl) {
    evt = evt.touches ? evt.touches[0] : evt;

    var nearest = _detectNearestEmptySortable(evt.clientX, evt.clientY);

    if (nearest) {
      // Create imitation event
      var event = {};

      for (var i in evt) {
        if (evt.hasOwnProperty(i)) {
          event[i] = evt[i];
        }
      }

      event.target = event.rootEl = nearest;
      event.preventDefault = void 0;
      event.stopPropagation = void 0;

      nearest[expando]._onDragOver(event);
    }
  }
};

var _checkOutsideTargetEl = function _checkOutsideTargetEl(evt) {
  if (dragEl) {
    dragEl.parentNode[expando]._isOutsideThisEl(evt.target);
  }
};
/**
 * @class  Sortable
 * @param  {HTMLElement}  el
 * @param  {Object}       [options]
 */


function Sortable(el, options) {
  if (!(el && el.nodeType && el.nodeType === 1)) {
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(el));
  }

  this.el = el; // root element

  this.options = options = _extends$1({}, options); // Export instance

  el[expando] = this;
  var defaults = {
    group: null,
    sort: true,
    disabled: false,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(el.nodeName) ? '>li' : '>*',
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: false,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: true,
    direction: function direction() {
      return _detectDirection(el, this.options);
    },
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    ignore: 'a, img',
    filter: null,
    preventOnFilter: true,
    animation: 0,
    easing: null,
    setData: function setData(dataTransfer, dragEl) {
      dataTransfer.setData('Text', dragEl.textContent);
    },
    dropBubble: false,
    dragoverBubble: false,
    dataIdAttr: 'data-id',
    delay: 0,
    delayOnTouchOnly: false,
    touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
    forceFallback: false,
    fallbackClass: 'sortable-fallback',
    fallbackOnBody: false,
    fallbackTolerance: 0,
    fallbackOffset: {
      x: 0,
      y: 0
    },
    supportPointer: Sortable.supportPointer !== false && 'PointerEvent' in window,
    emptyInsertThreshold: 5
  };
  PluginManager.initializePlugins(this, el, defaults); // Set default options

  for (var name in defaults) {
    !(name in options) && (options[name] = defaults[name]);
  }

  _prepareGroup(options); // Bind all private methods


  for (var fn in this) {
    if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
      this[fn] = this[fn].bind(this);
    }
  } // Setup drag mode


  this.nativeDraggable = options.forceFallback ? false : supportDraggable;

  if (this.nativeDraggable) {
    // Touch start threshold cannot be greater than the native dragstart threshold
    this.options.touchStartThreshold = 1;
  } // Bind events


  if (options.supportPointer) {
    on(el, 'pointerdown', this._onTapStart);
  } else {
    on(el, 'mousedown', this._onTapStart);
    on(el, 'touchstart', this._onTapStart);
  }

  if (this.nativeDraggable) {
    on(el, 'dragover', this);
    on(el, 'dragenter', this);
  }

  sortables.push(this.el); // Restore sorting

  options.store && options.store.get && this.sort(options.store.get(this) || []); // Add animation state manager

  _extends$1(this, AnimationStateManager());
}

Sortable.prototype =
/** @lends Sortable.prototype */
{
  constructor: Sortable,
  _isOutsideThisEl: function _isOutsideThisEl(target) {
    if (!this.el.contains(target) && target !== this.el) {
      lastTarget = null;
    }
  },
  _getDirection: function _getDirection(evt, target) {
    return typeof this.options.direction === 'function' ? this.options.direction.call(this, evt, target, dragEl) : this.options.direction;
  },
  _onTapStart: function _onTapStart(
  /** Event|TouchEvent */
  evt) {
    if (!evt.cancelable) return;

    var _this = this,
        el = this.el,
        options = this.options,
        preventOnFilter = options.preventOnFilter,
        type = evt.type,
        touch = evt.touches && evt.touches[0] || evt.pointerType && evt.pointerType === 'touch' && evt,
        target = (touch || evt).target,
        originalTarget = evt.target.shadowRoot && (evt.path && evt.path[0] || evt.composedPath && evt.composedPath()[0]) || target,
        filter = options.filter;

    _saveInputCheckedState(el); // Don't trigger start event when an element is been dragged, otherwise the evt.oldindex always wrong when set option.group.


    if (dragEl) {
      return;
    }

    if (/mousedown|pointerdown/.test(type) && evt.button !== 0 || options.disabled) {
      return; // only left button and enabled
    } // cancel dnd if original target is content editable


    if (originalTarget.isContentEditable) {
      return;
    }

    target = closest$1(target, options.draggable, el, false);

    if (target && target.animated) {
      return;
    }

    if (lastDownEl === target) {
      // Ignoring duplicate `down`
      return;
    } // Get the index of the dragged element within its parent


    oldIndex = index(target);
    oldDraggableIndex = index(target, options.draggable); // Check filter

    if (typeof filter === 'function') {
      if (filter.call(this, evt, target, this)) {
        _dispatchEvent({
          sortable: _this,
          rootEl: originalTarget,
          name: 'filter',
          targetEl: target,
          toEl: el,
          fromEl: el
        });

        pluginEvent('filter', _this, {
          evt: evt
        });
        preventOnFilter && evt.cancelable && evt.preventDefault();
        return; // cancel dnd
      }
    } else if (filter) {
      filter = filter.split(',').some(function (criteria) {
        criteria = closest$1(originalTarget, criteria.trim(), el, false);

        if (criteria) {
          _dispatchEvent({
            sortable: _this,
            rootEl: criteria,
            name: 'filter',
            targetEl: target,
            fromEl: el,
            toEl: el
          });

          pluginEvent('filter', _this, {
            evt: evt
          });
          return true;
        }
      });

      if (filter) {
        preventOnFilter && evt.cancelable && evt.preventDefault();
        return; // cancel dnd
      }
    }

    if (options.handle && !closest$1(originalTarget, options.handle, el, false)) {
      return;
    } // Prepare `dragstart`


    this._prepareDragStart(evt, touch, target);
  },
  _prepareDragStart: function _prepareDragStart(
  /** Event */
  evt,
  /** Touch */
  touch,
  /** HTMLElement */
  target) {
    var _this = this,
        el = _this.el,
        options = _this.options,
        ownerDocument = el.ownerDocument,
        dragStartFn;

    if (target && !dragEl && target.parentNode === el) {
      var dragRect = getRect(target);
      rootEl = el;
      dragEl = target;
      parentEl = dragEl.parentNode;
      nextEl = dragEl.nextSibling;
      lastDownEl = target;
      activeGroup = options.group;
      Sortable.dragged = dragEl;
      tapEvt = {
        target: dragEl,
        clientX: (touch || evt).clientX,
        clientY: (touch || evt).clientY
      };
      tapDistanceLeft = tapEvt.clientX - dragRect.left;
      tapDistanceTop = tapEvt.clientY - dragRect.top;
      this._lastX = (touch || evt).clientX;
      this._lastY = (touch || evt).clientY;
      dragEl.style['will-change'] = 'all';

      dragStartFn = function dragStartFn() {
        pluginEvent('delayEnded', _this, {
          evt: evt
        });

        if (Sortable.eventCanceled) {
          _this._onDrop();

          return;
        } // Delayed drag has been triggered
        // we can re-enable the events: touchmove/mousemove


        _this._disableDelayedDragEvents();

        if (!FireFox && _this.nativeDraggable) {
          dragEl.draggable = true;
        } // Bind the events: dragstart/dragend


        _this._triggerDragStart(evt, touch); // Drag start event


        _dispatchEvent({
          sortable: _this,
          name: 'choose',
          originalEvent: evt
        }); // Chosen item


        toggleClass(dragEl, options.chosenClass, true);
      }; // Disable "draggable"


      options.ignore.split(',').forEach(function (criteria) {
        find(dragEl, criteria.trim(), _disableDraggable);
      });
      on(ownerDocument, 'dragover', nearestEmptyInsertDetectEvent);
      on(ownerDocument, 'mousemove', nearestEmptyInsertDetectEvent);
      on(ownerDocument, 'touchmove', nearestEmptyInsertDetectEvent);
      on(ownerDocument, 'mouseup', _this._onDrop);
      on(ownerDocument, 'touchend', _this._onDrop);
      on(ownerDocument, 'touchcancel', _this._onDrop); // Make dragEl draggable (must be before delay for FireFox)

      if (FireFox && this.nativeDraggable) {
        this.options.touchStartThreshold = 4;
        dragEl.draggable = true;
      }

      pluginEvent('delayStart', this, {
        evt: evt
      }); // Delay is impossible for native DnD in Edge or IE

      if (options.delay && (!options.delayOnTouchOnly || touch) && (!this.nativeDraggable || !(Edge || IE11OrLess))) {
        if (Sortable.eventCanceled) {
          this._onDrop();

          return;
        } // If the user moves the pointer or let go the click or touch
        // before the delay has been reached:
        // disable the delayed drag


        on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
        on(ownerDocument, 'touchend', _this._disableDelayedDrag);
        on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
        on(ownerDocument, 'mousemove', _this._delayedDragTouchMoveHandler);
        on(ownerDocument, 'touchmove', _this._delayedDragTouchMoveHandler);
        options.supportPointer && on(ownerDocument, 'pointermove', _this._delayedDragTouchMoveHandler);
        _this._dragStartTimer = setTimeout(dragStartFn, options.delay);
      } else {
        dragStartFn();
      }
    }
  },
  _delayedDragTouchMoveHandler: function _delayedDragTouchMoveHandler(
  /** TouchEvent|PointerEvent **/
  e) {
    var touch = e.touches ? e.touches[0] : e;

    if (Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1))) {
      this._disableDelayedDrag();
    }
  },
  _disableDelayedDrag: function _disableDelayedDrag() {
    dragEl && _disableDraggable(dragEl);
    clearTimeout(this._dragStartTimer);

    this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function _disableDelayedDragEvents() {
    var ownerDocument = this.el.ownerDocument;
    off(ownerDocument, 'mouseup', this._disableDelayedDrag);
    off(ownerDocument, 'touchend', this._disableDelayedDrag);
    off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
    off(ownerDocument, 'mousemove', this._delayedDragTouchMoveHandler);
    off(ownerDocument, 'touchmove', this._delayedDragTouchMoveHandler);
    off(ownerDocument, 'pointermove', this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function _triggerDragStart(
  /** Event */
  evt,
  /** Touch */
  touch) {
    touch = touch || evt.pointerType == 'touch' && evt;

    if (!this.nativeDraggable || touch) {
      if (this.options.supportPointer) {
        on(document, 'pointermove', this._onTouchMove);
      } else if (touch) {
        on(document, 'touchmove', this._onTouchMove);
      } else {
        on(document, 'mousemove', this._onTouchMove);
      }
    } else {
      on(dragEl, 'dragend', this);
      on(rootEl, 'dragstart', this._onDragStart);
    }

    try {
      if (document.selection) {
        // Timeout neccessary for IE9
        _nextTick(function () {
          document.selection.empty();
        });
      } else {
        window.getSelection().removeAllRanges();
      }
    } catch (err) {}
  },
  _dragStarted: function _dragStarted(fallback, evt) {

    awaitingDragStarted = false;

    if (rootEl && dragEl) {
      pluginEvent('dragStarted', this, {
        evt: evt
      });

      if (this.nativeDraggable) {
        on(document, 'dragover', _checkOutsideTargetEl);
      }

      var options = this.options; // Apply effect

      !fallback && toggleClass(dragEl, options.dragClass, false);
      toggleClass(dragEl, options.ghostClass, true);
      Sortable.active = this;
      fallback && this._appendGhost(); // Drag start event

      _dispatchEvent({
        sortable: this,
        name: 'start',
        originalEvent: evt
      });
    } else {
      this._nulling();
    }
  },
  _emulateDragOver: function _emulateDragOver() {
    if (touchEvt) {
      this._lastX = touchEvt.clientX;
      this._lastY = touchEvt.clientY;

      _hideGhostForTarget();

      var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
      var parent = target;

      while (target && target.shadowRoot) {
        target = target.shadowRoot.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
        if (target === parent) break;
        parent = target;
      }

      dragEl.parentNode[expando]._isOutsideThisEl(target);

      if (parent) {
        do {
          if (parent[expando]) {
            var inserted = void 0;
            inserted = parent[expando]._onDragOver({
              clientX: touchEvt.clientX,
              clientY: touchEvt.clientY,
              target: target,
              rootEl: parent
            });

            if (inserted && !this.options.dragoverBubble) {
              break;
            }
          }

          target = parent; // store last element
        }
        /* jshint boss:true */
        while (parent = parent.parentNode);
      }

      _unhideGhostForTarget();
    }
  },
  _onTouchMove: function _onTouchMove(
  /**TouchEvent*/
  evt) {
    if (tapEvt) {
      var options = this.options,
          fallbackTolerance = options.fallbackTolerance,
          fallbackOffset = options.fallbackOffset,
          touch = evt.touches ? evt.touches[0] : evt,
          ghostMatrix = ghostEl && matrix(ghostEl, true),
          scaleX = ghostEl && ghostMatrix && ghostMatrix.a,
          scaleY = ghostEl && ghostMatrix && ghostMatrix.d,
          relativeScrollOffset = PositionGhostAbsolutely && ghostRelativeParent && getRelativeScrollOffset(ghostRelativeParent),
          dx = (touch.clientX - tapEvt.clientX + fallbackOffset.x) / (scaleX || 1) + (relativeScrollOffset ? relativeScrollOffset[0] - ghostRelativeParentInitialScroll[0] : 0) / (scaleX || 1),
          dy = (touch.clientY - tapEvt.clientY + fallbackOffset.y) / (scaleY || 1) + (relativeScrollOffset ? relativeScrollOffset[1] - ghostRelativeParentInitialScroll[1] : 0) / (scaleY || 1); // only set the status to dragging, when we are actually dragging

      if (!Sortable.active && !awaitingDragStarted) {
        if (fallbackTolerance && Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY)) < fallbackTolerance) {
          return;
        }

        this._onDragStart(evt, true);
      }

      if (ghostEl) {
        if (ghostMatrix) {
          ghostMatrix.e += dx - (lastDx || 0);
          ghostMatrix.f += dy - (lastDy || 0);
        } else {
          ghostMatrix = {
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: dx,
            f: dy
          };
        }

        var cssMatrix = "matrix(".concat(ghostMatrix.a, ",").concat(ghostMatrix.b, ",").concat(ghostMatrix.c, ",").concat(ghostMatrix.d, ",").concat(ghostMatrix.e, ",").concat(ghostMatrix.f, ")");
        css(ghostEl, 'webkitTransform', cssMatrix);
        css(ghostEl, 'mozTransform', cssMatrix);
        css(ghostEl, 'msTransform', cssMatrix);
        css(ghostEl, 'transform', cssMatrix);
        lastDx = dx;
        lastDy = dy;
        touchEvt = touch;
      }

      evt.cancelable && evt.preventDefault();
    }
  },
  _appendGhost: function _appendGhost() {
    // Bug if using scale(): https://stackoverflow.com/questions/2637058
    // Not being adjusted for
    if (!ghostEl) {
      var container = this.options.fallbackOnBody ? document.body : rootEl,
          rect = getRect(dragEl, true, PositionGhostAbsolutely, true, container),
          options = this.options; // Position absolutely

      if (PositionGhostAbsolutely) {
        // Get relatively positioned parent
        ghostRelativeParent = container;

        while (css(ghostRelativeParent, 'position') === 'static' && css(ghostRelativeParent, 'transform') === 'none' && ghostRelativeParent !== document) {
          ghostRelativeParent = ghostRelativeParent.parentNode;
        }

        if (ghostRelativeParent !== document.body && ghostRelativeParent !== document.documentElement) {
          if (ghostRelativeParent === document) ghostRelativeParent = getWindowScrollingElement();
          rect.top += ghostRelativeParent.scrollTop;
          rect.left += ghostRelativeParent.scrollLeft;
        } else {
          ghostRelativeParent = getWindowScrollingElement();
        }

        ghostRelativeParentInitialScroll = getRelativeScrollOffset(ghostRelativeParent);
      }

      ghostEl = dragEl.cloneNode(true);
      toggleClass(ghostEl, options.ghostClass, false);
      toggleClass(ghostEl, options.fallbackClass, true);
      toggleClass(ghostEl, options.dragClass, true);
      css(ghostEl, 'transition', '');
      css(ghostEl, 'transform', '');
      css(ghostEl, 'box-sizing', 'border-box');
      css(ghostEl, 'margin', 0);
      css(ghostEl, 'top', rect.top);
      css(ghostEl, 'left', rect.left);
      css(ghostEl, 'width', rect.width);
      css(ghostEl, 'height', rect.height);
      css(ghostEl, 'opacity', '0.8');
      css(ghostEl, 'position', PositionGhostAbsolutely ? 'absolute' : 'fixed');
      css(ghostEl, 'zIndex', '100000');
      css(ghostEl, 'pointerEvents', 'none');
      Sortable.ghost = ghostEl;
      container.appendChild(ghostEl); // Set transform-origin

      css(ghostEl, 'transform-origin', tapDistanceLeft / parseInt(ghostEl.style.width) * 100 + '% ' + tapDistanceTop / parseInt(ghostEl.style.height) * 100 + '%');
    }
  },
  _onDragStart: function _onDragStart(
  /**Event*/
  evt,
  /**boolean*/
  fallback) {
    var _this = this;

    var dataTransfer = evt.dataTransfer;
    var options = _this.options;
    pluginEvent('dragStart', this, {
      evt: evt
    });

    if (Sortable.eventCanceled) {
      this._onDrop();

      return;
    }

    pluginEvent('setupClone', this);

    if (!Sortable.eventCanceled) {
      cloneEl = clone(dragEl);
      cloneEl.draggable = false;
      cloneEl.style['will-change'] = '';

      this._hideClone();

      toggleClass(cloneEl, this.options.chosenClass, false);
      Sortable.clone = cloneEl;
    } // #1143: IFrame support workaround


    _this.cloneId = _nextTick(function () {
      pluginEvent('clone', _this);
      if (Sortable.eventCanceled) return;

      if (!_this.options.removeCloneOnHide) {
        rootEl.insertBefore(cloneEl, dragEl);
      }

      _this._hideClone();

      _dispatchEvent({
        sortable: _this,
        name: 'clone'
      });
    });
    !fallback && toggleClass(dragEl, options.dragClass, true); // Set proper drop events

    if (fallback) {
      ignoreNextClick = true;
      _this._loopId = setInterval(_this._emulateDragOver, 50);
    } else {
      // Undo what was set in _prepareDragStart before drag started
      off(document, 'mouseup', _this._onDrop);
      off(document, 'touchend', _this._onDrop);
      off(document, 'touchcancel', _this._onDrop);

      if (dataTransfer) {
        dataTransfer.effectAllowed = 'move';
        options.setData && options.setData.call(_this, dataTransfer, dragEl);
      }

      on(document, 'drop', _this); // #1276 fix:

      css(dragEl, 'transform', 'translateZ(0)');
    }

    awaitingDragStarted = true;
    _this._dragStartId = _nextTick(_this._dragStarted.bind(_this, fallback, evt));
    on(document, 'selectstart', _this);
    moved = true;

    if (Safari) {
      css(document.body, 'user-select', 'none');
    }
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function _onDragOver(
  /**Event*/
  evt) {
    var el = this.el,
        target = evt.target,
        dragRect,
        targetRect,
        revert,
        options = this.options,
        group = options.group,
        activeSortable = Sortable.active,
        isOwner = activeGroup === group,
        canSort = options.sort,
        fromSortable = putSortable || activeSortable,
        vertical,
        _this = this,
        completedFired = false;

    if (_silent) return;

    function dragOverEvent(name, extra) {
      pluginEvent(name, _this, _objectSpread({
        evt: evt,
        isOwner: isOwner,
        axis: vertical ? 'vertical' : 'horizontal',
        revert: revert,
        dragRect: dragRect,
        targetRect: targetRect,
        canSort: canSort,
        fromSortable: fromSortable,
        target: target,
        completed: completed,
        onMove: function onMove(target, after) {
          return _onMove(rootEl, el, dragEl, dragRect, target, getRect(target), evt, after);
        },
        changed: changed
      }, extra));
    } // Capture animation state


    function capture() {
      dragOverEvent('dragOverAnimationCapture');

      _this.captureAnimationState();

      if (_this !== fromSortable) {
        fromSortable.captureAnimationState();
      }
    } // Return invocation when dragEl is inserted (or completed)


    function completed(insertion) {
      dragOverEvent('dragOverCompleted', {
        insertion: insertion
      });

      if (insertion) {
        // Clones must be hidden before folding animation to capture dragRectAbsolute properly
        if (isOwner) {
          activeSortable._hideClone();
        } else {
          activeSortable._showClone(_this);
        }

        if (_this !== fromSortable) {
          // Set ghost class to new sortable's ghost class
          toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : activeSortable.options.ghostClass, false);
          toggleClass(dragEl, options.ghostClass, true);
        }

        if (putSortable !== _this && _this !== Sortable.active) {
          putSortable = _this;
        } else if (_this === Sortable.active && putSortable) {
          putSortable = null;
        } // Animation


        if (fromSortable === _this) {
          _this._ignoreWhileAnimating = target;
        }

        _this.animateAll(function () {
          dragOverEvent('dragOverAnimationComplete');
          _this._ignoreWhileAnimating = null;
        });

        if (_this !== fromSortable) {
          fromSortable.animateAll();
          fromSortable._ignoreWhileAnimating = null;
        }
      } // Null lastTarget if it is not inside a previously swapped element


      if (target === dragEl && !dragEl.animated || target === el && !target.animated) {
        lastTarget = null;
      } // no bubbling and not fallback


      if (!options.dragoverBubble && !evt.rootEl && target !== document) {
        dragEl.parentNode[expando]._isOutsideThisEl(evt.target); // Do not detect for empty insert if already inserted


        !insertion && nearestEmptyInsertDetectEvent(evt);
      }

      !options.dragoverBubble && evt.stopPropagation && evt.stopPropagation();
      return completedFired = true;
    } // Call when dragEl has been inserted


    function changed() {
      newIndex = index(dragEl);
      newDraggableIndex = index(dragEl, options.draggable);

      _dispatchEvent({
        sortable: _this,
        name: 'change',
        toEl: el,
        newIndex: newIndex,
        newDraggableIndex: newDraggableIndex,
        originalEvent: evt
      });
    }

    if (evt.preventDefault !== void 0) {
      evt.cancelable && evt.preventDefault();
    }

    target = closest$1(target, options.draggable, el, true);
    dragOverEvent('dragOver');
    if (Sortable.eventCanceled) return completedFired;

    if (dragEl.contains(evt.target) || target.animated && target.animatingX && target.animatingY || _this._ignoreWhileAnimating === target) {
      return completed(false);
    }

    ignoreNextClick = false;

    if (activeSortable && !options.disabled && (isOwner ? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
    : putSortable === this || (this.lastPutMode = activeGroup.checkPull(this, activeSortable, dragEl, evt)) && group.checkPut(this, activeSortable, dragEl, evt))) {
      vertical = this._getDirection(evt, target) === 'vertical';
      dragRect = getRect(dragEl);
      dragOverEvent('dragOverValid');
      if (Sortable.eventCanceled) return completedFired;

      if (revert) {
        parentEl = rootEl; // actualization

        capture();

        this._hideClone();

        dragOverEvent('revert');

        if (!Sortable.eventCanceled) {
          if (nextEl) {
            rootEl.insertBefore(dragEl, nextEl);
          } else {
            rootEl.appendChild(dragEl);
          }
        }

        return completed(true);
      }

      var elLastChild = lastChild(el, options.draggable);

      if (!elLastChild || _ghostIsLast(evt, vertical, this) && !elLastChild.animated) {
        // If already at end of list: Do not insert
        if (elLastChild === dragEl) {
          return completed(false);
        } // assign target only if condition is true


        if (elLastChild && el === evt.target) {
          target = elLastChild;
        }

        if (target) {
          targetRect = getRect(target);
        }

        if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, !!target) !== false) {
          capture();
          el.appendChild(dragEl);
          parentEl = el; // actualization

          changed();
          return completed(true);
        }
      } else if (target.parentNode === el) {
        targetRect = getRect(target);
        var direction = 0,
            targetBeforeFirstSwap,
            differentLevel = dragEl.parentNode !== el,
            differentRowCol = !_dragElInRowColumn(dragEl.animated && dragEl.toRect || dragRect, target.animated && target.toRect || targetRect, vertical),
            side1 = vertical ? 'top' : 'left',
            scrolledPastTop = isScrolledPast(target, 'top', 'top') || isScrolledPast(dragEl, 'top', 'top'),
            scrollBefore = scrolledPastTop ? scrolledPastTop.scrollTop : void 0;

        if (lastTarget !== target) {
          targetBeforeFirstSwap = targetRect[side1];
          pastFirstInvertThresh = false;
          isCircumstantialInvert = !differentRowCol && options.invertSwap || differentLevel;
        }

        direction = _getSwapDirection(evt, target, targetRect, vertical, differentRowCol ? 1 : options.swapThreshold, options.invertedSwapThreshold == null ? options.swapThreshold : options.invertedSwapThreshold, isCircumstantialInvert, lastTarget === target);
        var sibling;

        if (direction !== 0) {
          // Check if target is beside dragEl in respective direction (ignoring hidden elements)
          var dragIndex = index(dragEl);

          do {
            dragIndex -= direction;
            sibling = parentEl.children[dragIndex];
          } while (sibling && (css(sibling, 'display') === 'none' || sibling === ghostEl));
        } // If dragEl is already beside target: Do not insert


        if (direction === 0 || sibling === target) {
          return completed(false);
        }

        lastTarget = target;
        lastDirection = direction;
        var nextSibling = target.nextElementSibling,
            after = false;
        after = direction === 1;

        var moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, after);

        if (moveVector !== false) {
          if (moveVector === 1 || moveVector === -1) {
            after = moveVector === 1;
          }

          _silent = true;
          setTimeout(_unsilent, 30);
          capture();

          if (after && !nextSibling) {
            el.appendChild(dragEl);
          } else {
            target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
          } // Undo chrome's scroll adjustment (has no effect on other browsers)


          if (scrolledPastTop) {
            scrollBy(scrolledPastTop, 0, scrollBefore - scrolledPastTop.scrollTop);
          }

          parentEl = dragEl.parentNode; // actualization
          // must be done before animation

          if (targetBeforeFirstSwap !== undefined && !isCircumstantialInvert) {
            targetMoveDistance = Math.abs(targetBeforeFirstSwap - getRect(target)[side1]);
          }

          changed();
          return completed(true);
        }
      }

      if (el.contains(dragEl)) {
        return completed(false);
      }
    }

    return false;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function _offMoveEvents() {
    off(document, 'mousemove', this._onTouchMove);
    off(document, 'touchmove', this._onTouchMove);
    off(document, 'pointermove', this._onTouchMove);
    off(document, 'dragover', nearestEmptyInsertDetectEvent);
    off(document, 'mousemove', nearestEmptyInsertDetectEvent);
    off(document, 'touchmove', nearestEmptyInsertDetectEvent);
  },
  _offUpEvents: function _offUpEvents() {
    var ownerDocument = this.el.ownerDocument;
    off(ownerDocument, 'mouseup', this._onDrop);
    off(ownerDocument, 'touchend', this._onDrop);
    off(ownerDocument, 'pointerup', this._onDrop);
    off(ownerDocument, 'touchcancel', this._onDrop);
    off(document, 'selectstart', this);
  },
  _onDrop: function _onDrop(
  /**Event*/
  evt) {
    var el = this.el,
        options = this.options; // Get the index of the dragged element within its parent

    newIndex = index(dragEl);
    newDraggableIndex = index(dragEl, options.draggable);
    pluginEvent('drop', this, {
      evt: evt
    });
    parentEl = dragEl && dragEl.parentNode; // Get again after plugin event

    newIndex = index(dragEl);
    newDraggableIndex = index(dragEl, options.draggable);

    if (Sortable.eventCanceled) {
      this._nulling();

      return;
    }

    awaitingDragStarted = false;
    isCircumstantialInvert = false;
    pastFirstInvertThresh = false;
    clearInterval(this._loopId);
    clearTimeout(this._dragStartTimer);

    _cancelNextTick(this.cloneId);

    _cancelNextTick(this._dragStartId); // Unbind events


    if (this.nativeDraggable) {
      off(document, 'drop', this);
      off(el, 'dragstart', this._onDragStart);
    }

    this._offMoveEvents();

    this._offUpEvents();

    if (Safari) {
      css(document.body, 'user-select', '');
    }

    css(dragEl, 'transform', '');

    if (evt) {
      if (moved) {
        evt.cancelable && evt.preventDefault();
        !options.dropBubble && evt.stopPropagation();
      }

      ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);

      if (rootEl === parentEl || putSortable && putSortable.lastPutMode !== 'clone') {
        // Remove clone(s)
        cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
      }

      if (dragEl) {
        if (this.nativeDraggable) {
          off(dragEl, 'dragend', this);
        }

        _disableDraggable(dragEl);

        dragEl.style['will-change'] = ''; // Remove classes
        // ghostClass is added in dragStarted

        if (moved && !awaitingDragStarted) {
          toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : this.options.ghostClass, false);
        }

        toggleClass(dragEl, this.options.chosenClass, false); // Drag stop event

        _dispatchEvent({
          sortable: this,
          name: 'unchoose',
          toEl: parentEl,
          newIndex: null,
          newDraggableIndex: null,
          originalEvent: evt
        });

        if (rootEl !== parentEl) {
          if (newIndex >= 0) {
            // Add event
            _dispatchEvent({
              rootEl: parentEl,
              name: 'add',
              toEl: parentEl,
              fromEl: rootEl,
              originalEvent: evt
            }); // Remove event


            _dispatchEvent({
              sortable: this,
              name: 'remove',
              toEl: parentEl,
              originalEvent: evt
            }); // drag from one list and drop into another


            _dispatchEvent({
              rootEl: parentEl,
              name: 'sort',
              toEl: parentEl,
              fromEl: rootEl,
              originalEvent: evt
            });

            _dispatchEvent({
              sortable: this,
              name: 'sort',
              toEl: parentEl,
              originalEvent: evt
            });
          }

          putSortable && putSortable.save();
        } else {
          if (newIndex !== oldIndex) {
            if (newIndex >= 0) {
              // drag & drop within the same list
              _dispatchEvent({
                sortable: this,
                name: 'update',
                toEl: parentEl,
                originalEvent: evt
              });

              _dispatchEvent({
                sortable: this,
                name: 'sort',
                toEl: parentEl,
                originalEvent: evt
              });
            }
          }
        }

        if (Sortable.active) {
          /* jshint eqnull:true */
          if (newIndex == null || newIndex === -1) {
            newIndex = oldIndex;
            newDraggableIndex = oldDraggableIndex;
          }

          _dispatchEvent({
            sortable: this,
            name: 'end',
            toEl: parentEl,
            originalEvent: evt
          }); // Save sorting


          this.save();
        }
      }
    }

    this._nulling();
  },
  _nulling: function _nulling() {
    pluginEvent('nulling', this);
    rootEl = dragEl = parentEl = ghostEl = nextEl = cloneEl = lastDownEl = cloneHidden = tapEvt = touchEvt = moved = newIndex = newDraggableIndex = oldIndex = oldDraggableIndex = lastTarget = lastDirection = putSortable = activeGroup = Sortable.dragged = Sortable.ghost = Sortable.clone = Sortable.active = null;
    savedInputChecked.forEach(function (el) {
      el.checked = true;
    });
    savedInputChecked.length = lastDx = lastDy = 0;
  },
  handleEvent: function handleEvent(
  /**Event*/
  evt) {
    switch (evt.type) {
      case 'drop':
      case 'dragend':
        this._onDrop(evt);

        break;

      case 'dragenter':
      case 'dragover':
        if (dragEl) {
          this._onDragOver(evt);

          _globalDragOver(evt);
        }

        break;

      case 'selectstart':
        evt.preventDefault();
        break;
    }
  },

  /**
   * Serializes the item into an array of string.
   * @returns {String[]}
   */
  toArray: function toArray() {
    var order = [],
        el,
        children = this.el.children,
        i = 0,
        n = children.length,
        options = this.options;

    for (; i < n; i++) {
      el = children[i];

      if (closest$1(el, options.draggable, this.el, false)) {
        order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
      }
    }

    return order;
  },

  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function sort(order) {
    var items = {},
        rootEl = this.el;
    this.toArray().forEach(function (id, i) {
      var el = rootEl.children[i];

      if (closest$1(el, this.options.draggable, rootEl, false)) {
        items[id] = el;
      }
    }, this);
    order.forEach(function (id) {
      if (items[id]) {
        rootEl.removeChild(items[id]);
        rootEl.appendChild(items[id]);
      }
    });
  },

  /**
   * Save the current sorting
   */
  save: function save() {
    var store = this.options.store;
    store && store.set && store.set(this);
  },

  /**
   * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
   * @param   {HTMLElement}  el
   * @param   {String}       [selector]  default: `options.draggable`
   * @returns {HTMLElement|null}
   */
  closest: function closest$1$1(el, selector) {
    return closest$1(el, selector || this.options.draggable, this.el, false);
  },

  /**
   * Set/get option
   * @param   {string} name
   * @param   {*}      [value]
   * @returns {*}
   */
  option: function option(name, value) {
    var options = this.options;

    if (value === void 0) {
      return options[name];
    } else {
      var modifiedValue = PluginManager.modifyOption(this, name, value);

      if (typeof modifiedValue !== 'undefined') {
        options[name] = modifiedValue;
      } else {
        options[name] = value;
      }

      if (name === 'group') {
        _prepareGroup(options);
      }
    }
  },

  /**
   * Destroy
   */
  destroy: function destroy() {
    pluginEvent('destroy', this);
    var el = this.el;
    el[expando] = null;
    off(el, 'mousedown', this._onTapStart);
    off(el, 'touchstart', this._onTapStart);
    off(el, 'pointerdown', this._onTapStart);

    if (this.nativeDraggable) {
      off(el, 'dragover', this);
      off(el, 'dragenter', this);
    } // Remove draggable attributes


    Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
      el.removeAttribute('draggable');
    });

    this._onDrop();

    this._disableDelayedDragEvents();

    sortables.splice(sortables.indexOf(this.el), 1);
    this.el = el = null;
  },
  _hideClone: function _hideClone() {
    if (!cloneHidden) {
      pluginEvent('hideClone', this);
      if (Sortable.eventCanceled) return;
      css(cloneEl, 'display', 'none');

      if (this.options.removeCloneOnHide && cloneEl.parentNode) {
        cloneEl.parentNode.removeChild(cloneEl);
      }

      cloneHidden = true;
    }
  },
  _showClone: function _showClone(putSortable) {
    if (putSortable.lastPutMode !== 'clone') {
      this._hideClone();

      return;
    }

    if (cloneHidden) {
      pluginEvent('showClone', this);
      if (Sortable.eventCanceled) return; // show clone at dragEl or original position

      if (rootEl.contains(dragEl) && !this.options.group.revertClone) {
        rootEl.insertBefore(cloneEl, dragEl);
      } else if (nextEl) {
        rootEl.insertBefore(cloneEl, nextEl);
      } else {
        rootEl.appendChild(cloneEl);
      }

      if (this.options.group.revertClone) {
        this.animate(dragEl, cloneEl);
      }

      css(cloneEl, 'display', '');
      cloneHidden = false;
    }
  }
};

function _globalDragOver(
/**Event*/
evt) {
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move';
  }

  evt.cancelable && evt.preventDefault();
}

function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvent, willInsertAfter) {
  var evt,
      sortable = fromEl[expando],
      onMoveFn = sortable.options.onMove,
      retVal; // Support for new CustomEvent feature

  if (window.CustomEvent && !IE11OrLess && !Edge) {
    evt = new CustomEvent('move', {
      bubbles: true,
      cancelable: true
    });
  } else {
    evt = document.createEvent('Event');
    evt.initEvent('move', true, true);
  }

  evt.to = toEl;
  evt.from = fromEl;
  evt.dragged = dragEl;
  evt.draggedRect = dragRect;
  evt.related = targetEl || toEl;
  evt.relatedRect = targetRect || getRect(toEl);
  evt.willInsertAfter = willInsertAfter;
  evt.originalEvent = originalEvent;
  fromEl.dispatchEvent(evt);

  if (onMoveFn) {
    retVal = onMoveFn.call(sortable, evt, originalEvent);
  }

  return retVal;
}

function _disableDraggable(el) {
  el.draggable = false;
}

function _unsilent() {
  _silent = false;
}

function _ghostIsLast(evt, vertical, sortable) {
  var rect = getRect(lastChild(sortable.el, sortable.options.draggable));
  var spacer = 10;
  return vertical ? evt.clientX > rect.right + spacer || evt.clientX <= rect.right && evt.clientY > rect.bottom && evt.clientX >= rect.left : evt.clientX > rect.right && evt.clientY > rect.top || evt.clientX <= rect.right && evt.clientY > rect.bottom + spacer;
}

function _getSwapDirection(evt, target, targetRect, vertical, swapThreshold, invertedSwapThreshold, invertSwap, isLastTarget) {
  var mouseOnAxis = vertical ? evt.clientY : evt.clientX,
      targetLength = vertical ? targetRect.height : targetRect.width,
      targetS1 = vertical ? targetRect.top : targetRect.left,
      targetS2 = vertical ? targetRect.bottom : targetRect.right,
      invert = false;

  if (!invertSwap) {
    // Never invert or create dragEl shadow when target movemenet causes mouse to move past the end of regular swapThreshold
    if (isLastTarget && targetMoveDistance < targetLength * swapThreshold) {
      // multiplied only by swapThreshold because mouse will already be inside target by (1 - threshold) * targetLength / 2
      // check if past first invert threshold on side opposite of lastDirection
      if (!pastFirstInvertThresh && (lastDirection === 1 ? mouseOnAxis > targetS1 + targetLength * invertedSwapThreshold / 2 : mouseOnAxis < targetS2 - targetLength * invertedSwapThreshold / 2)) {
        // past first invert threshold, do not restrict inverted threshold to dragEl shadow
        pastFirstInvertThresh = true;
      }

      if (!pastFirstInvertThresh) {
        // dragEl shadow (target move distance shadow)
        if (lastDirection === 1 ? mouseOnAxis < targetS1 + targetMoveDistance // over dragEl shadow
        : mouseOnAxis > targetS2 - targetMoveDistance) {
          return -lastDirection;
        }
      } else {
        invert = true;
      }
    } else {
      // Regular
      if (mouseOnAxis > targetS1 + targetLength * (1 - swapThreshold) / 2 && mouseOnAxis < targetS2 - targetLength * (1 - swapThreshold) / 2) {
        return _getInsertDirection(target);
      }
    }
  }

  invert = invert || invertSwap;

  if (invert) {
    // Invert of regular
    if (mouseOnAxis < targetS1 + targetLength * invertedSwapThreshold / 2 || mouseOnAxis > targetS2 - targetLength * invertedSwapThreshold / 2) {
      return mouseOnAxis > targetS1 + targetLength / 2 ? 1 : -1;
    }
  }

  return 0;
}
/**
 * Gets the direction dragEl must be swapped relative to target in order to make it
 * seem that dragEl has been "inserted" into that element's position
 * @param  {HTMLElement} target       The target whose position dragEl is being inserted at
 * @return {Number}                   Direction dragEl must be swapped
 */


function _getInsertDirection(target) {
  if (index(dragEl) < index(target)) {
    return 1;
  } else {
    return -1;
  }
}
/**
 * Generate id
 * @param   {HTMLElement} el
 * @returns {String}
 * @private
 */


function _generateId(el) {
  var str = el.tagName + el.className + el.src + el.href + el.textContent,
      i = str.length,
      sum = 0;

  while (i--) {
    sum += str.charCodeAt(i);
  }

  return sum.toString(36);
}

function _saveInputCheckedState(root) {
  savedInputChecked.length = 0;
  var inputs = root.getElementsByTagName('input');
  var idx = inputs.length;

  while (idx--) {
    var el = inputs[idx];
    el.checked && savedInputChecked.push(el);
  }
}

function _nextTick(fn) {
  return setTimeout(fn, 0);
}

function _cancelNextTick(id) {
  return clearTimeout(id);
} // Fixed #973:


if (documentExists) {
  on(document, 'touchmove', function (evt) {
    if ((Sortable.active || awaitingDragStarted) && evt.cancelable) {
      evt.preventDefault();
    }
  });
} // Export utils


Sortable.utils = {
  on: on,
  off: off,
  css: css,
  find: find,
  is: function is(el, selector) {
    return !!closest$1(el, selector, el, false);
  },
  extend: extend,
  throttle: throttle$1,
  closest: closest$1,
  toggleClass: toggleClass,
  clone: clone,
  index: index,
  nextTick: _nextTick,
  cancelNextTick: _cancelNextTick,
  detectDirection: _detectDirection,
  getChild: getChild
};
/**
 * Get the Sortable instance of an element
 * @param  {HTMLElement} element The element
 * @return {Sortable|undefined}         The instance of Sortable
 */

Sortable.get = function (element) {
  return element[expando];
};
/**
 * Mount a plugin to Sortable
 * @param  {...SortablePlugin|SortablePlugin[]} plugins       Plugins being mounted
 */


Sortable.mount = function () {
  for (var _len = arguments.length, plugins = new Array(_len), _key = 0; _key < _len; _key++) {
    plugins[_key] = arguments[_key];
  }

  if (plugins[0].constructor === Array) plugins = plugins[0];
  plugins.forEach(function (plugin) {
    if (!plugin.prototype || !plugin.prototype.constructor) {
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(plugin));
    }

    if (plugin.utils) Sortable.utils = _objectSpread({}, Sortable.utils, plugin.utils);
    PluginManager.mount(plugin);
  });
};
/**
 * Create sortable instance
 * @param {HTMLElement}  el
 * @param {Object}      [options]
 */


Sortable.create = function (el, options) {
  return new Sortable(el, options);
}; // Export


Sortable.version = version;

var autoScrolls = [],
    scrollEl,
    scrollRootEl,
    scrolling = false,
    lastAutoScrollX,
    lastAutoScrollY,
    touchEvt$1,
    pointerElemChangedInterval;

function AutoScrollPlugin() {
  function AutoScroll() {
    this.defaults = {
      scroll: true,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: true
    }; // Bind all private methods

    for (var fn in this) {
      if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
        this[fn] = this[fn].bind(this);
      }
    }
  }

  AutoScroll.prototype = {
    dragStarted: function dragStarted(_ref) {
      var originalEvent = _ref.originalEvent;

      if (this.sortable.nativeDraggable) {
        on(document, 'dragover', this._handleAutoScroll);
      } else {
        if (this.options.supportPointer) {
          on(document, 'pointermove', this._handleFallbackAutoScroll);
        } else if (originalEvent.touches) {
          on(document, 'touchmove', this._handleFallbackAutoScroll);
        } else {
          on(document, 'mousemove', this._handleFallbackAutoScroll);
        }
      }
    },
    dragOverCompleted: function dragOverCompleted(_ref2) {
      var originalEvent = _ref2.originalEvent;

      // For when bubbling is canceled and using fallback (fallback 'touchmove' always reached)
      if (!this.options.dragOverBubble && !originalEvent.rootEl) {
        this._handleAutoScroll(originalEvent);
      }
    },
    drop: function drop() {
      if (this.sortable.nativeDraggable) {
        off(document, 'dragover', this._handleAutoScroll);
      } else {
        off(document, 'pointermove', this._handleFallbackAutoScroll);
        off(document, 'touchmove', this._handleFallbackAutoScroll);
        off(document, 'mousemove', this._handleFallbackAutoScroll);
      }

      clearPointerElemChangedInterval();
      clearAutoScrolls();
      cancelThrottle();
    },
    nulling: function nulling() {
      touchEvt$1 = scrollRootEl = scrollEl = scrolling = pointerElemChangedInterval = lastAutoScrollX = lastAutoScrollY = null;
      autoScrolls.length = 0;
    },
    _handleFallbackAutoScroll: function _handleFallbackAutoScroll(evt) {
      this._handleAutoScroll(evt, true);
    },
    _handleAutoScroll: function _handleAutoScroll(evt, fallback) {
      var _this = this;

      var x = (evt.touches ? evt.touches[0] : evt).clientX,
          y = (evt.touches ? evt.touches[0] : evt).clientY,
          elem = document.elementFromPoint(x, y);
      touchEvt$1 = evt; // IE does not seem to have native autoscroll,
      // Edge's autoscroll seems too conditional,
      // MACOS Safari does not have autoscroll,
      // Firefox and Chrome are good

      if (fallback || Edge || IE11OrLess || Safari) {
        autoScroll(evt, this.options, elem, fallback); // Listener for pointer element change

        var ogElemScroller = getParentAutoScrollElement(elem, true);

        if (scrolling && (!pointerElemChangedInterval || x !== lastAutoScrollX || y !== lastAutoScrollY)) {
          pointerElemChangedInterval && clearPointerElemChangedInterval(); // Detect for pointer elem change, emulating native DnD behaviour

          pointerElemChangedInterval = setInterval(function () {
            var newElem = getParentAutoScrollElement(document.elementFromPoint(x, y), true);

            if (newElem !== ogElemScroller) {
              ogElemScroller = newElem;
              clearAutoScrolls();
            }

            autoScroll(evt, _this.options, newElem, fallback);
          }, 10);
          lastAutoScrollX = x;
          lastAutoScrollY = y;
        }
      } else {
        // if DnD is enabled (and browser has good autoscrolling), first autoscroll will already scroll, so get parent autoscroll of first autoscroll
        if (!this.options.bubbleScroll || getParentAutoScrollElement(elem, true) === getWindowScrollingElement()) {
          clearAutoScrolls();
          return;
        }

        autoScroll(evt, this.options, getParentAutoScrollElement(elem, false), false);
      }
    }
  };
  return _extends$1(AutoScroll, {
    pluginName: 'scroll',
    initializeByDefault: true
  });
}

function clearAutoScrolls() {
  autoScrolls.forEach(function (autoScroll) {
    clearInterval(autoScroll.pid);
  });
  autoScrolls = [];
}

function clearPointerElemChangedInterval() {
  clearInterval(pointerElemChangedInterval);
}

var autoScroll = throttle$1(function (evt, options, rootEl, isFallback) {
  // Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
  if (!options.scroll) return;
  var x = (evt.touches ? evt.touches[0] : evt).clientX,
      y = (evt.touches ? evt.touches[0] : evt).clientY,
      sens = options.scrollSensitivity,
      speed = options.scrollSpeed,
      winScroller = getWindowScrollingElement();
  var scrollThisInstance = false,
      scrollCustomFn; // New scroll root, set scrollEl

  if (scrollRootEl !== rootEl) {
    scrollRootEl = rootEl;
    clearAutoScrolls();
    scrollEl = options.scroll;
    scrollCustomFn = options.scrollFn;

    if (scrollEl === true) {
      scrollEl = getParentAutoScrollElement(rootEl, true);
    }
  }

  var layersOut = 0;
  var currentParent = scrollEl;

  do {
    var el = currentParent,
        rect = getRect(el),
        top = rect.top,
        bottom = rect.bottom,
        left = rect.left,
        right = rect.right,
        width = rect.width,
        height = rect.height,
        canScrollX = void 0,
        canScrollY = void 0,
        scrollWidth = el.scrollWidth,
        scrollHeight = el.scrollHeight,
        elCSS = css(el),
        scrollPosX = el.scrollLeft,
        scrollPosY = el.scrollTop;

    if (el === winScroller) {
      canScrollX = width < scrollWidth && (elCSS.overflowX === 'auto' || elCSS.overflowX === 'scroll' || elCSS.overflowX === 'visible');
      canScrollY = height < scrollHeight && (elCSS.overflowY === 'auto' || elCSS.overflowY === 'scroll' || elCSS.overflowY === 'visible');
    } else {
      canScrollX = width < scrollWidth && (elCSS.overflowX === 'auto' || elCSS.overflowX === 'scroll');
      canScrollY = height < scrollHeight && (elCSS.overflowY === 'auto' || elCSS.overflowY === 'scroll');
    }

    var vx = canScrollX && (Math.abs(right - x) <= sens && scrollPosX + width < scrollWidth) - (Math.abs(left - x) <= sens && !!scrollPosX);
    var vy = canScrollY && (Math.abs(bottom - y) <= sens && scrollPosY + height < scrollHeight) - (Math.abs(top - y) <= sens && !!scrollPosY);

    if (!autoScrolls[layersOut]) {
      for (var i = 0; i <= layersOut; i++) {
        if (!autoScrolls[i]) {
          autoScrolls[i] = {};
        }
      }
    }

    if (autoScrolls[layersOut].vx != vx || autoScrolls[layersOut].vy != vy || autoScrolls[layersOut].el !== el) {
      autoScrolls[layersOut].el = el;
      autoScrolls[layersOut].vx = vx;
      autoScrolls[layersOut].vy = vy;
      clearInterval(autoScrolls[layersOut].pid);

      if (vx != 0 || vy != 0) {
        scrollThisInstance = true;
        /* jshint loopfunc:true */

        autoScrolls[layersOut].pid = setInterval(function () {
          // emulate drag over during autoscroll (fallback), emulating native DnD behaviour
          if (isFallback && this.layer === 0) {
            Sortable.active._onTouchMove(touchEvt$1); // To move ghost if it is positioned absolutely

          }

          var scrollOffsetY = autoScrolls[this.layer].vy ? autoScrolls[this.layer].vy * speed : 0;
          var scrollOffsetX = autoScrolls[this.layer].vx ? autoScrolls[this.layer].vx * speed : 0;

          if (typeof scrollCustomFn === 'function') {
            if (scrollCustomFn.call(Sortable.dragged.parentNode[expando], scrollOffsetX, scrollOffsetY, evt, touchEvt$1, autoScrolls[this.layer].el) !== 'continue') {
              return;
            }
          }

          scrollBy(autoScrolls[this.layer].el, scrollOffsetX, scrollOffsetY);
        }.bind({
          layer: layersOut
        }), 24);
      }
    }

    layersOut++;
  } while (options.bubbleScroll && currentParent !== winScroller && (currentParent = getParentAutoScrollElement(currentParent, false)));

  scrolling = scrollThisInstance; // in case another function catches scrolling as false in between when it is not
}, 30);

var drop = function drop(_ref) {
  var originalEvent = _ref.originalEvent,
      putSortable = _ref.putSortable,
      dragEl = _ref.dragEl,
      activeSortable = _ref.activeSortable,
      dispatchSortableEvent = _ref.dispatchSortableEvent,
      hideGhostForTarget = _ref.hideGhostForTarget,
      unhideGhostForTarget = _ref.unhideGhostForTarget;
  if (!originalEvent) return;
  var toSortable = putSortable || activeSortable;
  hideGhostForTarget();
  var touch = originalEvent.changedTouches && originalEvent.changedTouches.length ? originalEvent.changedTouches[0] : originalEvent;
  var target = document.elementFromPoint(touch.clientX, touch.clientY);
  unhideGhostForTarget();

  if (toSortable && !toSortable.el.contains(target)) {
    dispatchSortableEvent('spill');
    this.onSpill({
      dragEl: dragEl,
      putSortable: putSortable
    });
  }
};

function Revert() {}

Revert.prototype = {
  startIndex: null,
  dragStart: function dragStart(_ref2) {
    var oldDraggableIndex = _ref2.oldDraggableIndex;
    this.startIndex = oldDraggableIndex;
  },
  onSpill: function onSpill(_ref3) {
    var dragEl = _ref3.dragEl,
        putSortable = _ref3.putSortable;
    this.sortable.captureAnimationState();

    if (putSortable) {
      putSortable.captureAnimationState();
    }

    var nextSibling = getChild(this.sortable.el, this.startIndex, this.options);

    if (nextSibling) {
      this.sortable.el.insertBefore(dragEl, nextSibling);
    } else {
      this.sortable.el.appendChild(dragEl);
    }

    this.sortable.animateAll();

    if (putSortable) {
      putSortable.animateAll();
    }
  },
  drop: drop
};

_extends$1(Revert, {
  pluginName: 'revertOnSpill'
});

function Remove() {}

Remove.prototype = {
  onSpill: function onSpill(_ref4) {
    var dragEl = _ref4.dragEl,
        putSortable = _ref4.putSortable;
    var parentSortable = putSortable || this.sortable;
    parentSortable.captureAnimationState();
    dragEl.parentNode && dragEl.parentNode.removeChild(dragEl);
    parentSortable.animateAll();
  },
  drop: drop
};

_extends$1(Remove, {
  pluginName: 'removeOnSpill'
});

Sortable.mount(new AutoScrollPlugin());
Sortable.mount(Remove, Revert);

/**
 * Construit un élément représentant un chapitre
 *
 * @param {IChapter} chapter
 * @param {function} onUpdate
 * @return {HTMLLIElement}
 */

function Chapter({
  chapter,
  onUpdate,
  onRemove,
  onAdd,
  editPath
}) {
  function deleteChapter(e) {
    e.preventDefault();
    e.stopPropagation();
    const li = closest(e.currentTarget, 'li');
    li.parentElement.removeChild(li);
    onUpdate();
  }

  return html`
    <li data-title="${chapter.title}">
      <input type="text" value="${chapter.title}" class="chapters-editor__chapter" onblur=${onUpdate} />
      <button type="button" onclick=${deleteChapter} class="chapters-editor__delete">
        <svg class="icon icon-delete">
          <use xlink:href="/sprite.svg#delete"></use>
        </svg>
      </button>
      <ul>
        ${chapter.courses.map(c => html`
              <${Course} course=${c} onRemove=${onRemove} editPath=${editPath} />
            `)}
        <${AddButton} placeholder="Ajouter un cours" onAdd=${onAdd} />
      </ul>
    </li>
  `;
}
/**
 * Construit un élément représentant un cours
 *
 * @param {ICourse} course
 * @param {function} onRemove
 * @return {HTMLLIElement}
 */


function Course({
  course,
  onRemove,
  editPath
}) {
  const url = editPath.replace(':id', course.id);
  return html`
    <li class="chapters-editor__course" data-title=${course.title} data-id=${course.id}>
      <a href=${url} target="_blank">${course.title}</a>
      <button type="button" onclick=${onRemove} class="chapters-editor__delete">
        <svg class="icon icon-delete">
          <use xlink:href="/sprite.svg#delete"></use>
        </svg>
      </button>
    </li>
  `;
}
/**
 * Bouton d'ajout de contenu
 *
 * @param {string} placeholder
 * @param {function(string, HTMLLIElement)} onAdd
 * @return HTMLLIElement
 * @constructor
 */


function AddButton({
  placeholder,
  onAdd
}) {
  const callback = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const li = closest(e.currentTarget, 'li');
    const input = li.querySelector('input');
    onAdd(input.value, li);
    input.value = '';
    input.focus();
  };

  return html`
    <li class="chapters-editor__add">
      <input type="text" placeholder=${placeholder} onkeydown=${enterKeyListener(callback)} />
      <button type="button" onclick=${callback}>
        <svg class="icon icon-add">
          <use xlink:href="/sprite.svg#delete"></use>
        </svg>
      </button>
    </li>
  `;
}
/**
 * CustomElement pour la gestion des chapitres associé aux formations
 *
 * @property {HTMLUListElement} list <ul> contenant la liste des chapitres
 * @property {string} editPath URL d'édition d'un cours
 * @typedef {{title: string, courses: ICourse[]}} IChapter
 * @typedef {{id: number, title: string}} ICourse
 */


class ChaptersEditor extends HTMLTextAreaElement {
  constructor() {
    super();
    this.sortables = [];
    this.updateInput = this.updateInput.bind(this);
    this.removeCourse = this.removeCourse.bind(this);
    this.addCourse = this.addCourse.bind(this);
    this.addChapter = this.addChapter.bind(this);
    this.sortableOptions = {
      group: 'nested',
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      filter: '.chapters-editor__add',
      preventOnFilter: false,
      onEnd: this.updateInput
    };
  }

  connectedCallback() {
    this.style.display = 'none';
    this.editPath = this.getAttribute('endpoint-edit');
    this.list = this.renderList();
    this.bindSortable();
    this.insertAdjacentElement('afterend', this.list);
  }
  /**
   * Construit la liste de chapitre
   *
   * @param {IChapter[]} chapters
   * @return HTMLUListElement
   */


  renderList() {
    const chapters = JSON.parse(this.value);
    return html`
      <ul class="chapters-editor stack">
        ${chapters.map(chapter => html`
              <${Chapter}
                chapter=${chapter}
                onUpdate=${this.updateInput}
                onRemove=${this.removeCourse}
                onAdd="${this.addCourse}"
                editPath="${this.editPath}"
              />
            `)}
        <${AddButton} placeholder="Ajouter un chapitre" onAdd=${this.addChapter} />
      </ul>
    `;
  }
  /**
   * Ajoute un cours
   *
   * @param {KeyboardEvent} e
   */


  async addCourse(value, li) {
    if (value === '') {
      return;
    }

    const endpoint = this.getAttribute('endpoint').replace(':id', value);

    try {
      const course = await jsonFetch(endpoint);
      const courseLi = Course({
        course,
        onRemove: this.removeCourse,
        editPath: this.editPath
      });
      li.insertAdjacentElement('beforebegin', courseLi);
      this.updateInput();
    } catch (e) {
      alert(e.detail || e);
    }
  }
  /**
   * Supprime un cours de la liste des chapitres
   *
   * @param {MouseEvent} e
   */


  async removeCourse(e) {
    e.preventDefault();

    if (e.currentTarget instanceof HTMLButtonElement) {
      const li = closest(e.currentTarget, 'li');
      li.parentElement.removeChild(li);
      this.updateInput();
    }
  }
  /**
   * @param {KeyboardEvent|MouseEvent} e
   */


  addChapter(title, li) {
    const chapter = {
      title,
      courses: []
    };
    const chapterLi = html`
      <${Chapter}
        chapter=${chapter}
        onUpdate=${this.updateInput}
        onRemove=${this.removeCourse}
        onAdd=${this.addCourse}
        editPath=${this.editPath}
      />
    `;
    li.insertAdjacentElement('beforebegin', chapterLi);
    this.sortables.push(new Sortable(chapterLi.querySelector('ul'), this.sortableOptions));
  }
  /**
   * Greffer le comportement sortablejs
   */


  bindSortable() {
    this.sortables = Array.from(this.list.querySelectorAll('ul')).map(u => {
      return new Sortable(u, this.sortableOptions);
    });
    this.sortables.push(new Sortable(this.list, { ...this.sortableOptions,
      group: 'parent'
    }));
  }
  /**
   * Met à jour le champs avec les nouvelles données
   *
   * @param {HTMLUListElement} ul
   * @param {HTMLTextAreaElement} input
   */


  updateInput() {
    const newChapters = [];
    Array.from(this.list.children).forEach(li => {
      const courses = li.querySelectorAll('li'); // Il n'y a plus de cours dans ce chapitre

      if (courses.length === 0) {
        return;
      } // On ajoute le chapitre au tableau


      newChapters.push({
        title: li.querySelector('input').value,
        courses: Array.from(courses).map(l => {
          if (l.dataset.id === undefined) {
            return null;
          }

          return {
            id: l.dataset.id,
            title: l.dataset.title
          };
        }).filter(c => c !== null)
      });
    });
    this.value = JSON.stringify(newChapters);
  }

  disconnectedCallback() {
    this.sortables.forEach(sortable => sortable.destroy());

    if (this.list.parentElement) {
      this.list.parentElement.removeChild(this.list);
    }
  }

}

/**
 * Construit un élément représentant un élément
 *
 * @param {ICourse} course
 * @param {function} onRemove
 * @return {HTMLLIElement}
 */

function createLi(item) {
  const li = document.createElement('li');
  li.classList.add('sortable-item');
  li.setAttribute('class', 'sortable-item');
  li.setAttribute('data-id', item.id.toString());
  li.innerHTML = `
    <a href="${item.url}">${item.name}</a>
    <button type="button" class="sortable-item__delete">
      <svg class="icon icon-add">
        <use xlink:href="/sprite.svg#delete"></use>
      </svg>
    </button>
  `;
  li.querySelector('button').addEventListener('click', async e => {
    if (confirm('Sûr ?')) {
      e.preventDefault();
      const loader = showLoader(li);
      await jsonFetch(item.url, {
        method: 'DELETE'
      });
      hideLoader(loader);
      li.parentElement.removeChild(li);
    }
  });
  const ul = document.createElement('ul');
  ul.setAttribute('data-parent', item.id.toString());

  if (item.children.length > 0) {
    item.children.forEach(i => ul.appendChild(createLi(i)));
  }

  li.appendChild(ul);
  return li;
}
/**
 * @param {HTMLElement} item
 * @return {Element}
 */


function showLoader(item) {
  const loader = new SpinningDots();
  loader.classList.add('sortable-item__loader');
  item.insertAdjacentElement('afterbegin', loader);
  return loader;
}
/**
 * @param {HTMLElement} item
 */


function hideLoader(loader) {
  loader.parentElement.removeChild(loader);
}
/**
 * CustomElement pour la gestion d'une liste réorganisable sur 2 niveaux
 *
 * @property {HTMLUListElement} list <ul> contenant la liste des chapitres
 * @property {string} editPath URL d'édition d'un cours
 * @typedef {{title: string, courses: ICourse[]}} IChapter
 * @typedef {{id: number, title: string}} ICourse
 */


class ItemSorter extends HTMLElement {
  constructor() {
    super();
    this.sortables = [];
    this.sortableOptions = {
      group: 'nested',
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      preventOnFilter: false,
      onEnd: this.persist.bind(this)
    };
  }

  connectedCallback() {
    this.list = this.renderList();
    this.appendChild(this.list);
    this.bindSortable();
  }
  /**
   * Construit la liste de chapitre
   *
   * @param {IChapter[]} chapters
   * @return HTMLUListElement
   */


  renderList() {
    const items = JSON.parse(this.getAttribute('items'));
    const ul = document.createElement('ul');
    ul.setAttribute('class', 'sortable-items stack');
    items.forEach(i => ul.appendChild(createLi(i)));
    return ul;
  }
  /**
   * Greffer le comportement sortablejs
   */


  bindSortable() {
    this.sortables = Array.from(this.list.querySelectorAll('ul')).map(u => {
      return new Sortable(u, this.sortableOptions);
    });
    this.sortables.push(new Sortable(this.list, { ...this.sortableOptions
    }));
  }

  disconnectedCallback() {
    this.sortables.forEach(sortable => sortable.destroy());

    if (this.list.parentElement) {
      this.list.parentElement.removeChild(this.list);
    }
  }

  async persist(e) {
    const parentId = e.to.dataset.parent || null;
    const positions = Array.from(e.to.children).map((li, k) => {
      return {
        id: li.dataset.id,
        position: k,
        parent: parentId
      };
    });
    const loader = showLoader(e.item);
    await jsonFetch(this.getAttribute('endpoint'), {
      method: 'POST',
      body: JSON.stringify({
        positions
      })
    });
    hideLoader(loader);
  }

}

function FormNotification() {
  const onSuccess = function () {
    flash('Notification envoyée avec succès');
  };

  return v(FetchForm, {
    action: "/api/notifications",
    className: "stack",
    onSuccess: onSuccess
  }, v(FormField, {
    name: "message",
    type: "textarea"
  }), v(FormField, {
    name: "url",
    defaultValue: window.location.origin
  }), v(FormPrimaryButton, null, "Notifier"));
}

function preactCustomElement$1(tagName, Component, propNames, options) {
  function PreactElement() {
    const inst = Reflect.construct(HTMLElement, [], PreactElement);
    inst._vdomComponent = Component;
    inst._root = options && options.shadow ? inst.attachShadow({
      mode: 'open'
    }) : inst;
    return inst;
  }

  PreactElement.prototype = Object.create(HTMLElement.prototype);
  PreactElement.prototype.constructor = PreactElement;
  PreactElement.prototype.connectedCallback = connectedCallback$1;
  PreactElement.prototype.attributeChangedCallback = attributeChangedCallback$1;
  PreactElement.prototype.detachedCallback = detachedCallback$1;
  PreactElement.observedAttributes = propNames || Component.observedAttributes || Object.keys(Component.propTypes || {});
  return customElements.define(tagName || Component.tagName || Component.displayName || Component.name, PreactElement);
}

function connectedCallback$1() {
  this._vdom = toVdom$1(this, this._vdomComponent);
  (this.hasAttribute('hydrate') ? O : M)(this._vdom, this._root);
}

function attributeChangedCallback$1(name, oldValue, newValue) {
  if (!this._vdom) return;
  const props = {};
  props[name] = newValue;
  this._vdom = S(this._vdom, props);
  M(this._vdom, this._root);
}

function detachedCallback$1() {
  M(this._vdom = null, this._root);
}

function toVdom$1(element, nodeName) {
  if (element.nodeType === Node.TEXT_NODE) return element.data;
  if (element.nodeType !== Node.ELEMENT_NODE) return null;
  const children = [];
  const props = {};
  let i = 0;
  const a = element.attributes;
  const cn = element.childNodes;

  for (i = a.length; i--;) props[a[i].name] = a[i].value;

  for (i = cn.length; i--;) children[i] = toVdom$1(cn[i]);

  props.parent = element;
  return v(nodeName || element.nodeName.toLowerCase(), props, children);
}

var turbolinks = createCommonjsModule(function (module) {
/*
Turbolinks 5.2.0
Copyright © 2018 Basecamp, LLC
 */
(function(){var t=this;(function(){(function(){this.Turbolinks={supported:function(){return null!=window.history.pushState&&null!=window.requestAnimationFrame&&null!=window.addEventListener}(),visit:function(t,r){return e.controller.visit(t,r)},clearCache:function(){return e.controller.clearCache()},setProgressBarDelay:function(t){return e.controller.setProgressBarDelay(t)}};}).call(this);}).call(t);var e=t.Turbolinks;(function(){(function(){var t,r,n,o=[].slice;e.copyObject=function(t){var e,r,n;r={};for(e in t)n=t[e],r[e]=n;return r},e.closest=function(e,r){return t.call(e,r)},t=function(){var t,e;return t=document.documentElement,null!=(e=t.closest)?e:function(t){var e;for(e=this;e;){if(e.nodeType===Node.ELEMENT_NODE&&r.call(e,t))return e;e=e.parentNode;}}}(),e.defer=function(t){return setTimeout(t,1)},e.throttle=function(t){var e;return e=null,function(){var r;return r=1<=arguments.length?o.call(arguments,0):[],null!=e?e:e=requestAnimationFrame(function(n){return function(){return e=null,t.apply(n,r)}}(this))}},e.dispatch=function(t,e){var r,o,i,s,a,u;return a=null!=e?e:{},u=a.target,r=a.cancelable,o=a.data,i=document.createEvent("Events"),i.initEvent(t,!0,r===!0),i.data=null!=o?o:{},i.cancelable&&!n&&(s=i.preventDefault,i.preventDefault=function(){return this.defaultPrevented||Object.defineProperty(this,"defaultPrevented",{get:function(){return !0}}),s.call(this)}),(null!=u?u:document).dispatchEvent(i),i},n=function(){var t;return t=document.createEvent("Events"),t.initEvent("test",!0,!0),t.preventDefault(),t.defaultPrevented}(),e.match=function(t,e){return r.call(t,e)},r=function(){var t,e,r,n;return t=document.documentElement,null!=(e=null!=(r=null!=(n=t.matchesSelector)?n:t.webkitMatchesSelector)?r:t.msMatchesSelector)?e:t.mozMatchesSelector}(),e.uuid=function(){var t,e,r;for(r="",t=e=1;36>=e;t=++e)r+=9===t||14===t||19===t||24===t?"-":15===t?"4":20===t?(Math.floor(4*Math.random())+8).toString(16):Math.floor(15*Math.random()).toString(16);return r};}).call(this),function(){e.Location=function(){function t(t){var e,r;null==t&&(t=""),r=document.createElement("a"),r.href=t.toString(),this.absoluteURL=r.href,e=r.hash.length,2>e?this.requestURL=this.absoluteURL:(this.requestURL=this.absoluteURL.slice(0,-e),this.anchor=r.hash.slice(1));}var e,r,n,o;return t.wrap=function(t){return t instanceof this?t:new this(t)},t.prototype.getOrigin=function(){return this.absoluteURL.split("/",3).join("/")},t.prototype.getPath=function(){var t,e;return null!=(t=null!=(e=this.requestURL.match(/\/\/[^\/]*(\/[^?;]*)/))?e[1]:void 0)?t:"/"},t.prototype.getPathComponents=function(){return this.getPath().split("/").slice(1)},t.prototype.getLastPathComponent=function(){return this.getPathComponents().slice(-1)[0]},t.prototype.getExtension=function(){var t,e;return null!=(t=null!=(e=this.getLastPathComponent().match(/\.[^.]*$/))?e[0]:void 0)?t:""},t.prototype.isHTML=function(){return this.getExtension().match(/^(?:|\.(?:htm|html|xhtml))$/)},t.prototype.isPrefixedBy=function(t){var e;return e=r(t),this.isEqualTo(t)||o(this.absoluteURL,e)},t.prototype.isEqualTo=function(t){return this.absoluteURL===(null!=t?t.absoluteURL:void 0)},t.prototype.toCacheKey=function(){return this.requestURL},t.prototype.toJSON=function(){return this.absoluteURL},t.prototype.toString=function(){return this.absoluteURL},t.prototype.valueOf=function(){return this.absoluteURL},r=function(t){return e(t.getOrigin()+t.getPath())},e=function(t){return n(t,"/")?t:t+"/"},o=function(t,e){return t.slice(0,e.length)===e},n=function(t,e){return t.slice(-e.length)===e},t}();}.call(this),function(){var t=function(t,e){return function(){return t.apply(e,arguments)}};e.HttpRequest=function(){function r(r,n,o){this.delegate=r,this.requestCanceled=t(this.requestCanceled,this),this.requestTimedOut=t(this.requestTimedOut,this),this.requestFailed=t(this.requestFailed,this),this.requestLoaded=t(this.requestLoaded,this),this.requestProgressed=t(this.requestProgressed,this),this.url=e.Location.wrap(n).requestURL,this.referrer=e.Location.wrap(o).absoluteURL,this.createXHR();}return r.NETWORK_FAILURE=0,r.TIMEOUT_FAILURE=-1,r.timeout=60,r.prototype.send=function(){var t;return this.xhr&&!this.sent?(this.notifyApplicationBeforeRequestStart(),this.setProgress(0),this.xhr.send(),this.sent=!0,"function"==typeof(t=this.delegate).requestStarted?t.requestStarted():void 0):void 0},r.prototype.cancel=function(){return this.xhr&&this.sent?this.xhr.abort():void 0},r.prototype.requestProgressed=function(t){return t.lengthComputable?this.setProgress(t.loaded/t.total):void 0},r.prototype.requestLoaded=function(){return this.endRequest(function(t){return function(){var e;return 200<=(e=t.xhr.status)&&300>e?t.delegate.requestCompletedWithResponse(t.xhr.responseText,t.xhr.getResponseHeader("Turbolinks-Location")):(t.failed=!0,t.delegate.requestFailedWithStatusCode(t.xhr.status,t.xhr.responseText))}}(this))},r.prototype.requestFailed=function(){return this.endRequest(function(t){return function(){return t.failed=!0,t.delegate.requestFailedWithStatusCode(t.constructor.NETWORK_FAILURE)}}(this))},r.prototype.requestTimedOut=function(){return this.endRequest(function(t){return function(){return t.failed=!0,t.delegate.requestFailedWithStatusCode(t.constructor.TIMEOUT_FAILURE)}}(this))},r.prototype.requestCanceled=function(){return this.endRequest()},r.prototype.notifyApplicationBeforeRequestStart=function(){return e.dispatch("turbolinks:request-start",{data:{url:this.url,xhr:this.xhr}})},r.prototype.notifyApplicationAfterRequestEnd=function(){return e.dispatch("turbolinks:request-end",{data:{url:this.url,xhr:this.xhr}})},r.prototype.createXHR=function(){return this.xhr=new XMLHttpRequest,this.xhr.open("GET",this.url,!0),this.xhr.timeout=1e3*this.constructor.timeout,this.xhr.setRequestHeader("Accept","text/html, application/xhtml+xml"),this.xhr.setRequestHeader("Turbolinks-Referrer",this.referrer),this.xhr.onprogress=this.requestProgressed,this.xhr.onload=this.requestLoaded,this.xhr.onerror=this.requestFailed,this.xhr.ontimeout=this.requestTimedOut,this.xhr.onabort=this.requestCanceled},r.prototype.endRequest=function(t){return this.xhr?(this.notifyApplicationAfterRequestEnd(),null!=t&&t.call(this),this.destroy()):void 0},r.prototype.setProgress=function(t){var e;return this.progress=t,"function"==typeof(e=this.delegate).requestProgressed?e.requestProgressed(this.progress):void 0},r.prototype.destroy=function(){var t;return this.setProgress(1),"function"==typeof(t=this.delegate).requestFinished&&t.requestFinished(),this.delegate=null,this.xhr=null},r}();}.call(this),function(){var t=function(t,e){return function(){return t.apply(e,arguments)}};e.ProgressBar=function(){function e(){this.trickle=t(this.trickle,this),this.stylesheetElement=this.createStylesheetElement(),this.progressElement=this.createProgressElement();}var r;return r=300,e.defaultCSS=".turbolinks-progress-bar {\n  position: fixed;\n  display: block;\n  top: 0;\n  left: 0;\n  height: 3px;\n  background: #0076ff;\n  z-index: 9999;\n  transition: width "+r+"ms ease-out, opacity "+r/2+"ms "+r/2+"ms ease-in;\n  transform: translate3d(0, 0, 0);\n}",e.prototype.show=function(){return this.visible?void 0:(this.visible=!0,this.installStylesheetElement(),this.installProgressElement(),this.startTrickling())},e.prototype.hide=function(){return this.visible&&!this.hiding?(this.hiding=!0,this.fadeProgressElement(function(t){return function(){return t.uninstallProgressElement(),t.stopTrickling(),t.visible=!1,t.hiding=!1}}(this))):void 0},e.prototype.setValue=function(t){return this.value=t,this.refresh()},e.prototype.installStylesheetElement=function(){return document.head.insertBefore(this.stylesheetElement,document.head.firstChild)},e.prototype.installProgressElement=function(){return this.progressElement.style.width=0,this.progressElement.style.opacity=1,document.documentElement.insertBefore(this.progressElement,document.body),this.refresh()},e.prototype.fadeProgressElement=function(t){return this.progressElement.style.opacity=0,setTimeout(t,1.5*r)},e.prototype.uninstallProgressElement=function(){return this.progressElement.parentNode?document.documentElement.removeChild(this.progressElement):void 0},e.prototype.startTrickling=function(){return null!=this.trickleInterval?this.trickleInterval:this.trickleInterval=setInterval(this.trickle,r)},e.prototype.stopTrickling=function(){return clearInterval(this.trickleInterval),this.trickleInterval=null},e.prototype.trickle=function(){return this.setValue(this.value+Math.random()/100)},e.prototype.refresh=function(){return requestAnimationFrame(function(t){return function(){return t.progressElement.style.width=10+90*t.value+"%"}}(this))},e.prototype.createStylesheetElement=function(){var t;return t=document.createElement("style"),t.type="text/css",t.textContent=this.constructor.defaultCSS,t},e.prototype.createProgressElement=function(){var t;return t=document.createElement("div"),t.className="turbolinks-progress-bar",t},e}();}.call(this),function(){var t=function(t,e){return function(){return t.apply(e,arguments)}};e.BrowserAdapter=function(){function r(r){this.controller=r,this.showProgressBar=t(this.showProgressBar,this),this.progressBar=new e.ProgressBar;}var n,o,i;return i=e.HttpRequest,n=i.NETWORK_FAILURE,o=i.TIMEOUT_FAILURE,r.prototype.visitProposedToLocationWithAction=function(t,e){return this.controller.startVisitToLocationWithAction(t,e)},r.prototype.visitStarted=function(t){return t.issueRequest(),t.changeHistory(),t.loadCachedSnapshot()},r.prototype.visitRequestStarted=function(t){return this.progressBar.setValue(0),t.hasCachedSnapshot()||"restore"!==t.action?this.showProgressBarAfterDelay():this.showProgressBar()},r.prototype.visitRequestProgressed=function(t){return this.progressBar.setValue(t.progress)},r.prototype.visitRequestCompleted=function(t){return t.loadResponse()},r.prototype.visitRequestFailedWithStatusCode=function(t,e){switch(e){case n:case o:return this.reload();default:return t.loadResponse()}},r.prototype.visitRequestFinished=function(t){return this.hideProgressBar()},r.prototype.visitCompleted=function(t){return t.followRedirect()},r.prototype.pageInvalidated=function(){return this.reload()},r.prototype.showProgressBarAfterDelay=function(){return this.progressBarTimeout=setTimeout(this.showProgressBar,this.controller.progressBarDelay)},r.prototype.showProgressBar=function(){return this.progressBar.show()},r.prototype.hideProgressBar=function(){return this.progressBar.hide(),clearTimeout(this.progressBarTimeout)},r.prototype.reload=function(){return window.location.reload()},r}();}.call(this),function(){var t=function(t,e){return function(){return t.apply(e,arguments)}};e.History=function(){function r(e){this.delegate=e,this.onPageLoad=t(this.onPageLoad,this),this.onPopState=t(this.onPopState,this);}return r.prototype.start=function(){return this.started?void 0:(addEventListener("popstate",this.onPopState,!1),addEventListener("load",this.onPageLoad,!1),this.started=!0)},r.prototype.stop=function(){return this.started?(removeEventListener("popstate",this.onPopState,!1),removeEventListener("load",this.onPageLoad,!1),this.started=!1):void 0},r.prototype.push=function(t,r){return t=e.Location.wrap(t),this.update("push",t,r)},r.prototype.replace=function(t,r){return t=e.Location.wrap(t),this.update("replace",t,r)},r.prototype.onPopState=function(t){var r,n,o,i;return this.shouldHandlePopState()&&(i=null!=(n=t.state)?n.turbolinks:void 0)?(r=e.Location.wrap(window.location),o=i.restorationIdentifier,this.delegate.historyPoppedToLocationWithRestorationIdentifier(r,o)):void 0},r.prototype.onPageLoad=function(t){return e.defer(function(t){return function(){return t.pageLoaded=!0}}(this))},r.prototype.shouldHandlePopState=function(){return this.pageIsLoaded()},r.prototype.pageIsLoaded=function(){return this.pageLoaded||"complete"===document.readyState},r.prototype.update=function(t,e,r){var n;return n={turbolinks:{restorationIdentifier:r}},history[t+"State"](n,null,e)},r}();}.call(this),function(){e.HeadDetails=function(){function t(t){var e,r,n,s,a,u;for(this.elements={},n=0,a=t.length;a>n;n++)u=t[n],u.nodeType===Node.ELEMENT_NODE&&(s=u.outerHTML,r=null!=(e=this.elements)[s]?e[s]:e[s]={type:i(u),tracked:o(u),elements:[]},r.elements.push(u));}var e,r,n,o,i;return t.fromHeadElement=function(t){var e;return new this(null!=(e=null!=t?t.childNodes:void 0)?e:[])},t.prototype.hasElementWithKey=function(t){return t in this.elements},t.prototype.getTrackedElementSignature=function(){var t,e;return function(){var r,n;r=this.elements,n=[];for(t in r)e=r[t].tracked,e&&n.push(t);return n}.call(this).join("")},t.prototype.getScriptElementsNotInDetails=function(t){return this.getElementsMatchingTypeNotInDetails("script",t)},t.prototype.getStylesheetElementsNotInDetails=function(t){return this.getElementsMatchingTypeNotInDetails("stylesheet",t)},t.prototype.getElementsMatchingTypeNotInDetails=function(t,e){var r,n,o,i,s,a;o=this.elements,s=[];for(n in o)i=o[n],a=i.type,r=i.elements,a!==t||e.hasElementWithKey(n)||s.push(r[0]);return s},t.prototype.getProvisionalElements=function(){var t,e,r,n,o,i,s;r=[],n=this.elements;for(e in n)o=n[e],s=o.type,i=o.tracked,t=o.elements,null!=s||i?t.length>1&&r.push.apply(r,t.slice(1)):r.push.apply(r,t);return r},t.prototype.getMetaValue=function(t){var e;return null!=(e=this.findMetaElementByName(t))?e.getAttribute("content"):void 0},t.prototype.findMetaElementByName=function(t){var r,n,o,i;r=void 0,i=this.elements;for(o in i)n=i[o].elements,e(n[0],t)&&(r=n[0]);return r},i=function(t){return r(t)?"script":n(t)?"stylesheet":void 0},o=function(t){return "reload"===t.getAttribute("data-turbolinks-track")},r=function(t){var e;return e=t.tagName.toLowerCase(),"script"===e},n=function(t){var e;return e=t.tagName.toLowerCase(),"style"===e||"link"===e&&"stylesheet"===t.getAttribute("rel")},e=function(t,e){var r;return r=t.tagName.toLowerCase(),"meta"===r&&t.getAttribute("name")===e},t}();}.call(this),function(){e.Snapshot=function(){function t(t,e){this.headDetails=t,this.bodyElement=e;}return t.wrap=function(t){return t instanceof this?t:"string"==typeof t?this.fromHTMLString(t):this.fromHTMLElement(t)},t.fromHTMLString=function(t){var e;return e=document.createElement("html"),e.innerHTML=t,this.fromHTMLElement(e)},t.fromHTMLElement=function(t){var r,n,o,i;return o=t.querySelector("head"),r=null!=(i=t.querySelector("body"))?i:document.createElement("body"),n=e.HeadDetails.fromHeadElement(o),new this(n,r)},t.prototype.clone=function(){return new this.constructor(this.headDetails,this.bodyElement.cloneNode(!0))},t.prototype.getRootLocation=function(){var t,r;return r=null!=(t=this.getSetting("root"))?t:"/",new e.Location(r)},t.prototype.getCacheControlValue=function(){return this.getSetting("cache-control")},t.prototype.getElementForAnchor=function(t){try{return this.bodyElement.querySelector("[id='"+t+"'], a[name='"+t+"']")}catch(e){}},t.prototype.getPermanentElements=function(){return this.bodyElement.querySelectorAll("[id][data-turbolinks-permanent]")},t.prototype.getPermanentElementById=function(t){return this.bodyElement.querySelector("#"+t+"[data-turbolinks-permanent]")},t.prototype.getPermanentElementsPresentInSnapshot=function(t){var e,r,n,o,i;for(o=this.getPermanentElements(),i=[],r=0,n=o.length;n>r;r++)e=o[r],t.getPermanentElementById(e.id)&&i.push(e);return i},t.prototype.findFirstAutofocusableElement=function(){return this.bodyElement.querySelector("[autofocus]")},t.prototype.hasAnchor=function(t){return null!=this.getElementForAnchor(t)},t.prototype.isPreviewable=function(){return "no-preview"!==this.getCacheControlValue()},t.prototype.isCacheable=function(){return "no-cache"!==this.getCacheControlValue()},t.prototype.isVisitable=function(){return "reload"!==this.getSetting("visit-control")},t.prototype.getSetting=function(t){return this.headDetails.getMetaValue("turbolinks-"+t)},t}();}.call(this),function(){var t=[].slice;e.Renderer=function(){function e(){}var r;return e.render=function(){var e,r,n,o;return n=arguments[0],r=arguments[1],e=3<=arguments.length?t.call(arguments,2):[],o=function(t,e,r){r.prototype=t.prototype;var n=new r,o=t.apply(n,e);return Object(o)===o?o:n}(this,e,function(){}),o.delegate=n,o.render(r),o},e.prototype.renderView=function(t){return this.delegate.viewWillRender(this.newBody),t(),this.delegate.viewRendered(this.newBody)},e.prototype.invalidateView=function(){return this.delegate.viewInvalidated()},e.prototype.createScriptElement=function(t){var e;return "false"===t.getAttribute("data-turbolinks-eval")?t:(e=document.createElement("script"),e.textContent=t.textContent,e.async=!1,r(e,t),e)},r=function(t,e){var r,n,o,i,s,a,u;for(i=e.attributes,a=[],r=0,n=i.length;n>r;r++)s=i[r],o=s.name,u=s.value,a.push(t.setAttribute(o,u));return a},e}();}.call(this),function(){var t,r,n=function(t,e){function r(){this.constructor=t;}for(var n in e)o.call(e,n)&&(t[n]=e[n]);return r.prototype=e.prototype,t.prototype=new r,t.__super__=e.prototype,t},o={}.hasOwnProperty;e.SnapshotRenderer=function(e){function o(t,e,r){this.currentSnapshot=t,this.newSnapshot=e,this.isPreview=r,this.currentHeadDetails=this.currentSnapshot.headDetails,this.newHeadDetails=this.newSnapshot.headDetails,this.currentBody=this.currentSnapshot.bodyElement,this.newBody=this.newSnapshot.bodyElement;}return n(o,e),o.prototype.render=function(t){return this.shouldRender()?(this.mergeHead(),this.renderView(function(e){return function(){return e.replaceBody(),e.isPreview||e.focusFirstAutofocusableElement(),t()}}(this))):this.invalidateView()},o.prototype.mergeHead=function(){return this.copyNewHeadStylesheetElements(),this.copyNewHeadScriptElements(),this.removeCurrentHeadProvisionalElements(),this.copyNewHeadProvisionalElements()},o.prototype.replaceBody=function(){var t;return t=this.relocateCurrentBodyPermanentElements(),this.activateNewBodyScriptElements(),this.assignNewBody(),this.replacePlaceholderElementsWithClonedPermanentElements(t)},o.prototype.shouldRender=function(){return this.newSnapshot.isVisitable()&&this.trackedElementsAreIdentical()},o.prototype.trackedElementsAreIdentical=function(){return this.currentHeadDetails.getTrackedElementSignature()===this.newHeadDetails.getTrackedElementSignature()},o.prototype.copyNewHeadStylesheetElements=function(){var t,e,r,n,o;for(n=this.getNewHeadStylesheetElements(),o=[],e=0,r=n.length;r>e;e++)t=n[e],o.push(document.head.appendChild(t));return o},o.prototype.copyNewHeadScriptElements=function(){var t,e,r,n,o;for(n=this.getNewHeadScriptElements(),o=[],e=0,r=n.length;r>e;e++)t=n[e],o.push(document.head.appendChild(this.createScriptElement(t)));return o},o.prototype.removeCurrentHeadProvisionalElements=function(){var t,e,r,n,o;for(n=this.getCurrentHeadProvisionalElements(),o=[],e=0,r=n.length;r>e;e++)t=n[e],o.push(document.head.removeChild(t));return o},o.prototype.copyNewHeadProvisionalElements=function(){var t,e,r,n,o;for(n=this.getNewHeadProvisionalElements(),o=[],e=0,r=n.length;r>e;e++)t=n[e],o.push(document.head.appendChild(t));return o},o.prototype.relocateCurrentBodyPermanentElements=function(){var e,n,o,i,s,a,u;for(a=this.getCurrentBodyPermanentElements(),u=[],e=0,n=a.length;n>e;e++)i=a[e],s=t(i),o=this.newSnapshot.getPermanentElementById(i.id),r(i,s.element),r(o,i),u.push(s);return u},o.prototype.replacePlaceholderElementsWithClonedPermanentElements=function(t){var e,n,o,i,s,a,u;for(u=[],o=0,i=t.length;i>o;o++)a=t[o],n=a.element,s=a.permanentElement,e=s.cloneNode(!0),u.push(r(n,e));return u},o.prototype.activateNewBodyScriptElements=function(){var t,e,n,o,i,s;for(i=this.getNewBodyScriptElements(),s=[],e=0,o=i.length;o>e;e++)n=i[e],t=this.createScriptElement(n),s.push(r(n,t));return s},o.prototype.assignNewBody=function(){return document.body=this.newBody},o.prototype.focusFirstAutofocusableElement=function(){var t;return null!=(t=this.newSnapshot.findFirstAutofocusableElement())?t.focus():void 0},o.prototype.getNewHeadStylesheetElements=function(){return this.newHeadDetails.getStylesheetElementsNotInDetails(this.currentHeadDetails)},o.prototype.getNewHeadScriptElements=function(){return this.newHeadDetails.getScriptElementsNotInDetails(this.currentHeadDetails)},o.prototype.getCurrentHeadProvisionalElements=function(){return this.currentHeadDetails.getProvisionalElements()},o.prototype.getNewHeadProvisionalElements=function(){return this.newHeadDetails.getProvisionalElements()},o.prototype.getCurrentBodyPermanentElements=function(){return this.currentSnapshot.getPermanentElementsPresentInSnapshot(this.newSnapshot)},o.prototype.getNewBodyScriptElements=function(){return this.newBody.querySelectorAll("script")},o}(e.Renderer),t=function(t){var e;return e=document.createElement("meta"),e.setAttribute("name","turbolinks-permanent-placeholder"),e.setAttribute("content",t.id),{element:e,permanentElement:t}},r=function(t,e){var r;return (r=t.parentNode)?r.replaceChild(e,t):void 0};}.call(this),function(){var t=function(t,e){function n(){this.constructor=t;}for(var o in e)r.call(e,o)&&(t[o]=e[o]);return n.prototype=e.prototype,t.prototype=new n,t.__super__=e.prototype,t},r={}.hasOwnProperty;e.ErrorRenderer=function(e){function r(t){var e;e=document.createElement("html"),e.innerHTML=t,this.newHead=e.querySelector("head"),this.newBody=e.querySelector("body");}return t(r,e),r.prototype.render=function(t){return this.renderView(function(e){return function(){return e.replaceHeadAndBody(),e.activateBodyScriptElements(),t()}}(this))},r.prototype.replaceHeadAndBody=function(){var t,e;return e=document.head,t=document.body,e.parentNode.replaceChild(this.newHead,e),t.parentNode.replaceChild(this.newBody,t)},r.prototype.activateBodyScriptElements=function(){var t,e,r,n,o,i;for(n=this.getScriptElements(),i=[],e=0,r=n.length;r>e;e++)o=n[e],t=this.createScriptElement(o),i.push(o.parentNode.replaceChild(t,o));return i},r.prototype.getScriptElements=function(){return document.documentElement.querySelectorAll("script")},r}(e.Renderer);}.call(this),function(){e.View=function(){function t(t){this.delegate=t,this.htmlElement=document.documentElement;}return t.prototype.getRootLocation=function(){return this.getSnapshot().getRootLocation()},t.prototype.getElementForAnchor=function(t){return this.getSnapshot().getElementForAnchor(t)},t.prototype.getSnapshot=function(){return e.Snapshot.fromHTMLElement(this.htmlElement)},t.prototype.render=function(t,e){var r,n,o;return o=t.snapshot,r=t.error,n=t.isPreview,this.markAsPreview(n),null!=o?this.renderSnapshot(o,n,e):this.renderError(r,e)},t.prototype.markAsPreview=function(t){return t?this.htmlElement.setAttribute("data-turbolinks-preview",""):this.htmlElement.removeAttribute("data-turbolinks-preview")},t.prototype.renderSnapshot=function(t,r,n){return e.SnapshotRenderer.render(this.delegate,n,this.getSnapshot(),e.Snapshot.wrap(t),r)},t.prototype.renderError=function(t,r){return e.ErrorRenderer.render(this.delegate,r,t)},t}();}.call(this),function(){var t=function(t,e){return function(){return t.apply(e,arguments)}};e.ScrollManager=function(){function r(r){this.delegate=r,this.onScroll=t(this.onScroll,this),this.onScroll=e.throttle(this.onScroll);}return r.prototype.start=function(){return this.started?void 0:(addEventListener("scroll",this.onScroll,!1),this.onScroll(),this.started=!0)},r.prototype.stop=function(){return this.started?(removeEventListener("scroll",this.onScroll,!1),this.started=!1):void 0},r.prototype.scrollToElement=function(t){return t.scrollIntoView()},r.prototype.scrollToPosition=function(t){var e,r;return e=t.x,r=t.y,window.scrollTo(e,r)},r.prototype.onScroll=function(t){return this.updatePosition({x:window.pageXOffset,y:window.pageYOffset})},r.prototype.updatePosition=function(t){var e;return this.position=t,null!=(e=this.delegate)?e.scrollPositionChanged(this.position):void 0},r}();}.call(this),function(){e.SnapshotCache=function(){function t(t){this.size=t,this.keys=[],this.snapshots={};}var r;return t.prototype.has=function(t){var e;return e=r(t),e in this.snapshots},t.prototype.get=function(t){var e;if(this.has(t))return e=this.read(t),this.touch(t),e},t.prototype.put=function(t,e){return this.write(t,e),this.touch(t),e},t.prototype.read=function(t){var e;return e=r(t),this.snapshots[e]},t.prototype.write=function(t,e){var n;return n=r(t),this.snapshots[n]=e},t.prototype.touch=function(t){var e,n;return n=r(t),e=this.keys.indexOf(n),e>-1&&this.keys.splice(e,1),this.keys.unshift(n),this.trim()},t.prototype.trim=function(){var t,e,r,n,o;for(n=this.keys.splice(this.size),o=[],t=0,r=n.length;r>t;t++)e=n[t],o.push(delete this.snapshots[e]);return o},r=function(t){return e.Location.wrap(t).toCacheKey()},t}();}.call(this),function(){var t=function(t,e){return function(){return t.apply(e,arguments)}};e.Visit=function(){function r(r,n,o){this.controller=r,this.action=o,this.performScroll=t(this.performScroll,this),this.identifier=e.uuid(),this.location=e.Location.wrap(n),this.adapter=this.controller.adapter,this.state="initialized",this.timingMetrics={};}var n;return r.prototype.start=function(){return "initialized"===this.state?(this.recordTimingMetric("visitStart"),this.state="started",this.adapter.visitStarted(this)):void 0},r.prototype.cancel=function(){var t;return "started"===this.state?(null!=(t=this.request)&&t.cancel(),this.cancelRender(),this.state="canceled"):void 0},r.prototype.complete=function(){var t;return "started"===this.state?(this.recordTimingMetric("visitEnd"),this.state="completed","function"==typeof(t=this.adapter).visitCompleted&&t.visitCompleted(this),this.controller.visitCompleted(this)):void 0},r.prototype.fail=function(){var t;return "started"===this.state?(this.state="failed","function"==typeof(t=this.adapter).visitFailed?t.visitFailed(this):void 0):void 0},r.prototype.changeHistory=function(){var t,e;return this.historyChanged?void 0:(t=this.location.isEqualTo(this.referrer)?"replace":this.action,e=n(t),this.controller[e](this.location,this.restorationIdentifier),this.historyChanged=!0)},r.prototype.issueRequest=function(){return this.shouldIssueRequest()&&null==this.request?(this.progress=0,this.request=new e.HttpRequest(this,this.location,this.referrer),this.request.send()):void 0},r.prototype.getCachedSnapshot=function(){var t;return !(t=this.controller.getCachedSnapshotForLocation(this.location))||null!=this.location.anchor&&!t.hasAnchor(this.location.anchor)||"restore"!==this.action&&!t.isPreviewable()?void 0:t},r.prototype.hasCachedSnapshot=function(){return null!=this.getCachedSnapshot()},r.prototype.loadCachedSnapshot=function(){var t,e;return (e=this.getCachedSnapshot())?(t=this.shouldIssueRequest(),this.render(function(){var r;return this.cacheSnapshot(),this.controller.render({snapshot:e,isPreview:t},this.performScroll),"function"==typeof(r=this.adapter).visitRendered&&r.visitRendered(this),t?void 0:this.complete()})):void 0},r.prototype.loadResponse=function(){return null!=this.response?this.render(function(){var t,e;return this.cacheSnapshot(),this.request.failed?(this.controller.render({error:this.response},this.performScroll),"function"==typeof(t=this.adapter).visitRendered&&t.visitRendered(this),this.fail()):(this.controller.render({snapshot:this.response},this.performScroll),"function"==typeof(e=this.adapter).visitRendered&&e.visitRendered(this),this.complete())}):void 0},r.prototype.followRedirect=function(){return this.redirectedToLocation&&!this.followedRedirect?(this.location=this.redirectedToLocation,this.controller.replaceHistoryWithLocationAndRestorationIdentifier(this.redirectedToLocation,this.restorationIdentifier),this.followedRedirect=!0):void 0},r.prototype.requestStarted=function(){var t;return this.recordTimingMetric("requestStart"),"function"==typeof(t=this.adapter).visitRequestStarted?t.visitRequestStarted(this):void 0},r.prototype.requestProgressed=function(t){var e;return this.progress=t,"function"==typeof(e=this.adapter).visitRequestProgressed?e.visitRequestProgressed(this):void 0},r.prototype.requestCompletedWithResponse=function(t,r){return this.response=t,null!=r&&(this.redirectedToLocation=e.Location.wrap(r)),this.adapter.visitRequestCompleted(this)},r.prototype.requestFailedWithStatusCode=function(t,e){return this.response=e,this.adapter.visitRequestFailedWithStatusCode(this,t)},r.prototype.requestFinished=function(){var t;return this.recordTimingMetric("requestEnd"),"function"==typeof(t=this.adapter).visitRequestFinished?t.visitRequestFinished(this):void 0},r.prototype.performScroll=function(){return this.scrolled?void 0:("restore"===this.action?this.scrollToRestoredPosition()||this.scrollToTop():this.scrollToAnchor()||this.scrollToTop(),this.scrolled=!0)},r.prototype.scrollToRestoredPosition=function(){var t,e;return t=null!=(e=this.restorationData)?e.scrollPosition:void 0,null!=t?(this.controller.scrollToPosition(t),!0):void 0},r.prototype.scrollToAnchor=function(){return null!=this.location.anchor?(this.controller.scrollToAnchor(this.location.anchor),!0):void 0},r.prototype.scrollToTop=function(){return this.controller.scrollToPosition({x:0,y:0})},r.prototype.recordTimingMetric=function(t){var e;return null!=(e=this.timingMetrics)[t]?e[t]:e[t]=(new Date).getTime()},r.prototype.getTimingMetrics=function(){return e.copyObject(this.timingMetrics)},n=function(t){switch(t){case"replace":return "replaceHistoryWithLocationAndRestorationIdentifier";case"advance":case"restore":return "pushHistoryWithLocationAndRestorationIdentifier"}},r.prototype.shouldIssueRequest=function(){return "restore"===this.action?!this.hasCachedSnapshot():!0},r.prototype.cacheSnapshot=function(){return this.snapshotCached?void 0:(this.controller.cacheSnapshot(),this.snapshotCached=!0)},r.prototype.render=function(t){return this.cancelRender(),this.frame=requestAnimationFrame(function(e){return function(){return e.frame=null,t.call(e)}}(this))},r.prototype.cancelRender=function(){return this.frame?cancelAnimationFrame(this.frame):void 0},r}();}.call(this),function(){var t=function(t,e){return function(){return t.apply(e,arguments)}};e.Controller=function(){function r(){this.clickBubbled=t(this.clickBubbled,this),this.clickCaptured=t(this.clickCaptured,this),this.pageLoaded=t(this.pageLoaded,this),this.history=new e.History(this),this.view=new e.View(this),this.scrollManager=new e.ScrollManager(this),this.restorationData={},this.clearCache(),this.setProgressBarDelay(500);}return r.prototype.start=function(){return e.supported&&!this.started?(addEventListener("click",this.clickCaptured,!0),addEventListener("DOMContentLoaded",this.pageLoaded,!1),this.scrollManager.start(),this.startHistory(),this.started=!0,this.enabled=!0):void 0},r.prototype.disable=function(){return this.enabled=!1},r.prototype.stop=function(){return this.started?(removeEventListener("click",this.clickCaptured,!0),removeEventListener("DOMContentLoaded",this.pageLoaded,!1),this.scrollManager.stop(),this.stopHistory(),this.started=!1):void 0},r.prototype.clearCache=function(){return this.cache=new e.SnapshotCache(10)},r.prototype.visit=function(t,r){var n,o;return null==r&&(r={}),t=e.Location.wrap(t),this.applicationAllowsVisitingLocation(t)?this.locationIsVisitable(t)?(n=null!=(o=r.action)?o:"advance",this.adapter.visitProposedToLocationWithAction(t,n)):window.location=t:void 0},r.prototype.startVisitToLocationWithAction=function(t,r,n){var o;return e.supported?(o=this.getRestorationDataForIdentifier(n),this.startVisit(t,r,{restorationData:o})):window.location=t},r.prototype.setProgressBarDelay=function(t){return this.progressBarDelay=t},r.prototype.startHistory=function(){return this.location=e.Location.wrap(window.location),this.restorationIdentifier=e.uuid(),this.history.start(),this.history.replace(this.location,this.restorationIdentifier)},r.prototype.stopHistory=function(){return this.history.stop()},r.prototype.pushHistoryWithLocationAndRestorationIdentifier=function(t,r){return this.restorationIdentifier=r,this.location=e.Location.wrap(t),this.history.push(this.location,this.restorationIdentifier)},r.prototype.replaceHistoryWithLocationAndRestorationIdentifier=function(t,r){return this.restorationIdentifier=r,this.location=e.Location.wrap(t),this.history.replace(this.location,this.restorationIdentifier)},r.prototype.historyPoppedToLocationWithRestorationIdentifier=function(t,r){var n;return this.restorationIdentifier=r,this.enabled?(n=this.getRestorationDataForIdentifier(this.restorationIdentifier),this.startVisit(t,"restore",{restorationIdentifier:this.restorationIdentifier,restorationData:n,historyChanged:!0}),this.location=e.Location.wrap(t)):this.adapter.pageInvalidated()},r.prototype.getCachedSnapshotForLocation=function(t){var e;return null!=(e=this.cache.get(t))?e.clone():void 0},r.prototype.shouldCacheSnapshot=function(){return this.view.getSnapshot().isCacheable();
},r.prototype.cacheSnapshot=function(){var t,r;return this.shouldCacheSnapshot()?(this.notifyApplicationBeforeCachingSnapshot(),r=this.view.getSnapshot(),t=this.lastRenderedLocation,e.defer(function(e){return function(){return e.cache.put(t,r.clone())}}(this))):void 0},r.prototype.scrollToAnchor=function(t){var e;return (e=this.view.getElementForAnchor(t))?this.scrollToElement(e):this.scrollToPosition({x:0,y:0})},r.prototype.scrollToElement=function(t){return this.scrollManager.scrollToElement(t)},r.prototype.scrollToPosition=function(t){return this.scrollManager.scrollToPosition(t)},r.prototype.scrollPositionChanged=function(t){var e;return e=this.getCurrentRestorationData(),e.scrollPosition=t},r.prototype.render=function(t,e){return this.view.render(t,e)},r.prototype.viewInvalidated=function(){return this.adapter.pageInvalidated()},r.prototype.viewWillRender=function(t){return this.notifyApplicationBeforeRender(t)},r.prototype.viewRendered=function(){return this.lastRenderedLocation=this.currentVisit.location,this.notifyApplicationAfterRender()},r.prototype.pageLoaded=function(){return this.lastRenderedLocation=this.location,this.notifyApplicationAfterPageLoad()},r.prototype.clickCaptured=function(){return removeEventListener("click",this.clickBubbled,!1),addEventListener("click",this.clickBubbled,!1)},r.prototype.clickBubbled=function(t){var e,r,n;return this.enabled&&this.clickEventIsSignificant(t)&&(r=this.getVisitableLinkForNode(t.target))&&(n=this.getVisitableLocationForLink(r))&&this.applicationAllowsFollowingLinkToLocation(r,n)?(t.preventDefault(),e=this.getActionForLink(r),this.visit(n,{action:e})):void 0},r.prototype.applicationAllowsFollowingLinkToLocation=function(t,e){var r;return r=this.notifyApplicationAfterClickingLinkToLocation(t,e),!r.defaultPrevented},r.prototype.applicationAllowsVisitingLocation=function(t){var e;return e=this.notifyApplicationBeforeVisitingLocation(t),!e.defaultPrevented},r.prototype.notifyApplicationAfterClickingLinkToLocation=function(t,r){return e.dispatch("turbolinks:click",{target:t,data:{url:r.absoluteURL},cancelable:!0})},r.prototype.notifyApplicationBeforeVisitingLocation=function(t){return e.dispatch("turbolinks:before-visit",{data:{url:t.absoluteURL},cancelable:!0})},r.prototype.notifyApplicationAfterVisitingLocation=function(t){return e.dispatch("turbolinks:visit",{data:{url:t.absoluteURL}})},r.prototype.notifyApplicationBeforeCachingSnapshot=function(){return e.dispatch("turbolinks:before-cache")},r.prototype.notifyApplicationBeforeRender=function(t){return e.dispatch("turbolinks:before-render",{data:{newBody:t}})},r.prototype.notifyApplicationAfterRender=function(){return e.dispatch("turbolinks:render")},r.prototype.notifyApplicationAfterPageLoad=function(t){return null==t&&(t={}),e.dispatch("turbolinks:load",{data:{url:this.location.absoluteURL,timing:t}})},r.prototype.startVisit=function(t,e,r){var n;return null!=(n=this.currentVisit)&&n.cancel(),this.currentVisit=this.createVisit(t,e,r),this.currentVisit.start(),this.notifyApplicationAfterVisitingLocation(t)},r.prototype.createVisit=function(t,r,n){var o,i,s,a,u;return i=null!=n?n:{},a=i.restorationIdentifier,s=i.restorationData,o=i.historyChanged,u=new e.Visit(this,t,r),u.restorationIdentifier=null!=a?a:e.uuid(),u.restorationData=e.copyObject(s),u.historyChanged=o,u.referrer=this.location,u},r.prototype.visitCompleted=function(t){return this.notifyApplicationAfterPageLoad(t.getTimingMetrics())},r.prototype.clickEventIsSignificant=function(t){return !(t.defaultPrevented||t.target.isContentEditable||t.which>1||t.altKey||t.ctrlKey||t.metaKey||t.shiftKey)},r.prototype.getVisitableLinkForNode=function(t){return this.nodeIsVisitable(t)?e.closest(t,"a[href]:not([target]):not([download])"):void 0},r.prototype.getVisitableLocationForLink=function(t){var r;return r=new e.Location(t.getAttribute("href")),this.locationIsVisitable(r)?r:void 0},r.prototype.getActionForLink=function(t){var e;return null!=(e=t.getAttribute("data-turbolinks-action"))?e:"advance"},r.prototype.nodeIsVisitable=function(t){var r;return (r=e.closest(t,"[data-turbolinks]"))?"false"!==r.getAttribute("data-turbolinks"):!0},r.prototype.locationIsVisitable=function(t){return t.isPrefixedBy(this.view.getRootLocation())&&t.isHTML()},r.prototype.getCurrentRestorationData=function(){return this.getRestorationDataForIdentifier(this.restorationIdentifier)},r.prototype.getRestorationDataForIdentifier=function(t){var e;return null!=(e=this.restorationData)[t]?e[t]:e[t]={}},r}();}.call(this),function(){!function(){var t,e;if((t=e=document.currentScript)&&!e.hasAttribute("data-turbolinks-suppress-warning"))for(;t=t.parentNode;)if(t===document.body)return console.warn("You are loading Turbolinks from a <script> element inside the <body> element. This is probably not what you meant to do!\n\nLoad your application\u2019s JavaScript bundle inside the <head> element instead. <script> elements in <body> are evaluated with each page change.\n\nFor more information, see: https://github.com/turbolinks/turbolinks#working-with-script-elements\n\n\u2014\u2014\nSuppress this warning by adding a `data-turbolinks-suppress-warning` attribute to: %s",e.outerHTML)}();}.call(this),function(){var t,r,n;e.start=function(){return r()?(null==e.controller&&(e.controller=t()),e.controller.start()):void 0},r=function(){return null==window.Turbolinks&&(window.Turbolinks=e),n()},t=function(){var t;return t=new e.Controller,t.adapter=new e.BrowserAdapter(t),t},n=function(){return window.Turbolinks===e},n()&&e.start();}.call(this);}).call(this),module.exports?module.exports=e:"function"==typeof undefined;}).call(commonjsGlobal);
});

customElements.define('input-attachment', InputAttachment, {
  extends: 'input'
});
customElements.define('file-manager', FileManager$1);
customElements.define('date-picker', DatePicker, {
  extends: 'input'
});
customElements.define('chapters-editor', ChaptersEditor, {
  extends: 'textarea'
});
customElements.define('item-sorter', ItemSorter);
customElements.define('user-select', UserSelect, {
  extends: 'select'
});
preactCustomElement$1('form-notification', FormNotification);
document.addEventListener('turbolinks:load', () => {});
turbolinks.start();

export { commonjsGlobal as a, createCommonjsModule as c };
