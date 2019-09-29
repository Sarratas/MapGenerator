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
}