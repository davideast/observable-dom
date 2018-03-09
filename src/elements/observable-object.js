import { renderHost, createHost, walk } from '../render.js';

export class ObservableObject extends HTMLElement {

  setSource(val) {
    this.source$ = val;
    this.source$.subscribe(this._next.bind(this));
  }

  constructor() {
    super();
    this._nextTemplate = this.querySelector('template');
    
    // This element can be subclassed or it can used
    // directly. If there is a getInitialValue method
    // we are assuming they are using a subclass. If
    // there's not we assume they use it directly.
    let firstValue = {};
    if(typeof this.getInitialValue !== 'undefined') {
      firstValue = this.getInitialValue();
    } else {
      firstValue = JSON.parse(this.getAttribute('initial-value'));
    }

    const cloneNode = this._nextTemplate.content.cloneNode(true);

    const { host, events } = createHost(
      cloneNode, 
      firstValue, 
      firstValue
    );

    this.appendChild(host);

    Object.keys(events).forEach(name => {
      this[name] = Rx.Observable.fromEvent(
        events[name].element, events[name].event
      );
    });
  }

  _next(data) {
    const cloneNode = this._nextTemplate.content.cloneNode(true);
    walk(this, cloneNode, data);
  }

}
