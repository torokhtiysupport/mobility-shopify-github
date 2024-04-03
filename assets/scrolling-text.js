if (!customElements.get('scrolling-text')) {
  customElements.define('scrolling-text', class ScrollingText extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.observer = new IntersectionObserver((entries, observer) => {
        if(entries[0].isIntersecting) {
          this.runAnimation();
          this.observer.disconnect();
        }
      });
  
      this.observer.observe(this);
    }

    disconnectedCallback() {
      if(this.observer) {
        this.observer.disconnect();
      }
    }

    runAnimation() {
      setTimeout(() => {
        this.classList.add('enable-animation');
      }, 500);
    }
  });
}