import 'tailwindcss/utilities.css';

import './exclude.js';

function className() {
  return 'flex';
}

const root = document.getElementById('root');
const element = document.createElement('div');
element.id = 'test';
element.className = className();
root.appendChild(element);