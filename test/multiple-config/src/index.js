import 'tailwindcss/utilities.css';

function className() {
  return 'flex bg-index';
}

const root = document.getElementById('root');
const element = document.createElement('div');
element.id = 'test';
element.className = className();
element.textContent = 'Index Entry';
root.appendChild(element);
