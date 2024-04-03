class StickyCart extends HTMLElement
{
  constructor() {
    super();
  }

  connectedCallback() {
    this.currentScrollTop = 0;
    this.form = document.getElementById(this.dataset.form);
    this.formButtons = this.form.querySelector('.product-form__buttons');
    this.primaryQuantityInput = this.form.querySelector('.quantity__input');
    this.quantityInput = this.querySelector('.quantity__input');
    this.onScrollHandler = this.onScroll.bind(this);
    if(this.formButtons) {
      window.addEventListener('scroll', this.onScrollHandler, false);
    }

    if(this.primaryQuantityInput) {
      this.onPrimaryQuanityInputChangeHandler = this.onPrimaryQuanityInputChange.bind(this);
      this.primaryQuantityInput.addEventListener('change', this.onPrimaryQuanityInputChangeHandler);
    }

    this.onFocusInHandler = this.onFocusIn.bind(this);
    this.onFocusOutHandler = this.onFocusOut.bind(this);

    this.addEventListener('focusin', this.onFocusInHandler);
    this.addEventListener('focusout', this.onFocusOutHandler);
  }

  disconnectedCallback() {
    if(this.formButtons) {
      window.removeEventListener('scroll', this.onScrollHandler);
    }
    if(this.primaryQuantityInput) {
      this.primaryQuantityInput.removeEventListener('change', this.onPrimaryQuanityInputChangeHandler);
    }
    this.removeEventListener('focusin', this.onFocusInHandler);
    this.removeEventListener('focusout', this.onFocusOutHandler);
  }

  open() {
    this.classList.add('open');
    document.body.classList.add('open-sticky-cart');
  }

  hide() {
    this.classList.remove('open');
    document.body.classList.remove('open-sticky-cart');
  }

  onFocusIn() {
    this.classList.add('working');
    this.open();
  }

  onFocusOut() {
    this.classList.remove('working');
    if(this.formButtons.getBoundingClientRect().top >= 0) {
      this.classList.remove('open');
    }
  }

  onScroll(event) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if(!this.classList.contains('working')) {
      if (scrollTop > this.currentScrollTop) {
        // Scrolling down
        this.hide();
      } else {
        // Scrolling up
        if(this.formButtons.getBoundingClientRect().top >= 0) {
          this.hide();
        } else {
          this.open();
        }
      }
    }

    this.currentScrollTop = scrollTop;
  }

  onPrimaryQuanityInputChange() {
    this.quantityInput.value = this.primaryQuantityInput.value;
  }
}
customElements.define('sticky-cart', StickyCart);

class StickyVariantSelects extends VariantSelects
{
  constructor() {
    super();
  }

  connectedCallback() {
    this.primaryPicker = document.querySelector(this.dataset.primaryPicker);
    this.mobilePicker = document.getElementById(this.dataset.mobilePicker);
    this.onPrimaryPickerHandler = this.onPrimaryPickerChange.bind(this);
    if(this.primaryPicker) {
      this.primaryPicker.addEventListener('change', this.onPrimaryPickerHandler);
    }
  }

  disconnectedCallback() {
    if(this.primaryPicker) {
      this.removeEventListener('change', this.onPrimaryPickerHandler);
    }
  }

  onPrimaryPickerChange(event) {
    if(event.isTrusted) {
      this.querySelectorAll('select').forEach((select, index) => {
        select.value = this.primaryPicker.options[index];
      });
      this.dispatchEvent(new Event('change'));
      this.updateMobilePicker();
    }
  }

  onVariantChange(event) {
    this.updateVariantStatuses();
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.removeErrorMessage();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateVariantInput();
      this.renderProductInfo();
    }
    if(event.isTrusted) {
      // Update back to the primary variant picker and mobile variant picker
      this.updatePrimaryPicker(this.options);
      this.updateMobilePicker();
    }
  }

  updatePrimaryPicker(options) {
    if(this.primaryPicker.tagName.toLowerCase() == 'variant-selects') {
      this.primaryPicker.querySelectorAll('select').forEach((select, index) => {
        select.value = options[index];
      });
    } else {
      this.primaryPicker.querySelectorAll('fieldset').forEach((fieldset, index) => {
        Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.value == options[index]).checked = true;
      });
    }
    this.primaryPicker.dispatchEvent(new Event('change'));
  }

  updateMobilePicker() {
    if(this.currentVariant) {
      this.mobilePicker.targetItemClick(this.mobilePicker.querySelector(`a[data-value="${this.currentVariant.id}"]`));
    }
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const media = document.getElementById(`sticky-media-${this.dataset.section}`);
    media.src = `${this.currentVariant.featured_media.preview_image.src}&width=150`;
    media.srcset = `${this.currentVariant.featured_media.preview_image.src}&width=150 150w`;
  }

  renderProductInfo() {
    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        const destination = document.getElementById(`sticky-price-${this.dataset.section}`);
        const source = html.getElementById(`sticky-price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);

        if (source && destination) destination.innerHTML = source.innerHTML;

        const price = document.getElementById(`sticky-price-${this.dataset.section}`);

        if (price) price.classList.remove('visibility-hidden');
        this.toggleAddButton(!this.currentVariant || !this.currentVariant.available, window.variantStrings.soldOut);
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}-sticky`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  updateVariantInput() {
    const productForm = document.getElementById(`product-form-${this.dataset.section}-sticky`);
    const input = productForm.querySelector('input[name="id"]');
    input.value = this.currentVariant.id;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
customElements.define('sticky-variant-selects', StickyVariantSelects);

class StickyVariantsMobile extends HTMLElement {
  constructor() {
    super();
    this.elements = {
      detailsDisclosure: this.querySelector('details-disclosure'),
      button: this.querySelector('summary'),
      panel: this.querySelector('.disclosure__list-wrapper'),
      variantPicker: document.getElementById(this.dataset.variantPicker)
    };
    
    this.querySelectorAll('a').forEach(item => item.addEventListener('click', this.onItemClick.bind(this)));
  }

  hidePanel() {
    this.elements.detailsDisclosure.closeWithClosingClass();
  }

  onItemClick(event) {
    event.preventDefault();
    if(event.target.ariaCurrent != 'true') {
      this.targetItemClick(event.target);
      this.afterItemClick(event);
    }
    this.hidePanel();
  }

  targetItemClick(target) {
    if(target.ariaCurrent != 'true') {
      const currentItem = this.querySelector('a[aria-current="true"]');
      if(currentItem) {
        currentItem.removeAttribute('aria-current');
      }
      target.ariaCurrent = true;
      this.elements.button.querySelector('span').textContent = target.textContent;
    }
  }

  afterItemClick(event) {
    if(event.isTrusted) {
      const target = event.target;
      const options = target.textContent.split(' / ');
      this.elements.variantPicker.querySelectorAll('select').forEach((select, index) => {
        select.value = options[index];
      });
      this.elements.variantPicker.dispatchEvent(new Event('change', {detail: {updatePrimary: true}}));
      this.elements.variantPicker.updatePrimaryPicker(options);
    }
  }
}
customElements.define('sticky-variants-mobile', StickyVariantsMobile);