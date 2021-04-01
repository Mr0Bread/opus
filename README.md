<h1 float="left">
    <img src="https://e.unicode-table.com/orig/40/2824a7079418328ff8a74ab2d92441.png" height="32">
    Spalva
</h1>

## Why

<h4 float="left"> 
    <img src="https://e.unicode-table.com/orig/76/82f32524fb743dbc62cd86fba89f6e.png" height="20">
    Make your requests extensible
</h4>

The GraphQL requests generated by this library are easily extensible by [the plugin system](https://github.com/plugjs/plugjs).


<h4 float="left"> 
    <img src="https://e.unicode-table.com/orig/40/2824a7079418328ff8a74ab2d92441.png" height="20">
    Stay lightweight
</h4>

This library is TINY and still provides all of the main functionality for GraphQL interactions.

<h4 float="left"> 
    <img src="https://e.unicode-table.com/orig/a0/d616e234deff52663bbb0d263b1a18.png" height="20">
    Definitely typed
</h4>

Generate GraphQL requests with Builder pattern and receive properly structurally typed responses upon fetching!
![Hnet com-image](https://user-images.githubusercontent.com/46347627/113285078-304d1b80-92f3-11eb-91f4-c7a491a39996.gif)

## What

<h4 float="left"> 
    <img src="https://e.unicode-table.com/orig/41/afffcb1f4ba527f67325f094febfb1.png" height="20">
    Building fields
</h4>

Almost every aspect of GraphQL functionality is supported: fields, nested fields, inline fragments, arguments.
The only thing not yet supported are non-inline Fragments. Although, apart from slightly increased request size, this will not impact your development experience in any way.

```js
const dragonFields = ['name', 'neck_length', 'age'] as const;

const dragonsQuery = new Field('dragons')
    .addArgument('limit', 'Int', 5)
    .addFieldList(dragonFields)
    .addField(new Field('children')
        .addFieldList(dragonFields)
    )
    .addField(new InlineFragment('Fire')
        .addField('fire_temperature')
    )
    .addField(new InlineFragment('Ice')
        .addField('ice_density')
    )
```


<h4 float="left">
    <img src="https://e.unicode-table.com/orig/71/6bd8089ef56220c22155843e864262.png" height="20">
    Configuring the client
</h4>

It is necessary to set up the client before fetching any data. See the required configuration steps below.

-  Endpoint


   -  `client.setEndpoint(endpoint: string)` allows to configure this in runtime 


   -  Setting `GRAPHQL_ENDPOINT` in `process.env` will also set the endpoint


   -  It defaults to `/graphql`

-  Headers

   -  `client.setHeaders(headers: any)` will set the headers to use when fetching requests

<h4 float="left">
    <img src="https://e.unicode-table.com/orig/c6/067075f73e5891479108c2d51d0ff7.png" height="20">
    Using a middleware
</h4>

It is possible to set a middleware, in order to support custom data structures coming from backend. A target of using a middleware is to make the response correlate with the type generated by the `Field` class.

```js
// By default, this middleware is used
client.setMiddleware(async (response: any): unknown => {
    const { data, errors } = response;
    if (errors) {
        throw new Error('...');
    }

    return data;
})
```

<h4 float="left">
    <img src="https://e.unicode-table.com/orig/be/f154b24d3532e67d8d943112e5b931.png" height="20">
    Fetching some requests!
</h4>

The `client` provides an opportunity to fetch queries and mutations, as well as fetch combined queries and combined mutations.

```js
// Single requests
const queryResult = await client.postQuery(someQuery);
const mutationResult = await client.postMutation(someMutation);

// Combined queries and mutations work the same
const combinedQueryResult = await client.postQuery(new CombinedField
    .addField(firstQuery)
    .addField(secondQuery)
);
```