if (!customElements.get('quick-add-drawer-opener')) {
  customElements.define('quick-add-drawer-opener', class QuickAddDrawerOpener extends HTMLElement {
    constructor() {
      super();

      this.button = this.querySelector('button');
      this.onClickHandler = this.onClick.bind(this);
      this.button.addEventListener('click', this.onClickHandler);
    }

    onClick(e) {
      this.button.setAttribute('aria-disabled', true);
      this.button.classList.add('loading');
      this.button.querySelector('.loading-overlay__spinner').classList.remove('hidden');
      let url = this.button.dataset.productUrl;
      if(url.includes('?')) {
        url += '&';
      } else {
        url += '?';
      }
      url += 'section_id=quick-add-drawer';
      fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const newQuickAddDrawer = getDomHtmlFromText(responseText, 'quick-add-drawer');
        if(window.hasQuickAddDrawer) {
          const quickAddDrawer = document.querySelector('quick-add-drawer');
          quickAddDrawer.setInnerHTML(newQuickAddDrawer.querySelector('.quick-add-main-product').innerHTML);
          quickAddDrawer.open(this.button);
        } else {
          document.body.appendChild(newQuickAddDrawer);
          newQuickAddDrawer.reInjectScript(newQuickAddDrawer);
          setTimeout(() => {
            newQuickAddDrawer.open(this.button);
          }, 300);
          window.hasQuickAddDrawer = true;
        }      
      })
      .finally(() => {
        this.button.removeAttribute('aria-disabled');
        this.button.classList.remove('loading');
        this.button.querySelector('.loading-overlay__spinner').classList.add('hidden');
      });
    }
  });
}
if (!customElements.get('quick-add-drawer')) {
  customElements.define('quick-add-drawer', class QuickAddDrawer extends DrawerFixed {
    constructor() {
      super();

      this.querySelector('.drawer__overlay').addEventListener('click', this.close.bind(this));
    }

    close(evt) {
      this.classList.remove('open-content');
      super.close(evt);
      setTimeout(() => {
        this.productElement.innerHTML = '';
      }, 300);
    }

    open(opener) {
      this.assignProductElement();
      this.preventDuplicatedIDs();
      this.removeDOMElements();
      
      if (window.Shopify && Shopify.PaymentButton) {
        Shopify.PaymentButton.init();
      }

      if (window.ProductModel) window.ProductModel.loadShopifyXR();

      this.removeGalleryListSemantic();
      this.preventVariantURLSwitching();
      super.open(opener);
      setTimeout(() => {
        this.classList.add('open-content');
      }, 300);
    }

    assignProductElement() {
      if(!this.productElement) {
        this.productElement = this.querySelector('.quick-add-main-product');
      }
    }

    setInnerHTML(html) {
      this.assignProductElement();
      this.productElement.innerHTML = html;

      // Reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
      this.reInjectScript(this.productElement);
    }

    reInjectScript(element) {
      element.querySelectorAll('script').forEach(oldScriptTag => {
        const newScriptTag = document.createElement('script');
        Array.from(oldScriptTag.attributes).forEach(attribute => {
          newScriptTag.setAttribute(attribute.name, attribute.value)
        });
        newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
        oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
      });
    }

    preventVariantURLSwitching() {
      this.productElement.querySelector('variant-radios,variant-selects').setAttribute('data-update-url', 'false');
    }
    
    removeDOMElements() {
      this.productElement.querySelectorAll('.quick-add-hidden').forEach(element => {
        if(element) {
          element.remove();
        }
      });
    }

    preventDuplicatedIDs() {
      const sectionId = this.productElement.dataset.section;
      this.productElement.innerHTML = this.productElement.innerHTML.replaceAll(sectionId, `quickadd-${ sectionId }`);
      this.productElement.querySelectorAll('variant-selects, variant-radios').forEach((variantSelect) => {
        variantSelect.dataset.originalSection = sectionId;
      });
    }

    removeGalleryListSemantic() {
      const galleryList = this.productElement.querySelector('[id^="Slider-Gallery"]');
      if (!galleryList) return;

      galleryList.setAttribute('role', 'presentation');
      galleryList.querySelectorAll('[id^="Slide-"]').forEach(li => li.setAttribute('role', 'presentation'));
    }
  });
}
