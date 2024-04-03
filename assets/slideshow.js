if (!customElements.get('slideshow-component')) {
  customElements.define('slideshow-component', class SlideshowComponent extends SliderComponent {
    constructor() {
      super();
    }

    init() {
      super.init();
      this.sliderControlWrapper = this.querySelector('.slider-buttons');
      this.enableSliderLooping = true;
      this.autoplayButtonQuerySelector = '.slideshow__autoplay';
      this.autoPlayPausedClass = 'slideshow__autoplay--paused';
  
      if (!this.sliderControlWrapper) return;
  
      if (this.sliderItemsToShow.length > 0) this.currentPage = 1;
  
      this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));
      this.setSlideVisibility();

      this.querySelectorAll('.banner__price').forEach(ele => {
        ele.innerHTML = Shopify.showPrice(ele.dataset.price * 1);
      });
    }
  
    onButtonClick(event) {
      super.onButtonClick(event);
      const isFirstSlide = this.currentPage === 1;
      const isLastSlide = this.currentPage === this.sliderItemsToShow.length;
  
      if (!isFirstSlide && !isLastSlide) return;
  
      if (isFirstSlide && event.currentTarget.name === 'previous') {
        this.slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
      } else if (isLastSlide && event.currentTarget.name === 'next') {
        this.slideScrollPosition = 0;
      }
      this.slider.scrollTo({
        left: this.slideScrollPosition
      });
  
    }
  
    update() {
      super.update();
      const activeSlide = this.querySelector('.slideshow__slide.active');
      if(activeSlide) activeSlide.classList.remove('active');
      this.querySelector(`.slideshow__slide:nth-child(${this.currentPage})`).classList.add('active');
      if(this.prevButton) {
        this.prevButton.removeAttribute('disabled');
      }
    }
  
    setSlideVisibility() {
      this.sliderItemsToShow.forEach((item, index) => {
        const linkElements = item.querySelectorAll('a');
        if (index === this.currentPage - 1) {
          if (linkElements.length) linkElements.forEach(button => {
            button.removeAttribute('tabindex');
          });
          item.setAttribute('aria-hidden', 'false');
          item.removeAttribute('tabindex');
        } else {
          if (linkElements.length) linkElements.forEach(button => {
            button.setAttribute('tabindex', '-1');
          });
          item.setAttribute('aria-hidden', 'true');
          item.setAttribute('tabindex', '-1');
        }
      });
    }
  
    play() {
      super.play();
      if(this.sliderAutoplayButton) {
        this.sliderAutoplayButton.classList.remove(this.autoPlayPausedClass);
        this.sliderAutoplayButton.querySelector('.slideshow__progress__path').getAnimations().forEach((anim) => {
          anim.cancel();
          anim.play();
        });
      }
    }

    pause() {
      super.pause();
      if(this.sliderAutoplayButton) {
        this.sliderAutoplayButton.classList.add(this.autoPlayPausedClass);
        this.sliderAutoplayButton.querySelector('.slideshow__progress__path').getAnimations().forEach((anim) => {
          anim.pause();
        });
      }
    }
  });
}