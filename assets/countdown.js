if (!customElements.get('count-down')) {
  customElements.define('count-down', class Countdown extends HTMLElement {
    constructor() {
      super();

      if(!this.dataset.hasOwnTpl) {
        this.appendChild(document.getElementById('countdown-tpl').content.firstElementChild.cloneNode(true));
      }
      if(this.dataset.endtime) {
        this.initSingleCountdown();
      } else if(this.dataset.list) {
        this.initCountdownInList();
      } else {
        this.initFail();
      }
    }

    initSingleCountdown() {
      const pattern1 = /^\d{4}-\d{2}-\d{2}$/;
      const pattern2 = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
      const pattern3 = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(\:\d{2}|)(\+|-)\d{4}/;
      if(pattern1.test(this.dataset.endtime) || pattern2.test(this.dataset.endtime) || pattern3.test(this.dataset.endtime)) {
        var finalDate = this.dataset.endtime;
        if(pattern1.test(this.dataset.endtime)) {
          finalDate += ' 00:00:00' + this.dataset.timezone;
        } else if(pattern2.test(this.dataset.endtime)) {
          finalDate += this.dataset.timezone;
        }
        this.countDownDate = new Date(finalDate).getTime();
        this.initElements();
        this.interval = setInterval(this.run.bind(this), 1000);  
      } else {
        this.initFail();
      }
    }

    initCountdownInList() {
      const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(\:\d{2}|)(\+|-)\d{4}/;
      const dataList = this.dataset.list.split(',');
      const now = new Date();
      let min;
      dataList.forEach(value => {
        if(pattern.test(value)) {
          let countdownDate = new Date(value);
          if(countdownDate > now) {
            if(!min || countdownDate <= min) {
              min = countdownDate;
            }
          }
        }
      });
      if(min) {
        this.countDownDate = min.getTime();
        this.initElements();
        this.interval = setInterval(this.run.bind(this), 1000);
      } else {
        this.initFail();
      }
    }

    initElements() {
      this.daysElement = this.querySelector('.countdown__days__value');
      this.hoursElement = this.querySelector('.countdown__hours__value');
      this.minutesElement = this.querySelector('.countdown__minutes__value');
      this.secondsElement = this.querySelector('.countdown__seconds__value');
    }

    initFail() {
      if(Shopify.designMode) {
        this.showMessage(window.accessibilityStrings.countdownErrorMsg);
      } else {
        this.remove();
      }
    }

    run() {
      const now = new Date().getTime();

      // Find the distance between now and the count down date
      const distance = this.countDownDate - now;
    
      // Time calculations for days, hours, minutes and seconds
      const daysNumber = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hoursNumber = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutesNumber = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const secondsNumber = Math.floor((distance % (1000 * 60)) / 1000);
      if(!daysNumber) {
        this.daysElement.parentElement.classList.add('hidden');
      } else {
        this.daysElement.textContent = daysNumber;
      }

      if(!hoursNumber) {
        this.hoursElement.parentElement.classList.add('hidden');
      } else {
        this.hoursElement.textContent = hoursNumber;
      }

      this.minutesElement.textContent = minutesNumber;
      this.secondsElement.textContent = secondsNumber;
    
      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(this.interval);
        this.showMessage(this.dataset.expiredMsg ? this.dataset.expiredMsg : window.accessibilityStrings.countdownExpiredMsg);
        this.classList.add('expired');
      }
    }

    showMessage(msg) {
      this.querySelectorAll(':scope > *').forEach((ele) => ele.remove());
      const node = document.createTextNode(msg);
      this.appendChild(node);
    }
  });
}