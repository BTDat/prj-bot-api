import {IllegalStateError} from '../errors/illegal-state.error';
import {IllegalArgumentError} from '../errors/illegal-argument.error';

export const assertStateTrue = (value: boolean, message?: string) => {
  if (!value) {
    throw new IllegalStateError(message);
  }
};

export const assertStateFalse = (value: boolean, message?: string) => {
  if (value) {
    throw new IllegalStateError(message);
  }
};

export const assertArgumentEqual = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value1: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value2: any,
  message?: string,
) => {
  if (value1 !== value2) {
    throw new IllegalArgumentError(message);
  }
};
