import { createTransmitter } from './components/Transmitter.js';
import { createReceiver } from './components/Receiver.js';

const app = document.getElementById('app');
const tabs = document.querySelectorAll('.tab-btn');

let activeComponent = null;

function renderTab(tabName) {
  if (activeComponent && typeof activeComponent.destroy === 'function') {
    activeComponent.destroy();
  }
  app.innerHTML = '';

  if (tabName === 'transmitter') {
    activeComponent = createTransmitter(app);
  } else if (tabName === 'receiver') {
    activeComponent = createReceiver(app);
  }
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderTab(tab.getAttribute('data-tab'));
  });
});

// Default: Transmitter
renderTab('transmitter');
