import Utils from '../utils';

test('Utils.range', () => {
  expect(Utils.range(0, 0)).toEqual([0]);
  expect(Utils.range(0, 1)).toEqual([0, 1]);
  expect(Utils.range(2, 4)).toEqual([2, 3, 4]);
  expect(Utils.range(-2, 2)).toEqual([-2, -1, 0, 1, 2]);

  expect(Utils.range(1, 0)).toEqual([]);
});

test('Utils.throttle without this', () => {
  jest.useFakeTimers();

  const fn = jest.fn();
  const throttledFunc = Utils.throttle(fn, 1000);

  throttledFunc('a');
  throttledFunc('a');
  throttledFunc('a');

  expect(fn).toBeCalledTimes(1);

  jest.runAllTimers();

  expect(fn).toBeCalledTimes(2);
});

test('Utils.throttle with this', () => {
  jest.useFakeTimers();

  const obj = {
    fn: jest.fn(),
  };
  const throttledFunc = Utils.throttle(obj.fn, 1000);

  throttledFunc();
  throttledFunc();
  throttledFunc();

  expect(obj.fn).toBeCalledTimes(1);

  jest.runAllTimers();

  expect(obj.fn).toBeCalledTimes(2);
});
