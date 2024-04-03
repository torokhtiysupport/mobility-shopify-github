class BtRecentlyViewedUtil
{
  static init() {
    BtRecentlyViewedUtil.key = 'recently_viewed';
  }

  static setArray(array) {
    BtStorageUtil.set(BtRecentlyViewedUtil.key, array);
  }

	static getArray() {
    return BtStorageUtil.get(BtRecentlyViewedUtil.key, true) || [];
  }

	static addProduct(productId, productUrl, productImage, limit) {
    let currentList = BtRecentlyViewedUtil.getArray();
		let existProduct = currentList.filter(e => e.product_id != productId);

		existProduct.unshift({
			"product_id": productId,
			"url": productUrl,
			"image": productImage
		});

		if(existProduct.length > limit) {
			existProduct.pop();
		}

		BtRecentlyViewedUtil.setArray(existProduct);
  }
}

BtRecentlyViewedUtil.init();

const recentlyViewedObserver = new IntersectionObserver((entries, observer) => {
	entries.forEach(entry => {
		if(entry.isIntersecting) {
			entry.target.updateContent();
			observer.unobserve(entry.target);
		}
	});
}, {threshold: 0.1});

class RecentlyViewed extends HTMLElement
{
  constructor() {
		super();

		this.limit = parseInt(this.dataset.limit);
		
		this.isEmpty = true;
		
		this.updatedContent = false;
		this.section = this.querySelector('.recently-viewed-products__section');
		this.results = this.querySelector('.recently-viewed-products__results');

		if(this.dataset.productId) {
			this.addProduct(this.dataset.productId, this.dataset.productUrl, this.dataset.productImage);
		}
	}

	connectedCallback() {
		recentlyViewedObserver.observe(this);
	}

	addProduct(productId, productUrl, productImage) {
		BtRecentlyViewedUtil.addProduct(productId, productUrl, productImage, this.limit);
		this.updatedContent = false;
	}

	updateContent() {
		const itemList = BtRecentlyViewedUtil.getArray();
		if(itemList.length > 0) {
			const newIds = [];
			itemList.forEach((item) => {
				newIds.push(`id:${item.product_id}`);
			});
			const idsQuery =  newIds.join(' OR ');
			fetch(`${window.routes.search_url}?section_id=recently-viewed-products-ajax&q=${idsQuery}&type="product"`)
			.then((response) => response.text()) 
			.then(response => {
				const html = new DOMParser().parseFromString(response, 'text/html');
				if(!this.hasAssets) {
					html.querySelectorAll('.assets > *').forEach(asset => {
						document.body.appendChild(asset);
					});
					this.hasAssets = true;
				}
				const sliderComponent = html.querySelector('slider-component');
				if(sliderComponent) {
					sliderComponent.setAttribute('data-outside-prev-button-id', this.dataset.prevButton);
					sliderComponent.setAttribute('data-outside-next-button-id', this.dataset.nextButton);
					if(this.dataset.fullWidth) {
						sliderComponent.classList.add('page-width--full');
						if(sliderComponent.classList.contains('has-slider')) {
							sliderComponent.classList.add('slider-component-full-width');
							const productGrid = sliderComponent.querySelector('.product-grid');
							if(productGrid.classList.contains('slider')) {
								productGrid.classList.add('grid--peek');
							}
						}
					}
					this.section.classList.remove('hidden');
					this.results.innerHTML == '';
					this.results.appendChild(sliderComponent);
				} else {
					this.section.classList.add('hidden');
				}
			});
		}
		this.updatedContent = true;
	}
}

customElements.define('recently-viewed', RecentlyViewed);
