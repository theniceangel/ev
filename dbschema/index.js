let express = require('express')
let app = express()

const catchErrors = (handler) => async (req, res, next) => {
    try{
        await handler(req, res, next);
    }catch(e){
        res.status(500).json({error: (e.stack || e).toString()});
    }
}

app.get('/', function(req, res){
    res.send('Hello world!');
});

app.get('/test', catchErrors((req, res) => {
    res.json({test: "this is a test!"});
}));

let server = app.listen(8080, function(){
    let host = server.address().address
    let port = server.address().port

    console.log(`Start up http://${host}:${port}`)
});
