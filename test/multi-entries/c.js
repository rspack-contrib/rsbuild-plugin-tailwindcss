import 'tailwindcss/utilities.css';

function className() {
  return 'px-4';
}

const root = document.getElementById('root');
const element = document.createElement('div');
element.id = 'test';
element.className = className();
root.appendChild(element);
