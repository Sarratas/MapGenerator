export default class Utils {
    public static rand(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    public static range(min: number, max: number): Array<number> {
        let result: Array<number> = [];
        for (let i = min; i <= max; ++i) {
            result.push(i);
        }
        return result;
    }

    // tslint:disable-next-line:no-any
    public static throttle<T extends Array<any>, U>(func: (...params: T) => U, ms: number) {
        let isThrottled = false;
        let savedArgs: T | undefined;
        let savedThis: Object | undefined;

        function wrapper(...args: T) {
            if (isThrottled) {
                savedArgs = args;
                savedThis = this;
                return;
            }

            func.apply(this, args);

            isThrottled = true;

            setTimeout(function() {
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
