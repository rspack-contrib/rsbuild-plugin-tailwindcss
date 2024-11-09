import 'tailwindcss/utilities.css';

function className() {
  return 'w-8';
}

const root = document.getElementById('root');
const element = document.createElement('div');
element.id = 'test';
element.className = className();
root.appendChild(element);
