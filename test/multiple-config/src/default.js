import 'tailwindcss/utilities.css';

function className() {
  return 'flex bg-default';
}

const root = document.getElementById('root');
const element = document.createElement('div');
element.id = 'test';
element.className = className();
element.textContent = 'Default Entry';
root.appendChild(element);
