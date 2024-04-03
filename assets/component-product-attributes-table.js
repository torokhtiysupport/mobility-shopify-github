if (!customElements.get('product-attributes-table')) {
	customElements.define('product-attributes-table', class ProductAttributesTable extends HTMLElement {
		constructor() {
			super();

			this.mainProductSection = document.querySelector('[id^="MainProduct"]');
			if(this.mainProductSection) {
				this.variantPicker = this.mainProductSection.querySelector(`.variant-picker-primary-${this.mainProductSection.dataset.section}`);
			}
		}

		connectedCallback() {
			if(this.variantPicker) {
				this.onVariantChangeHandler = this.onVariantChange.bind(this);
				this.variantPicker.addEventListener('change', this.onVariantChangeHandler);
			}
		}

		disconnectedCallback() {
			if(this.variantPicker) {
				this.variantPicker.removeEventListener('change', this.onVariantChangeHandler);
			}
		}

		onVariantChange() {
			const variantInput = this.mainProductSection.querySelector(`#product-form-${this.mainProductSection.dataset.section} input[name="id"], #product-form-installment-${this.mainProductSection.dataset.section} input[name="id"]`);
			if(variantInput) {
				fetch(`${this.dataset.url}?variant=${variantInput.value}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
				.then((response) => response.text())
				.then((responseText) => {
					const html = new DOMParser().parseFromString(responseText, 'text/html');
					this.innerHTML = html.querySelector('product-attributes-table').innerHTML;
				});
			}
		}
	});
}