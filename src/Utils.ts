export class Utils {
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

    public static throttle(func: Function, ms: number) {
        let isThrottled = false;
        let savedArgs: Array<any> = [];
        let savedThis: Object = undefined;
      
        function wrapper(...args: Array<any>) {
            if (isThrottled) {
                savedArgs = args;
                savedThis = this;
                return;
            }

            func.apply(this, args);

            isThrottled = true;
      
            setTimeout(function() {
                isThrottled = false;
                if (savedThis !== undefined) {
                    wrapper.apply(savedThis, savedArgs);
                    savedArgs = savedThis = undefined;
                }
            }, ms);
        }
        return wrapper;
    }
}