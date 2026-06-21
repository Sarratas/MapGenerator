export default class Utils {
    public static range(min: number, max: number): Array<number> {
        const result: Array<number> = [];
        for (let i = min; i <= max; ++i) {
            result.push(i);
        }
        return result;
    }

    public static throttle<T extends Array<unknown>, U>(func: (...params: T) => U, ms: number): (...args: T) => void {
        let isThrottled = false;
        let savedArgs: T | undefined;
        let savedThis: unknown;

        function wrapper(this: unknown, ...args: T): void {
            if (isThrottled) {
                savedArgs = args;
                savedThis = this;
                return;
            }

            func.apply(this, args);

            isThrottled = true;

            setTimeout(() => {
                isThrottled = false;
                if (savedArgs !== undefined) {
                    wrapper.apply(savedThis, savedArgs);
                    savedThis = savedArgs = undefined;
                }
            }, ms);
        }
        return wrapper;
    }
}
