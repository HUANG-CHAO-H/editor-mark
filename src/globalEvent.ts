import {EventEmitter} from "./utils";

export interface IGlobalEvent {
  // openFile: ()
}

export const globalEvent = new EventEmitter<IGlobalEvent>();