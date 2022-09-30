import { CombinedField } from '../builder/CombinedField';
import { prepareRequest } from './prepare-document';
import { parseResponse } from './parse-response';
import { executePost } from './post';
import { Mutation } from '../builder/Mutation';
import { Query } from '../builder/Query';
import { AbstractField } from '../builder/AbstractField';
import { deepApply } from '../util/deep-apply';
import { DataType } from '../util/data-type';

export interface GraphQlResponse {
    errors: string | Error | Error[],
    data: unknown
}

export type Middleware = (response: GraphQlResponse) => unknown;

export type RequestOptions = {
    endpoint: string,
    headers?: Record<string, string>
} & Omit<RequestInit, 'method' | 'body' | 'headers'>;

export const defaultOptions: RequestOptions = {
    endpoint: process.env.GRAPHQL_ENDPOINT || '/graphql'
};

type QueriesMapRecord = {
    query: Query<any, any, any>,
    input?: any
}

type MutationsMapRecord = {
    mutation: Mutation<any, any, any>,
    input?: any
}

export class Client<
    QueriesMap extends Record<string, QueriesMapRecord> = {},
    MutationsMap extends Record<string, MutationsMapRecord> = {}
> {
    public queries: {
        [K in keyof QueriesMap]: QueriesMap[K]
    } = {} as {
        [K in keyof QueriesMap]: QueriesMap[K]
    };
    public mutations: {
        [K in keyof MutationsMap]: MutationsMap[K]
    } = {} as {
        [K in keyof MutationsMap]: MutationsMap[K]
    }
    protected options: RequestOptions = defaultOptions;

    setEndpoint = (endpoint: string): void => {
        this.options.endpoint = endpoint;
    };

    setHeaders = (headers: Record<string, string>): void => {
        this.options.headers = headers;
    };

    getOptions = (): RequestOptions => this.options;

    async post<N extends string, RT, A extends boolean>(
        rawField: Query<N, RT, A> | Mutation<N, RT, A>,
        overrideOptions?: Partial<RequestOptions>
    ): Promise<DataType<typeof rawField>>;

    async post<RT>(
        rawField: CombinedField<RT>,
        overrideOptions?: Partial<RequestOptions>
    ): Promise<DataType<typeof rawField>>;

    async post(
        rawField: any,
        overrideOptions?: Partial<RequestOptions>
    ) {
        const fieldArray = rawField instanceof CombinedField ? rawField.getFields() : [rawField];

        if (!fieldArray.length) {
            throw new Error('Attempting to post empty field!');
        }

        const response = await executePost(
            prepareRequest(fieldArray, rawField.type!),
            // TODO deep merge
            {
                ...this.options,
                ...(overrideOptions || {})
            }
        );

        const parsedResponse = parseResponse(await response.json());

        if (rawField instanceof CombinedField) {
            for (const field of rawField.getFields()) {
                await this.process(field, parsedResponse[field.name], parsedResponse)
            }
        } else {
            await this.process(rawField, parsedResponse[rawField.name], parsedResponse);
        }

        deepApply(Object.freeze, parsedResponse);

        return parsedResponse;
    };

    registerMutation<
        N extends string,
        RT,
        A extends boolean,
        MutationName extends string
    >(
        name: MutationName,
        options: {
            mutation: Mutation<N, RT, A>,
        }
    ): Client<
        QueriesMap,
        MutationsMap & {
            [K in MutationName]: {
                mutation: typeof options.mutation,
                input: never
            }
        }
    >

    registerMutation<
        N extends string,
        RT,
        A extends boolean,
        MutationName extends string
    >(
        name: MutationName,
        options: {
            mutation: () => Mutation<N, RT, A>,
        }
    ): Client<
        QueriesMap,
        MutationsMap & {
            [K in MutationName]: {
                mutation: ReturnType<typeof options.mutation>,
                input: never
            }
        }
    >

    registerMutation<
        N extends string,
        RT,
        A extends boolean,
        MutationName extends string,
        Input extends any = never
    >(
        name: MutationName,
        options: {
            mutation: (input: Input) => Mutation<N, RT, A>,
        }
    ): Client<
        QueriesMap,
        MutationsMap & {
            [K in MutationName]: {
                mutation: ReturnType<typeof options.mutation>,
                input: Input
            }
        }
    >

    registerMutation<
        N extends string,
        RT,
        A extends boolean,
        MutationName extends string,
        Input extends Record<string, any> = {}
    >(
        name: MutationName,
        options: {
            mutation: Mutation<N, RT, A>
            | (() => Mutation<N, RT, A>)
            | ((input: Input) => Mutation<N, RT, A>),
        }
    ) {
        const newClient = new Client<
            QueriesMap,
            MutationsMap & {
                [K in MutationName]: typeof options.mutation extends Mutation<any, any, any>
                ? {
                    mutation: Extract<typeof options.mutation, Mutation<any, any, any>>
                }
                : {
                    mutation: ReturnType<Extract<typeof options.mutation, () => Mutation<N, RT, A>>>
                }
            }
        >()

        newClient.queries = this.queries;

        newClient.mutations = {
            ...this.mutations,
            [name]: {
                mutation: options.mutation
            }
        }

        return newClient;
    }

    registerQuery<
        N extends string,
        RT,
        A extends boolean,
        QueryName extends string
    >(
        name: QueryName,
        options: {
            query: Query<N, RT, A>,
        }
    ): Client<
        QueriesMap & {
            [K in QueryName]: {
                query: typeof options.query,
                input: never
            }
        },
        MutationsMap
    >

    registerQuery<
        N extends string,
        RT,
        A extends boolean,
        QueryName extends string
    >(
        name: QueryName,
        options: {
            query: () => Query<N, RT, A>,
        }
    ): Client<
        QueriesMap & {
            [K in QueryName]: {
                query: ReturnType<typeof options.query>,
                input: never
            }
        },
        MutationsMap
    >

    registerQuery<
        N extends string,
        RT,
        A extends boolean,
        QueryName extends string,
        Input extends any = never
    >(
        name: QueryName,
        options: {
            query: (input: Input) => Query<N, RT, A>,
        }
    ): Client<
        QueriesMap & {
            [K in QueryName]: {
                query: ReturnType<typeof options.query>,
                input: Input
            }
        },
        MutationsMap
    >

    registerQuery<
        N extends string,
        RT,
        A extends boolean,
        QueryName extends string,
        Input extends Record<string, any> = {}
    >(
        name: QueryName,
        options: {
            query: Query<N, RT, A>
            | (() => Query<N, RT, A>)
            | ((input: Input) => Query<N, RT, A>),
        }
    ) {
        const newClient = new Client<
            QueriesMap & {
                [K in QueryName]: typeof options.query extends Query<any, any, any>
                ? {
                    query: Extract<typeof options.query, Query<any, any, any>>
                }
                : {
                    query: ReturnType<Extract<typeof options.query, () => Query<N, RT, A>>>
                }
            },
            MutationsMap
        >()

        newClient.queries = {
            ...this.queries,
            [name]: {
                query: options.query
            }
        }

        return newClient;
    }

    // registerMutation<N extends string, RT, A extends boolean>(
    //     rawField: Mutation<N, RT, A>
    // ): Client<
    //     RegisteredQueries,
    //     [...RegisteredMutations, typeof rawField]
    // > {
    //     return this;
    // }

    query<
        QueryName extends keyof QueriesMap,
    >(
        queryTuple: QueriesMap[QueryName]['input'] extends never
            ? [QueryName]
            : [QueryName, QueriesMap[QueryName]['input']]
    ): Promise<
        DataType<QueriesMap[QueryName]['query']>
    >

    async query<
        QueryName extends keyof QueriesMap,
    >(
        queryTuple: QueriesMap[QueryName]['input'] extends never
            ? [QueryName]
            : [QueryName, QueriesMap[QueryName]['input']]
    ) {
        const query = this.queries[queryTuple[0]].query

        return this.post(query) as Promise<
            DataType<QueriesMap[QueryName]['query']>
        >
    }

    mutate<
        MutationName extends keyof MutationsMap,
    >(
        queryTuple: MutationsMap[MutationName]['input'] extends never
            ? [MutationName]
            : [MutationName, MutationsMap[MutationName]['input']]
    ): Promise<
        DataType<MutationsMap[MutationName]['mutation']>
    >

    async mutate<
        MutationName extends keyof MutationsMap,
    >(
        queryTuple: MutationsMap[MutationName]['input'] extends never
            ? [MutationName]
            : [MutationName, MutationsMap[MutationName]['input']]
    ) {
        const query = this.mutations[queryTuple[0]].mutation

        return this.post(query) as Promise<
            DataType<MutationsMap[MutationName]['mutation']>
        >
    }

    /**
     * Handles calculating and transforming fields on result
     */
    protected async process(field: AbstractField<any, any, any>, result: any, parentResult: any) {
        // Prevent calculating for non-object fields from the result
        if (!field.children.length) {
            return;
        }

        // If array - process each separately
        if (Array.isArray(result)) {
            for (const item of result) {
                await this.process(field, item, parentResult);
            }
        } else {
            // If has children - process children first
            for (const child of field.children) {
                if (child.tag === 'InlineFragment') {
                    for (const fragmentChild of child.children) {
                        if (result === null || !Object.hasOwnProperty.call(result, fragmentChild.name)) {
                            continue;
                        }

                        await this.process(fragmentChild, result[fragmentChild.name], result);
                    }
                } else {
                    if (result === null || !Object.hasOwnProperty.call(result, child.name)) {
                        continue;
                    }
                    await this.process(child, result[child.name], result);
                }
            }

            // POSTVISIT - calculate the actual fields
            for (const [fieldName, calculator] of Object.entries(field.calculators)) {
                result[fieldName] = await calculator(result);
            }

            // Prevent adding new properties from now on
            deepApply(Object.seal, result);

            if (field.transformer) {
                parentResult[field.name] = await field.transformer(result);
            }

            // TODO in dev mode we can compare own props to prevent extending in improper ways
        }
    }
}
