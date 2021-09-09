import { DataType, Mutation, Query, Field, CombinedField } from "../..";

const query = new Query('person')
    .addField('name')
    .addField('surname')
    .addField(new Field('mother')
        .addField('name')
        .addField('surname')
    );

const anotherQuery = new Query('car')
    .addField('maxSpeed')
    .addField('brand');

const mutation = new Mutation('someMutation')
    .addField('some')
    .addField('other');

const combinedRequest = new CombinedField()
    .add(query)
    .add(anotherQuery)

describe('type is properly extracted', () => {
    it('extracts type from query', () => {
        const returned: DataType<typeof query> = {} as any;

        try {
            returned.person;
            returned.person.name;
            returned.person.mother;
            returned.person.mother.name;
        } catch {}
    });

    it('extracts type from a mutation', () => {
        const returned: DataType<typeof mutation> = {} as any;

        try {
            returned.someMutation;
            returned.someMutation.some;
            returned.someMutation.other;
        } catch {}
    });

    it('extracts type from a combined request', () => {
        const returned: DataType<typeof combinedRequest> = {} as any;

        try {
            returned.car;
            returned.car.brand;
            returned.person;
            returned.person.name;
        } catch {}
    });
})