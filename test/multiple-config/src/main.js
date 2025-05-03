import 'tailwindcss/utilities.css';

function className() {
  return 'flex bg-main';
}

const root = document.getElementById('root');
const element = document.createElement('div');
element.id = 'test';
element.className = className();
element.textContent = 'Main Entry';
root.appendChild(element);
