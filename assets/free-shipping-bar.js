if (!customElements.get('free-shipping-bar')) {
  customElements.define('free-shipping-bar', class FreeShippingBar extends HTMLElement {
    constructor() {
      super();
      this.unreachedMessage = this.querySelector('.free-shipping-bar__unreached-message');
      this.reachedMessage = this.querySelector('.free-shipping-bar__reached-message');
      if(this.unreachedMessage) {
        this.unreachedMessageText = this.unreachedMessage.innerHTML;
      }
      this.percentNumber = this.querySelector('.free-shipping-bar__progress-number');
      if(!this.dataset.threshold) return;
      this.threshold = parseInt(this.dataset.threshold);
      this.calculateBar(parseInt(this.dataset.total));
      this.onCartChangeHandler = this.onCartChange.bind(this);
      document.addEventListener('afterCartChanged', this.onCartChangeHandler);
      document.addEventListener('afterUpdateQuantity', this.onCartChangeHandler);
    }

    disconnectedCallback() {
      document.removeEventListener('afterCartChanged', this.onCartChangeHandler);
      document.removeEventListener('afterUpdateQuantity', this.onCartChangeHandler);
    }

    calculateBar(currentTotal) {
      const total = currentTotal / parseFloat(Shopify.currency.rate);
      if(total >= this.threshold) {
        this.style.setProperty('--percent', '100%');
        this.classList.add('completed');
        this.hideUnreachedMessage();
        this.showReachedMessage();
        this.percentNumber.textContent = `100%`;
      }  else {
        const remain = this.threshold - total;
        const percent = (total * 100) / this.threshold;
        this.style.setProperty('--percent', `${percent}%`);
        this.hideReachedMessage();
        this.showUnreachedMessage(remain);
        this.percentNumber.textContent = `${Math.floor(percent)}%`;
      }
    }

    onCartChange() {
      fetch(`${routes.cart_url}`, {...fetchConfig('json', 'GET')})
      .then((response) => response.json())
      .then((response) => {
        let totalPrice = response.total_price;
        if (freeShippingBarExcludeProducts.length > 0 && response.items.length > 0) {
          response.items.forEach((item) => {
            if(freeShippingBarExcludeProducts.includes(item.product_id)) {
              totalPrice -= item.final_line_price;
            }
          });
        }
        this.calculateBar(totalPrice);
      });
    }

    showUnreachedMessage(remainAmount) {
      if(!this.unreachedMessageText && this.unreachedMessage) return;
      const remainPrice = Shopify.showPrice(remainAmount);
      this.unreachedMessage.classList.remove('hidden');
      this.unreachedMessage.innerHTML = this.unreachedMessageText.replace('[remain]', `${remainPrice}`);
    }

    hideUnreachedMessage() {
      if(!this.unreachedMessage) return;
      this.unreachedMessage.classList.add('hidden');
    }

    showReachedMessage(remainAmount) {
      if(!this.reachedMessage) return;
      this.reachedMessage.classList.remove('hidden')
    }

    hideReachedMessage() {
      if(!this.reachedMessage) return;
      this.reachedMessage.classList.add('hidden');
    }
  });
}