function isLeftMouseClick(e: React.MouseEvent) {
  return e.type === 'click' && e.button === 0;
}

function isEnterKeyUp(e: React.KeyboardEvent) {
  return e.type === 'keyup' && e.key === 'Enter';
}

export { isEnterKeyUp, isLeftMouseClick }