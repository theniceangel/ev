const mysql = require('mysql')
const genericPool = require('generic-pool')
const {promisify} = require('util')
const BaseDriver = require('BaseDriver')

const GenericTypeToMySql = {
    'string': 'varchar(255)'
};

class MySqlDriver extends BaseDriver{
    constructor(config){
        super();
        this.config = {
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ...config
        }
        this.pool = genericPool.createPool({
            create: async () => {
                const conn = mysql.createConnection(this.config);
                const connect = promisify(conn.connect.bind(conn));

                conn.on && conn.on('error', (err) => {
                    conn.destroy();
                });

                conn.execute = promisify(conn.query.bind(conn));
                await connect();
                return conn;
            },
            desctroy: (connection) => {
                return promisify(connection.end.bind(connection))();
            },
            validate: async (connection) => {
                try{
                    await connection.execute('SELECT 1');
                }catch(e){
                    return false;
                }
                return true;
            }
        }, {
            min: 0,
            max: 8,
            evictionRunIntervalMillis: 10000,
            softIdleTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            testOnBorrow: true,
            acquireTimeoutMillis: 20000,
        });
    }

    withConnection(fn){
        const self = this;
        const connectionPromise = this.pool.acquire();

        let cancelled = false;
        const cancelObj = {};
        const promise = connectionPromise.then(conn => {
            cancelObj.cancel = async () => {
                cancelled = true;
                await self.withConnection(async conn => {
                    const processRows = await conn.execute('SHOW PROCESSLIST');
                    await Promise.all(processRows.filter(row => row.Time >= 599).map(row => {
                        return conn.execute(`KILL ${row.id}`);
                    }));
                });
            };
            return fn(conn).then(res => {
                return this.pool.release(conn).then(() => {
                    if(cancelled){
                        throw new Error('Query cancelled');
                    }
                    return res;
                });
            }).cache((err) => {
                return this.pool.release(conn).then(() => {
                    if(cancelled){
                        throw new Error('Query cancelled');
                    }
                    throw err;
                });
            })
        });
        promise.cancel = () => cancelObj.cancel();
        return promise;
    }

    async testConnection(){
        const conn = await this.pool._factory.create();
        try{
            return await conn.execute('SELECT 1');
        }finally{
            await this.pool._factory.destory(conn);
        }
    }
}


