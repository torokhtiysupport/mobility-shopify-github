class BtCompareUtil
{
  static init() {
    BtCompareUtil.key = 'compare';
    BtCompareUtil.bubbleHtmlClass = '.compare-count-bubble';
    BtCompareUtil.updateCompareBubble(true);
    BtCompareUtil.loadedContent = false;
  }

  static setCompareArray(compareArray) {
    BtStorageUtil.set(BtCompareUtil.key, compareArray);
  }

  static getCompareArray() {
    return BtStorageUtil.get(BtCompareUtil.key, true) || [];
  }

  static toggleProductToCompare(productId) {
    const currentProducts = BtCompareUtil.getCompareArray();
    if(currentProducts.includes(productId) === false) {
      currentProducts.push(productId);
      pushSuccessMessage(window.addedCompareStrings.success);
    } else {
      const index = currentProducts.indexOf(productId);
      currentProducts.splice(index, 1);
    }
    BtCompareUtil.setCompareArray(currentProducts);
    BtCompareUtil.updateCompareBubble();
    BtCompareUtil.loadedContent = false;
    BtCompareUtil.toogleEmptyWarningClass(document.querySelector('compare-popup'));
  }

  static removeCompareProduct(productId) {
    const currentProducts = BtCompareUtil.getCompareArray();
    const index = currentProducts.indexOf(productId);
    currentProducts.splice(index, 1);
    BtCompareUtil.setCompareArray(currentProducts);
    BtCompareUtil.updateCompareBubble();
  }

  static updateCompareBubble(ignoreZero = false) {
    const currentProducts = BtCompareUtil.getCompareArray();
    const total = currentProducts.length;
    if(total > 0 || !ignoreZero) {
      document.querySelectorAll(BtCompareUtil.bubbleHtmlClass).forEach(bubble => {
        bubble.textContent = total;
      });
      BtCompareUtil.updateAddedStyle(currentProducts);
    }
  }

  static updateAddedStyle(currentProducts = []) {
    let styleTag = document.getElementById('bt-compare-style');
    if(styleTag == undefined) {
      styleTag = document.createElement('style');
      styleTag.setAttribute('id', 'bt-compare-style');
      styleTag.textContent = BtCompareUtil.generateAddedCss(currentProducts);
      document.head.appendChild(styleTag);
    } else {
      styleTag.textContent = BtCompareUtil.generateAddedCss(currentProducts);
    }
  }

  static generateAddedCss(currentProducts = []) {
    let cssContent = '';
    if(currentProducts.length > 0) {
      currentProducts.forEach(productId => {
        if(cssContent != '') {
          cssContent += ',';
        }
        cssContent += `.compare-add-button[data-product-id="${productId}"] .compare-added-check`;
      });
      cssContent += '{opacity:1;}'
    }
    return cssContent;
  }

  static toogleEmptyWarningClass(popup) {
    const size = BtCompareUtil.getCompareArray().length;
    if(size > 1) {
      popup.classList.remove('empty', 'warning');
    } else if(size == 1) {
      popup.classList.remove('empty');
      popup.classList.add('warning');
    } else {
      popup.classList.remove('warning');
      popup.classList.add('empty');
    }
  }
}

BtCompareUtil.init();

class ComparePopup extends HTMLElement
{
  constructor() {
    super();
    this.assets = document.getElementById('compare-modal-assets');
    this.results = this.querySelector('.compare-modal__results');
    this.hasAssets = false;
  }

  loadContent() {
    if(BtCompareUtil.loadedContent) return;
    this.classList.add('loading');
    const currentProducts = BtCompareUtil.getCompareArray();
    const newIds = [];
    currentProducts.forEach(productId => {
      newIds.push(`id:${productId}`);
    });
    const idsQuery =  newIds.join(' OR ');
    fetch(`${window.routes.search_url}?section_id=product-compare&q=${idsQuery}&type="product"`)
    .then((response) => response.text()) 
    .then(response => {
      const html = new DOMParser().parseFromString(response, 'text/html');
      if(!this.hasAssets) {
        this.assets.innerHTML = html.querySelector('.assets').innerHTML;
        this.hasAssets = true;
      }
      this.results.innerHTML = html.querySelector('.results').innerHTML;
      BtCompareUtil.toogleEmptyWarningClass(this);
    })
    .finally(() => {
      this.classList.remove('loading');
      BtCompareUtil.loadedContent = true;
    });
  }
}

customElements.define('compare-popup', ComparePopup);

class CompareAddButton extends HTMLElement
{
  constructor() {
    super();
    this.bindEvents();
  }

  bindEvents() {
    this.button = this.querySelector('button');
    this.onButtonClickHandler = this.onButtonClick.bind(this);
    this.button.addEventListener('click', this.onButtonClickHandler);
  }

  disconnectedCallback() {
    this.button.removeEventListener('click', this.onButtonClickHandler);
  }

  onButtonClick() {
    BtCompareUtil.toggleProductToCompare(this.button.dataset.productId);
  }
}

customElements.define('compare-add-button', CompareAddButton);

class CompareRemoveButton extends HTMLElement
{
  constructor() {
    super();
    this.bindEvents();
  }

  bindEvents() {
    this.button = this.querySelector('a');
    this.onButtonClickHandler = this.onButtonClick.bind(this);
    this.button.addEventListener('click', this.onButtonClickHandler);
  }

  disconnectedCallback() {
    this.button.removeEventListener('click', this.onButtonClickHandler);
  }

  onButtonClick(e) {
    e.preventDefault();
    const popup = this.closest('compare-popup');
    BtCompareUtil.removeCompareProduct(this.button.dataset.productId);
    BtCompareUtil.toogleEmptyWarningClass(popup);
    popup.querySelectorAll(`.product-compare-${this.button.dataset.productId}`).forEach((td) => {
      td.remove();
    });
  }
}

customElements.define('compare-remove-button', CompareRemoveButton);

class CompareVariantRadios extends VariantRadios
{
  constructor() {
    super();
    this.isRadios = this.localName == 'compare-variant-radios';
    this.dataset.originalSection = 'product-compare-item';
    this.customSectionId = this.closest('div').dataset.customSectionId;
  }

  onVariantChange(event) {
    this.updateVariantStatuses();
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.removeErrorMessage();
    this.updateSoldoutValues();
    
    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      // this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }
    
    if(this.isRadios && this.currentVariant) {
      this.updateOptionLabel(event);
    }
  }

  renderProductInfo() {
    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        
        this.updateElements(html);

        const price = document.getElementById(`price-${this.customSectionId}`);

        if (price) price.classList.remove('visibility-hidden');
        this.toggleAddButton(!this.currentVariant || !this.currentVariant.available, window.variantStrings.soldOut);
      });
  }

  updateElements(html) {
    const elementKeys = ['featured-image', 'price', 'inventory'];
    elementKeys.forEach(key => {
      const destination = document.getElementById(`${key}-${this.customSectionId}`);
      const source = html.getElementById(`product-compare-${key}`);
      if (source && destination) destination.innerHTML = source.innerHTML;
    });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.customSectionId}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
    } else {
      addButton.removeAttribute('disabled');
    }

    if (!modifyClass) return;
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.customSectionId}, #product-form-installment-${this.customSectionId}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  removeErrorMessage() {
    const productForm = document.getElementById(`product-form-${this.customSectionId}`);
    if (productForm) productForm.handleErrorMessage();
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.customSectionId}`);
    const addButton = button.querySelector('[name="add"]');
    const price = document.getElementById(`price-${this.customSectionId}`);
    if (addButton) addButton.setAttribute('disabled', 'disabled');;
    if (price) price.classList.add('visibility-hidden');
  }
}

customElements.define('compare-variant-radios', CompareVariantRadios);

class CompareVariantSelects extends CompareVariantRadios
{
  constructor() {
    super();
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }
}

customElements.define('compare-variant-selects', CompareVariantSelects);