/**
 * Common utility functions
 */
export class CommonUtils {
    static getCounter(counter: number | null):string {
        if (!counter) return '0';
        if (counter > 9) return ''+ counter + '+';
        return ''+counter;
    }
}