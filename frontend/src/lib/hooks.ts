'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions<T> {
    initialData?: T;
    immediate?: boolean;
}

interface UseApiResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    execute: (...args: any[]) => Promise<T | null>;
    refresh: () => Promise<T | null>;
    setData: (data: T | null) => void;
}

export function useApi<T>(
    apiFunction: (...args: any[]) => Promise<{ success: boolean; data?: T; error?: string }>,
    options: UseApiOptions<T> = {}
): UseApiResult<T> {
    const [data, setData] = useState<T | null>(options.initialData || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastArgs, setLastArgs] = useState<any[]>([]);

    const execute = useCallback(
        async (...args: any[]): Promise<T | null> => {
            setLoading(true);
            setError(null);
            setLastArgs(args);

            try {
                const result = await apiFunction(...args);
                if (result.success && result.data !== undefined) {
                    setData(result.data);
                    return result.data;
                } else {
                    setError(result.error || 'Unknown error');
                    return null;
                }
            } catch (err: any) {
                setError(err.message || 'Unknown error');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [apiFunction]
    );

    const refresh = useCallback(() => execute(...lastArgs), [execute, lastArgs]);

    useEffect(() => {
        if (options.immediate) {
            execute();
        }
    }, []);

    return { data, loading, error, execute, refresh, setData };
}

// Debounced search hook
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Local storage hook with SSR safety
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.error('Error reading localStorage:', error);
        }
    }, [key]);

    const setValue = (value: T) => {
        try {
            setStoredValue(value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error setting localStorage:', error);
        }
    };

    return [storedValue, setValue];
}
