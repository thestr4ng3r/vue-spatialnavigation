import { FocusElement } from "./focus.directive";
import Vue from "vue";
import { BehaviorSubject } from "rxjs";

export enum NavigationServiceDirection {
	Up = "up",
	Down = "down",
	Left = "left",
	Right = "right",
	Enter = "enter"
}

export class NavigationService {
	keyCodes: { [key: number]: string } = [];
	focusAbleElements: Array<FocusElement> = new Array<FocusElement>();
	lastElementIdInFocus = "";
	blockAllSpatialNavigation = false;

	private readonly _currentFocusedElementSubject = new BehaviorSubject<FocusElement | null>(null);

	get currentFocusedElementObservable() {
		return this._currentFocusedElementSubject.asObservable();
	}

	get currentFocusedElement(): FocusElement | null {
		return this._currentFocusedElementSubject.value;
	}

	set currentFocusedElement(focusElement: FocusElement | null) {
		this._currentFocusedElementSubject.next(focusElement);
	}


	constructor(keys: { [key: string]: number | Array<number> }, enableMouse: boolean) {
		// bind keyCodes object from Vue config
		for(let keyName in NavigationServiceDirection) {
			let keyCode = keys[NavigationServiceDirection[keyName as any] as string];
			if(keyCode) {
				if(keyCode instanceof Array) {
					for(let k of keyCode) {
						this.keyCodes[k] = keyName;
					}
				} else {
					this.keyCodes[keyCode] = keyName;
				}
			}
		}

		this.setupKeyBoardEvents();
		if(enableMouse) {
			this.setupMouseEvents();
		}
	}

	setupKeyBoardEvents() {
		document.addEventListener("keydown", ((e: KeyboardEvent) => {
			// find key code
			const keyCode = e.keyCode ? e.keyCode : e.charCode ? e.charCode : e.which;

			// find key name
			let keyName = this.keyCodes[keyCode];

			// no matching key found
			if(!keyName) return false;

			e.preventDefault();

			// spatial navigation is blocked
			if(this.blockAllSpatialNavigation) return false;

			// action spatial navigation
			if(keyName in NavigationServiceDirection) this.spatialNavigationAction(<keyof typeof NavigationServiceDirection>keyName);
		}));
	}

	setupMouseEvents() {
		// enable mouseover event
		document.addEventListener("mouseover", (e: MouseEvent) => {
			if(this.blockAllSpatialNavigation) return false;

			let el = this.findFocusable(<HTMLElement>e.target);
			if(el) el.focus();
		});

		// enable mouseout event
		document.addEventListener("mouseout", (e: MouseEvent) => {
			if(this.blockAllSpatialNavigation) return false;

			let el = this.findFocusable(<HTMLElement>e.target);
			if(el) el.blur();
		});


		// enable click event
		document.addEventListener("click", (e: MouseEvent) => {
			if(this.blockAllSpatialNavigation) return false;
			let el = this.findFocusable(<HTMLElement>e.target);
			if(el) el.enter();
		});

	}

	// try to find focusable element on mouse hover or click
	findFocusable(target: Element): FocusElement | undefined {
		// inside loop search for focusable element
		// we need this if the focusable element has children inside
		// so e.target can point to child or grandchild of focusable element
		while(target) {
			if(target.id) {
				let focusEl = this.getFocusElementById(target.id);
				if(focusEl) return focusEl;
			}
			if(!target.parentNode) return undefined;
			target = <Element>target.parentNode;
		}
		return undefined;
	}

	// action a new spatial navigation action
	spatialNavigationAction(action: keyof typeof NavigationServiceDirection) {
		let el = this.currentFocusedElement;

		//let keyValue = NavigationServiceDirection[action];
		let keyValue = NavigationServiceDirection[action];

		// initiate focus action if we have active element
		if(el && el.$el && document.body.contains(el.$el)) {
			switch(keyValue) {
				case NavigationServiceDirection.Up:
					el.up();
					break;
				case NavigationServiceDirection.Down:
					el.down();
					break;
				case NavigationServiceDirection.Left:
					el.left();
					break;
				case NavigationServiceDirection.Right:
					el.right();
					break;
				case NavigationServiceDirection.Enter:
					el.enter();
					break;
			}

			// if there is no active element, try to find last element in focus
		} else if(this.getFocusElementById(this.lastElementIdInFocus)) {
			const el = this.getFocusElementById(this.lastElementIdInFocus);
			if(el) el.focus();

			// as a last resort, try to find a default focus element to 'reset' focus
		} else {
			const el = this.getFocusElementIsDefault();
			if(el) el.focus();
		}
	}

	// bind focusable component
	registerFocusElement(focusElement: FocusElement) {
		this.focusAbleElements.push(focusElement);
		// set initial focus if there is no active focus and current element is default
		if(focusElement.isDefault && !this.currentFocusedElement) {
			focusElement.focus();
		}
	}

	// unbind focusable component
	deRegisterFocusElement(focusElement: FocusElement) {
		let index = this.focusAbleElements.indexOf(focusElement);
		if(index > -1) {
			let el = this.focusAbleElements.splice(index, 1);
			if(el.length > 0) el[0].destroy();
		}
	}

	// find focusable component by id
	getFocusElementById(id: string): FocusElement | null {
		for(let el of this.focusAbleElements) {
			if(el.id === id) return el;
		}
		return null;
	}

	// find component that should be focussed by default
	getFocusElementIsDefault() {
		for(const el of this.focusAbleElements) {
			if(el.isDefault) return el;
		}
	}

	// blurr all focusable components
	blurAllFocusElements() {
		if(this.currentFocusedElement) {
			this.currentFocusedElement.blur();
		}
	}
}
