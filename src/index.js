import { ObservableElement } from './elements/observable-element.js';

class Profile extends ObservableElement {

  getInitialValue() {
    return {
      name: 'Bobo',
      age: 129
    };
  }

  connectedCallback() {
    // Maybe make the behavior subject internal?
    const source$ = new Rx.BehaviorSubject(this.getInitialValue());
    this.setSource(source$);

    this.update$
      .map(_ => {
        const name = this.view_.name.value;
        const age = parseInt(this.view_.age.value, 10);
        return { name, age };
      })
      .map(newState => {
        const state = this.source$.getValue();
        return {
          ...state,
          ...newState
        };
      })
      .subscribe(state => {
        this.source$.next(state);
      });
  }

}

customElements.define('profile-element', Profile);
