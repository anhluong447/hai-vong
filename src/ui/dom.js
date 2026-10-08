export function element(tag,attributes = {},children = []) {
  const node = document.createElement(tag);
  for (const [key,value] of Object.entries(attributes)) {
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(),value);
    else if (key === 'checked' || key === 'disabled') node[key] = value;
    else node.setAttribute(key,value);
  }
  for (const child of Array.isArray(children) ? children : [children]) if (child !== null && child !== undefined) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
export const text = (tag,value,className = '') => element(tag,{ text:value, class:className });
export const button = (label,onClick,className = '',disabled = false) => element('button',{ type:'button',text:label,onClick,class:className,disabled });
export function numberField(label,value,{ min = 0,max,step = 1,name } = {}) {
  const input = element('input',{ type:'number',value,min,step,...(max === undefined ? {} : { max }),...(name ? { name } : {}) });
  return { input,node:element('label',{ class:'field' },[text('span',label),input]) };
}
