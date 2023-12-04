import { kanaMaps } from './dict';

export function getAllKeys(kana: string): string[] {
    if (kana.length === 0) {
        return [''];
    }
    if (kana.length === 1) {
        const keys = kanaMaps.find((v) => v.kana === kana)?.keys;
        if (keys === undefined) {
            throw new Error(`${kana} is not kana`);
        }
        return keys;
    }

    const keys = [];
    {
        const firstKeys = kanaMaps.find(
            (v) => v.kana === kana.slice(0, 2)
        )?.keys;
        if (firstKeys !== undefined) {
            for (const rest of getAllKeys(kana.slice(2))) {
                for (const first of firstKeys) {
                    keys.push(first + rest);
                }
            }
        }
    }
    {
        const firstKeys = kanaMaps.find((v) => v.kana === kana[0])?.keys;
        if (firstKeys === undefined) {
            throw new Error(`${kana} is not kana`);
        }
        for (const rest of getAllKeys(kana.slice(1))) {
            let modifiedFirstKeys = [...firstKeys];
            if (
                kana[0] === 'ん' &&
                !['a', 'i', 'u', 'e', 'o', 'n', 'y'].includes(rest[0])
            ) {
                modifiedFirstKeys = ['n', ...modifiedFirstKeys];
            }
            if (
                kana[0] === 'っ' &&
                !['a', 'i', 'u', 'e', 'o', 'n'].includes(rest[0])
            ) {
                modifiedFirstKeys = [rest[0], ...modifiedFirstKeys];
            }
            for (const first of modifiedFirstKeys) {
                keys.push(first + rest);
            }
        }
    }

    return keys;
}

export function getKana(keys: string): string {
    if (keys.length >= 2) {
        if (
            keys[0] === 'n' &&
            !['a', 'i', 'u', 'e', 'o', 'n', 'y'].includes(keys[1])
        ) {
            return 'ん' + getKana(keys.slice(1));
        }
        if (
            keys[0] === keys[1] &&
            !['a', 'i', 'u', 'e', 'o', 'n'].includes(keys[0])
        ) {
            return 'っ' + getKana(keys.slice(1));
        }
    }
    for (let i = 0; i < keys.length; i++) {
        const kana = kanaMaps.find((v) =>
            v.keys.includes(keys.slice(0, i + 1))
        )?.kana;
        if (kana !== undefined) {
            return kana + getKana(keys.slice(i + 1));
        }
    }
    return '';
}

export function getNextKeysArray(
    kana: string
): { kanaLength: number; keys: string }[] {
    if (kana.length === 0) {
        return [{ kanaLength: 0, keys: '' }];
    }
    if (kana.length === 1) {
        const keys = kanaMaps.find((v) => v.kana === kana)?.keys;
        if (keys === undefined) {
            throw new Error(`${kana} is not kana`);
        }
        return keys.map((v) => ({ kanaLength: 1, keys: v }));
    }

    const result: { kanaLength: number; keys: string }[] = [];
    {
        const keys = kanaMaps.find((v) => v.kana === kana.slice(0, 2))?.keys;
        if (keys !== undefined) {
            result.push(...keys.map((v) => ({ kanaLength: 2, keys: v })));
        }
    }
    {
        const keys = kanaMaps.find((v) => v.kana === kana[0])?.keys;
        if (keys === undefined) {
            throw new Error(`${kana} is not kana`);
        }
        for (const next of getNextKeysArray(kana.slice(1, 3))) {
            if (
                kana[0] === 'ん' &&
                !['a', 'i', 'u', 'e', 'o', 'n', 'y'].includes(next.keys[0])
            ) {
                result.push({
                    kanaLength: 1 + next.kanaLength,
                    keys: 'n' + next.keys,
                });
            }
            if (
                kana[0] === 'っ' &&
                !['a', 'i', 'u', 'e', 'o', 'n'].includes(next.keys[0])
            ) {
                result.push({
                    kanaLength: 1 + next.kanaLength,
                    keys: next.keys[0] + next.keys,
                });
            }
        }
        result.push(...keys.map((v) => ({ kanaLength: 1, keys: v })));
    }
    return result;
}

export class Jtyping {
    public typedKeys = '';
    private typedKanaLength = 0;
    private nextKeysArray: { kanaLength: number; keys: string }[] = [];

    constructor(public kana: string) {
        this.nextKeysArray = getNextKeysArray(this.kana);
    }

    public type(key: string): boolean {
        if (this.nextKeysArray.every((v) => v.keys[0] !== key)) {
            return false;
        }
        this.typedKeys += key;
        this.nextKeysArray = this.nextKeysArray
            .filter((v) => v.keys[0] === key)
            .map((v) => ({ kanaLength: v.kanaLength, keys: v.keys.slice(1) }));
        if (this.nextKeysArray[0].keys === '') {
            this.typedKanaLength += this.nextKeysArray[0].kanaLength;
            this.nextKeysArray = getNextKeysArray(
                this.kana.slice(this.typedKanaLength)
            );
        }
        return true;
    }

    public getSuggestKeys(): string {
        let suggestKeys = this.nextKeysArray[0].keys;
        let start = this.typedKanaLength + this.nextKeysArray[0].kanaLength;
        while (start < this.kana.length) {
            const nextKeysArray = getNextKeysArray(this.kana.slice(start));
            suggestKeys += nextKeysArray[0].keys;
            start += nextKeysArray[0].kanaLength;
        }
        return suggestKeys;
    }
}
