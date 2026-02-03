declare namespace Deno {
    export interface Env {
        get(key: string): string | undefined;
        toObject(): { [index: string]: string };
    }
    export const env: Env;
}

declare function serve(handler: (req: Request) => Promise<Response> | Response): void;

declare function fetch(input: string | Request, init?: RequestInit): Promise<Response>;

interface Request {
    method: string;
    url: string;
    json(): Promise<any>;
    headers: Headers;
}
interface Response {
    body: any;
    status: number;
    headers: Headers;
    json(): Promise<any>;
    text(): Promise<string>;
}
declare var Request: {
    prototype: Request;
    new(input: string | Request, init?: RequestInit): Request;
};
declare var Response: {
    prototype: Response;
    new(body?: BodyInit | null, init?: ResponseInit): Response;
    json(data: any, init?: ResponseInit): Response;
};

interface Headers {
    get(name: string): string | null;
    set(name: string, value: string): void;
    append(name: string, value: string): void;
    delete(name: string): void;
    forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
}

interface URL {
    searchParams: URLSearchParams;
}
interface URLSearchParams {
    get(name: string): string | null;
}
declare var URL: {
    prototype: URL;
    new(url: string, base?: string | URL): URL;
};

type BodyInit = string | Blob | ArrayBuffer | FormData | URLSearchParams;

interface RequestInit {
    method?: string;
    headers?: any;
    body?: BodyInit | null;
}
interface ResponseInit {
    status?: number;
    statusText?: string;
    headers?: any;
}
