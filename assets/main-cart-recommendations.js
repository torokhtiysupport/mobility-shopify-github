if (!customElements.get('main-cart-recommendations')) {
	customElements.define('main-cart-recommendations', class MainCartRecommendations extends HTMLElement {
		constructor() {
			super();
      this.handleRequests = [];
      const productRecommendation = this.querySelector('cart-product-recommendations');
      if(productRecommendation) {
        productRecommendation.update();
      }

      // this.cartItems = document.querySelector('cart-items');
      // if(this.cartItems) {
      //   this.cartItems.addEventListener('afterUpdateQuantity', () => {
      //     this.update();
      //   });
      // }
		}

		update() {
      fetch(`${routes.cart_url}.js`)
      .then(response => response.json())
      .then(cart => {
        const productRecommendation = this.querySelector('cart-product-recommendations');
        if(cart.item_count > 0) {
          if(productRecommendation) {
            const productIds = cart.items.map((item) => {
              return item.product_id;
            });
            productRecommendation.dataset.productIds = productIds;
            productRecommendation.update();
          }
        } else {
          if(productRecommendation) {
            productRecommendation.classList.add('loading');
          }
          fetch(`${routes.cart_url}?section_id=${this.dataset.sectionId}`)
          .then(response => response.text())
          .then(text => {
            if(productRecommendation) {
              productRecommendation.remove();
            }
            this.appendChild(getDomHtmlFromText(text, '.cart__empty-recommendation'));
          });
        }
      });
    }
  });
}