# Server-side clustering with MongoDB

This web app demonstrates how to implement some server-side map clustering algorithms with MongoDB.

[See it in action!](https://ssc-mongodb.herokuapp.com/)



## Local usage

Requirements:

* MongoDB 3+
* Node.js 6+

Install and run it:

    git clone https://github.com/AlphaHydrae/server-side-clustering-mongodb.git
    cd server-side-clustering-mongodb
    npm install
    npm start

Generate more points:

    DEBUG=ssc* SSC_COUNT=50000 npm start



## Configuration

* Set `$MONGODB_URI` or `$DATABASE_URL` to use another database connection URL (defaults to `mongodb://localhost/server-side-clustering`).
* Set `$SSC_CLEAR` to clear and re-generate points data.
* Set `$SSC_COUNT` to generate more points (defaults to `1000`).



## Contributions

* Countries GeoJSON from [https://github.com/johan/world.geo.json](https://github.com/johan/world.geo.json/blob/master/countries.geo.json)
