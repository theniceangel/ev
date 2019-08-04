const {reduce } = require('ramda')

const sortByKeys = (unordered) => {
    const ordered = {};

    Object.keys(unordered).sort().forEach(function(key) {
        ordered[key] = unordered[key];
    });

    return ordered;
};

const DbTypeToGenericType = {
    'timestamp without time zone': 'timestamp',
    'integer': 'int',
    'character varying': 'text',
    'varchar': 'text',
    'text': 'text',
    'string': 'text',
    'boolean': 'boolean',
    'bigint': 'bigint',
    'time': 'string',
    'datetime': 'timestamp',
    'date': 'date',
    'double precision': 'decimal'
};

class BaseDriver{
    informationSchemaQuery(){
        return `
            SELECT columns.column_name as "column_name",
                    columns.table_name as "table_name",
                    columns.table_schema as "table_schema",
                    columns.data_type as "data_type"
            FROM information_schema.columns
            WHERE columns.table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
        `;
    }

    testConnection(){
        throw 'Not implemented';
    }

    query(){
        throw 'Not implemented';
    }

    tablesSchema(){
        const query = this.informationSchemaQuery();

        const reduceCb = (result, i) => {
            let schema = (result[i.table_schema] || {});
            console.log(schema);
            let tables = (schema[i.table_name] || []);
            console.log(tables);

            tables.push({name: i.column_name, type: i.data_type, attributes: i.key_type? ['primaryKey'] : []})

            tables.sort();
            schema[i.table_name] = tables;
            schema = sortByKeys(schema);
            result[i.table_schema] = schema;

            return sortByKeys(result);
        }
    }
}
