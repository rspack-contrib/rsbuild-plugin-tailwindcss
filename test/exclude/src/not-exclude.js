function className() {
  return 'pt-4';
}

const root = document.getElementById('root');
const element = document.createElement('div');
element.id = 'not-exclude';
element.className = className();
root.appendChild(element);
