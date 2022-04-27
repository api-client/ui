export function selectNode(node: Element): void {
  const { body } = document;
  // @ts-ignore
  if (body.createTextRange) {
    // @ts-ignore
    const range = body.createTextRange();
    range.moveToElementText(node);
    range.select();
  } else if (window.getSelection) {
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.selectNode(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};
