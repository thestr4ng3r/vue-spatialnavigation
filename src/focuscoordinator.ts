import { FocusElement } from "./focus.directive";

export enum FocusDirection {
	LEFT,
	RIGHT,
	UP,
	DOWN
}

export interface FocusCoordinator {
	nextFocusElementID(focusElement: FocusElement, direction: FocusDirection): string | null
}

export function isFocusCoordinator(object: any): object is FocusCoordinator {
	return "nextFocusElementID" in object;
}
