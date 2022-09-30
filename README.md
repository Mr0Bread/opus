# Better typed Opus

## Description

This page contains version of @tilework/opus with client that is capable of registering queries and mutations upfront and then using them in a type-safe way. This version is meant to be used with TypeScript. In addition, it provides full backwards compatibility with the original @tilework/opus.

## Client instantiation
    
```typescript
export const client = new Client();
```

Absolutely the same way you would do in original @tilework/opus.

## Query and mutation registration

### Static queries and mutations

To simply register query or mutation use register methods `registerQuery` or `registerMutation`. First argument is the name of the query or mutation, second is the object where you pass query or mutation itself

```typescript
client
    .registerQuery(
        'getProduct',
        {
            query: new Query('product')
                .addFieldList<string, {
                    name: string,
                    price: number,
                    description: string
                }>([
                    'name',
                    'price',
                    'description'
                ])
        }
    )
    .registerMutation(
        'createUser',
        {
            mutation: new Mutation('createUser')
                .addFieldList<string, {
                    name: string,
                    surname: string,
                }>([
                    'name',
                    'surname',
                ])
        }
    )
```

### Dynamic queries and mutations

You can also pass function that returns query or mutation. This is useful when you want to pass arguments to the query or mutation. Specifying argument is not necessary, but if you do, you will get type safety for the argument.

```typescript
client
    .registerQuery(
        'getUser',
        {
            query: (name: string) => new Query('getUser')
                .addArgument('name', 'String', name)
                .addFieldList<string, {
                    name: string,
                    surname: string
                }>([
                    'name',
                    'surname'
                ])
                .addField<
                    'role',
                    false,
                    string
                >(
                    'role',
                )
        }
    )
    .registerMutation(
        'deleteUser',
        {
            mutation: (id: number) => new Mutation('deleteUser')
                .addFieldList<string, {
                    name: string,
                    surname: string,
                }>([
                    'name',
                    'surname',
                ])
        }
    )
```

## Performing typesafe requests

To simply perform a query or mutation use `query` and `mutate` methods

```typescript
const result = await newClient.query(['admins'])

const mutationResult = await newClient.mutate(['deleteUser', 5])
```
